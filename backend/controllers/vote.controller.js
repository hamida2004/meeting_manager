const db = require("../models");

// =====================================================
// VOTE ON AGENDA POINT
// =====================================================
exports.vote = async (
  req,
  res
) => {
  try {
    const { vote } =
      req.body;

    // validate enum
    const allowedVotes = [
      "agree",
      "disagree",
      "abstain",
    ];

    if (
      !allowedVotes.includes(
        vote
      )
    ) {
      return res.status(400).json({
        msg: "Invalid vote",
      });
    }

    // get point
    const point =
      await db.AgendaPoint.findByPk(
        req.params.id,
        {
          include: [
            {
              model:
                db.Agenda,
            },
          ],
        }
      );

    if (!point) {
      return res.status(404).json({
        msg:
          "Agenda point not found",
      });
    }

    // voting must be open
    if (
      point.state !== "open"
    ) {
      return res.status(400).json({
        msg:
          "Voting is closed",
      });
    }

    // resolve meeting
    const meeting =
      await db.Meeting.findByPk(
        point.Agenda.id_meeting
      );

    if (!meeting) {
      return res.status(404).json({
        msg: "Meeting not found",
      });
    }

    // must be meeting member
    const membership =
      await db.MeetingMember.findOne({
        where: {
          id_meeting:
            meeting.id_meeting,

          id_user:
            req.user.id_user,
        },
      });

    if (!membership) {
      return res.status(403).json({
        msg:
          "You are not meeting member",
      });
    }

    // prevent duplicate vote
    const exists =
      await db.Vote.findOne({
        where: {
          id_user:
            req.user.id_user,

          id_point:
            point.id_point,
        },
      });

    if (exists) {
      return res.status(400).json({
        msg:
          "You already voted",
      });
    }

    // create vote
    const createdVote =
      await db.Vote.create({
        id_user:
          req.user.id_user,

        id_point:
          point.id_point,

        vote,
      });

    return res.status(201).json({
      msg:
        "Vote submitted",

      vote:
        createdVote,
    });

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// GET VOTES FOR POINT
// =====================================================
exports.getVotesForPoint =
  async (req, res) => {
    try {
      const point =
        await db.AgendaPoint.findByPk(
          req.params.id
        );

      if (!point) {
        return res.status(404).json({
          msg:
            "Agenda point not found",
        });
      }

      const votes =
        await db.Vote.findAll({
          where: {
            id_point:
              point.id_point,
          },

          include: [
            {
              model: db.User,
              as: "voter",

              attributes: [
                "id_user",
                "full_name",
                "email",
              ],
            },
          ],
        });

      // statistics
      const stats = {
        agree: 0,
        disagree: 0,
        abstain: 0,
      };

      votes.forEach((v) => {
        stats[v.vote]++;
      });

      return res.json({
        point_id:
          point.id_point,

        total_votes:
          votes.length,

        stats,

        votes,
      });

    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  };

// =====================================================
// GET MY VOTE FOR POINT
// =====================================================
exports.getMyVote = async (
  req,
  res
) => {
  try {
    const vote =
      await db.Vote.findOne({
        where: {
          id_point:
            req.params.id,

          id_user:
            req.user.id_user,
        },
      });

    if (!vote) {
      return res.status(404).json({
        msg: "Vote not found",
      });
    }

    return res.json(vote);

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};