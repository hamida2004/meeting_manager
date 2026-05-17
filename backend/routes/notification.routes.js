// routes/notification.routes.js

const router =
  require("express").Router();

const controller = require(
  "../controllers/notification.controller"
);

const {
  auth,
} = require(
  "../middlewares/auth.middleware"
);

// =====================================================
// GET ALL NOTIFICATIONS
// =====================================================
router.get(
  "/",
  auth(),
  controller.getNotifications
);

// =====================================================
// CREATE NOTIFICATION
// =====================================================
router.post(
  "/",
  auth(),
  controller.createNotification
);

// =====================================================
// NOTIFY COMMITTEE MEMBERS
// =====================================================
router.post(
  "/committee",
  auth(),
  controller.notifyCommittee
);

// =====================================================
// NOTIFY MEETING MEMBERS
// =====================================================
router.post(
  "/meeting",
  auth(),
  controller.notifyMeeting
);

// =====================================================
// MARK ONE AS READ
// =====================================================
router.patch(
  "/:id/read",
  auth(),
  controller.markAsRead
);

// =====================================================
// MARK ALL AS READ
// =====================================================
router.patch(
  "/read-all",
  auth(),
  controller.markAllAsRead
);

// =====================================================
// DELETE NOTIFICATION
// =====================================================
router.delete(
  "/:id",
  auth(),
  controller.deleteNotification
);

module.exports = router;