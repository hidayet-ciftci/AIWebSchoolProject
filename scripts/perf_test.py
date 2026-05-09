"""
Pipeline performans testi — NLTK singleton + chunker + embedding benchmark.
Calistirmak icin: python scripts/perf_test.py
"""
import sys, time, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# ─── 1. NLTK Singleton ───────────────────────────────────────────────────────
print("=== 1. NLTK SINGLETON TESTI ===")
from backend.python_rag_service.parsing.text_chunker import _get_sentence_tokenizer, _tokenize_sentences

t0 = time.perf_counter()
tok = _get_sentence_tokenizer()
first_load_ms = (time.perf_counter() - t0) * 1000
print(f"Ilk yukleme (disk)   : {first_load_ms:.0f}ms")

t0 = time.perf_counter()
for _ in range(500):
    _get_sentence_tokenizer()
singleton_ms = (time.perf_counter() - t0) * 1000
print(f"500x singleton cagri : {singleton_ms:.1f}ms total / {singleton_ms/500:.3f}ms per call")
print(f"Kazanim vs eski kod  : ~{round(500 * 71.6 / max(singleton_ms, 0.1))}x daha hizli")
print()

# ─── 2. Chunker ──────────────────────────────────────────────────────────────
print("=== 2. CHUNKER PERFORMANS TESTI ===")
sample_block = (
    "Newton'un birinci hareket yasasina gore bir cisim uzerine net bir kuvvet "
    "uygulanmadikca durur ya da sabit hizla hareket eder. Ikinci yasa F=ma "
    "formulu ile ifade edilir ve kuvvet ile ivme arasindaki iliskiyi tanimlar. "
    "Ucuncu yasa her etki icin esit ve zit bir tepki oldugunu soyler. "
    "Enerji korunumu yasasina gore bir sistemin toplam mekanik enerjisi sabit kalir. "
)
blocks = [
    {"text": sample_block * 2, "page": i // 10 + 1, "section": f"Bolum {i // 50 + 1}"}
    for i in range(300)
]

from backend.python_rag_service.parsing.text_chunker import split_text_into_chunks

t0 = time.perf_counter()
chunks_old = split_text_into_chunks(blocks=blocks, max_chunk_size=600, overlap_sentences=2)
t_old = time.perf_counter() - t0

t0 = time.perf_counter()
chunks_new = split_text_into_chunks(blocks=blocks, max_chunk_size=1000, overlap_sentences=1)
t_new = time.perf_counter() - t0

print(f"Eski (size=600, overlap=2): {len(chunks_old)} chunk, {t_old:.2f}s")
print(f"Yeni (size=1000, overlap=1): {len(chunks_new)} chunk, {t_new:.2f}s")
if chunks_new:
    avg_len = sum(len(c["text"]) for c in chunks_new) / len(chunks_new)
    print(f"Ortalama chunk uzunlugu  : {avg_len:.0f} karakter")
print(f"Chunk azalmasi           : {len(chunks_old) - len(chunks_new)} daha az chunk ({(1 - len(chunks_new)/max(len(chunks_old),1))*100:.0f}% azalma)")
print()

# ─── 3. Embedding ────────────────────────────────────────────────────────────
print("=== 3. EMBEDDING BENCHMARK (GPU) ===")
from backend.python_rag_service.retrieval.embedding_service import embed_passages
import torch
print(f"CUDA: {torch.cuda.is_available()} | Device: {'GPU' if torch.cuda.is_available() else 'CPU'}")

texts = [c["text"] for c in chunks_new[:200]]
# warmup
embed_passages(texts[:4])

t0 = time.perf_counter()
vecs = embed_passages(texts)
embed_time = time.perf_counter() - t0
throughput = len(texts) / embed_time
print(f"{len(texts)} chunk embed : {embed_time:.2f}s ({throughput:.0f} chunk/s)")
print(f"Tahmini {len(chunks_new)} chunk icin : {len(chunks_new)/throughput:.2f}s")
print()

# ─── 4. Ozet ─────────────────────────────────────────────────────────────────
print("=== 4. TAHMINI PIPELINE SURESI (300 blok PDF) ===")
total_est = t_new + len(chunks_new) / throughput
print(f"Parse        : ~0.5s   (PyMuPDF, 5MB PDF)")
print(f"Chunk        : {t_new:.2f}s")
print(f"Embed        : {len(chunks_new)/throughput:.2f}s")
print(f"Qdrant       : ~2s     (batched upsert)")
print(f"TAHMINI TOTAL: ~{0.5 + t_new + len(chunks_new)/throughput + 2:.1f}s")
