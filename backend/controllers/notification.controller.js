const db = require("../models");

// =====================================================
// GET MY NOTIFICATIONS
// =====================================================
exports.getNotifications =
  async (req, res) => {
    try {
      const notifications =
        await db.Notification.findAll({
          where: {
            id_user:
              req.user.id_user,
          },

          order: [
            ["createdAt", "DESC"],
          ],
        });

      return res.json(
        notifications
      );

    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  };

// =====================================================
// MARK AS READ
// =====================================================
exports.markAsRead = async (
  req,
  res
) => {
  try {
    const notif =
      await db.Notification.findByPk(
        req.params.id
      );

    if (!notif) {
      return res.status(404).json({
        msg:
          "Notification not found",
      });
    }

    if (
      notif.id_user !==
      req.user.id_user
    ) {
      return res.status(403).json({
        msg: "Not allowed",
      });
    }

    notif.is_read = true;

    await notif.save();

    return res.json({
      msg:
        "Notification marked as read",
    });

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// MARK ALL AS READ
// =====================================================
exports.markAllAsRead =
  async (req, res) => {
    try {
      await db.Notification.update(
        {
          is_read: true,
        },
        {
          where: {
            id_user:
              req.user.id_user,
          },
        }
      );

      return res.json({
        msg:
          "All notifications marked as read",
      });

    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  };