const db = require("../models");

// =====================================================
// CREATE MEETING
// =====================================================
exports.createMeeting = async (
  req,
  res
) => {
  const t =
    await db.sequelize.transaction();

  try {
    const {
      title,
      site,
      timing,
      meeting_type,
      committee_id,
      reporter_id,
    } = req.body;

    if (
      !title ||
      !timing ||
      !committee_id
    ) {
      await t.rollback();

      return res.status(400).json({
        msg:
          "Missing required fields",
      });
    }

    // committee exists
    const committee =
      await db.Committee.findByPk(
        committee_id,
        { transaction: t }
      );

    if (!committee) {
      await t.rollback();

      return res.status(404).json({
        msg: "Committee not found",
      });
    }

    // creator belongs to committee
    const creatorMembership =
      await db.CommitteeMember.findOne(
        {
          where: {
            committee_id,
            id_user:
              req.user.id_user,
          },
          transaction: t,
        }
      );

    if (!creatorMembership) {
      await t.rollback();

      return res.status(403).json({
        msg:
          "You are not member of this committee",
      });
    }

    // reporter validation
    if (reporter_id) {
      const reporterMember =
        await db.CommitteeMember.findOne(
          {
            where: {
              committee_id,
              id_user:
                reporter_id,
            },
            transaction: t,
          }
        );

      if (!reporterMember) {
        await t.rollback();

        return res.status(400).json({
          msg:
            "Reporter must belong to committee",
        });
      }
    }

    // create meeting
    const meeting =
      await db.Meeting.create(
        {
          title,
          site,
          timing,
          meeting_type,
          committee_id,

          creator_id:
            req.user.id_user,

          reporter_id:
            reporter_id || null,
        },
        { transaction: t }
      );

    // auto create draft
    await db.Draft.create(
      {
        id_meeting:
          meeting.id_meeting,
      },
      { transaction: t }
    );

    // creator auto member
    await db.MeetingMember.create(
      {
        id_meeting:
          meeting.id_meeting,

        id_user:
          req.user.id_user,

        invited: true,
        confirmed: true,
        attended: false,
      },
      { transaction: t }
    );

    // reporter auto member
    if (
      reporter_id &&
      reporter_id !==
        req.user.id_user
    ) {
      await db.MeetingMember.create(
        {
          id_meeting:
            meeting.id_meeting,

          id_user:
            reporter_id,

          invited: true,
        },
        { transaction: t }
      );
    }

    await t.commit();

    return res.status(201).json({
      msg:
        "Meeting created successfully",

      meeting,
    });

  } catch (err) {
    await t.rollback();

    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// GET MY MEETINGS
// =====================================================
exports.getMeetingsByMember =
  async (req, res) => {
    try {
      const meetings =
        await db.MeetingMember.findAll({
          where: {
            id_user:
              req.user.id_user,
          },

          include: [
            {
              model: db.Meeting,
              include: [
                db.Committee,
              ],
            },
          ],
        });

      return res.json(meetings);

    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  };

// =====================================================
// GET MEETINGS GROUPED BY COMMITTEE
// =====================================================
exports.getMeetingsGroupedByCommittee =
  async (req, res) => {
    try {
      const memberships =
        await db.MeetingMember.findAll({
          where: {
            id_user:
              req.user.id_user,
          },

          include: [
            {
              model: db.Meeting,
              include: [
                db.Committee,
              ],
            },
          ],
        });

      const grouped = {};

      memberships.forEach((m) => {
        const meeting =
          m.Meeting;

        if (
          !meeting ||
          !meeting.Committee
        ) {
          return;
        }

        const cid =
          meeting.Committee
            .id_committee;

        if (!grouped[cid]) {
          grouped[cid] = {
            committee:
              meeting.Committee,

            meetings: [],
          };
        }

        grouped[cid].meetings.push(
          meeting
        );
      });

      return res.json(
        Object.values(grouped)
      );

    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  };

// =====================================================
// ADD REPORTER
// =====================================================
exports.addReporter = async (
  req,
  res
) => {
  try {
    const meeting =
      await db.Meeting.findByPk(
        req.params.id
      );

    if (!meeting) {
      return res.status(404).json({
        msg: "Meeting not found",
      });
    }

    const { reporter_id } =
      req.body;

    // reporter must belong to meeting
    const membership =
      await db.MeetingMember.findOne({
        where: {
          id_meeting:
            meeting.id_meeting,

          id_user:
            reporter_id,
        },
      });

    if (!membership) {
      return res.status(400).json({
        msg:
          "Reporter must belong to meeting",
      });
    }

    meeting.reporter_id =
      reporter_id;

    await meeting.save();

    return res.json({
      msg: "Reporter assigned",
      meeting,
    });

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// ADD MEMBERS
// =====================================================
exports.addMembers = async (
  req,
  res
) => {
  try {
    const meeting =
      await db.Meeting.findByPk(
        req.params.id
      );

    if (!meeting) {
      return res.status(404).json({
        msg: "Meeting not found",
      });
    }

    const { members } =
      req.body;

    if (
      !Array.isArray(members)
    ) {
      return res.status(400).json({
        msg:
          "Members array required",
      });
    }

    // ensure committee members
    const committeeMembers =
      await db.CommitteeMember.findAll({
        where: {
          committee_id:
            meeting.committee_id,

          id_user: members,
        },
      });

    if (
      committeeMembers.length !==
      members.length
    ) {
      return res.status(400).json({
        msg:
          "Some users are not committee members",
      });
    }

    const data = members.map(
      (id) => ({
        id_meeting:
          meeting.id_meeting,

        id_user: id,

        invited: true,
        confirmed: false,
        attended: false,
      })
    );

    await db.MeetingMember.bulkCreate(
      data,
      {
        ignoreDuplicates: true,
      }
    );

    return res.json({
      msg: "Members added",
    });

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// EDIT MEETING
// =====================================================
exports.editMeeting = async (
  req,
  res
) => {
  try {
    const meeting =
      await db.Meeting.findByPk(
        req.params.id
      );

    if (!meeting) {
      return res.status(404).json({
        msg: "Meeting not found",
      });
    }

    await meeting.update(
      req.body
    );

    return res.json({
      msg: "Meeting updated",
      meeting,
    });

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// DELETE MEETING
// =====================================================
exports.deleteMeeting = async (
  req,
  res
) => {
  try {
    const meeting =
      await db.Meeting.findByPk(
        req.params.id
      );

    if (!meeting) {
      return res.status(404).json({
        msg: "Meeting not found",
      });
    }

    await meeting.destroy();

    return res.json({
      msg: "Meeting deleted",
    });

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// CHANGE STATUS
// =====================================================
exports.changeStatus = async (
  req,
  res
) => {
  try {
    const meeting =
      await db.Meeting.findByPk(
        req.params.id
      );

    if (!meeting) {
      return res.status(404).json({
        msg: "Meeting not found",
      });
    }

    meeting.status =
      req.body.status;

    await meeting.save();

    return res.json(meeting);

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// MEMBER CONFIRM ATTENDANCE
// =====================================================
exports.confirmAttendance =
  async (req, res) => {
    try {
      const mm =
        await db.MeetingMember.findOne({
          where: {
            id_meeting:
              req.params.id,

            id_user:
              req.user.id_user,
          },
        });

      if (!mm) {
        return res.status(404).json({
          msg:
            "Meeting membership not found",
        });
      }

      mm.confirmed = true;

      await mm.save();

      return res.json({
        msg:
          "Attendance confirmed",
        member: mm,
      });

    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  };

// =====================================================
// VALIDATE ATTENDANCE
// =====================================================
exports.validateAttendance =
  async (req, res) => {
    try {
      const {
        id,
        memberId,
      } = req.params;

      const meeting =
        await db.Meeting.findByPk(id);

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
          msg:
            "Only creator allowed",
        });
      }

      const mm =
        await db.MeetingMember.findOne({
          where: {
            id_meeting: id,
            id_user:
              memberId,
          },
        });

      if (!mm) {
        return res.status(404).json({
          msg:
            "Meeting member not found",
        });
      }

      if (!mm.confirmed) {
        return res.status(400).json({
          msg:
            "Member must confirm attendance first",
        });
      }

      mm.attended = true;

      await mm.save();

      return res.json({
        msg:
          "Attendance validated",
        member: mm,
      });

    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  };