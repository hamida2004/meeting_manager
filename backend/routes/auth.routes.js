const router = require("express").Router();
const ctrl = require("../controllers/auth.controller");
const { auth } = require("../middleware/auth.middleware");

router.post("/register", ctrl.register);
router.post("/login", ctrl.login);

router.get("/me", auth(), ctrl.me);
router.post("/logout", auth(), ctrl.logout);

// password reset
router.post("/request-reset", ctrl.requestReset);
router.post("/reset-password", ctrl.resetPassword);

module.exports = router;