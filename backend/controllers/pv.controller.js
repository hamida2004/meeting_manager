const db = require("../models");

// =====================================================
// CREATE PV FROM DRAFT
// =====================================================
exports.createPV = async (
  req,
  res
) => {
  const t =
    await db.sequelize.transaction();

  try {
    const { meetingId } =
      req.params;

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
          },
        ],

        transaction: t,
      });

    if (!draft) {
      await t.rollback();

      return res.status(404).json({
        msg: "Draft not found",
      });
    }

    // ensure meeting exists
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

    // reporter only
    if (
      meeting.reporter_id !==
      req.user.id_user
    ) {
      await t.rollback();

      return res.status(403).json({
        msg:
          "Reporter only",
      });
    }

    // prevent duplicate PV
    const existingPv =
      await db.Pv.findOne({
        where: {
          id_draft:
            draft.id_draft,
        },
        transaction: t,
      });

    if (existingPv) {
      await t.rollback();

      return res.status(400).json({
        msg:
          "PV already exists",
      });
    }

    // create PV
    const pv =
      await db.Pv.create(
        {
          id_draft:
            draft.id_draft,

          created_by:
            req.user.id_user,
        },
        { transaction: t }
      );

    // clone draft points
    if (
      draft.points &&
      draft.points.length > 0
    ) {
      const pvPoints =
        draft.points.map(
          (point) => ({
            id_pv: pv.id_pv,
            content:
              point.content,
          })
        );

      await db.PvPoint.bulkCreate(
        pvPoints,
        { transaction: t }
      );
    }

    await t.commit();

    return res.status(201).json({
      msg:
        "PV created successfully",

      pv,
    });

  } catch (err) {
    await t.rollback();

    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// ADD POINT TO PV
// =====================================================
exports.addPointToPv = async (
  req,
  res
) => {
  try {
    const { pvId } =
      req.params;

    const { content } =
      req.body;

    if (
      !content ||
      content.trim() === ""
    ) {
      return res.status(400).json({
        msg:
          "Content is required",
      });
    }

    const pv =
      await db.Pv.findByPk(
        pvId
      );

    if (!pv) {
      return res.status(404).json({
        msg: "PV not found",
      });
    }

    // resolve meeting
    const draft =
      await db.Draft.findByPk(
        pv.id_draft
      );

    if (!draft) {
      return res.status(404).json({
        msg: "Draft not found",
      });
    }

    const meeting =
      await db.Meeting.findByPk(
        draft.id_meeting
      );

    if (!meeting) {
      return res.status(404).json({
        msg: "Meeting not found",
      });
    }

    // reporter only
    if (
      meeting.reporter_id !==
        req.user.id_user &&
      !req.user.is_admin
    ) {
      return res.status(403).json({
        msg:
          "Reporter only",
      });
    }

    const point =
      await db.PvPoint.create({
        id_pv: pv.id_pv,
        content,
      });

    return res.status(201).json({
      msg:
        "PV point added",

      point,
    });

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// GET PV BY MEETING
// =====================================================
exports.getPvByMeeting =
  async (req, res) => {
    try {
      const { meetingId } =
        req.params;

      // resolve draft
      const draft =
        await db.Draft.findOne({
          where: {
            id_meeting:
              meetingId,
          },
        });

      if (!draft) {
        return res.status(404).json({
          msg: "Draft not found",
        });
      }

      // get pv
      const pv =
        await db.Pv.findOne({
          where: {
            id_draft:
              draft.id_draft,
          },

          include: [
            {
              model:
                db.PvPoint,
              as: "points",
            },

            {
              model: db.User,
              as: "reporter",

              attributes: [
                "id_user",
                "full_name",
                "email",
              ],
            },
          ],
        });

      if (!pv) {
        return res.status(404).json({
          msg: "PV not found",
        });
      }

      return res.json(pv);

    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  };