const db = require("../models");


exports.getAgendaByMeeting = async (req, res) => {
  try {
    const agenda = await db.AgendaPoint.findAll({
      where: { meeting_id: req.params.meetingId },
      order: [["id_point", "ASC"]],
    });

    res.json(agenda);
  } catch (err) {
    res.status(500).json(err.message);
  }
};
exports.addPointToAgenda = async (req, res) => {
  try {
    const point = await db.AgendaPoint.create({
      content: req.body.content,
      meeting_id: req.params.meetingId,
      proposed_by: req.user.id_user,
      state: "pending",
    });

    res.json(point);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

// CONFIRM AGENDA (creator)
exports.confirmAgenda = async (req, res) => {
  const ap = await db.AgendaPoint.findByPk(req.params.id);

  ap.state = "confirmed";
  await ap.save();

  res.json(ap);
};