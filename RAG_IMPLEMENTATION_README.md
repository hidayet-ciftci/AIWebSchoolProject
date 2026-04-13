# RAG Implementation Worklog

Bu dosya, projedeki local RAG entegrasyonunun ilerleme kaydıdır. Amaç; neyin tamamlandığını, sırada ne olduğunu ve sistemi tekrar açtığımda nereden devam etmem gerektiğini net görmek.

## Hedef

- Öğretmen materyal yükler
- Dosya local olarak uploads içinde saklanır
- Arka planda queue ile işlenir
- Embeddingler local çalışan Chroma içinde tutulur
- Chat sırasında sadece ilgili ders materyalinden context alınır
- Uygun context yoksa mevcut chatbot fallback çalışır

## Mimari Kararlar

- Backend: Express
- Frontend: Next.js
- LLM: Ollama chat modeli
- Embedding: Ollama embedding modeli
- Queue: BullMQ + Redis
- Vector store: Local Chroma
- Scope: İlk sürümde sadece PDF, DOCX, TXT

## Tamamlananlar

- [x] Plain chatbot stabil hale getirildi
- [x] Sohbet geçmişi localStorage ile kalıcı yapıldı
- [x] Sohbeti sil butonu eklendi
- [x] RAG için backend bağımlılıkları kuruldu
- [x] Queue altyapısı için temel dosyalar oluşturuldu
- [x] Document parser, chunker, Chroma ve retrieval servis iskeleti oluşturuldu
- [x] Worker süreci eklendi
- [x] Windows geliştirme ortamı için yerel async queue fallback bağlandı
- [x] Chroma + embedding + retrieval smoke testi başarıyla geçti
- [x] pdf-parse v2 uyumluluğu düzeltildi ve gerçek PDF extract testi doğrulandı

## Şu Anki Durum

Aktif faz: gerçek ders verisiyle uygulama testi

Bu fazda amaç:

- upload akışını queue ile bağlamak
- chat endpointini RAG + fallback yapısına geçirmek
- materyal durum alanlarını modele eklemek
- local servislerin env ayarlarını tamamlamak

## Sıradaki İşler

1. Upload sonrası gerçek materyal ingest testini yap
2. Chat içinde gerçek course bazlı retrieval sonucunu doğrula
3. İstenirse QUEUE_PROVIDER=bullmq moduna geçmek için tam Redis 5+ uyumlu servis bağla
4. Kaynak gösterimi ve daha iyi relevance ayarı ekle

## Önemli Dosyalar

- backend/src/controllers/courseController.js
- backend/src/routes/chat.js
- backend/src/models/Course.js
- backend/src/middlewares/upload.js
- backend/src/queue/ragIngestionQueue.js
- backend/src/services/rag/documentParser.js
- backend/src/services/rag/textChunker.js
- backend/src/services/rag/chromaService.js
- backend/src/services/rag/ragService.js
- backend/src/workers/ragWorker.js

## Env Notları

Backend tarafında gerekli olması beklenen değişkenler:

- OLLAMA_BASE_URL
- OLLAMA_MODEL
- OLLAMA_EMBED_MODEL
- REDIS_HOST / REDIS_PORT veya REDIS_URL
- CHROMA_URL veya CHROMA_HOST / CHROMA_PORT
- CHROMA_COLLECTION
- RAG_TOP_K
- RAG_MAX_DISTANCE
- RAG_CHUNK_SIZE
- RAG_CHUNK_OVERLAP

## Çalıştırma Notları

Beklenen yerel servisler:

1. Redis veya yerel async queue fallback hazır olacak
2. Chroma local erişilebilir olacak
3. Ollama açık olacak
4. Backend ayrı çalışacak
5. Eğer QUEUE_PROVIDER=bullmq ise worker ayrı process olarak çalışacak

Örnek süreç:

- backend server başlat
- gerekiyorsa worker başlat
- dosya yükle
- materyal durumunu kontrol et
- course bazlı soru sor

Not: Bu makinede şu anda QUEUE_PROVIDER=local aktif. Bu sayede upload sonrası işlem yine asenkron başlar ama ayrı BullMQ worker zorunlu değildir. Daha sonra tam Redis 5+ ortamı hazır olduğunda QUEUE_PROVIDER=bullmq yapılarak doğrudan o moda geçilebilir.

## Son Doğrulama Notu

- Yerel asenkron enqueue -> embedding -> Chroma query -> cleanup zinciri test edildi ve başarılı sonuç verdi.
- Bu makinede şu an güvenilir mod olarak QUEUE_PROVIDER=local kullanılmaktadır.
- Chroma local olarak çalışıyor ve retrieval sonuç döndürüyor.
- PDF upload tarafındaki "pdfParse is not a function" hatası giderildi; parser, yeni pdf-parse API yapısına göre doğrulandı.

## Başarı Kriterleri

- Upload isteği hızlı dönüyor mu
- Queue job oluşuyor mu
- Worker materyali ready yapıyor mu
- Chroma sonuç döndürüyor mu
- Alakasız sorguda fallback chat çalışıyor mu
- Silinen materyal retrieval sonuçlarından çıkıyor mu

## Not

İlk sürüm sade tutulacak. OCR, görsel anlama ve taranmış PDF desteği sonraki faza bırakılacak.
