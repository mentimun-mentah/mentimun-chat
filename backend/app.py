from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, Query, WebSocket, WebSocketDisconnect

app = FastAPI()

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

        if message: msg_data.update({"message": message})

        for user in self.users:
            await user.send_json(msg_data)
            await user.send_json({"users": self.users_data})

    def disconnect(self,websocket: WebSocket) -> None:
        self.users.remove(websocket)

@app.websocket('/ws')
async def websocket(websocket: WebSocket, username: str = Query(...)):
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
    except WebSocketDisconnect:
        connection.disconnect(websocket)
        await connection.broadcast(msg_data,operation="discon")
