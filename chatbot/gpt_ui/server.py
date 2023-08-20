import asyncio
import websockets

async def handle_client(websocket, path):
    async for message in websocket:
        if message == "ping":
            await websocket.send("pong")
        if message == "I am Pablo":
            await websocket.send("Really? You are so cool you are like the coolest person ever born and humble too. And handsome")
        else:
            await websocket.send("I don't understand")

start_server = websockets.serve(handle_client, "localhost", 8765)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
