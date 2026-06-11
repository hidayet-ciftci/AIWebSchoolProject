# AIWebSchoolProject

Okul yönetimi ile yapay zeka destekli öğrenmeyi aynı platformda birleştiren full-stack web uygulaması.
Öğretmenler ders materyali yükler; öğrenciler o materyale dayalı soru sorar. Sistem hibrit RAG mimarisiyle (BM25 + semantic embedding + CrossEncoder reranker) ilgili bağlamı bulup yerel Ollama LLM ile Türkçe yanıt üretir ve SSE streaming ile token-token gösterir.

> Mimari detaylar → [ARCHITECTURE.md](ARCHITECTURE.md) | AI pipeline detayları → [RAG_PIPELINE.md](RAG_PIPELINE.md)

---

## Teknoloji Yığını

| Katman        | Teknoloji                                                                     |
| ------------- | ----------------------------------------------------------------------------- |
| Frontend      | Next.js 15, React 19, TypeScript, Tailwind CSS, React Hot Toast               |
| Backend       | Node.js, Express.js (port 5000)                                               |
| Veritabanı    | MongoDB Atlas                                                                 |
| Auth          | JWT                                                                           |
| LLM           | Ollama — fine-tuned `mistral-7b-edu` (port 11434)                             |
| Embedding     | sentence-transformers — `intfloat/multilingual-e5-base` (768 boyut)           |
| Reranker      | sentence-transformers — `cross-encoder/ms-marco-MiniLM-L-6-v2`                |
| Keyword Arama | BM25Okapi (`rank-bm25`) — Türkçe tokenizer                                    |
| Vector DB     | Qdrant (port 6333, Docker) — koleksiyon: `course_materials`                   |
| RAG Servisi   | Python FastAPI (port 8001)                                                    |
| Streaming     | SSE (Server-Sent Events)                                                      |
| Dosya Parse   | PyMuPDF (`fitz`) — PDF; docx2txt — DOCX                                       |
| Kuyruk        | Local async fallback (`setImmediate`) veya BullMQ + Redis (port 6379, Docker) |

---

## Kullanıcı Rolleri

| Rol          | Yapabilecekleri                                                                       |
| ------------ | ------------------------------------------------------------------------------------- |
| **Admin**    | Kullanıcı & sistem yönetimi, tüm kurslara erişim, chatbot                             |
| **Öğretmen** | Kurs oluşturma, materyal yükleme (PDF/DOCX/TXT), sınav oluşturma, not girişi, chatbot |
| **Öğrenci**  | Kayıtlı dersleri görüntüleme, materyallere erişim, sınava girme, not görme, chatbot   |

---

## Ön Gereksinimler

| Araç           | Notlar                                                                 |
| -------------- | ---------------------------------------------------------------------- |
| Node.js ≥ 18   | Frontend + backend için                                                |
| Python ≥ 3.10  | 3.13 test edildi                                                       |
| Docker Desktop | Qdrant + Redis container'ları için — çalışıyor olmalı                  |
| Ollama         | `mistral-7b-edu` modeli çekilmiş olmalı (`ollama pull mistral-7b-edu`) |
| MongoDB Atlas  | Bağlantı dizesi `.env`'de tanımlı olmalı                               |

---

## Kurulum (İlk Kez)

```powershell
# 1. Python sanal ortamı oluştur (proje kökünde)
python -m venv .venv

# 2. Python bağımlılıklarını kur
cd backend
..\.venv\Scripts\python.exe -m pip install -r python_rag_service/requirements.txt

# 3. NLTK tokenizer'ı indir (bir kere yeterli)
..\.venv\Scripts\python.exe -c "import nltk; nltk.download('punkt_tab'); nltk.download('punkt')"

# 4. Node bağımlılıklarını kur
npm install
cd ..\frontend ; npm install

# 5. Ollama modelini çek
ollama pull mistral-7b-edu
```

> `intfloat/multilingual-e5-base` (~1.1 GB) ve `cross-encoder/ms-marco-MiniLM-L-6-v2` (~90 MB)
> Python servisi **ilk başlatılırken** HuggingFace cache'e otomatik indirilir.

---

## Servisleri Başlatma

**5 ayrı terminalde sırayla başlatılır:**

### Terminal 1 — Docker (Qdrant + Redis)

```powershell
# Proje kökünden
docker compose up qdrant redis -d
```

Sağlık kontrolü: `http://localhost:6333/healthz`

### Terminal 2 — Ollama

```powershell
ollama serve
```

### Terminal 3 — Python RAG Servisi

```powershell
cd backend
..\.venv\Scripts\python.exe -m uvicorn python_rag_service.main:app --host 0.0.0.0 --port 8001

cd "C:\Users\hidos\Desktop\AI school web app\AIWebSchoolProject\backend"
uvicorn python_rag_service.main:app --host 0.0.0.0 --port 8001
```

> **Önemli:** Komut mutlaka `backend/` dizininden çalıştırılmalı — `python_rag_service/` içinden değil.
> `config.py` `.env` dosyasını parent dizinden okur.

Sağlık kontrolü: `http://localhost:8001/health` → `{"ok": true}`

### Terminal 4 — Node.js Backend

```powershell
cd backend
npm run dev
```

### Terminal 5 — Next.js Frontend

```powershell
cd frontend
npm run dev
```

Uygulama: `http://localhost:3000`

---

## Ortam Değişkenleri

`backend/.env` dosyası oluştur:

```env
# Temel
PORT=5000
FRONTEND_URL=http://localhost:3000
MONGO_URI=<MongoDB Atlas bağlantı dizesi>
MONGO_DB_NAME=test
MONGO_COURSE_COLLECTION=courses
JWT_SECRET=<güçlü rastgele değer>

# Ollama (sadece yanıt üretimi — embedding sentence-transformers ile yapılıyor)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral-7b-edu
OLLAMA_GENERATE_TIMEOUT_MS=90000
OLLAMA_RAG_TIMEOUT_MS=120000
OLLAMA_NUM_PREDICT=600

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_COLLECTION=course_materials

# Embedding
EMBED_MODEL=intfloat/multilingual-e5-base
EMBED_DIMENSION=768
EMBED_BATCH_SIZE=32

# Reranker
RERANKER_MODEL=cross-encoder/ms-marco-MiniLM-L-6-v2

# BM25 & Hybrid Retrieval
BM25_K1=1.5
BM25_B=0.75
HYBRID_ALPHA=0.6
RAG_CANDIDATE_K=25
RAG_FINAL_K=5
RERANK_THRESHOLD=0.0
RAG_CONTEXT_CHAR_LIMIT=6000
RAG_CONTEXT_SOURCES=5
RAG_CHUNK_SIZE=600
RAG_CHUNK_OVERLAP_SENTENCES=2

# Python RAG servisi (Node → FastAPI köprüsü)
PY_RAG_SERVICE_URL=http://127.0.0.1:8001
PY_RAG_SHARED_SECRET=<güçlü paylaşılan gizli anahtar>
PY_RAG_TIMEOUT_MS=120000
PY_RAG_INGEST_TIMEOUT_MS=300000

# Kuyruk (local: Redis gerekmez; bullmq: Redis zorunlu)
QUEUE_PROVIDER=local
REDIS_URL=redis://127.0.0.1:6379
```

`frontend/.env.local` dosyası oluştur:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Olası Sorunlar

| Sorun                                            | Neden                                              | Çözüm                                                                               |
| ------------------------------------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Ollama "runner process has terminated"           | RAM/VRAM yetersizliği                              | Backend 1 otomatik retry yapar; devam ederse Ollama'yı yeniden başlat               |
| Qdrant 502 / bağlantı hatası                     | Docker çalışmıyor                                  | `docker compose up qdrant -d` → `http://localhost:6333/healthz` kontrol et          |
| `No module named 'python_rag_service'`           | `python_rag_service/` içinden uvicorn çalıştırıldı | `cd backend` yapıp oradan `python -m uvicorn python_rag_service.main:app` çalıştır  |
| `ModuleNotFoundError: No module named 'fastapi'` | Paketler `.venv`'e kurulmamış                      | `..\.venv\Scripts\python.exe -m pip install -r python_rag_service/requirements.txt` |
| Redis ECONNREFUSED                               | Docker çalışmıyor                                  | `QUEUE_PROVIDER=local` kullan veya `docker compose up redis -d`                     |
| sentence-transformers indirme yavaş              | İlk başlatmada ~1.2 GB indiriliyor                 | HuggingFace cache'e bir kez iner, sonraki başlatmalar hızlı                         |
| `No readable text extracted from file`           | Dosya bozuk veya taranmış PDF                      | Farklı dosya dene; OCR desteği henüz yok                                            |
