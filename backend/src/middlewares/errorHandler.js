function errorHandler(err, req, res, next) {
  console.error("Hata Detayı:", err);

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message =
      field === "email"
        ? "Bu e-posta adresi zaten sisteme kayıtlı."
        : `${field} alanı zaten kullanımda.`;

    return res.status(409).json({ message: message });
  }

  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({ message: messages.join(", ") });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message:
      statusCode === 500
        ? "Sunucu tarafında beklenmedik bir hata oluştu."
        : err.message,
  });
}

module.exports = errorHandler;
