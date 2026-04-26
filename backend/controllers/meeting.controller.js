const db = require("../models");

exports.createMeeting = async (req, res) => {
  const meeting = await db.Meeting.create(req.body);

  // AUTO CREATE DRAFT
  await db.Draft.create({
    id_meeting: meeting.id_meeting,
  });

  res.json(meeting);
};