const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {
  let token;
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "no Token" });
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else {
    return res.status(401).json({ message: "invaled format" });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
}
module.exports = verifyToken;
