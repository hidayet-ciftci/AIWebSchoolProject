const User = require("../models/User");

const register = async (req, res) => {
  try {
    // Kayıt işlemleri burada yapılır
    const newUser = await User.create(req.body);
    res.status(201).json({ status: "success", data: newUser });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
const login = async (req, res) => {
  try {
    // Kayıt işlemleri burada yapılır
    const newUser = await User.create(req.body);
    res.status(201).json({ status: "success", data: newUser });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
module.exports = { register, login };
