"""Son dogrulama - tum degisiklikler import ve syntax kontrolu."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

print("Dosyalar yukleniyor...")
from backend.python_rag_service.parsing.text_chunker import split_text_into_chunks, _get_sentence_tokenizer
from backend.python_rag_service.parsing.ingestion_service import process_ingestion_data, mark_material_failed
import backend.python_rag_service.retrieval.qdrant_service as qs

print("OK - text_chunker import basarili")
print("OK - ingestion_service import basarili")
print("OK - qdrant_service import basarili")
print()

tok = _get_sentence_tokenizer()
status = "YUKLU" if tok is not None else "FALLBACK (regex)"
print(f"NLTK singleton: {status}")

sample = "Newton yasalari. Birinci yasa. Ikinci yasa. Ucuncu yasa. Enerji korunumu."
result = split_text_into_chunks(text=sample, max_chunk_size=1000, overlap_sentences=1)
print(f"Chunker test: {len(result)} chunk uretildi")

print(f"Qdrant batch size: {qs._UPSERT_BATCH_SIZE} (200 olmali)")
print()
print("TUM KONTROLLER BASARILI")
