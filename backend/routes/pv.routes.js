const router =
  require("express").Router();

const controller = require(
  "../controllers/pv.controller"
);

const {
  auth,
  isReporter,
} = require(
  "../middlewares/auth.middleware"
);

// =====================================================
// CREATE EMPTY PV
// =====================================================
router.post(
  "/meeting/:meetingId",
  auth(),
  isReporter,
  controller.createPV
);

// =====================================================
// CREATE PV FROM DRAFT
// =====================================================
router.post(
  "/meeting/:meetingId/from-draft",
  auth(),
  isReporter,
  controller.createPVFromDraft
);

// =====================================================
// GET PV
// =====================================================
router.get(
  "/meeting/:meetingId",
  auth(),
  controller.getPvByMeeting
);

// =====================================================
// ADD POINT
// =====================================================
router.post(
  "/:pvId/points",
  auth(),
  isReporter,
  controller.addPointToPv
);

// =====================================================
// EDIT PV POINT
// =====================================================
router.patch(
  "/points/:pointId",
  auth(),
  isReporter,
  controller.editPvPoint
);

// =====================================================
// DELETE PV POINT
// =====================================================
router.delete(
  "/points/:pointId",
  auth(),
  isReporter,
  controller.deletePvPoint
);

// =====================================================
// DELETE PV
// =====================================================
router.delete(
  "/:pvId",
  auth(),
  isReporter,
  controller.deletePv
);

module.exports = router;