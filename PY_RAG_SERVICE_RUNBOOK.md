# Python RAG Service Runbook

Bu dokuman JS RAG'den Python RAG servisine gecis sonrasi lokal calistirma ve test adimlarini verir.

## 1) Python RAG bagimliliklari

Backend klasorunde:

```powershell
cd backend
..\.venv\Scripts\python.exe -m pip install -r python_rag_service/requirements.txt
```

Not: Bu proje icin Python RAG bagimliliklarini global ya da `--user` ile degil, dogrudan workspace icindeki `.venv` ortamina kur.

Eger `.venv` aktif degilse ama elle kurmak istiyorsan tam yol ile calistir:

```powershell
cd backend
C:/Users/hidos/Desktop/AI school web app/AIWebSchoolProject/.venv/Scripts/python.exe -m pip install -r python_rag_service/requirements.txt
```

## 2) Gerekli servisleri ac

1. Ollama
2. Chroma
3. Python RAG service
4. Backend (Node)
5. Frontend

### Chroma

```powershell
chroma run --path ./chroma_db --host localhost --port 8000
```

### Python RAG service

```powershell
cd backend
npm run rag:python
```

Bu script artik dogrudan workspace icindeki `.venv` Python yorumlayicisini kullanir. Bu nedenle `fastapi` ve diger RAG paketleri `.venv` icinde kurulu olmali.

Health kontrol:

```powershell
Invoke-WebRequest -Uri http://127.0.0.1:8001/health -Method Get
```

Beklenen: HTTP 200 ve `{"ok":true}`

### Backend

```powershell
cd backend
npm run dev
```

### Frontend

```powershell
cd frontend
npm run dev
```

## 3) .env degiskenleri

Backend `.env` icinde en az su degerler olmali:

```env
MONGO_URI=...
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
OLLAMA_EMBED_MODEL=nomic-embed-text:latest
CHROMA_URL=http://localhost:8000
CHROMA_COLLECTION=course_materials
QUEUE_PROVIDER=local

# Python RAG service endpoint
PY_RAG_SERVICE_URL=http://127.0.0.1:8001
# Opsiyonel, eger girersen Node ve Python ayni secret'i kullanmali
PY_RAG_SHARED_SECRET=
PY_RAG_TIMEOUT_MS=120000
```

## 4) E2E test senaryolari

### Test A - Genel chat fallback

1. Chat ekraninda ders secmeden soru sor.
2. Beklenen: cevap gelir, RAG zorunlu degil.

### Test B - RAG ingestion

1. Ogretmen panelinden bir derse PDF/DOCX/TXT yukle.
2. Beklenen: material status `pending -> processing -> ready`.
3. Beklenen: `chunksCount > 0` (duplicate degilse).

### Test C - Ders bazli RAG

1. Chat ekraninda ilgili dersi sec.
2. Yuklenen materyale dogrudan bagli bir soru sor.
3. Beklenen: context tabanli cevap gelir.

### Test D - Fallback (low/no result)

1. Derse ilgisiz bir soru sor.
2. Beklenen: genel cevap/fallback davranisi calisir.

### Test E - Material silme

1. Yuklenen materyali sil.
2. Beklenen: ders kaydindan silinir, vektor verileri de silinir.

## 5) Hata durumlari

- `Python RAG service is unreachable`:
  - `npm run rag:python` calisiyor mu kontrol et.
  - `PY_RAG_SERVICE_URL` dogru mu kontrol et.

- `ModuleNotFoundError: No module named 'fastapi'`:
  - Paketler `.venv` icine kurulmamis demektir.
  - `cd backend`
  - `..\.venv\Scripts\python.exe -m pip install -r python_rag_service/requirements.txt`

- `Cannot connect to Ollama`:
  - `ollama serve` acik mi kontrol et.

- `No readable text extracted from file`:
  - Dosya icerigi bos/bozuk olabilir; farkli dosya dene.

## 6) Bu migrasyonda degisenler

- Node tarafinda RAG retrieval, ingestion, vector delete ve generation akislari Python servise delege edildi.
- Eski JS parser/chunker modulleri kaldirildi.
- Frontend endpoint sozlesmesi degismedi.
