const { Vote, AgendaPoint, Meeting, MeetingMember } = require("../models");

// POST /votes/:id   (id = id_agenda_point)
// body: { vote: "agree" | "disagree" | "abstain" }
// middleware chain: auth() → isMeetingMember → canVote
exports.vote = async (req, res) => {
  try {
    const agendaPointId = req.params.id;
    const { vote } = req.body;

    const validVotes = ["agree", "disagree", "abstain"];
    if (!validVotes.includes(vote))
      return res.status(400).json({ msg: `vote must be one of: ${validVotes.join(", ")}.` });

    // Fetch the agenda point to check its meeting
    const point = await AgendaPoint.findByPk(agendaPointId);
    if (!point) return res.status(404).json({ msg: "Agenda point not found." });

    // Check the meeting has voting open
    const meeting = await Meeting.findByPk(point.meeting_id);
    if (!meeting) return res.status(404).json({ msg: "Meeting not found." });

    if (meeting.voting_state !== "open")
      return res.status(403).json({ msg: "Voting is not open for this meeting." });

    if (point.state !== "confirmed")
      return res.status(403).json({ msg: "This agenda point has not been confirmed for voting." });

    // Check for duplicate vote (also enforced by DB unique index)
    const existing = await Vote.findOne({
      where: { id_user: req.user.id, id_agenda_point: agendaPointId },
    });
    if (existing) return res.status(409).json({ msg: "You have already voted on this point." });

    const newVote = await Vote.create({
      vote,
      id_user: req.user.id,
      id_agenda_point: agendaPointId,
      vote_at: new Date(),
    });

    return res.status(201).json({ msg: "Vote recorded.", vote: newVote });
  } catch (err) {
    // Handle DB-level unique constraint violation
    if (err.name === "SequelizeUniqueConstraintError")
      return res.status(409).json({ msg: "You have already voted on this point." });
    console.error(err);
    return res.status(500).json({ msg: "Server error." });
  }
};