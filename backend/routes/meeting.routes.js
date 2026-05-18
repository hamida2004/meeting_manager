const router =
  require("express").Router();

const controller = require(
  "../controllers/meeting.controller"
);

const {
  auth,
} = require(
  "../middlewares/auth.middleware"
);

// =====================================================
// CREATE MEETING
// =====================================================
router.post(
  "/",
  auth(),
  controller.createMeeting
);

// =====================================================
// GET MY MEETINGS
// =====================================================
router.get(
  "/mine",
  auth(),
  controller.getMeetingsByMember
);

// =====================================================
// GET MEETINGS GROUPED
// =====================================================
router.get(
  "/grouped",
  auth(),
  controller.getMeetingsGroupedByCommittee
);

// =====================================================
// GET MEETING BY ID
// =====================================================
router.get(
  "/:id",
  auth(),
  controller.getMeetingById
);

// =====================================================
// GET MEETING MEMBERS
// =====================================================
router.get(
  "/:id/members",
  auth(),
  controller.getMeetingMembers
);

// =====================================================
// ADD MEMBERS
// =====================================================
router.post(
  "/:id/members",
  auth(),
  controller.addMembers
);

// =====================================================
// ADD REPORTER
// =====================================================
router.patch(
  "/:id/reporter",
  auth(),
  controller.addReporter
);

// =====================================================
// EDIT MEETING
// =====================================================
router.patch(
  "/:id",
  auth(),
  controller.editMeeting
);

// =====================================================
// DELETE MEETING
// =====================================================
router.delete(
  "/:id",
  auth(),
  controller.deleteMeeting
);

// =====================================================
// CHANGE STATUS
// =====================================================
router.patch(
  "/:id/status",
  auth(),
  controller.changeStatus
);
// =====================================================
// CHANGE VOTING STATE
// =====================================================
router.patch(
  "/:id/voting-state",
  auth(),
  controller.changeVotingState
);
// =====================================================
// CONFIRM ATTENDANCE
// member confirms himself
// =====================================================
router.patch(
  "/:id/confirm",
  auth(),
  controller.confirmAttendance
);

// =====================================================
// VALIDATE ATTENDANCE
// creator validates member
// =====================================================
router.patch(
  "/:id/validate/:memberId",
  auth(),
  controller.validateAttendance
);

module.exports = router;