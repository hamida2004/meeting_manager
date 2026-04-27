const router = require("express").Router();
const ctrl = require("../controllers/vote.controller");
const { auth, isMeetingMember, canVote } = require("../middleware/auth.middleware");

// vote once
router.post("/:id", auth(), isMeetingMember, canVote, ctrl.vote);

module.exports = router;