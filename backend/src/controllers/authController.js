const User = require("../models/User");
const bcrypt = require("bcryptjs");
const Jwt = require("jsonwebtoken");

const register = async (req, res, next) => {
  try {
    const newUser = req.body;
    if (newUser.password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long." });
    }
    const hashedPassword = await bcrypt.hash(newUser.password, 10);
    const user = await User.create({ ...newUser, password: hashedPassword });
    res.status(201).json({ message: "user created", user });
  } catch (err) {
    next(err);
  }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "user not found" });
    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) return res.status(400).json({ message: "Wrong Password" });
    const accessToken = Jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    res.json({ message: "login success", accessToken });
  } catch (error) {
    next(error);
  }
};
module.exports = { register, login };
