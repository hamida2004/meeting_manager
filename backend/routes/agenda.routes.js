const router = require("express").Router();

const controller = require(
  "../controllers/agenda.controller"
);

const {
  auth,
  isMeetingCreator,
} = require(
  "../middlewares/auth.middleware"
);

// GET AGENDA
router.get(
  "/meeting/:meetingId",
  auth(),
  controller.getAgendaByMeeting
);

// ADD POINT
router.post(
  "/meeting/:meetingId/points",
  auth(),
  controller.addPointToAgenda
);

// APPROVE
router.patch(
  "/points/:id/approve",
  auth(),
  controller.approveAgendaPoint
);

// REJECT
router.patch(
  "/points/:id/reject",
  auth(),
  controller.rejectAgendaPoint
);

// OPEN VOTING
router.patch(
  "/points/:id/open",
  auth(),
  controller.openVoting
);

// CLOSE VOTING
router.patch(
  "/points/:id/close",
  auth(),
  controller.closeVoting
);

// DELETE POINT
router.delete(
  "/points/:id",
  auth(),
  controller.deleteAgendaPoint
);

module.exports = router;