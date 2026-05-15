const db = require("../models");

// =====================================================
// GET AGENDA BY MEETING
// =====================================================
exports.getAgendaByMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;

    // 1. Check meeting
    const meeting = await db.Meeting.findByPk(meetingId);

    if (!meeting) {
      return res.status(404).json({
        msg: "Meeting not found",
      });
    }

    // 2. Get agenda
    const agenda = await db.Agenda.findOne({
      where: {
        id_meeting: meetingId,
      },
      include: [
        {
          model: db.AgendaPoint,
          as: "points",
          include: [
            {
              model: db.User,
              as: "proposer",
              attributes: [
                "id_user",
                "full_name",
                "email",
              ],
            },
          ],
          order: [["id_point", "ASC"]],
        },
      ],
    });

    if (!agenda) {
      return res.status(404).json({
        msg: "Agenda not found",
      });
    }

    // 3. Visibility filtering
    const filteredPoints = agenda.points.filter((point) => {
      // visible to all
      if (
        point.state === "approved" ||
        point.state === "open" ||
        point.state === "closed"
      ) {
        return true;
      }

      // pending/rejected visible only to:
      // proposer, creator, admin
      return (
        point.proposed_by === req.user.id_user ||
        meeting.creator_id === req.user.id_user ||
        req.user.is_admin
      );
    });

    return res.json({
      id_agenda: agenda.id_agenda,
      id_meeting: agenda.id_meeting,
      points: filteredPoints,
    });

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// ADD POINT TO AGENDA
// =====================================================
exports.addPointToAgenda = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const { meetingId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === "") {
      await t.rollback();

      return res.status(400).json({
        msg: "Content is required",
      });
    }

    // 1. Check meeting exists
    const meeting = await db.Meeting.findByPk(
      meetingId,
      { transaction: t }
    );

    if (!meeting) {
      await t.rollback();

      return res.status(404).json({
        msg: "Meeting not found",
      });
    }

    // 2. Ensure user belongs to meeting
    const membership =
      await db.MeetingMember.findOne({
        where: {
          id_meeting: meetingId,
          id_user: req.user.id_user,
        },
        transaction: t,
      });

    if (!membership) {
      await t.rollback();

      return res.status(403).json({
        msg: "Not a meeting member",
      });
    }

    // 3. Create agenda automatically if missing
    let agenda = await db.Agenda.findOne({
      where: {
        id_meeting: meetingId,
      },
      transaction: t,
    });

    if (!agenda) {
      agenda = await db.Agenda.create(
        {
          id_meeting: meetingId,
        },
        { transaction: t }
      );
    }

    // 4. Create point
    const point = await db.AgendaPoint.create(
      {
        id_agenda: agenda.id_agenda,
        content,
        proposed_by: req.user.id_user,
        state: "pending",
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(201).json({
      msg: "Agenda point created",
      point,
    });

  } catch (err) {
    await t.rollback();

    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// APPROVE AGENDA POINT
// =====================================================
exports.approveAgendaPoint = async (req, res) => {
  try {
    const point = await db.AgendaPoint.findByPk(
      req.params.id,
      {
        include: [
          {
            model: db.Agenda,
          },
        ],
      }
    );

    if (!point) {
      return res.status(404).json({
        msg: "Agenda point not found",
      });
    }

    const meeting = await db.Meeting.findByPk(
      point.Agenda.id_meeting
    );

    if (!meeting) {
      return res.status(404).json({
        msg: "Meeting not found",
      });
    }

    // only creator/admin
    if (
      meeting.creator_id !== req.user.id_user &&
      !req.user.is_admin
    ) {
      return res.status(403).json({
        msg: "Not allowed",
      });
    }

    point.state = "approved";

    await point.save();

    return res.json({
      msg: "Agenda point approved",
      point,
    });

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// REJECT AGENDA POINT
// =====================================================
exports.rejectAgendaPoint = async (req, res) => {
  try {
    const point = await db.AgendaPoint.findByPk(
      req.params.id,
      {
        include: [db.Agenda],
      }
    );

    if (!point) {
      return res.status(404).json({
        msg: "Agenda point not found",
      });
    }

    const meeting = await db.Meeting.findByPk(
      point.Agenda.id_meeting
    );

    if (
      meeting.creator_id !== req.user.id_user &&
      !req.user.is_admin
    ) {
      return res.status(403).json({
        msg: "Not allowed",
      });
    }

    point.state = "rejected";

    await point.save();

    return res.json({
      msg: "Agenda point rejected",
      point,
    });

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// OPEN VOTING
// =====================================================
exports.openVoting = async (req, res) => {
  try {
    const point = await db.AgendaPoint.findByPk(
      req.params.id,
      {
        include: [db.Agenda],
      }
    );

    if (!point) {
      return res.status(404).json({
        msg: "Agenda point not found",
      });
    }

    const meeting = await db.Meeting.findByPk(
      point.Agenda.id_meeting
    );

    if (
      meeting.creator_id !== req.user.id_user &&
      !req.user.is_admin
    ) {
      return res.status(403).json({
        msg: "Not allowed",
      });
    }

    if (point.state !== "approved") {
      return res.status(400).json({
        msg: "Point must be approved first",
      });
    }

    point.state = "open";

    await point.save();

    return res.json({
      msg: "Voting opened",
      point,
    });

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// CLOSE VOTING
// =====================================================
exports.closeVoting = async (req, res) => {
  try {
    const point = await db.AgendaPoint.findByPk(
      req.params.id,
      {
        include: [db.Agenda],
      }
    );

    if (!point) {
      return res.status(404).json({
        msg: "Agenda point not found",
      });
    }

    const meeting = await db.Meeting.findByPk(
      point.Agenda.id_meeting
    );

    if (
      meeting.creator_id !== req.user.id_user &&
      !req.user.is_admin
    ) {
      return res.status(403).json({
        msg: "Not allowed",
      });
    }

    point.state = "closed";

    await point.save();

    return res.json({
      msg: "Voting closed",
      point,
    });

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// DELETE AGENDA POINT
// =====================================================
exports.deleteAgendaPoint = async (req, res) => {
  try {
    const point = await db.AgendaPoint.findByPk(
      req.params.id
    );

    if (!point) {
      return res.status(404).json({
        msg: "Agenda point not found",
      });
    }

    // proposer OR admin
    if (
      point.proposed_by !== req.user.id_user &&
      !req.user.is_admin
    ) {
      return res.status(403).json({
        msg: "Not allowed",
      });
    }

    await point.destroy();

    return res.json({
      msg: "Agenda point deleted",
    });

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};