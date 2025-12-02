const multer = require("multer");
const path = require("path");
const fs = require("fs");

//klasör kontrolü, yoksa oluşturur
//Bu yüzden projenin başlangıcında (Initialization Phase) Sync kullanmak güvenlidir ve Best
//Practice'tir. Çünkü "Klasör yoksa sunucuyu hiç başlatma, bekle" demek istersin.
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

//depolama
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

//dosya filtresi
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "profileImage") {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error("please load image file", false));
    }
  }
  cb(null, true);
};
// multer'ı hazırlama
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;
