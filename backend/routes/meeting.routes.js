const router = require("express").Router();
const ctrl = require("../controllers/meeting.controller");
const {
  auth,
  isMeetingCreator,
  isMeetingMember,
} = require("../middleware/auth.middleware");

// create meeting
router.post("/", auth(), ctrl.createMeeting);

// meetings of logged user
router.get("/member", auth(), ctrl.getMeetingsByMember);

// add reporter
router.post("/:id/reporter", auth(), isMeetingCreator, ctrl.addReporter);

// add members
router.post("/:id/members", auth(), isMeetingCreator, ctrl.addMembers);

// edit meeting
router.put("/:id", auth(), isMeetingCreator, ctrl.editMeeting);

// change status
router.patch("/:id/status", auth(), isMeetingCreator, ctrl.changeStatus);

// member confirms attendance
router.post("/:id/confirm", auth(), isMeetingMember, ctrl.confirmAttendance);

// creator validates attendance
router.post(
  "/:id/attendance/:memberId",
  auth(),
  isMeetingCreator,
  ctrl.validateAttendance
);

module.exports = router;