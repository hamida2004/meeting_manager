const jwt = require("jsonwebtoken");
const db = require("../models");

// =====================================================
// AUTHENTICATION
// =====================================================
const auth = () => {
  return async (req, res, next) => {
    try {
      const header = req.headers.authorization;

      if (!header) {
        return res.status(401).json({
          msg: "No token provided",
        });
      }

      const token = header.startsWith("Bearer ")
        ? header.split(" ")[1]
        : header;

      const decoded = jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET
      );

      const user = await db.User.findByPk(
        decoded.id
      );

      if (!user) {
        return res.status(404).json({
          msg: "User not found",
        });
      }

      req.user = user;

      next();

    } catch (err) {
      return res.status(401).json({
        msg: "Invalid token",
      });
    }
  };
};

// =====================================================
// ADMIN ONLY
// =====================================================
const isAdmin = (req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({
      msg: "Admin only",
    });
  }

  next();
};

// =====================================================
// COMMITTEE PRESIDENT
// =====================================================
const isPresident = async (req, res, next) => {
  try {
    const committeeId =
      req.params.id ||
      req.params.committeeId ||
      req.body.committee_id;

    const committee =
      await db.Committee.findByPk(committeeId);

    if (!committee) {
      return res.status(404).json({
        msg: "Committee not found",
      });
    }

    if (
      committee.president_id !==
      req.user.id_user
    ) {
      return res.status(403).json({
        msg: "President only",
      });
    }

    req.committee = committee;

    next();

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// MEETING CREATOR
// =====================================================
const isMeetingCreator = async (
  req,
  res,
  next
) => {
  try {
    const meetingId =
      req.params.id ||
      req.params.meetingId;

    const meeting =
      await db.Meeting.findByPk(meetingId);

    if (!meeting) {
      return res.status(404).json({
        msg: "Meeting not found",
      });
    }

    if (
      meeting.creator_id !==
      req.user.id_user
    ) {
      return res.status(403).json({
        msg: "Meeting creator only",
      });
    }

    req.meeting = meeting;

    next();

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// REPORTER ONLY
// =====================================================
const isReporter = async (
  req,
  res,
  next
) => {
  try {
    let meeting = null;

    // -----------------------------
    // DIRECT MEETING ACCESS
    // -----------------------------
    const meetingId =
      req.params.id ||
      req.params.meetingId;

    if (meetingId) {
      meeting =
        await db.Meeting.findByPk(meetingId);
    }

    // -----------------------------
    // FROM PV
    // -----------------------------
    if (!meeting && req.params.pvId) {
      const pv = await db.Pv.findByPk(
        req.params.pvId
      );

      if (!pv) {
        return res.status(404).json({
          msg: "PV not found",
        });
      }

      const draft =
        await db.Draft.findByPk(
          pv.id_draft
        );

      if (!draft) {
        return res.status(404).json({
          msg: "Draft not found",
        });
      }

      meeting =
        await db.Meeting.findByPk(
          draft.id_meeting
        );
    }

    if (!meeting) {
      return res.status(404).json({
        msg: "Meeting not found",
      });
    }

    if (
      meeting.reporter_id !==
      req.user.id_user
    ) {
      return res.status(403).json({
        msg: "Reporter only",
      });
    }

    req.meeting = meeting;

    next();

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// MEETING MEMBER
// =====================================================
const isMeetingMember = async (
  req,
  res,
  next
) => {
  try {
    const meetingId =
      req.params.id ||
      req.params.meetingId;

    const membership =
      await db.MeetingMember.findOne({
        where: {
          id_meeting: meetingId,
          id_user: req.user.id_user,
        },
      });

    if (!membership) {
      return res.status(403).json({
        msg: "Not a meeting member",
      });
    }

    req.membership = membership;

    next();

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// CAN VOTE
// =====================================================
const canVote = async (
  req,
  res,
  next
) => {
  try {
    const point =
      await db.AgendaPoint.findByPk(
        req.params.id
      );

    if (!point) {
      return res.status(404).json({
        msg: "Agenda point not found",
      });
    }

    // only open points
    if (point.state !== "open") {
      return res.status(400).json({
        msg: "Voting closed",
      });
    }

    // prevent duplicate votes
    const existingVote =
      await db.Vote.findOne({
        where: {
          id_user: req.user.id_user,
          id_point: point.id_point,
        },
      });

    if (existingVote) {
      return res.status(400).json({
        msg: "Already voted",
      });
    }

    next();

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

module.exports = {
  auth,
  isAdmin,
  isPresident,
  isMeetingCreator,
  isReporter,
  isMeetingMember,
  canVote,
};