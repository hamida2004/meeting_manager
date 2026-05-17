const db = require("../models");

// =====================================================
// GET ALL USERS
// =====================================================
exports.getUsers = async (
  req,
  res
) => {
  try {
    const users =
      await db.User.findAll({
        attributes: [
          "id_user",
          "full_name",
          "email",
          "is_admin",
          "createdAt",
          "updatedAt",
        ],
      });

    return res.json(users);

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// GET ONE USER
// =====================================================
exports.getUser = async (
  req,
  res
) => {
  try {
    const user =
      await db.User.findByPk(
        req.params.id,
        {
          attributes: [
            "id_user",
            "full_name",
            "email",
            "is_admin",
            "createdAt",
            "updatedAt",
          ],
        }
      );

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    return res.json(user);

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// UPDATE USER
// =====================================================
exports.updateUser = async (
  req,
  res
) => {
  try {
    const user =
      await db.User.findByPk(
        req.params.id
      );

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    // only self or admin
    if (
      req.user.id_user !==
        user.id_user &&
      !req.user.is_admin
    ) {
      return res.status(403).json({
        msg: "Not allowed",
      });
    }

    // prevent admin escalation
    delete req.body.is_admin;

    await user.update({
      full_name:
        req.body.full_name ||
        user.full_name,

      email:
        req.body.email ||
        user.email,
    });

    return res.json({
      msg: "User updated",
      user: {
        id_user:
          user.id_user,

        full_name:
          user.full_name,

        email:
          user.email,

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
// DELETE USER
// =====================================================
exports.deleteUser = async (
  req,
  res
) => {
  try {
    const user =
      await db.User.findByPk(
        req.params.id
      );

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    // prevent deleting yourself
    if (
      user.id_user ===
      req.user.id_user
    ) {
      return res.status(400).json({
        msg:
          "Cannot delete your own account",
      });
    }

    await user.destroy();

    return res.json({
      msg: "User deleted",
    });

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// TOGGLE ADMIN
// =====================================================
exports.switchAdmin = async (
  req,
  res
) => {
  try {
    const { id_user } =
      req.body;

    if (!id_user) {
      return res.status(400).json({
        msg:
          "user_id required",
      });
    }

    const user =
      await db.User.findByPk(
        id_user
      );

    if (!user) {
      return res.status(404).json({
        msg: "User not found",
      });
    }

    // prevent self-demotion
    if (
      user.id_user ===
        req.user.id_user &&
      user.is_admin
    ) {
      return res.status(400).json({
        msg:
          "Cannot remove your own admin access",
      });
    }

    user.is_admin =
      !user.is_admin;

    await user.save();

    return res.json({
      msg:
        "Admin status updated",

      user: {
        id_user:
          user.id_user,

        full_name:
          user.full_name,

        email:
          user.email,

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