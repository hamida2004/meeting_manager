const router = require("express").Router();
const ctrl = require("../controllers/agenda.controller");
const {
  auth,
  isMeetingCreator,
  isMeetingMember,
} = require("../middleware/auth.middleware");

// get agenda
router.get("/:meetingId", auth(), ctrl.getAgendaByMeeting);

// add point
router.post(
  "/:meetingId/point",
  auth(),
  isMeetingMember,
  ctrl.addPointToAgenda
);

// confirm agenda (creator only)
router.patch(
  "/point/:id/confirm",
  auth(),
  isMeetingCreator,
  ctrl.confirmAgenda
);

module.exports = router;