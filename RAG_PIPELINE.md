# RAG Pipeline — AI Servis Detayları

> Kurulum için [README.md](README.md) | Sistem mimarisi için [ARCHITECTURE.md](ARCHITECTURE.md)

---

## Python Servis Dosya Yapısı

```
backend/python_rag_service/
├── main.py              ← FastAPI uygulama & tüm HTTP endpoint'ler
├── config.py            ← Tüm env parametreleri (.env okur)
├── schemas.py           ← Pydantic request/response şemaları
├── db.py                ← MongoDB singleton bağlantısı
├── errors.py            ← ApiError, is_runner_terminated_message
├── requirements.txt
│
├── retrieval/           ← Vektör arama & retrieval katmanı
│   ├── embedding_service.py  ← SentenceTransformer singleton, GPU auto-detect, lru_cache
│   ├── qdrant_service.py     ← Qdrant client, collection yönetimi, query/upsert/delete
│   ├── bm25_service.py       ← BM25Okapi index, Türkçe tokenizer, normalize_scores
│   ├── reranker_service.py   ← CrossEncoder singleton, rerank()
│   └── rag_service.py        ← 2-aşamalı hibrit retrieval orchestration
│
├── parsing/             ← Döküman ayrıştırma & chunking katmanı
│   ├── document_parser.py    ← PDF/DOCX/TXT parse, sayfa+bölüm metadata, SHA-256 hash
│   ├── text_chunker.py       ← Semantik recursive chunker (NLTK punkt_tab)
│   └── ingestion_service.py  ← Tam ingestion pipeline (parse → chunk → embed → upsert)
│
└── llm/                 ← Dil modeli üretim katmanı
    ├── prompt_builder.py     ← Sistem promptu, bağlam bloğu, tam prompt birleştirme
    └── ollama_service.py     ← generate_reply() (blocking) + generate_stream() (async SSE)
```

---

## Python Paketleri

| Paket                        | Kullanım                                                     |
| ---------------------------- | ------------------------------------------------------------ |
| `fastapi==0.115.9`           | HTTP API framework                                           |
| `uvicorn==0.34.2`            | ASGI sunucu                                                  |
| `pymongo==4.13.0`            | MongoDB bağlantısı                                           |
| `qdrant-client>=1.9.0`       | Qdrant vektör DB istemcisi (`query_points` API kullanılıyor) |
| `sentence-transformers>=2.7` | Embedding (`e5-base`) ve reranker (`CrossEncoder`)           |
| `torch>=2.2.0`               | sentence-transformers backend — GPU auto-detect              |
| `rank-bm25>=0.2.2`           | BM25Okapi keyword retrieval                                  |
| `nltk>=3.8.0`                | Türkçe cümle tokenizer (`punkt_tab`)                         |
| `httpx>=0.27.0`              | Async HTTP — Ollama streaming bağlantısı                     |
| `requests==2.32.3`           | Sync HTTP — Ollama blocking çağrıları                        |
| `PyMuPDF>=1.23.0,<2.0.0`     | PDF parse — sayfa/blok düzeyinde metin çıkarımı              |
| `docx2txt==0.9`              | DOCX parse                                                   |
| `python-multipart==0.0.20`   | FastAPI form/dosya yükleme desteği                           |
| `pydantic`                   | Request/response şema validasyonu                            |

---

## FastAPI Endpoint'leri

| Method | Path                       | Açıklama                                                          |
| ------ | -------------------------- | ----------------------------------------------------------------- |
| GET    | `/health`                  | Servis sağlık kontrolü → `{"ok": true}`                           |
| POST   | `/api/rag/ingest`          | Döküman parse + chunk + embed + Qdrant upsert                     |
| POST   | `/api/rag/context`         | Hibrit retrieval → top-5 chunk döner                              |
| POST   | `/api/llm/generate`        | Prompt oluştur + Ollama fine-tuned mistral-7b-edu blocking yanıt  |
| POST   | `/api/llm/stream`          | Prompt oluştur + Ollama fine-tuned mistral-7b-edu SSE token akışı |
| POST   | `/api/rag/delete-material` | Qdrant'tan materialId'ye ait chunk'ları sil                       |

Tüm endpoint'ler `X-Rag-Secret` header ile korunur (`PY_RAG_SHARED_SECRET`).

---

## Ingestion Pipeline (Adım Adım)

```
Öğretmen dosya yükler (PDF / DOCX / TXT)
         │
         ▼
1. document_parser.py
   ├── PDF  → PyMuPDF fitz: blok düzeyinde metin, sayfa numarası, bölüm başlığı
   ├── DOCX → docx2txt: paragraf bölme, bölüm tespiti (heading heuristic)
   └── TXT  → UTF-8 decode, paragraf bölme
   → SHA-256 hash ile duplicate kontrolü (aynı hash + status:ready varsa atlanır)
         │
         ▼
2. text_chunker.py  (semantik recursive)
   ├── Seviye 1: Bölüm başlıkları (heading regex)
   ├── Seviye 2: Paragraf sınırları (\n\n)
   ├── Seviye 3: Cümle sınırları (NLTK punkt_tab Türkçe)
   └── Greedy birleştirme: max ~600 karakter, 2 cümle overlap
         │
         ▼
3. embedding_service.py
   ├── Prefix: "passage: " + chunk metni
   ├── Model: intfloat/multilingual-e5-base (768 boyut)
   ├── Batch: 32 chunk/istek
   └── GPU varsa cuda, yoksa cpu
         │
         ▼
4. qdrant_service.py
   ├── ensure_collection() — koleksiyon yoksa oluşturur (cosine, HNSW)
   ├── delete_material_chunks() — önce eski chunk'lar temizlenir
   └── upsert_chunks() — yeni vektörler + payload yazılır
       Payload: { text, courseId, materialId, fileName, section, page, chunkIndex }
         │
         ▼
5. MongoDB güncelleme
   └── status: "ready", chunksCount, textExtractedAt, hash
```

---

## Retrieval Pipeline (Adım Adım)

```
Kullanıcı sorusu alınır, kurs ID'si var
         │
         ▼
1. Kurs erişim kontrolü (MongoDB)
   ├── Admin → tüm kurslara erişir
   ├── Öğretmen → kendi kurslarına erişir
   └── Öğrenci → kayıtlı olduğu kurslara erişir
         │
         ▼
2. embedding_service.embed_query()
   ├── Prefix: "query: " + soru metni
   └── lru_cache ile tekrar sorgularda önbellekten döner
         │
         ▼
3. qdrant_service.query_points()
   ├── Filter: courseId eşleşmesi
   ├── top-25 semantik aday (cosine similarity)
   └── Her aday için: text, score, payload
         │
         ▼
4. bm25_service.get_scores()
   ├── 25 adayın metni üzerinde BM25Okapi index kurulur
   ├── Türkçe tokenizer (noktalama temizleme, lowercase)
   └── Her aday için BM25 skoru
         │
         ▼
5. Skor birleştirme (fusion)
   ├── Her iki skor [0,1] aralığına normalize edilir
   └── final_score = 0.6 × semantic + 0.4 × BM25
         │
         ▼
6. reranker_service.rerank()
   ├── CrossEncoder: cross-encoder/ms-marco-MiniLM-L-6-v2
   ├── (soru, chunk_metni) çiftleri puanlanır
   └── RERANK_THRESHOLD altındakiler elenir → top-5 döner
         │
         ▼
7. Sonuç
   ├── useRag: true  → top-5 chunk context olarak döner
   └── useRag: false → reason: "no-results" | "low-similarity" | "embedding-error" | "qdrant-error"
```

---

## Prompt Yapısı

`prompt_builder.py` aşağıdaki bloklardan tam prompt oluşturur:

```
SİSTEM: Sen bir eğitim asistanısın. YALNIZCA verilen MATERYAL BAĞLAMI'nı kullan.
        Cevap materyalde yoksa: "Bu materyaller içinde buna dair bilgi bulamadım."

BAĞLAM: Kullanıcı rolü: Öğrenci. Kullanıcı adı: Ahmet Yılmaz.

DERS: Fizik 101

MATERYAL BAĞLAMI:
[Kaynak 1] fizik_ders1.pdf, Bölüm: Newton Yasaları, Sayfa: 4
Newton'un birinci hareket yasasına göre...

[Kaynak 2] ...

KULLANICI: Newton'un hareket yasaları nelerdir?

ASISTAN:
```

Parametreler: max `RAG_CONTEXT_CHAR_LIMIT=6000` karakter, max `RAG_CONTEXT_SOURCES=5` kaynak, chunk'lar MD5 hash ile tekilleştirilir.

---

## SSE Streaming Detayı

Python `/api/llm/stream` → Node `streamPythonReply()` → Frontend `useChatMessages.ts`

```
Ollama stream:true → JSON satır satır gelir
  ├── Her satır: { "response": "<token>", "done": false }
  └── Son satır: { "response": "", "done": true }

Python → Node'a SSE:
  data: <token>\n\n     ← her token için
  data: [DONE]\n\n      ← bitti

Node → Frontend'e SSE:
  ├── İlk event: [META] {"used":true,"reason":"ok","sourceCount":3,...}
  ├── Sonraki event'ler: token'lar
  └── Son event: [DONE]
```

---

## Fallback Senaryoları

| Durum                           | `useRag` | `reason`          | Davranış                                  |
| ------------------------------- | -------- | ----------------- | ----------------------------------------- |
| Kurs seçilmemiş                 | false    | `no-course`       | Genel sohbet — bağlam olmadan LLM'e gider |
| Kurs seçili, materyal yok       | false    | `no-results`      | Genel chatbot yanıtı                      |
| Materyal var, soru alakasız     | false    | `low-similarity`  | CrossEncoder eşiği altında — genel yanıt  |
| Embedding servisi başlatılamadı | false    | `embedding-error` | Genel yanıt                               |
| Qdrant erişilemez               | false    | `qdrant-error`    | Genel yanıt                               |
| Python servisi kapalı           | —        | —                 | Node `503 Service Unavailable`            |
| Ollama yanıt vermez             | —        | —                 | `504 Gateway Timeout`                     |
| Ollama runner çöker             | —        | —                 | 750ms bekle + 1 otomatik retry            |
