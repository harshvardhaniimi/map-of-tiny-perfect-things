import asyncio
import websockets
from datetime import datetime
from langchain.chains import ConversationalRetrievalChain
from langchain.chat_models import ChatOpenAI
from langchain.document_loaders.csv_loader import CSVLoader
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import Chroma
import os

os.environ["OPENAI_API_KEY"] = "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"

loader = CSVLoader("../master_data/master_data.csv")
places_docs = loader.load_and_split()
embeddings = OpenAIEmbeddings()
txt_docsearch = Chroma.from_documents(places_docs, embeddings, persist_directory="places_persist")
llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0.1)
qa = ConversationalRetrievalChain.from_llm(llm, retriever=txt_docsearch.as_retriever())
chat_history = []

async def handle_client(websocket, path):
    async for message in websocket:
        # Respond to predefined commands
        if message == "ping":
            await websocket.send("pong")
        elif message == "I am Pablo":
            await websocket.send("Really? You are so cool you are like the coolest person ever born and humble too. And handsome")
        else:
            try:
                question = message
                response = qa({"question": question, "chat_history": chat_history})
                answer = response["answer"]
                chat_history.append((question, answer))
                await websocket.send(answer)
            except Exception as e:
                await websocket.send("<b>Error:</b> " + str(e))

start_server = websockets.serve(handle_client, "localhost", 8765)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
