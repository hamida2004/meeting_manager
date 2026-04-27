const router = require("express").Router();
const ctrl = require("../controllers/notification.controller");
const { auth } = require("../middleware/auth.middleware");

router.get("/", auth(), ctrl.getNotifications);

module.exports = router;