# RAG Implementation Worklog

Bu doküman, projedeki RAG altyapısının ne durumda olduğunu, neleri tamamladığımızı, sırada hangi işlerin bulunduğunu ve sistemin pratikte nasıl çalıştığını hızlıca görmek için hazırlanmıştır.

---

## Amaç

Hedeflenen akış şu şekildedir:

- öğretmen ders materyali yükler,
- dosya sunucuda saklanır,
- içerik arka planda işlenir,
- metin chunk'lara ayrılır,
- embedding'ler üretilir,
- vektörler ChromaDB'ye kaydedilir,
- öğrenci o ders için soru sorduğunda yalnızca ilgili materyallerden context alınır,
- uygun bağlam yoksa sistem genel chatbot akışına döner.

---

## Kullanılan Teknolojiler

- Backend: Express
- Frontend: Next.js
- Veritabanı: MongoDB
- Chat modeli: Ollama
- Embedding modeli: Ollama embedding endpoint'i
- Vector store: ChromaDB
- Queue: BullMQ + Redis veya local async fallback

---

## Tamamlanan İşler

Aşağıdaki başlıklar aktif olarak tamamlanmış durumdadır:

- [x] Temel chatbot entegrasyonu kuruldu
- [x] Student, teacher ve admin chatbot sayfaları backend'e bağlandı
- [x] Sohbet geçmişi localStorage ile korunur hale getirildi
- [x] Ders materyali yükleme akışı eklendi
- [x] PDF, DOCX ve TXT parsing altyapısı hazırlandı
- [x] Metni chunk'lara bölen servis eklendi
- [x] Embedding üretimi Ollama ile bağlandı
- [x] ChromaDB'ye yazma ve sorgulama servisi eklendi
- [x] Course bazlı retrieval mantığı kuruldu
- [x] Materyal durum alanları eklendi: pending, processing, ready, failed
- [x] Windows ortamı için local queue fallback aktif hale getirildi
- [x] PDF parse uyumluluk sorunu giderildi
- [x] RAG isteklerinde timeout azaltımı için süre ve context sınırları iyileştirildi

---

## Güncel Durum

RAG altyapısı uygulamaya entegre edilmiştir ve temel uçtan uca akış çalışmaktadır. Şu an sistemin davranışı şöyledir:

- ders seçilmeden sorulan sorular genel chatbot üzerinden cevaplanır,
- ders seçilip materyal hazır durumdaysa retrieval devreye girer,
- yeterli bağlam bulunamazsa fallback cevap mekanizması çalışır.

Bu makinede en güvenilir geliştirme ayarı:

- `QUEUE_PROVIDER=local`

Bu sayede materyal yükleme sonrası ingestion işlemi arka planda devam eder ve ayrı worker zorunlu olmaz. Daha sonra Redis tabanlı tam kuyruk sistemi istenirse `bullmq` moduna geçilebilir.

---

## Sistem Akışı

### 1. Upload akışı

- öğretmen dosya yükler,
- dosya ilgili ders materyaline eklenir,
- başlangıç durumu `pending` olur,
- ingestion işlemi başlatılır,
- sistem dosyadan metni çıkarır,
- metin chunk'lara ayrılır,
- embedding üretilir,
- ChromaDB içine yazılır,
- başarıyla biterse materyal durumu `ready` yapılır.

### 2. Soru-cevap akışı

- kullanıcı bir ders seçer,
- soru backend'e gönderilir,
- sistem önce erişim kontrolü yapar,
- soru embedding'e çevrilir,
- ChromaDB içinde o derse ait en alakalı chunk'lar aranır,
- sonuç varsa prompt bağlamı bu içeriklerle oluşturulur,
- Ollama cevap üretir,
- sonuç kullanıcıya Türkçe ve kısa/öğretici biçimde döner.

---

## Önemli Dosyalar

- `backend/src/controllers/courseController.js`
- `backend/src/routes/chat.js`
- `backend/src/services/llmService.js`
- `backend/src/services/rag/documentParser.js`
- `backend/src/services/rag/textChunker.js`
- `backend/src/services/rag/chromaService.js`
- `backend/src/services/rag/ragService.js`
- `backend/src/services/rag/ingestionProcessor.js`
- `backend/src/queue/ragIngestionQueue.js`
- `backend/src/workers/ragWorker.js`

---

## Çalıştırma Notları

RAG akışının çalışması için genelde aşağıdakiler yeterlidir:

1. MongoDB açık olmalı
2. Ollama açık olmalı
3. ChromaDB erişilebilir olmalı
4. Backend çalışmalı
5. Frontend çalışmalı
6. Eğer `QUEUE_PROVIDER=bullmq` ise worker ayrıca başlatılmalı

Yerel geliştirme için tipik akış:

- backend'i başlat,
- frontend'i başlat,
- materyal yükle,
- materyalin `ready` olmasını bekle,
- ilgili dersi seçerek soru sor.

---

## Sıradaki İşler

Öncelikli geliştirme adımları şunlardır:

1. gerçek kullanıcı senaryolarıyla daha fazla doğrulama yapmak,
2. kaynak gösterimi eklemek,
3. relevance ve top-k ayarlarını daha akıllı hale getirmek,
4. sohbet geçmişini RAG ile birlikte daha iyi yönetmek,
5. büyük materyallerde cevap kalitesini artırmak,
6. üretim ortamı için servis başlatma süreçlerini netleştirmek.

---

## Başarı Kriterleri

RAG akışının başarılı kabul edilmesi için şu maddeler kontrol edilir:

- upload isteği hızlı cevap dönüyor mu,
- materyal statüsü doğru güncelleniyor mu,
- chunk üretimi yapılıyor mu,
- Chroma sorgusu sonuç veriyor mu,
- ilgili sorularda materyal bazlı cevap dönüyor mu,
- alakasız sorularda fallback doğru çalışıyor mu.

---

## Not

İlk sürüm bilinçli olarak sade tutulmuştur. OCR, görüntü analizi, taranmış PDF desteği ve daha gelişmiş kaynak gösterimi sonraki fazlara bırakılmıştır.
