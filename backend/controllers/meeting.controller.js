const { Meeting, MeetingMember, User, Committee, AgendaPoint, Draft, Notification } = require("../models");

// ─── helpers ───────────────────────────────────────────────────────────────

const isCreator = (meeting, userId) =>
  Number(meeting.creator_id) === Number(userId);

// Send a notification to a list of user IDs
const notify = async (userIds, content) => {
  const rows = userIds.map((id) => ({ member_id: id, content, created_at: new Date() }));
  await Notification.bulkCreate(rows).catch(() => {}); // non-blocking
};

// ─── CREATE ────────────────────────────────────────────────────────────────

// POST /meetings
exports.createMeeting = async (req, res) => {
  try {
    const { title, site, timing, meeting_type, committee_id } = req.body;
    if (!title || !timing)
      return res.status(400).json({ msg: "title and timing are required." });

    const meeting = await Meeting.create({
      title,
      site: site || null,
      timing,
      meeting_type: meeting_type || "onsite",
      status: "scheduled",
      voting_state: "closed",
      creator_id: req.user.id,
      committee_id: committee_id || null,
    });

    // Add creator as a member automatically
    await MeetingMember.create({
      id_meeting: meeting.id_meeting,
      id_user: req.user.id,
      invited: true,
      confirmed: true,
      attended: false,
    });

    // Auto-create draft for this meeting
    await Draft.create({ id_meeting: meeting.id_meeting, created_at: new Date(), last_update_at: new Date() });

    return res.status(201).json(meeting);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// ─── READ ──────────────────────────────────────────────────────────────────

// GET /meetings/member  — meetings where the logged user is a member
exports.getMeetingsByMember = async (req, res) => {
  try {
    const memberships = await MeetingMember.findAll({
      where: { id_user: req.user.id },
      attributes: ["id_meeting"],
    });
    const ids = memberships.map((m) => m.id_meeting);

    const meetings = await Meeting.findAll({
      where: { id_meeting: ids },
      include: [
        { model: User, as: "creator", attributes: ["id_user", "full_name"] },
        { model: User, as: "reporter", attributes: ["id_user", "full_name"] },
      ],
      order: [["timing", "DESC"]],
    });

    return res.json(meetings);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// GET /meetings  — all meetings (admin / general list)
exports.getAllMeetings = async (req, res) => {
  try {
    const meetings = await Meeting.findAll({
      include: [
        { model: User, as: "creator", attributes: ["id_user", "full_name"] },
        { model: User, as: "reporter", attributes: ["id_user", "full_name"] },
      ],
      order: [["timing", "DESC"]],
    });
    return res.json(meetings);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// GET /meetings/:id
exports.getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findByPk(req.params.id, {
      include: [
        { model: User, as: "creator", attributes: ["id_user", "full_name"] },
        { model: User, as: "reporter", attributes: ["id_user", "full_name"] },
        {
          model: MeetingMember,
          include: [{ model: User, attributes: ["id_user", "full_name", "email"] }],
        },
        {
          model: AgendaPoint,
          as: "AgendaPoints",
        },
      ],
    });
    if (!meeting) return res.status(404).json({ msg: "Meeting not found." });
    return res.json(meeting);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// ─── UPDATE ────────────────────────────────────────────────────────────────

// PUT /meetings/:id  — isMeetingCreator middleware already checked
exports.editMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findByPk(req.params.id);
    if (!meeting) return res.status(404).json({ msg: "Meeting not found." });

    const { title, site, timing, meeting_type } = req.body;
    await meeting.update({
      title: title ?? meeting.title,
      site: site ?? meeting.site,
      timing: timing ?? meeting.timing,
      meeting_type: meeting_type ?? meeting.meeting_type,
    });

    return res.json(meeting);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// PATCH /meetings/:id/status
exports.changeStatus = async (req, res) => {
  try {
    const meeting = await Meeting.findByPk(req.params.id);
    if (!meeting) return res.status(404).json({ msg: "Meeting not found." });

    const { status, voting_state } = req.body;

    const validStatus = ["scheduled", "ongoing", "closed", "canceled"];
    if (status && !validStatus.includes(status))
      return res.status(400).json({ msg: `status must be one of: ${validStatus.join(", ")}.` });

    await meeting.update({
      status: status ?? meeting.status,
      voting_state: voting_state ?? meeting.voting_state,
    });

    // Notify all members on status change
    const members = await MeetingMember.findAll({ where: { id_meeting: meeting.id_meeting }, attributes: ["id_user"] });
    const userIds = members.map((m) => m.id_user).filter((id) => Number(id) !== Number(req.user.id));
    if (userIds.length)
      await notify(userIds, `Meeting "${meeting.title}" status changed to ${meeting.status}.`);

    return res.json(meeting);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// DELETE /meetings/:id
exports.deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findByPk(req.params.id);
    if (!meeting) return res.status(404).json({ msg: "Meeting not found." });

    await meeting.destroy();
    return res.json({ msg: "Meeting deleted." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// ─── MEMBERS ───────────────────────────────────────────────────────────────

// POST /meetings/:id/members  — body: { userIds: [1,2,3] }
exports.addMembers = async (req, res) => {
  try {
    const meeting = await Meeting.findByPk(req.params.id);
    if (!meeting) return res.status(404).json({ msg: "Meeting not found." });

    const { userIds } = req.body;
    if (!Array.isArray(userIds) || userIds.length === 0)
      return res.status(400).json({ msg: "userIds array is required." });

    // Avoid duplicate inserts
    const existing = await MeetingMember.findAll({
      where: { id_meeting: meeting.id_meeting },
      attributes: ["id_user"],
    });
    const existingIds = existing.map((m) => Number(m.id_user));
    const toAdd = userIds.filter((id) => !existingIds.includes(Number(id)));

    if (toAdd.length === 0)
      return res.status(409).json({ msg: "All users are already members." });

    await MeetingMember.bulkCreate(
      toAdd.map((id) => ({
        id_meeting: meeting.id_meeting,
        id_user: id,
        invited: true,
        confirmed: false,
        attended: false,
      }))
    );

    await notify(toAdd, `You have been invited to the meeting: "${meeting.title}".`);

    return res.status(201).json({ msg: `${toAdd.length} member(s) added.` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// POST /meetings/:id/reporter  — body: { reporterId }
exports.addReporter = async (req, res) => {
  try {
    const meeting = await Meeting.findByPk(req.params.id);
    if (!meeting) return res.status(404).json({ msg: "Meeting not found." });

    const { reporterId } = req.body;
    if (!reporterId) return res.status(400).json({ msg: "reporterId is required." });

    // Ensure reporter is a meeting member
    const member = await MeetingMember.findOne({
      where: { id_meeting: meeting.id_meeting, id_user: reporterId },
    });
    if (!member)
      return res.status(400).json({ msg: "Reporter must be a member of the meeting." });

    await meeting.update({ reporter_id: reporterId });
    await notify([reporterId], `You have been assigned as reporter for "${meeting.title}".`);

    return res.json({ msg: "Reporter assigned.", meeting });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// ─── ATTENDANCE ────────────────────────────────────────────────────────────

// POST /meetings/:id/confirm  — member self-confirms attendance
exports.confirmAttendance = async (req, res) => {
  try {
    const member = await MeetingMember.findOne({
      where: { id_meeting: req.params.id, id_user: req.user.id },
    });
    if (!member) return res.status(404).json({ msg: "You are not a member of this meeting." });

    await member.update({ confirmed: true });
    return res.json({ msg: "Attendance confirmed." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// POST /meetings/:id/attendance/:memberId  — creator validates a member's attendance
exports.validateAttendance = async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const member = await MeetingMember.findOne({
      where: { id_meeting: id, id_user: memberId },
    });
    if (!member) return res.status(404).json({ msg: "Member not found in this meeting." });

    await member.update({ attended: true });
    return res.json({ msg: "Attendance validated." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error." });
  }
};