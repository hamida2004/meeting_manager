const jwt = require("jsonwebtoken");
const db = require("../models");

// =========================
// 🔐 AUTHENTICATION
// =========================
const auth = () => {
  return async (req, res, next) => {
    try {
      const header = req.headers["authorization"];

      if (!header) {
        return res.status(403).json({ msg: "No token" });
      }

      const token = header.startsWith("Bearer ")
        ? header.split(" ")[1]
        : header;

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      const user = await db.User.findByPk(decoded.id);

      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }

      req.user = user;

      next();
    } catch (err) {
      console.log(err);
      return res.status(401).json({ msg: "Invalid token" });
    }
  };
};


const isAdmin = (req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ msg: "Admin only" });
  }
  next();
};

exports.switchRole = async (req, res) => {
  try {
    const { user_id } = req.body;

    const user = await db.User.findByPk(user_id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // 🔄 toggle role
    user.role_id = user.role_id === 1 ? 2 : 1;

    await user.save();

    res.json({
      msg: "Role switched successfully",
      user: {
        id_user: user.id_user,
        role_id: user.role_id,
      },
    });

  } catch (err) {
    res.status(500).json(err.message);
  }
};




const isPresident = async (req, res, next) => {
  try {
    const committeeId =
      req.body.committee_id ||
      req.params.committeeId ||
      req.params.id;

    const committee = await db.Committee.findByPk(committeeId);

    if (!committee) {
      return res.status(404).json({ msg: "Committee not found" });
    }

    if (committee.president_id !== req.user.id_user) {
      return res.status(403).json({ msg: "President only" });
    }

    req.committee = committee;

    next();
  } catch (err) {
    res.status(500).json(err.message);
  }
};

// =========================
// 👤 MEETING CREATOR
// =========================
const isMeetingCreator = async (req, res, next) => {
  try {
    const meeting = await db.Meeting.findByPk(req.params.id);

    if (!meeting) {
      return res.status(404).json({ msg: "Meeting not found" });
    }

    if (meeting.creator_id !== req.user.id_user) {
      return res.status(403).json({ msg: "Only creator allowed" });
    }

    req.meeting = meeting;

    next();
  } catch (err) {
    res.status(500).json(err.message);
  }
};


const isReporter = async (req, res, next) => {
  try {
    let meeting = null;

    // CASE 1: direct meeting id (existing behavior)
    const meetingId = req.params.id || req.params.meetingId;

    if (meetingId) {
      meeting = await db.Meeting.findByPk(meetingId);
    }

    // CASE 2: resolve from pvId
    if (!meeting && req.params.pvId) {
      const pv = await db.Pv.findByPk(req.params.pvId);
      if (!pv) {
        return res.status(404).json({ msg: "PV not found" });
      }

      const draft = await db.Draft.findByPk(pv.id_draft);
      if (!draft) {
        return res.status(404).json({ msg: "Draft not found" });
      }

      meeting = await db.Meeting.findByPk(draft.id_meeting);
    }

    // FINAL CHECK
    if (!meeting) {
      return res.status(400).json({ msg: "Meeting not resolved" });
    }

    if (meeting.reporter_id !== req.user.id_user) {
      return res.status(403).json({ msg: "Reporter only" });
    }

    req.meeting = meeting;

    next();

  } catch (err) {
    res.status(500).json(err.message);
  }
};

const isMeetingMember = async (req, res, next) => {
  try {
    const meetingId = req.params.id || req.params.meetingId;

    const membership = await db.MeetingMember.findOne({
      where: {
        id_user: req.user.id_user,
        id_meeting: meetingId,
      },
    });

    if (!membership) {
      return res.status(403).json({ msg: "Not a meeting member" });
    }

    req.membership = membership;

    next();
  } catch (err) {
    res.status(500).json(err.message);
  }
};



const canVote = async (req, res, next) => {
  try {
    const exists = await db.Vote.findOne({
      where: {
        id_user: req.user.id_user,
        id_agenda_point: req.params.id,
      },
    });

    if (exists) {
      return res.status(400).json({ msg: "Already voted" });
    }

    next();
  } catch (err) {
    res.status(500).json(err.message);
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