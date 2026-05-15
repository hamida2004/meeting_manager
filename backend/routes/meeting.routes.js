const router = require("express").Router();

const controller = require(
  "../controllers/meeting.controller"
);

const {
  auth,
  isMeetingCreator,
} = require(
  "../middlewares/auth.middleware"
);

// GET
router.get(
  "/mine",
  auth(),
  controller.getMeetingsByMember
);

router.get(
  "/grouped",
  auth(),
  controller.getMeetingsGroupedByCommittee
);

// CREATE
router.post(
  "/",
  auth(),
  controller.createMeeting
);

// UPDATE
router.patch(
  "/:id",
  auth(),
  isMeetingCreator,
  controller.editMeeting
);

// DELETE
router.delete(
  "/:id",
  auth(),
  isMeetingCreator,
  controller.deleteMeeting
);

// STATUS
router.patch(
  "/:id/status",
  auth(),
  isMeetingCreator,
  controller.changeStatus
);

// REPORTER
router.patch(
  "/:id/reporter",
  auth(),
  isMeetingCreator,
  controller.addReporter
);

// MEMBERS
router.post(
  "/:id/members",
  auth(),
  isMeetingCreator,
  controller.addMembers
);

// ATTENDANCE
router.patch(
  "/:id/confirm-attendance",
  auth(),
  controller.confirmAttendance
);

router.patch(
  "/:id/attendance/:memberId",
  auth(),
  isMeetingCreator,
  controller.validateAttendance
);

module.exports = router;