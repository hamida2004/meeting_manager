const router = require("express").Router();
const ctrl = require("../controllers/meeting.controller");
const { auth, isMeetingCreator, isMeetingMember } = require("../middleware/auth.middleware");

router.post("/", auth(), ctrl.createMeeting);
router.get("/member", auth(), ctrl.getMeetingsByMember);
router.get("/", auth(), ctrl.getAllMeetings);        // ADD: Meetings tab needs this
router.get("/:id", auth(), isMeetingMember, ctrl.getMeetingById); // ADD: [id].jsx needs this
router.post("/:id/reporter", auth(), isMeetingCreator, ctrl.addReporter);
router.post("/:id/members", auth(), isMeetingCreator, ctrl.addMembers);
router.put("/:id", auth(), isMeetingCreator, ctrl.editMeeting);
router.delete("/:id", auth(), isMeetingCreator, ctrl.deleteMeeting); // ADD: frontend calls this
router.patch("/:id/status", auth(), isMeetingCreator, ctrl.changeStatus);
router.post("/:id/confirm", auth(), isMeetingMember, ctrl.confirmAttendance);
router.post("/:id/attendance/:memberId", auth(), isMeetingCreator, ctrl.validateAttendance);

module.exports = router;