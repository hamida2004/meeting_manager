const router = require("express").Router();
const ctrl = require("../controllers/agenda.controller");
const { auth, isMeetingCreator, isMeetingMember } = require("../middleware/auth.middleware");

router.get("/:meetingId", auth(), ctrl.getAgendaByMeeting);
router.post("/:meetingId/point", auth(), isMeetingMember, ctrl.addPointToAgenda);
router.patch("/point/:id/confirm", auth(), isMeetingCreator, ctrl.confirmAgenda);

module.exports = router;