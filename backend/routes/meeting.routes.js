const router = require("express").Router();
const ctrl = require("../controllers/meeting.controller");
const auth = require("../middleware/auth.middleware");

router.post("/", auth, ctrl.createMeeting);

module.exports = router;