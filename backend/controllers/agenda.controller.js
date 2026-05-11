const { AgendaPoint, Meeting, MeetingMember, Vote, User, Notification } = require("../models");

const notify = async (userIds, content) => {
  const rows = userIds.map((id) => ({ member_id: id, content, created_at: new Date() }));
  await Notification.bulkCreate(rows).catch(() => {});
};

// GET /agenda/:meetingId
exports.getAgendaByMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findByPk(meetingId);
    if (!meeting) return res.status(404).json({ msg: "Meeting not found." });

    const points = await AgendaPoint.findAll({
      where: { meeting_id: meetingId },
      include: [
        {
          model: Vote,
          attributes: ["id_vote", "vote", "id_user", "vote_at"],
        },
        {
          model: User,
          as: "proposer",       // requires association: AgendaPoint.belongsTo(User, { foreignKey: "proposed_by", as: "proposer" })
          attributes: ["id_user", "full_name"],
        },
      ],
      order: [["id_point", "ASC"]],
    });

    return res.json(points);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// POST /agenda/:meetingId/point  — any meeting member can add a point
exports.addPointToAgenda = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim())
      return res.status(400).json({ msg: "content is required." });

    const meeting = await Meeting.findByPk(meetingId);
    if (!meeting) return res.status(404).json({ msg: "Meeting not found." });

    if (meeting.status === "closed" || meeting.status === "canceled")
      return res.status(400).json({ msg: "Cannot add points to a closed or canceled meeting." });

    const point = await AgendaPoint.create({
      content: content.trim(),
      meeting_id: meetingId,
      proposed_by: req.user.id,
      state: "pending",
    });

    // Notify the meeting creator
    if (Number(meeting.creator_id) !== Number(req.user.id)) {
      await notify([meeting.creator_id], `New agenda point added to "${meeting.title}": "${content.trim()}".`);
    }

    return res.status(201).json(point);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// PATCH /agenda/point/:id/confirm  — creator confirms/rejects a pending point
// body: { state: "confirmed" | "canceled" }
exports.confirmAgenda = async (req, res) => {
  try {
    const point = await AgendaPoint.findByPk(req.params.id);
    if (!point) return res.status(404).json({ msg: "Agenda point not found." });

    const { state } = req.body;
    if (!["confirmed", "canceled"].includes(state))
      return res.status(400).json({ msg: "state must be 'confirmed' or 'canceled'." });

    await point.update({ state });

    // Notify the proposer
    if (Number(point.proposed_by) !== Number(req.user.id)) {
      const msg =
        state === "confirmed"
          ? `Your agenda point "${point.content}" was confirmed.`
          : `Your agenda point "${point.content}" was rejected.`;
      await notify([point.proposed_by], msg);
    }

    return res.json(point);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error." });
  }
};