const db = require("../models");

exports.getUsers = async (req, res) => {
  const users = await db.User.findAll();
  res.json(users);
};

exports.getUser = async (req, res) => {
  const user = await db.User.findByPk(req.params.id);
  res.json(user);
};

exports.updateUser = async (req, res) => {
  const user = await db.User.findByPk(req.params.id);

  await user.update(req.body);

  res.json(user);
};

exports.deleteUser = async (req, res) => {
  await db.User.destroy({
    where: { id_user: req.params.id },
  });

  res.json({ msg: "Deleted" });
};

exports.getRoles = async (req, res) => {
  try {
    const roles = await db.Role.findAll();
    res.json(roles);
  } catch (e) {
    res.status(500).json(e.message);
  }
};

exports.switchAdmin = async (req, res) => {
  try {
    const { user_id } = req.body;

    const user = await db.User.findByPk(user_id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.is_admin = !user.is_admin;

    await user.save();

    res.json({
      msg: "Admin status toggled",
      user: {
        id_user: user.id_user,
        is_admin: user.is_admin,
      },
    });

  } catch (err) {
    res.status(500).json(err.message);
  }
};