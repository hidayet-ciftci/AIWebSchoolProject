# Ollama (Local LLM) Entegrasyon Notları

Bu doküman, **AI school web app** projesinde yapılan **Ollama (local)** entegrasyonunu ve sonraki adımları özetler. GitHub'a koymak ve sonra tekrar hatırlatmak için hazırlanmıştır.

## Genel Durum

- **Frontend**: Next.js (student/teacher/admin panellerinde ChatBot sayfaları var)
- **Backend**: Express + MongoDB
- **LLM**: Ollama, local olarak `http://localhost:11434` üzerinde çalışıyor

## Yapılanlar (Özet)

### Backend

- **LLM servisi eklendi**
  - Dosya: `backend/src/services/llmService.js`
  - Ollama endpoint: `POST http://localhost:11434/api/generate`
  - Model: varsayılan `llama3`, yoksa `/api/tags` üzerinden mevcut ilk modele düşer
  - **Türkçe zorlaması**: prompt içine güçlü sistem talimatı eklendi:
    - `"Her zaman Türkçe cevap ver. Açıklayıcı ve öğretici bir dil kullan."` (ve benzeri güçlendirilmiş metin)
  - **Hata yönetimi**: timeout / bağlantı hatası / Ollama error mesajları anlamlı şekilde ele alınıyor
  - **Runner crash için retry**:
    - `"runner process has terminated"` görülürse kısa bekleyip **1 kez tekrar** deniyor (Ollama bazen ilk isteklerde toparlıyor)

- **Chat endpoint’i eklendi**
  - Dosya: `backend/src/routes/chat.js`
  - Route: `POST /chat`
  - Auth: `verifyToken` ile korumalı (**student/teacher/admin** hepsi kullanabilir)
  - Request:
    ```json
    { "message": "string" }
    ```
  - Response:
    ```json
    { "reply": "string" }
    ```

- **Route server’a bağlandı**
  - Dosya: `backend/app.js`
  - Eklenen satır:
    - `app.use("/chat", chatRouter);`

### Frontend (Chatbot’lar gerçek API’ye bağlandı)

Önceden ChatBot sayfaları `setTimeout` ile **sahte cevap** üretiyordu. Artık hepsi backend’e POST atıyor:

- **Student**: `frontend/app/student/chatbot/page.tsx`
- **Teacher**: `frontend/app/teacher/chatbot/page.tsx`
- **Admin**: `frontend/app/admin/chatbot/page.tsx` (yeni eklendi)

Ortak davranış:

- `localStorage` içinden `token` alır
- `POST ${NEXT_PUBLIC_API_URL}/chat` çağırır
- `Authorization: Bearer <token>` header’ı ile gider
- İstek sırasında input/button disable olur (`isSending`)
- Hata olursa `react-hot-toast` ile mesaj gösterir

Admin menüsüne link eklendi:

- Dosya: `frontend/app/admin/layout.tsx`
- Link: `/admin/chatbot`

## Çevre Değişkenleri (ENV)

### Backend (`backend/.env`)

Zaten vardı:

- `PORT=5000`
- `FRONTEND_URL=http://localhost:3000`
- `MONGO_URI=...`
- `JWT_SECRET=...`

Opsiyonel (istersen eklenebilir):

- `OLLAMA_BASE_URL=http://localhost:11434`
- `OLLAMA_MODEL=llama3:latest` (veya cihazın kaldırdığı daha küçük bir model)

### Frontend (`frontend/.env.local`)

Gerekli:

- `NEXT_PUBLIC_API_URL=http://localhost:5000`

## Çalıştırma

### 1) Ollama

- Ollama servisinin çalışıyor olması gerekir.
- Model kontrol:
  - `ollama list`
  - `ollama pull llama3`

Not: Bazı cihazlarda `llama3` ilk çalıştırmada runner hatası verebiliyor, birkaç denemeden sonra toparlayabiliyor.

### 2) Backend

Proje kökünde veya `backend` klasöründe:

- `npx nodemon app.js` (mevcut kullanım)

### 3) Frontend

`frontend` klasöründe:

- `npm run dev`

## API Test (Postman / curl)

`POST http://localhost:5000/chat`

Headers:

- `Content-Type: application/json`
- `Authorization: Bearer <TOKEN>`

Body:

```json
{ "message": "Merhaba, bana 5 maddelik çalışma planı hazırlar mısın?" }
```

Response:

```json
{ "reply": "..." }
```

## Bilinen Durum / Sorunlar

- **Ollama “runner process has terminated”**:
  - Genelde RAM/VRAM yetersizliği veya Ollama’nın ilk çalıştırma anındaki kararsızlığıyla ilişkili.
  - Backend tarafında bu hata için **1 retry** eklendi.
  - Devam ederse çözüm: daha küçük model (örn. 3B) veya Ollama restart.

## Yapılabilecek İyileştirmeler (Backlog)

- **Streaming**:
  - Ollama `stream: true` ile parça parça yanıt verebilir.
  - Backend: SSE/WebSocket ile stream forward edilebilir.
  - Frontend: mesaj balonuna “yazıyor...” gibi akış eklenebilir.

- **Conversation history (sohbet geçmişi)**:
  - Şu an her istek tek mesajla gidiyor.
  - İyileştirme: Son N mesajı prompt’a eklemek.

- **Role bazlı davranış**:
  - Şu an role bilgisi prompt’a ekleniyor (admin/teacher/student).
  - İyileştirme: Role göre farklı sistem prompt’ları ve güvenlik kuralları.

- **DB’den kullanıcı profilini bağlama eklemek**:
  - Şu an `req.user` içinden role alınıyor.
  - İyileştirme: `req.user.id` ile DB’den kullanıcıyı çekip isim/branş vb. bağlam eklemek.

- **Model fallback stratejisi**:
  - Runner crash durumunda otomatik daha küçük bir modele düşme (env ile yönetilebilir).
