# Sistem Mimarisi

> Kurulum ve başlatma talimatları için [README.md](README.md) | AI pipeline detayları için [RAG_PIPELINE.md](RAG_PIPELINE.md)

---

## Genel Bakış

```
[Kullanıcı (Browser)]
        │
        ▼
[Next.js Frontend  :3000]
        │  POST /chat          (JSON)
        │  POST /chat/stream   (SSE)
        ▼
[Node.js / Express Backend  :5000]
  ├── Auth / JWT doğrulama
  ├── MongoDB CRUD (kurs, sınav, not, kullanıcı)
  ├── BullMQ kuyruk yönetimi (materyal ingestion)
  └── Python RAG proxy
        │
        │  HTTP (dahili)
        ▼
[Python FastAPI RAG Servisi  :8001]
  ├── POST /api/rag/context        ← hibrit retrieval
  ├── POST /api/llm/generate       ← yanıt üretimi (JSON)
  ├── POST /api/llm/stream         ← yanıt üretimi (SSE)
  ├── POST /api/rag/ingest         ← döküman indeksleme
  └── POST /api/rag/delete-material

[Harici Servisler]
  ├── Qdrant     (vector DB,   :6333, Docker)
  ├── Redis      (queue/cache, :6379, Docker)
  ├── MongoDB Atlas
  └── Ollama     (llama3,      :11434)
```

---

## Request Akışları

### Soru-Cevap — JSON

```
POST /chat  (Bearer JWT)
  → verifyToken
  → getPythonRagContext()   →  Python /api/rag/context
       ├── Sorgu embed edilir (sentence-transformers)
       ├── Qdrant → top-25 semantik aday
       ├── BM25 keyword puanlama (aynı adaylar)
       ├── Skor birleştirme (0.6 × semantic + 0.4 × BM25)
       └── CrossEncoder rerank → top-5
  → generatePythonReply()  →  Python /api/llm/generate
       ├── Prompt oluşturulur (prompt_builder)
       └── Ollama llama3 (stream:false)
  ← { reply, rag: { used, reason, sourceCount, sources } }
```

### Soru-Cevap — SSE Streaming

```
POST /chat/stream  (Bearer JWT)
  → verifyToken
  → getPythonRagContext()   →  aynı retrieval pipeline
  → streamPythonReply()     →  Python /api/llm/stream  (SSE)
       └── Ollama llama3 (stream:true)
  ← SSE token akışı → frontend token-by-token görüntüler
```

SSE olay sırası:

```
data: [META] {"used":true,"reason":"ok","sourceCount":3,"sources":[...]}
data: Newton
data: 'un
data:  üç
...
data: [DONE]
```

### Materyal Yükleme & İndeksleme

```
POST /api/courses/:id/materials  (Öğretmen)
  → Multer → uploads/notes/ dizinine kaydeder
  → MongoDB'de materyal kaydı oluşturur  (status: "pending")
  → BullMQ kuyruğuna ekler
  → Worker → Python /api/rag/ingest
       ├── Döküman parse (PDF/DOCX/TXT)
       ├── Semantik chunking (~600 karakter)
       ├── Embedding (sentence-transformers, batch)
       └── Qdrant upsert
  → MongoDB materyal durumu: "ready", chunksCount güncellenir
```

### Materyal Silme

```
DELETE /api/courses/:id/materials/:materialId
  ├── Qdrant'tan o materialId'ye ait tüm chunk'lar silinir
  ├── uploads/notes/ dizininden fiziksel dosya silinir
  └── MongoDB'den materyal kaydı kaldırılır
```

---

## Node.js API Route'ları

| Method | Path                              | Açıklama                      |
| ------ | --------------------------------- | ----------------------------- |
| POST   | `/auth/register`                  | Kullanıcı kaydı               |
| POST   | `/auth/login`                     | JWT token üretimi             |
| GET    | `/api/courses`                    | Kurs listesi (role-aware)     |
| POST   | `/api/courses`                    | Kurs oluştur (öğretmen/admin) |
| GET    | `/api/courses/:id`                | Kurs detayı + materyaller     |
| POST   | `/api/courses/:id/materials`      | Materyal yükle                |
| DELETE | `/api/courses/:id/materials/:mid` | Materyal sil                  |
| GET    | `/api/exams`                      | Sınav listesi                 |
| POST   | `/api/exams`                      | Sınav oluştur                 |
| POST   | `/api/grades`                     | Not gir                       |
| GET    | `/api/grades`                     | Notları görüntüle             |
| POST   | `/chat`                           | RAG destekli sohbet (JSON)    |
| POST   | `/chat/stream`                    | RAG destekli sohbet (SSE)     |

Auth: `Authorization: Bearer <JWT>` — tüm `/api/` ve `/chat` route'ları için zorunlu.

---

## Proje Dosya Yapısı

```
AIWebSchoolProject/
├── .venv/                          # Python sanal ortamı
├── docker-compose.yml              # Qdrant + Redis
├── README.md                       # Kurulum & başlatma
├── ARCHITECTURE.md                 # Bu dosya — sistem mimarisi
├── RAG_PIPELINE.md                 # AI pipeline detayları
│
├── backend/
│   ├── app.js                      # Express giriş noktası
│   ├── .env                        # Ortam değişkenleri
│   ├── uploads/notes/              # Yüklenen materyal dosyaları
│   │
│   ├── python_rag_service/         # FastAPI RAG servisi
│   │   ├── main.py                 # FastAPI uygulama & tüm route'lar
│   │   ├── config.py               # Tüm RAG parametreleri (.env okur)
│   │   ├── schemas.py              # Pydantic request/response şemaları
│   │   ├── db.py                   # MongoDB bağlantısı
│   │   ├── errors.py               # ApiError sınıfı
│   │   ├── requirements.txt        # Python bağımlılıkları
│   │   ├── retrieval/              # Vektör arama katmanı
│   │   │   ├── embedding_service.py
│   │   │   ├── qdrant_service.py
│   │   │   ├── bm25_service.py
│   │   │   ├── reranker_service.py
│   │   │   └── rag_service.py
│   │   ├── parsing/                # Döküman işleme katmanı
│   │   │   ├── document_parser.py
│   │   │   ├── text_chunker.py
│   │   │   └── ingestion_service.py
│   │   └── llm/                    # Dil modeli katmanı
│   │       ├── prompt_builder.py
│   │       └── ollama_service.py
│   │
│   └── src/
│       ├── controllers/            # authController, courseController, examController, gradeController
│       ├── middlewares/            # verifyToken, checkRole, logger, upload, errorHandler
│       ├── models/                 # User, Course, Exam, Grade
│       ├── queue/                  # ragIngestionQueue.js
│       ├── routes/                 # chat.js, authRoutes, examRoutes, gradeRoutes, getCourses, getUser
│       ├── services/               # pythonRagClient.js, llmService.js, rag/ragService.js
│       └── workers/                # ragWorker.js
│
└── frontend/
    ├── app/
    │   ├── student/                # Öğrenci paneli (courses, exam, grades, chatbot, profile)
    │   ├── teacher/                # Öğretmen paneli (courses, exams, grades, chatbot, profile)
    │   └── admin/                  # Admin paneli (courses, register, chatbot, profile)
    ├── components/                 # ProfileCard
    ├── hooks/                      # useChatMessages.ts, useProfile.ts
    └── types/                      # index.ts
```

---

## Deployment Önerileri

| Bileşen               | Öneri                                                                         |
| --------------------- | ----------------------------------------------------------------------------- |
| Qdrant                | Managed cloud (cloud.qdrant.io) veya dedicated VM — persistent volume zorunlu |
| Redis                 | Redis Cloud free tier veya Upstash (serverless)                               |
| Python servisi        | Uvicorn + Gunicorn veya Docker container (2+ worker)                          |
| Node backend          | PM2 cluster mode                                                              |
| HuggingFace modelleri | Container image'a dahil et — cold start'ı önler                               |
| GPU                   | NVIDIA runtime ekle — embedding ~10x hızlanır                                 |

## Scalability

- **Qdrant**: sharding ile yatay ölçekleme destekler
- **Embedding**: GPU ile `EMBED_BATCH_SIZE=64+` artırılabilir
- **Reranker**: en yavaş adım (~100ms/chunk CPU) — GPU ile ~5ms/chunk
- **BullMQ**: `concurrency=4` ile paralel ingestion
- **Python servisi**: stateless → load balancer arkasına kolayca alınabilir
