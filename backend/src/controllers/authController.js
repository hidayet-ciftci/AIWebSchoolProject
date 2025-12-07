const User = require("../models/User");
const bcrypt = require("bcryptjs");
const Jwt = require("jsonwebtoken");

const generateUserIds = async (role) => {
  const count = await User.countDocuments();
  if (role === "student") {
    return { studentNo: count + 2510205000 };
  }
  if (role === "teacher") {
    const suffix = count < 10 ? `00${count}` : `0${count}`;
    return { sicilNo: `AKD-2025-${suffix}` };
  }
  return {};
};

const register = async (req, res, next) => {
  try {
    const newUser = req.body;
    if (newUser.password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long." });
    }
    const hashedPassword = await bcrypt.hash(newUser.password, 10);
    const generateId = await generateUserIds(newUser.role);
    const user = await User.create({
      ...newUser,
      password: hashedPassword,
      ...generateId,
    });
    res.status(201).json({ message: "user created", user });
  } catch (err) {
    next(err);
  }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Wrong Email, User not found" });
    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) return res.status(400).json({ message: "Wrong Password" });
    const accessToken = Jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    res.json({
      message: "login success",
      accessToken,
      user: { name: user.name, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};
module.exports = { register, login };
