const router = require("express").Router();

const controller = require(
  "../controllers/auth.controller"
);

const {
  auth,
} = require(
  "../middlewares/auth.middleware"
);

// PUBLIC
router.post(
  "/register",
  controller.register
);

router.post(
  "/login",
  controller.login
);

router.post(
  "/forgot-password",
  controller.requestReset
);

router.post(
  "/reset-password",
  controller.resetPassword
);

// PRIVATE
router.get(
  "/me",
  auth(),
  controller.me
);

router.post(
  "/logout",
  auth(),
  controller.logout
);

module.exports = router;