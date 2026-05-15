const db = require("../models");

// =====================================================
// GET DRAFT BY MEETING
// =====================================================
exports.getDraftByMeeting =
  async (req, res) => {
    try {
      const { meetingId } =
        req.params;

      // check meeting
      const meeting =
        await db.Meeting.findByPk(
          meetingId
        );

      if (!meeting) {
        return res.status(404).json({
          msg: "Meeting not found",
        });
      }

      // ensure member
      const membership =
        await db.MeetingMember.findOne({
          where: {
            id_meeting: meetingId,
            id_user:
              req.user.id_user,
          },
        });

      if (!membership) {
        return res.status(403).json({
          msg:
            "Not a meeting member",
        });
      }

      // get draft
      const draft =
        await db.Draft.findOne({
          where: {
            id_meeting:
              meetingId,
          },

          include: [
            {
              model:
                db.DraftPoint,
              as: "points",

              include: [
                {
                  model: db.User,
                  as: "author",

                  attributes: [
                    "id_user",
                    "full_name",
                    "email",
                  ],
                },
              ],
            },
          ],
        });

      if (!draft) {
        return res.status(404).json({
          msg: "Draft not found",
        });
      }

      return res.json(draft);

    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  };

// =====================================================
// ADD DRAFT POINT
// =====================================================
exports.addDraftPoint =
  async (req, res) => {
    const t =
      await db.sequelize.transaction();

    try {
      const { meetingId } =
        req.params;

      const { content } =
        req.body;

      if (
        !content ||
        content.trim() === ""
      ) {
        await t.rollback();

        return res.status(400).json({
          msg:
            "Content is required",
        });
      }

      // get meeting
      const meeting =
        await db.Meeting.findByPk(
          meetingId,
          { transaction: t }
        );

      if (!meeting) {
        await t.rollback();

        return res.status(404).json({
          msg: "Meeting not found",
        });
      }

      // only reporter/admin
      if (
        meeting.reporter_id !==
          req.user.id_user &&
        !req.user.is_admin
      ) {
        await t.rollback();

        return res.status(403).json({
          msg:
            "Reporter only",
        });
      }

      // get draft
      const draft =
        await db.Draft.findOne({
          where: {
            id_meeting:
              meetingId,
          },
          transaction: t,
        });

      if (!draft) {
        await t.rollback();

        return res.status(404).json({
          msg: "Draft not found",
        });
      }

      // create point
      const point =
        await db.DraftPoint.create(
          {
            id_draft:
              draft.id_draft,

            content,

            added_by:
              req.user.id_user,

            added_at:
              new Date(),
          },
          { transaction: t }
        );

      // update timestamp
      draft.last_updated_at =
        new Date();

      await draft.save({
        transaction: t,
      });

      await t.commit();

      return res.status(201).json({
        msg:
          "Draft point added",

        point,
      });

    } catch (err) {
      await t.rollback();

      return res.status(500).json({
        msg: err.message,
      });
    }
  };

// =====================================================
// EDIT DRAFT POINT
// =====================================================
exports.editDraftPoint =
  async (req, res) => {
    try {
      const point =
        await db.DraftPoint.findByPk(
          req.params.id
        );

      if (!point) {
        return res.status(404).json({
          msg:
            "Draft point not found",
        });
      }

      // author OR admin
      if (
        point.added_by !==
          req.user.id_user &&
        !req.user.is_admin
      ) {
        return res.status(403).json({
          msg:
            "Not allowed",
        });
      }

      point.content =
        req.body.content;

      point.edited_at =
        new Date();

      await point.save();

      return res.json({
        msg:
          "Draft point updated",

        point,
      });

    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  };

// =====================================================
// DELETE DRAFT POINT
// =====================================================
exports.deleteDraftPoint =
  async (req, res) => {
    try {
      const point =
        await db.DraftPoint.findByPk(
          req.params.id
        );

      if (!point) {
        return res.status(404).json({
          msg:
            "Draft point not found",
        });
      }

      // author OR admin
      if (
        point.added_by !==
          req.user.id_user &&
        !req.user.is_admin
      ) {
        return res.status(403).json({
          msg:
            "Not allowed",
        });
      }

      await point.destroy();

      return res.json({
        msg:
          "Draft point deleted",
      });

    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  };