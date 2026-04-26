const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../models");

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id_user },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1h" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id_user },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
};

// =========================
// REGISTER
// =========================
exports.register = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    const hash = await bcrypt.hash(password, 10);

    const user = await db.User.create({
      full_name,
      email,
      password: hash,
    });

    res.json(user);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

// =========================
// LOGIN
// =========================
exports.login = async (req, res) => {
  try {
    const user = await db.User.findOne({
      where: { email: req.body.email },
    });

    if (!user) return res.status(404).json({ msg: "User not found" });

    const valid = await bcrypt.compare(req.body.password, user.password);
    if (!valid) return res.status(401).json({ msg: "Wrong password" });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 🔴 SAVE REFRESH TOKEN IN DB
    user.refresh_token = refreshToken;
    await user.save();

    res.json({
      accessToken,
    });
  } catch (err) {
    res.status(500).json(err.message);
  }
};

// =========================
// LOGOUT
// =========================
exports.logout = async (req, res) => {
  try {
    const user = await db.User.findByPk(req.user.id);

    if (!user) return res.status(404).json({ msg: "User not found" });

    // 🔴 REMOVE REFRESH TOKEN
    user.refresh_token = null;
    await user.save();

    res.json({ msg: "Logged out successfully" });
  } catch (err) {
    res.status(500).json(err.message);
  }
};