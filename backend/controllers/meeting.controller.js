const db = require("../models");

// CREATE MEETING (creator = logged user)
exports.createMeeting = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    // 🔹 1. create meeting
    const meeting = await db.Meeting.create(
      {
        ...req.body,
        creator_id: req.user.id_user,
      },
      { transaction: t }
    );

    // 🔹 2. auto create draft
    await db.Draft.create(
      {
        id_meeting: meeting.id_meeting,
        created_at: new Date(),
      },
      { transaction: t }
    );

    // 🔹 3. add creator as meeting member
    await db.MeetingMember.create(
      {
        id_meeting: meeting.id_meeting,
        id_user: req.user.id_user,
        invited: true,
        confirmed: true,  // creator is automatically confirmed
        attended: false,
      },
      { transaction: t }
    );

    await t.commit();

    res.json({
      msg: "Meeting created successfully",
      meeting,
    });

  } catch (err) {
    await t.rollback();
    res.status(500).json(err.message);
  }
};

// GET MEETINGS BY MEMBER
exports.getMeetingsByMember = async (req, res) => {
  const meetings = await db.MeetingMember.findAll({
    where: { id_user: req.user.id_user },
    include: [db.Meeting],
  });

  res.json(meetings);
};

// ADD REPORTER
exports.addReporter = async (req, res) => {
  const meeting = await db.Meeting.findByPk(req.params.id);

  meeting.reporter_id = req.body.reporter_id;
  await meeting.save();

  res.json(meeting);
};

// ADD MEMBERS
exports.addMembers = async (req, res) => {
  const members = req.body.members.map((id) => ({
    id_meeting: req.params.id,
    id_user: id,
    invited: true,
    confirmed: false,
    attended: false,
  }));

  await db.MeetingMember.bulkCreate(members);

  res.json({ msg: "Members added" });
};

// EDIT MEETING
exports.editMeeting = async (req, res) => {
  const meeting = await db.Meeting.findByPk(req.params.id);

  await meeting.update(req.body);

  res.json(meeting);
};

// CHANGE STATUS
exports.changeStatus = async (req, res) => {
  const meeting = await db.Meeting.findByPk(req.params.id);

  meeting.status = req.body.status;
  await meeting.save();

  res.json(meeting);
};

// MEMBER CONFIRM ATTENDANCE
exports.confirmAttendance = async (req, res) => {
  const mm = await db.MeetingMember.findOne({
    where: {
      id_meeting: req.params.id,
      id_user: req.user.id_user,
    },
  });

  mm.confirmed = true;
  await mm.save();

  res.json(mm);
};

// CREATOR VALIDATES ATTENDANCE
exports.validateAttendance = async (req, res) => {
  try {
    const { id, memberId } = req.params; // id = meeting_id

    // 🔹 1. check meeting exists
    const meeting = await db.Meeting.findByPk(id);
    if (!meeting) {
      return res.status(404).json({ msg: "Meeting not found" });
    }

    // 🔹 2. check creator permission
    if (meeting.creator_id !== req.user.id_user) {
      return res.status(403).json({ msg: "Only creator can validate attendance" });
    }

    // 🔹 3. check membership
    const mm = await db.MeetingMember.findOne({
      where: {
        id_meeting: id,
        id_user: memberId,
      },
    });

    if (!mm) {
      return res.status(404).json({ msg: "Member not part of this meeting" });
    }

    // 🔹 4. ensure member confirmed first
    if (!mm.confirmed) {
      return res.status(400).json({
        msg: "Member must confirm attendance first",
      });
    }

    // 🔹 5. update attendance
    mm.attended = true;
    await mm.save();

    res.json({
      msg: "Attendance validated",
      member: mm,
    });

  } catch (err) {
    res.status(500).json(err.message);
  }
};
