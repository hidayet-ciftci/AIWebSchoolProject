function errorHandler(err, req, res, next) {
  console.error("Hata Detayı:", err); // Geliştirme aşamasında konsolda hatayı tam görmek için

  // 1. MongoDB Duplicate Key Hatası (E-posta zaten kayıtlıysa)
  if (err.code === 11000) {
    // err.keyValue hangi alanın tekrar ettiğini söyler (örn: { email: "..." })
    const field = Object.keys(err.keyValue)[0];
    const message =
      field === "email"
        ? "Bu e-posta adresi zaten sisteme kayıtlı."
        : `${field} alanı zaten kullanımda.`;

    return res.status(409).json({ message: message });
  }

  // 2. Mongoose Validasyon Hataları (Örn: Zorunlu alan eksikse)
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({ message: messages.join(", ") });
  }

  // 3. Genel Sunucu Hatası (Beklenmedik hatalar)
  // Eğer hata bizim özel fırlattığımız bir hata değilse, genel bir mesaj gösterelim.
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message:
      statusCode === 500
        ? "Sunucu tarafında beklenmedik bir hata oluştu."
        : err.message,
  });
}

module.exports = errorHandler;
