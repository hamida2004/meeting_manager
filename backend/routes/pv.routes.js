const router = require("express").Router();
const ctrl = require("../controllers/pv.controller");
const { auth, isReporter, isMeetingMember } = require("../middleware/auth.middleware");

// create pv from draft
router.post("/:id", auth(), isReporter, ctrl.createPV);

// add point to pv
router.post("/:pvId/point", auth(), isReporter, ctrl.addPointToPv);
router.get(
  "/meeting/:meetingId",
  auth(),
  isMeetingMember, // optional but recommended
  ctrl.getPvByMeeting
);
module.exports = router;