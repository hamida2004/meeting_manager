const db = require("../models");

// VOTE ONCE
exports.vote = async (req, res) => {
  const exists = await db.Vote.findOne({
    where: {
      id_user: req.user.id_user,
      id_agenda_point: req.params.id,
    },
  });

  if (exists) {
    return res.status(400).json({ msg: "Already voted" });
  }

  const vote = await db.Vote.create({
    id_user: req.user.id_user,
    id_agenda_point: req.params.id,
    vote: req.body.vote,
    vote_at: new Date(),
  });

  res.json(vote);
};