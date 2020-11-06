from datetime import datetime
from typing import List, Optional
from models import database, insert_message, get_history, Users
from fastapi import FastAPI, Query, WebSocket, WebSocketDisconnect
from fastapi.exceptions import WebSocketRequestValidationError
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

class ConnectionManager:
    users: List[WebSocket] = []
    users_data: List[dict] = []

    async def connect(self,websocket: WebSocket):
        await websocket.accept()
        self.users.append(websocket)

    async def broadcast(
        self,
        msg_data: dict,
        message: Optional[str] = None,
        operation: Optional[str] = None
    ) -> None:
        if operation == 'conn':
            self.users_data.append(msg_data)

        if operation == 'discon':
            for index, value in enumerate(self.users_data):
                if value['username'] == msg_data['username']:
                    self.users_data.pop(index)

        if message:
            msg_data.update({"message": message})
            user_id = await insert_message(**msg_data)
            msg_data.update({"id": user_id})

        for user in self.users:
            await user.send_json(msg_data)
            await user.send_json({"users": self.users_data})

    def disconnect(self,websocket: WebSocket) -> None:
        self.users.remove(websocket)

@app.websocket('/ws')
async def websocket(websocket: WebSocket, username: str = Query(...,min_length=1,max_length=100)):
    connection = ConnectionManager()
    await connection.connect(websocket)
    try:
        avatar = await websocket.receive_text()
        msg_data = {
            "username": username,
            "avatar": avatar,
            "received": str(datetime.now())
        }
        await connection.broadcast(msg_data,operation="conn")
        while True:
            data = await websocket.receive_text()
            await connection.broadcast(msg_data,message=f"{data}")
    except (WebSocketDisconnect, WebSocketRequestValidationError):
        connection.disconnect(websocket)
        await connection.broadcast(msg_data,operation="discon")

@app.get("/history",response_model=List[Users])
async def history():
    return await get_history()
