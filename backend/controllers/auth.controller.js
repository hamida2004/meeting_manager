const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { User, Role } = require("../models");

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || "access_secret";
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || "refresh_secret";
const ACCESS_EXPIRES = "15m";
const REFRESH_EXPIRES = "7d";
const RESET_EXPIRES_MS = 1000 * 60 * 30; // 30 minutes

const makeTokens = (userId) => ({
  accessToken: jwt.sign({ id: userId }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES }),
  refreshToken: jwt.sign({ id: userId }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES }),
});

// POST /auth/register
exports.register = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;
    if (!email || !password || !full_name)
      return res.status(400).json({ msg: "full_name, email and password are required." });

    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ msg: "Email already registered." });

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ full_name, email, password: hashed });

    return res.status(201).json({ msg: "Registered successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// POST /auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ msg: "Email and password are required." });

    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, attributes: ["role_name"] }],
    });
    if (!user) return res.status(401).json({ msg: "Invalid credentials." });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ msg: "Invalid credentials." });

    const { accessToken, refreshToken } = makeTokens(user.id_user);

    // Store refresh token
    await user.update({ refresh_token: refreshToken });

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id_user: user.id_user,
        full_name: user.full_name,
        email: user.email,
        is_admin: user.is_admin,
        role: user.Role?.role_name || null,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// GET /auth/me  — requires auth() middleware that sets req.user
exports.me = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password", "refresh_token", "reset_token", "reset_token_expire"] },
      include: [{ model: Role, attributes: ["role_name"] }],
    });
    if (!user) return res.status(404).json({ msg: "User not found." });

    return res.json({
      id_user: user.id_user,
      full_name: user.full_name,
      email: user.email,
      is_admin: user.is_admin,
      role: user.Role?.role_name || null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// POST /auth/logout
exports.logout = async (req, res) => {
  try {
    await User.update({ refresh_token: null }, { where: { id_user: req.user.id } });
    return res.json({ msg: "Logged out." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// POST /auth/request-reset
exports.requestReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: "Email is required." });

    const user = await User.findOne({ where: { email } });
    // Always respond 200 to avoid user enumeration
    if (!user) return res.json({ msg: "If that email exists, a reset token was sent." });

    const token = crypto.randomBytes(32).toString("hex");
    const expire = new Date(Date.now() + RESET_EXPIRES_MS);

    await user.update({ reset_token: token, reset_token_expire: expire });

    // In production: send token via email
    // In dev: return it directly
    return res.json({
      msg: "Reset token generated.",
      token, // remove in production
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// POST /auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password)
      return res.status(400).json({ msg: "Token and new password are required." });
    if (password.length < 6)
      return res.status(400).json({ msg: "Password must be at least 6 characters." });

    const user = await User.findOne({ where: { reset_token: token } });
    if (!user) return res.status(400).json({ msg: "Invalid or expired token." });

    if (new Date() > new Date(user.reset_token_expire))
      return res.status(400).json({ msg: "Token has expired." });

    const hashed = await bcrypt.hash(password, 10);
    await user.update({
      password: hashed,
      reset_token: null,
      reset_token_expire: null,
    });

    return res.json({ msg: "Password updated successfully." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error." });
  }
};