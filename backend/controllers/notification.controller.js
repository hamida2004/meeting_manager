// controllers/notification.controller.js
const db = require("../models");

exports.getNotifications = async (req, res) => {
  try {
    const list = await db.Notification.findAll({
      where: { id_user: req.user.id_user },
      order: [["createdAt", "DESC"]],
    });

    res.json(list);
  } catch (err) {
    res.status(500).json(err.message);
  }
};