const router = require("express").Router();
const ctrl = require("../controllers/auth.controller");
const auth = require("../middleware/auth.middleware");

// PUBLIC
router.post("/register", ctrl.register);
router.post("/login", ctrl.login);
router.post("/request-reset", ctrl.requestReset);
router.get("/me", auth(), ctrl.me);
router.post("/logout", auth(), ctrl.logout);

module.exports = router;