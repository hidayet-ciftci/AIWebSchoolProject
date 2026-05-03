# AIWebSchoolProject

Okul yönetimi ile yapay zeka destekli öğrenmeyi aynı platformda birleştiren full-stack bir web uygulaması.  
Öğretmenler ders materyali yükler, öğrenciler o materyale dayalı sorular sorar, sistem RAG mimarisiyle ilgili bağlamı bulup Ollama üzerinde yerel LLM ile Türkçe yanıt üretir.

---

## çindekiler

- [Proje Nedir?](#proje-nedir)
- [Teknoloji Yığını](#teknoloji-yığını)
- [Mimari](#mimari)
- [Kullanıcı Rolleri ve Ekranlar](#kullanıcı-rolleri-ve-ekranlar)
- [Özellikler](#özellikler)
- [Kurulum](#kurulum)
- [Servisleri Başlatma](#servisleri-başlatma)
- [Ortam Değişkenleri (.env)](#ortam-değişkenleri-env)
- [Güncel Durum](#güncel-durum)
- [Bilinen Sorunlar ve Çözümler](#bilinen-sorunlar-ve-çözümler)
- [Yol Haritası](#yol-haritası)

---

## Proje Nedir?

AIWebSchoolProject şu amaçlar için tasarlanmıştır:

- Okul süreçlerini tek panelden yönetmek
- Öğretmenlerin ders ve materyal yükleyebilmesini sağlamak
- Öğrencilerin ders içeriklerine ve sınavlara erişebilmesini sağlamak
- PDF, DOCX ve TXT materyallerden bilgi çekerek yapay zeka destekli soru-cevap deneyimi sunmak (RAG)
- Tüm yanıtları yerel Ollama LLM ile üretmek; harici bir API'ye bağımlılık olmaksızın

---

## Teknoloji Yığını

| Katman        | Teknoloji                                                            |
| ------------- | -------------------------------------------------------------------- |
| Frontend      | Next.js 15, React 19, TypeScript, Tailwind CSS, React Hot Toast      |
| Backend       | Node.js, Express.js (port 5000)                                      |
| Veritabanı    | MongoDB Atlas (bulut)                                                |
| Auth          | JWT                                                                  |
| LLM           | Ollama — model: `llama3:latest`                                      |
| Embedding     | Ollama — model: `nomic-embed-text:latest`                            |
| Vector DB     | ChromaDB (port 8000) — koleksiyon: `course_materials`, cosine mesafe |
| RAG Servisi   | Python FastAPI (port 8001)                                           |
| Dosya Parse   | PyMuPDF (`fitz`) — PDF, DOCX, TXT                                    |
| Kuyruk        | Local async fallback (`setImmediate`) veya BullMQ + Redis            |
| Dosya Yükleme | Multer                                                               |

---

## Mimari

```
[Kullanıcı (Browser)]
        │
        ▼
[Next.js Frontend :3000]
        │  REST API
        ▼
[Node.js / Express Backend :5000]
        │                    │
        │ Sorgu akışı        │ ngestion akışı
        ▼                    ▼
[Python FastAPI RAG :8001]  [Kuyruk → Python FastAPI]
        │                         │
        ├── ChromaDB :8000 ◄───────┘  (embedding kaydet / sorgula)
        └── Ollama :11434            (embedding üret / yanıt üret)
```

### Upload & Ingestion Akışı

1. Öğretmen dosya yükler
2. Node.js dosyayı `uploads/` klasörüne kaydeder, MongoDB'de materyal kaydı oluşturur
3. ş kuyruğuna eklenir (local mod: `setImmediate`)
4. Python RAG servisi dosyayı alır, PyMuPDF ile metni çıkarır
5. Metin chunk'lara ayrılır
6. Her chunk için Ollama ile embedding üretilir (8'li batch, aralarında 0.1s bekleme)
7. Embedding'ler ChromaDB'ye kaydedilir
8. Materyal durumu `pending → processing → ready` olarak güncellenir

### Soru-Cevap Akışı

1. Kullanıcı ders seçer ve soru sorar
2. Backend erişim kontrolü yapar
3. Python RAG servisi soruyu embedding'e çevirir
4. ChromaDB'de o derse ait en alakalı chunk'lar bulunur (top-k: 6, max mesafe: 0.65)
5. Bulunan chunk'lar prompt bağlamı olarak Ollama'ya gönderilir
6. Ollama Türkçe yanıt üretir (num_predict: 400, temperature: 0.3)
7. Yanıt ve kaynak dosya adları frontend'e döner

---

## Kullanıcı Rolleri ve Ekranlar

### Admin

- Kullanıcı ve sistem yönetimi
- Tüm kurslara erişim
- Chatbot (RAG destekli)
- Profil

### Öğretmen

- Kurs oluşturma ve yönetimi
- Ders materyali yükleme (PDF, DOCX, TXT)
- Sınav oluşturma
- Not girişi
- Chatbot (RAG destekli)
- Profil

### Öğrenci

- Kayıtlı dersleri görüntüleme ve materyallere erişim
- Sınava girme
- Notlarını görme
- Chatbot — ders seçerek o materyale dayalı soru sorma (RAG)
- Profil

---

## Özellikler

### Tamamlananlar ✅

- **Rol tabanlı kimlik doğrulama**: JWT ile admin/öğretmen/öğrenci panelleri
- **Kurs yönetimi**: oluşturma, listeleme, materyal yükleme, silme
- **Sınav & not sistemi**: sınav oluşturma, öğrenci yanıtları, not girişi
- **Chatbot**: Ollama ile Türkçe sohbet, tüm rol panellerinde aktif
- **RAG altyapısı**: materyal yükleme → chunk → embed → ChromaDB → retrieval → yanıt
- **PDF desteği**: PyMuPDF ile sayfa/blok düzeyinde metin çıkarımı
- **Embedding batching**: 8'li gruplar, OOM/crash önleme
- **Sohbet geçmişi kalıcılığı**: mesajlar `localStorage`'da saklanır
- **Mesaj doğrulama**: 2000 karakter sınırı (413 hatası)
- **Materyal durum takibi**: `pending`, `processing`, `ready`, `failed`
- **Queue hata loglama**: kuyruk hataları konsola ayrıntılı yazılır
- **Model cache TTL**: 5 dakika, crash sonrası yeniden çözümleme
- **ngestion timeout**: 5 dakika (büyük dosyalar için)
- **Fallback**: Ders bağlamı bulunamazsa genel chatbot cevabı döner

---

## Kurulum

### Ön Koşullar

- Node.js ≥ 18
- Python ≥ 3.10 (`.venv` workspace içinde)
- Ollama kurulu ve çalışıyor olmalı
- ChromaDB kurulu olmalı (`pip install chromadb`)
- MongoDB Atlas bağlantısı

### 1) Depoyu Klonla

```powershell
git clone <repo-url>
cd AIWebSchoolProject
```

### 2) Python Sanal Ortamı Oluştur

```powershell
python -m venv .venv
```

### 3) Python Bağımlılıklarını Kur

```powershell
cd backend
..\.venv\Scripts\python.exe -m pip install -r python_rag_service/requirements.txt
```

Gerekli paketler: `fastapi`, `uvicorn`, `pymongo`, `chromadb`, `requests`, `PyMuPDF>=1.23.0`, `docx2txt`, `python-multipart`

### 4) Node Bağımlılıklarını Kur

```powershell
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 5) Ollama Modellerini ndir

```powershell
ollama pull llama3
ollama pull nomic-embed-text
```

### 6) .env Dosyasını Oluştur

`backend/.env` dosyası (bkz. [Ortam Değişkenleri](#ortam-değişkenleri-env))

`frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Servisleri Başlatma

**Sıralı olarak başlatılmalıdır:**

### 1) ChromaDB

```powershell
# Proje kökünden
chroma run --path ./chroma_db --host localhost --port 8000
```

### 2) Python RAG Servisi

```powershell
cd backend
npm run rag:python
```

Sağlık kontrolü:

```powershell
Invoke-WebRequest -Uri http://127.0.0.1:8001/health -Method Get
# Beklenen: HTTP 200, {"ok": true}
```

### 3) Node.js Backend

```powershell
cd backend
npm run dev
```

### 4) Next.js Frontend

```powershell
cd frontend
npm run dev
```

> **Not:** `QUEUE_PROVIDER=local` modunda ayrı bir worker başlatmak **gerekmez**.  
> BullMQ/Redis modu kullanılacaksa: `npm run dev:worker`

---

## Ortam Değişkenleri (.env)

`backend/.env` dosyasında tanımlanması gereken değişkenler:

```env
# Temel
PORT=5000
FRONTEND_URL=http://localhost:3000
MONGO_URI=<MongoDB Atlas bağlantı dizesi>
JWT_SECRET=<güçlü rastgele değer>

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3:latest
OLLAMA_EMBED_MODEL=nomic-embed-text:latest
OLLAMA_EMBED_TIMEOUT_MS=90000
OLLAMA_NUM_PREDICT=400

# ChromaDB
CHROMA_URL=http://localhost:8000
CHROMA_COLLECTION=course_materials

# RAG parametreleri
RAG_TOP_K=6
RAG_MAX_DISTANCE=0.65
RAG_CONTEXT_SOURCES=4
RAG_CONTEXT_CHAR_LIMIT=5000

# Python RAG servisi
PY_RAG_SERVICE_URL=http://127.0.0.1:8001
PY_RAG_TIMEOUT_MS=120000
PY_RAG_INGEST_TIMEOUT_MS=300000

# Kuyruk
QUEUE_PROVIDER=local
REDIS_HOST=127.0.0.1
REDIS_PORT=6380
```

---

## Güncel Durum

**Son güncelleme: Mayıs 2026**

Sistem temel uçtan uca akışla çalışır durumdadır. Mevcut başarı kriterleri:

| Kriter                       | Durum        |
| ---------------------------- | ------------ |
| Materyal yükleme & ingestion | ✅ Çalışıyor |
| Materyal durum takibi        | ✅ Çalışıyor |
| Chunk üretimi                | ✅ Çalışıyor |
| ChromaDB sorgusu             | ✅ Çalışıyor |
| Ders bazlı RAG yanıtı        | ✅ Çalışıyor |
| Fallback (bağlam yoksa)      | ✅ Çalışıyor |
| PDF parse (PyMuPDF)          | ✅ Çalışıyor |

---

## Bilinen Sorunlar ve Çözümler

| Sorun                                            | Neden                                                  | Çözüm                                                                                              |
| ------------------------------------------------ | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Ollama "runner process has terminated"           | RAM/VRAM yetersizliği veya ilk çalıştırma kararsızlığı | Backend 1 otomatik retry yapar; devam ederse Ollama'yı yeniden başlat veya daha küçük model kullan |
| ChromaDB bağlantı hatası                         | `localhost` bazen IPv6 `[::1]`'e çözümleniyor          | `.env`'de `CHROMA_URL=http://127.0.0.1:8000` dene                                                  |
| Redis ECONNREFUSED (port 6380)                   | BullMQ bağlantıyı erken kuruyor                        | `QUEUE_PROVIDER=local` kullan (varsayılan)                                                         |
| ngestion timeout                                 | Çok büyük dosya veya Ollama yavaş                      | Timeout 5 dakikaya çıkarıldı; dosya boyutunu küçük tut                                             |
| `ModuleNotFoundError: No module named 'fastapi'` | Paketler `.venv`'e kurulmamış                          | `..\.venv\Scripts\python.exe -m pip install -r python_rag_service/requirements.txt`                |
| `No readable text extracted from file`           | Dosya bozuk veya taranmış PDF                          | Farklı dosya dene; OCR desteği henüz yok                                                           |

---

## Yol Haritası

### Yakın Vadeli

- [ ] **Sohbet geçmişi (chat history)**: son N mesajı prompt'a eklemek — konuşma bağlamı iyileştirilir
- [ ] **Streaming (SSE)**: Ollama `stream: true` → Backend SSE → Frontend yazıyor efekti
- [ ] **Daha fazla E2E test**: gerçek materyallerle retrieval kalitesini doğrulama

### Orta Vadeli

- [ ] **Rol bazlı farklı sistem prompt'ları**: öğrenci / öğretmen / admin için farklı davranış
- [ ] **OCR desteği**: taranmış PDF'lerden metin çıkarımı
- [ ] **Üretim ortamı kurulum kılavuzu**: PM2, Nginx, Docker Compose ile dağıtım

### Uzun Vadeli

- [ ] **Fine-tuning**: Mistral-7B veya benzeri model üzerinde eğitim verisi formatı hazırlığı
- [ ] **BullMQ + Redis tam entegrasyonu**: ölçeklenebilir kuyruk sistemi
- [ ] **Görüntü ve tablo desteği**: PDF'lerdeki görsellerin yorumlanması

---

## API Özeti

### POST /chat

```json
// stek
{ "message": "Newton'un hareket yasaları nelerdir?" }

// Yanıt
{
  "reply": "Newton'un üç hareket yasası şunlardır...",
  "rag": {
    "used": true,
    "reason": "ok",
    "sourceCount": 2
  }
}
```

Auth: `Authorization: Bearer <JWT>`

---

## Proje Yapısı

```
AIWebSchoolProject/
├── .venv/                          # Python sanal ortamı
├── chroma_db/                      # ChromaDB yerel veri klasörü
├── backend/
│   ├── app.js                      # Express giriş noktası
│   ├── .env                        # Ortam değişkenleri
│   ├── python_rag_service/         # FastAPI RAG servisi
│   │   ├── main.py                 # FastAPI uygulama
│   │   ├── rag_service.py          # Retrieval & generation
│   │   ├── ingestion_service.py    # Upload işleme
│   │   ├── document_parser.py      # PDF/DOCX/TXT parse (PyMuPDF)
│   │   ├── text_chunker.py         # Metin bölme
│   │   ├── chroma_service.py       # ChromaDB istemcisi
│   │   ├── ollama_service.py       # Embedding & LLM
│   │   ├── config.py               # Tüm RAG parametreleri
│   │   └── requirements.txt
│   └── src/
│       ├── controllers/            # authController, courseController...
│       ├── middlewares/            # verifyToken, checkRole, logger...
│       ├── models/                 # User, Course, Exam, Grade
│       ├── queue/                  # ragIngestionQueue.js
│       ├── routes/                 # chat.js, authRoutes, examRoutes...
│       ├── services/               # llmService, pythonRagClient
│       └── workers/                # ragWorker.js
└── frontend/
    ├── app/
    │   ├── student/                # Öğrenci paneli
    │   ├── teacher/                # Öğretmen paneli
    │   └── admin/                  # Admin paneli
    ├── components/                 # ProfileCard...
    ├── hooks/                      # useChatMessages, useProfile
    └── types/
```
