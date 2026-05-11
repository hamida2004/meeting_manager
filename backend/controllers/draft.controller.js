const { Draft, DraftPoint, Meeting, User } = require("../models");

// GET /drafts/:id   (id = id_draft)
exports.getDraft = async (req, res) => {
  try {
    const draft = await Draft.findByPk(req.params.id, {
      include: [
        {
          model: DraftPoint,
          include: [{ model: User, foreignKey: "added_by", attributes: ["id_user", "full_name"] }],
          order: [["added_at", "ASC"]],
        },
      ],
    });
    if (!draft) return res.status(404).json({ msg: "Draft not found." });
    return res.json(draft);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// GET /drafts/meeting/:meetingId
exports.getDraftByMeeting = async (req, res) => {
  try {
    const draft = await Draft.findOne({
      where: { id_meeting: req.params.meetingId },
      include: [
        {
          model: DraftPoint,
          include: [{ model: User, foreignKey: "added_by", attributes: ["id_user", "full_name"] }],
          order: [["added_at", "ASC"]],
        },
      ],
    });
    if (!draft) return res.status(404).json({ msg: "Draft not found for this meeting." });
    return res.json(draft);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// POST /drafts/:id   — add or edit a draft point
// body: { content, pointId? }
//   • if pointId is given → edit that DraftPoint
//   • otherwise → add a new DraftPoint
exports.editDraft = async (req, res) => {
  try {
    const draft = await Draft.findByPk(req.params.id);
    if (!draft) return res.status(404).json({ msg: "Draft not found." });

    const { content, pointId } = req.body;
    if (!content || !content.trim())
      return res.status(400).json({ msg: "content is required." });

    let point;
    if (pointId) {
      // Edit existing point — only the author can edit their own point
      point = await DraftPoint.findOne({ where: { id_point: pointId, id_draft: draft.id_draft } });
      if (!point) return res.status(404).json({ msg: "Draft point not found." });

      if (Number(point.added_by) !== Number(req.user.id))
        return res.status(403).json({ msg: "You can only edit your own draft points." });

      await point.update({ content: content.trim(), edited_at: new Date() });
    } else {
      // Add new point
      point = await DraftPoint.create({
        content: content.trim(),
        id_draft: draft.id_draft,
        added_by: req.user.id,
        added_at: new Date(),
        edited_at: null,
      });
    }

    // Update draft's last_update_at
    await draft.update({ last_update_at: new Date() });

    return res.status(pointId ? 200 : 201).json(point);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error." });
  }
};