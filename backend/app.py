from fastapi import FastAPI, Query, WebSocket, WebSocketDisconnect
from typing import List

app = FastAPI()

class ConnectionManager:
    users: List[WebSocket] = []

    async def connect(self,websocket: WebSocket):
        await websocket.accept()
        self.users.append(websocket)

    async def broadcast(self,message: dict):
        for user in self.users:
            await user.send_json(message)

    def disconnect(self,websocket: WebSocket):
        self.users.remove(websocket)

@app.websocket('/ws')
async def websocket(websocket: WebSocket, username: str = Query(...)):
    connection = ConnectionManager()
    await connection.connect(websocket)
    try:
        avatar = await websocket.receive_text()
        await connection.broadcast({"username": username,"message":f"{username} connected","avatar": avatar})
        while True:
            data = await websocket.receive_text()
            await connection.broadcast({"username": username,"message":f"{data}","avatar": avatar})
    except WebSocketDisconnect:
        connection.disconnect(websocket)
        await connection.broadcast({"username": username,"message":f"{username} disconnected","avatar": avatar})
