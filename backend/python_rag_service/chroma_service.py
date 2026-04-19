from urllib.parse import urlparse

import chromadb

from .config import CHROMA_COLLECTION, CHROMA_URL


_chroma_client = None
_collection = None


def get_chroma_client():
    global _chroma_client
    if _chroma_client is not None:
        return _chroma_client

    parsed = urlparse(CHROMA_URL)
    host = parsed.hostname or "localhost"
    port = parsed.port or 8000
    ssl = parsed.scheme == "https"

    _chroma_client = chromadb.HttpClient(host=host, port=port, ssl=ssl)
    return _chroma_client


def get_collection():
    global _collection
    if _collection is not None:
        return _collection

    client = get_chroma_client()
    _collection = client.get_or_create_collection(
        name=CHROMA_COLLECTION,
        metadata={"hnsw:space": "cosine"},
    )
    return _collection


def upsert_document_chunks(ids, documents, embeddings, metadatas):
    collection = get_collection()
    collection.upsert(
        ids=ids,
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas,
    )


def query_relevant_chunks(embedding, course_id: str, top_k: int):
    collection = get_collection()
    result = collection.query(
        query_embeddings=[embedding],
        n_results=top_k,
        where={"courseId": course_id},
    )

    ids = result.get("ids", [[]])[0] if result else []
    documents = result.get("documents", [[]])[0] if result else []
    metadatas = result.get("metadatas", [[]])[0] if result else []
    distances = result.get("distances", [[]])[0] if result else []

    mapped = []
    for index, document in enumerate(documents):
        if not isinstance(document, str) or not document.strip():
            continue
        mapped.append(
            {
                "id": ids[index] if index < len(ids) else None,
                "document": document,
                "metadata": metadatas[index] if index < len(metadatas) else {},
                "distance": distances[index] if index < len(distances) else None,
            }
        )

    return mapped


def delete_material_chunks(material_id: str):
    collection = get_collection()
    collection.delete(where={"materialId": material_id})
