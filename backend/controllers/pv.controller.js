const { Pv, PvPoint, Draft, DraftPoint, Meeting } = require("../models");

// POST /pvs/:id   (id = id_draft)  — reporter creates PV from draft
exports.createPV = async (req, res) => {
  try {
    const draft = await Draft.findByPk(req.params.id, {
      include: [{ model: DraftPoint }],
    });
    if (!draft) return res.status(404).json({ msg: "Draft not found." });

    // Only one PV allowed per draft
    const existing = await Pv.findOne({ where: { id_draft: draft.id_draft } });
    if (existing) return res.status(409).json({ msg: "A PV already exists for this draft." });

    const pv = await Pv.create({
      id_draft: draft.id_draft,
      created_by: req.user.id,
      created_at: new Date(),
    });

    // Copy all draft points into pv_points
    if (draft.DraftPoints && draft.DraftPoints.length > 0) {
      await PvPoint.bulkCreate(
        draft.DraftPoints.map((dp) => ({
          content: dp.content,
          id_pv: pv.id_pv,
        }))
      );
    }

    const fullPv = await Pv.findByPk(pv.id_pv, { include: [{ model: PvPoint }] });
    return res.status(201).json(fullPv);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// POST /pvs/:pvId/point  — reporter adds an extra point to an existing PV
// body: { content }
exports.addPointToPv = async (req, res) => {
  try {
    const pv = await Pv.findByPk(req.params.pvId);
    if (!pv) return res.status(404).json({ msg: "PV not found." });

    // Only the reporter who created the PV can add points
    if (Number(pv.created_by) !== Number(req.user.id))
      return res.status(403).json({ msg: "Only the PV creator (reporter) can add points." });

    const { content } = req.body;
    if (!content || !content.trim())
      return res.status(400).json({ msg: "content is required." });

    const point = await PvPoint.create({ content: content.trim(), id_pv: pv.id_pv });
    return res.status(201).json(point);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error." });
  }
};

// GET /pvs/meeting/:meetingId
exports.getPvByMeeting = async (req, res) => {
  try {
    // Find the draft for the meeting, then the PV for that draft
    const draft = await Draft.findOne({ where: { id_meeting: req.params.meetingId } });
    if (!draft) return res.status(404).json({ msg: "No draft found for this meeting." });

    const pv = await Pv.findOne({
      where: { id_draft: draft.id_draft },
      include: [{ model: PvPoint, order: [["id_pvpoint", "ASC"]] }],
    });
    if (!pv) return res.status(404).json({ msg: "No PV generated for this meeting yet." });

    return res.json(pv);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Server error." });
  }
};