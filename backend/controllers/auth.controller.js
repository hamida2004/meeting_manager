const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../models");
const crypto = require("crypto");

// =========================
// TOKEN GENERATION
// =========================
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
// GET CURRENT USER
// =========================
exports.me = async (req, res) => {
  try {
    const { id_user, full_name, email, is_admin } = req.user;

    res.json({
      id_user,
      full_name,
      email,
      role: is_admin ? "admin" : "user",
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
    req.user.refresh_token = null;
    await req.user.save();

    res.json({ msg: "Logged out" });
  } catch (err) {
    res.status(500).json(err.message);
  }
};



// =========================
// REGISTER
// =========================
exports.register = async (req, res) => {
  try {
    const { full_name, email, password, is_admin } = req.body;

    // prevent admin creation from public
    const safeIsAdmin = false;

    const hash = await bcrypt.hash(password, 10);

    const user = await db.User.create({
      full_name,
      email,
      password: hash,
      is_admin: safeIsAdmin, // 🔒 force false
    });

    res.json({
      id_user: user.id_user,
      full_name: user.full_name,
      email: user.email,
      is_admin: user.is_admin,
    });

  } catch (err) {
    res.status(500).json(err.message);
  }
};



// =========================
// LOGIN
// =========================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db.User.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ msg: "Wrong password" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refresh_token = refreshToken;
    await user.save();

    res.json({
      accessToken,
      role: user.is_admin ? "admin" : "user",
    });

  } catch (err) {
    res.status(500).json(err.message);
  }
};



// =========================
// REQUEST PASSWORD RESET
// =========================
const { sendResetEmail } = require("../utils/mailer");

exports.requestReset = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await db.User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    user.reset_token = token;
    user.reset_token_expire = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    await sendResetEmail(email, token);

    res.json({ msg: "Reset email sent" });

  } catch (err) {
    res.status(500).json("Error sending email");
  }
};



// =========================
// RESET PASSWORD
// =========================
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await db.User.findOne({
      where: { reset_token: token },
    });

    if (!user) {
      return res.status(400).json({ msg: "Invalid token" });
    }

    if (user.reset_token_expire < new Date()) {
      return res.status(400).json({ msg: "Token expired" });
    }

    const hash = await bcrypt.hash(password, 10);

    user.password = hash;
    user.reset_token = null;
    user.reset_token_expire = null;

    await user.save();

    res.json({ msg: "Password updated successfully" });

  } catch (err) {
    res.status(500).json(err.message);
  }
};