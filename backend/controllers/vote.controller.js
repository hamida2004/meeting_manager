const db = require("../models");

exports.vote = async (req, res) => {
  try {
    const vote = await db.Vote.create({
      vote: req.body.vote,
      UserId: req.user.id,
      AgendaPointId: req.body.agenda_point_id,
      vote_at: new Date(),
    });

    res.json(vote);
  } catch (err) {
    res.status(400).json({ msg: "Already voted" });
  }
};