const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const db = require("../models");

const User = db.User;

// =====================================================
// TOKEN GENERATION
// =====================================================
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id_user,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "1h",
    }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id_user,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// =====================================================
// REGISTER
// =====================================================
exports.register = async (req, res) => {
  try {
    const {
      full_name,
      email,
      password,
    } = req.body;

    if (
      !full_name ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        msg: "Missing required fields",
      });
    }

    // prevent duplicate emails
    const exists =
      await User.findOne({
        where: { email },
      });

    if (exists) {
      return res.status(400).json({
        msg: "Email already used",
      });
    }

    // hash password
    const hash =
      await bcrypt.hash(password, 10);

    // create user
    const user =
      await User.create({
        full_name,
        email,
        password: hash,

        is_admin: false,
      });

    // generate tokens
    const accessToken =
      generateAccessToken(user);

    const refreshToken =
      generateRefreshToken(user);

    // save refresh token
    user.refresh_token =
      refreshToken;

    await user.save();

    // return auth response
    return res.status(201).json({
      accessToken,
      refreshToken,

      user: {
        id_user: user.id_user,
        full_name:
          user.full_name,
        email: user.email,
        is_admin:
          user.is_admin,
      },
    });

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};
// =====================================================
// LOGIN
// =====================================================
exports.login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        msg: "Email and password required",
      });
    }

    const user =
      await User.findOne({
        where: { email },
      });

    if (!user) {
      return res.status(401).json({
        msg: "Invalid credentials",
      });
    }

    const valid =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!valid) {
      return res.status(401).json({
        msg: "Invalid credentials",
      });
    }

    const accessToken =
      generateAccessToken(user);

    const refreshToken =
      generateRefreshToken(user);

    user.refresh_token =
      refreshToken;

    await user.save();

    return res.json({
      accessToken,
      refreshToken,

      user: {
        id_user: user.id_user,
        full_name: user.full_name,
        email: user.email,
        is_admin: user.is_admin,
      },
    });

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// GET CURRENT USER
// =====================================================
exports.me = async (req, res) => {
  try {
    return res.json({
      id_user: req.user.id_user,
      full_name: req.user.full_name,
      email: req.user.email,
      is_admin: req.user.is_admin,
    });

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// LOGOUT
// =====================================================
exports.logout = async (req, res) => {
  try {
    req.user.refresh_token = null;

    await req.user.save();

    return res.json({
      msg: "Logged out successfully",
    });

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// REQUEST PASSWORD RESET
// =====================================================
exports.requestReset = async (
  req,
  res
) => {
  try {
    const { email } = req.body;

    const user =
      await User.findOne({
        where: { email },
      });

    // do not reveal existence
    if (!user) {
      return res.json({
        msg: "If email exists, reset instructions were sent",
      });
    }

    const token =
      crypto.randomBytes(32)
        .toString("hex");

    user.reset_token = token;

    user.reset_token_exp =
      new Date(
        Date.now() +
        15 * 60 * 1000
      );

    await user.save();

    // TODO:
    // send email here

    return res.json({
      msg: "Reset token generated",
      reset_token: token,
    });

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// RESET PASSWORD
// =====================================================
exports.resetPassword = async (
  req,
  res
) => {
  try {
    const {
      token,
      password,
    } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        msg: "Missing fields",
      });
    }

    const user =
      await User.findOne({
        where: {
          reset_token: token,
        },
      });

    if (!user) {
      return res.status(400).json({
        msg: "Invalid token",
      });
    }

    if (
      !user.reset_token_exp ||
      user.reset_token_exp <
      new Date()
    ) {
      return res.status(400).json({
        msg: "Token expired",
      });
    }

    const hash =
      await bcrypt.hash(password, 10);

    user.password = hash;

    user.reset_token = null;
    user.reset_token_exp = null;

    await user.save();

    return res.json({
      msg: "Password updated successfully",
    });

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};