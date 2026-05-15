const router = require("express").Router();

const controller = require(
  "../controllers/notification.controller"
);

const {
  auth,
} = require(
  "../middlewares/auth.middleware"
);

// GET ALL
router.get(
  "/",
  auth(),
  controller.getNotifications
);

// READ ONE
router.patch(
  "/:id/read",
  auth(),
  controller.markAsRead
);

// READ ALL
router.patch(
  "/read-all",
  auth(),
  controller.markAllAsRead
);

module.exports = router;