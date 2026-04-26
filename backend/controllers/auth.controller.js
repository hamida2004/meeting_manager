const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../models");
const crypto = require("crypto");


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


exports.me = async (req, res) => {
  const { id_user, full_name, email, role } = req.user;
  res.json({ id_user, full_name, email, role });
};

exports.logout = async (req, res) => {
  // if you store refresh_token, invalidate it:
  req.user.refresh_token = null;
  await req.user.save();
  res.json({ msg: "Logged out" });
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
    console.error(err);
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