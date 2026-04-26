const router = require("express").Router();
const ctrl = require("../controllers/vote.controller");
const auth = require("../middleware/auth.middleware");

router.post("/", auth, ctrl.vote);

module.exports = router;