const db = require("../models");

// CREATE DRAFT (reporter)
exports.createDraft = async (req, res) => {
  const draft = await db.Draft.findOne({
    where: { id_meeting: req.params.id },
  });

  res.json(draft);
};

// EDIT DRAFT (members)
exports.editDraft = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const { id } = req.params;

    // 1. Check draft exists
    const draft = await db.Draft.findByPk(id, { transaction: t });

    if (!draft) {
      await t.rollback();
      return res.status(404).json({ msg: "Draft not found" });
    }

    // 2. Create draft point
    const point = await db.DraftPoint.create(
      {
        id_draft: id,
        content: req.body.content,
        added_by: req.user.id_user,
        added_at: new Date(),
      },
      { transaction: t }
    );

    // 3. Update last_update_at
    draft.last_update_at = new Date();
    await draft.save({ transaction: t });

    await t.commit();

    res.json(point);

  } catch (err) {
    await t.rollback();
    res.status(500).json(err.message);
  }
};

exports.getDraftByMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;

    // 1. Optional: check meeting exists
    const meeting = await db.Meeting.findByPk(meetingId);
    if (!meeting) {
      return res.status(404).json({ msg: "Meeting not found" });
    }

    // 2. Get draft + points
    const draft = await db.Draft.findOne({
      where: { id_meeting: meetingId },
      include: [
        {
          model: db.DraftPoint,
          attributes: [
            "id_point",
            "content",
            "added_at",
            "edited_at",
            "added_by",
          ],
        },
      ],
    });

    if (!draft) {
      return res.status(404).json({ msg: "Draft not found" });
    }

    res.json(draft);

  } catch (err) {
    res.status(500).json(err.message);
  }
};