const multer = require("multer");
const fs = require("fs");
const path = require("path");

// Dosyanın kaydedileceği yer ve isim ayarları
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 1. Hedef klasör yolu: proje_ana_dizini/uploads/notes
    const uploadPath = path.join("uploads", "notes");

    // 2. Klasör yoksa oluştur (recursive: true, iç içe klasör oluşturur)
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // 3. Dosya ismini düzenle: Rastgele karakter yerine Tarih + Orijinal İsim
    // Örnek: 17156230005-ders-notu.pdf

    // Türkçe karakterleri ve boşlukları temizle (isteğe bağlı ama önerilir)
    const sanitizedName = file.originalname
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9.\-_]/g, "");

    const uniqueSuffix = Date.now() + "-" + sanitizedName;
    cb(null, uniqueSuffix);
  },
});

// Sadece belirli dosya türlerine izin verelim (isteğe bağlı güvenlik)
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Desteklenmeyen dosya türü! Sadece PDF, Word ve Resim yükleyebilirsiniz."
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 100 }, // Maksimum 100MB
  fileFilter: fileFilter,
});

module.exports = upload;
