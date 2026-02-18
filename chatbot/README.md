# Chatbot (Local Dev Utilities)

The production chatbot is now a native web page in `map/` (`/chat`) backed by a Netlify Function (`map/netlify/functions/ask-ava.mjs`) so it does not sleep like Streamlit and requires no user login.

This `chatbot/` folder is kept for local RAG experimentation.

## Local Stack (Optional)

- Retrieval: Chroma
- Embeddings: Ollama (`nomic-embed-text`)
- Chat model: Ollama (`qwen2.5:7b` by default)
- UI: Streamlit

## Commands

From repository root:

```bash
pip install -r chatbot/requirements.txt
python chatbot/ingest.py
streamlit run chatbot/main.py
```

## Environment Variables

- `OLLAMA_BASE_URL` (default: `http://localhost:11434`)
- `OLLAMA_CHAT_MODEL` (default: `qwen2.5:7b`)
- `OLLAMA_EMBED_MODEL` (default: `nomic-embed-text`)
- `MASTER_DATA_PATH` (optional override)
- `VECTORSTORE_DIR` (optional override)
- `COLLECTION_NAME` (optional override)
