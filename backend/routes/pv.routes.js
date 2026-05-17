const router =
  require("express").Router();

const controller = require(
  "../controllers/pv.controller"
);

const {
  auth,
} = require(
  "../middlewares/auth.middleware"
);

// =====================================================
// CREATE EMPTY PV
// =====================================================
router.post(
  "/meeting/:meetingId",
  auth(),
  controller.createPV
);

// =====================================================
// CREATE PV FROM DRAFT
// =====================================================
router.post(
  "/meeting/:meetingId/from-draft",
  auth(),
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
  controller.addPointToPv
);

// =====================================================
// EDIT PV POINT
// =====================================================
router.patch(
  "/points/:pointId",
  auth(),
  controller.editPvPoint
);

// =====================================================
// DELETE PV POINT
// =====================================================
router.delete(
  "/points/:pointId",
  auth(),
  controller.deletePvPoint
);

// =====================================================
// DELETE PV
// =====================================================
router.delete(
  "/:pvId",
  auth(),
  controller.deletePv
);

module.exports = router;