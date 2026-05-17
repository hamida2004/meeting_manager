// controllers/notification.controller.js

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
// CREATE NOTIFICATION
// =====================================================
exports.createNotification =
  async (req, res) => {

    try {

      const {
        id_user,
        content,
      } = req.body;

      if (
        !id_user ||
        !content
      ) {
        return res.status(400).json({
          msg:
            "id_user and content are required",
        });
      }

      const user =
        await db.User.findByPk(
          id_user
        );

      if (!user) {
        return res.status(404).json({
          msg:
            "User not found",
        });
      }

      const notification =
        await db.Notification.create({
          id_user,
          content,
          is_read: false,
        });

      return res.status(201).json({
        msg:
          "Notification created",

        notification,
      });

    } catch (err) {

      return res.status(500).json({
        msg: err.message,
      });
    }
  };

// =====================================================
// NOTIFY COMMITTEE MEMBERS
// =====================================================
exports.notifyCommittee =
  async (req, res) => {

    const t =
      await db.sequelize.transaction();

    try {

      const {
        committee_id,
        content,
      } = req.body;

      if (
        !committee_id ||
        !content
      ) {
        await t.rollback();

        return res.status(400).json({
          msg:
            "committee_id and content are required",
        });
      }

      // verify committee
      const committee =
        await db.Committee.findByPk(
          committee_id,
          {
            transaction: t,
          }
        );

      if (!committee) {
        await t.rollback();

        return res.status(404).json({
          msg:
            "Committee not found",
        });
      }

      // members
      const members =
        await db.CommitteeMember.findAll({
          where: {
            committee_id,
          },

          transaction: t,
        });

      if (
        members.length === 0
      ) {
        await t.rollback();

        return res.status(400).json({
          msg:
            "Committee has no members",
        });
      }

      const notifications =
        members.map(
          (member) => ({
            id_user:
              member.id_user,

            content,

            is_read: false,
          })
        );

      await db.Notification.bulkCreate(
        notifications,
        {
          transaction: t,
        }
      );

      await t.commit();

      return res.json({
        msg:
          "Committee notified",

        count:
          notifications.length,
      });

    } catch (err) {

      await t.rollback();

      return res.status(500).json({
        msg: err.message,
      });
    }
  };

// =====================================================
// NOTIFY MEETING MEMBERS
// =====================================================
exports.notifyMeeting =
  async (req, res) => {

    const t =
      await db.sequelize.transaction();

    try {

      const {
        meeting_id,
        content,
      } = req.body;

      if (
        !meeting_id ||
        !content
      ) {
        await t.rollback();

        return res.status(400).json({
          msg:
            "meeting_id and content are required",
        });
      }

      // verify meeting
      const meeting =
        await db.Meeting.findByPk(
          meeting_id,
          {
            transaction: t,
          }
        );

      if (!meeting) {
        await t.rollback();

        return res.status(404).json({
          msg:
            "Meeting not found",
        });
      }

      // meeting members
      const members =
        await db.MeetingMember.findAll({
          where: {
            id_meeting:
              meeting_id,
          },

          transaction: t,
        });

      if (
        members.length === 0
      ) {
        await t.rollback();

        return res.status(400).json({
          msg:
            "Meeting has no members",
        });
      }

      const notifications =
        members.map(
          (member) => ({
            id_user:
              member.id_user,

            content,

            is_read: false,
          })
        );

      await db.Notification.bulkCreate(
        notifications,
        {
          transaction: t,
        }
      );

      await t.commit();

      return res.json({
        msg:
          "Meeting members notified",

        count:
          notifications.length,
      });

    } catch (err) {

      await t.rollback();

      return res.status(500).json({
        msg: err.message,
      });
    }
  };

// =====================================================
// MARK ONE AS READ
// =====================================================
exports.markAsRead =
  async (req, res) => {

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
          msg:
            "Not allowed",
        });
      }

      notif.is_read = true;

      await notif.save();

      return res.json({
        msg:
          "Notification marked as read",

        notification:
          notif,
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

// =====================================================
// DELETE NOTIFICATION
// =====================================================
exports.deleteNotification =
  async (req, res) => {

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
          msg:
            "Not allowed",
        });
      }

      await notif.destroy();

      return res.json({
        msg:
          "Notification deleted",
      });

    } catch (err) {

      return res.status(500).json({
        msg: err.message,
      });
    }
  };