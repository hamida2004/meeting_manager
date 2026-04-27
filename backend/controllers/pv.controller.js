const db = require("../models");

// CREATE PV FROM DRAFT
exports.createPV = async (req, res) => {
  const draft = await db.Draft.findOne({
    where: { id_meeting: req.params.id },
    include: [db.DraftPoint],
  });

  const pv = await db.Pv.create({
    id_draft: draft.id_draft,
    created_at: new Date(),
    created_by: req.user.id_user,
  });

  const pvPoints = draft.DraftPoints.map((dp) => ({
    id_pv: pv.id_pv,
    content: dp.content,
  }));

  await db.PvPoint.bulkCreate(pvPoints);

  res.json(pv);
};

exports.addPointToPv = async (req, res) => {
  try {
    const { pvId } = req.params;

    // 1. Find PV
    const pv = await db.Pv.findByPk(pvId);

    if (!pv) {
      return res.status(404).json({ msg: "PV not found" });
    }

    // 2. Get Draft
    const draft = await db.Draft.findByPk(pv.id_draft);

    if (!draft) {
      return res.status(404).json({ msg: "Draft not found" });
    }

    // 3. Get Meeting
    const meeting = await db.Meeting.findByPk(draft.id_meeting);

    if (!meeting) {
      return res.status(404).json({ msg: "Meeting not found" });
    }

    // 4. Check reporter
    if (meeting.reporter_id !== req.user.id_user) {
      return res.status(403).json({ msg: "Reporter only" });
    }

    // 5. Validate content
    if (!req.body.content) {
      return res.status(400).json({ msg: "Content is required" });
    }

    // 6. Create PV point
    const point = await db.PvPoint.create({
      id_pv: pv.id_pv,
      content: req.body.content,
    });

    res.json(point);

  } catch (err) {
    res.status(500).json(err.message);
  }
};

exports.getPvByMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;

    // 1. Find draft
    const draft = await db.Draft.findOne({
      where: { id_meeting: meetingId },
    });

    if (!draft) {
      return res.status(404).json({ msg: "Draft not found for this meeting" });
    }

    // 2. Find PV + include points
    const pv = await db.Pv.findOne({
      where: { id_draft: draft.id_draft },
      include: [
        {
          model: db.PvPoint,
          attributes: ["id_pvpoint", "content"],
        },
      ],
    });

    if (!pv) {
      return res.status(404).json({ msg: "PV not found" });
    }

    res.json(pv);

  } catch (err) {
    res.status(500).json(err.message);
  }
};