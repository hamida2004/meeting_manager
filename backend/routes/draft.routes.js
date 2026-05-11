const router = require("express").Router();
const ctrl = require("../controllers/draft.controller");
const { auth, isMeetingMember } = require("../middleware/auth.middleware");

router.get("/:id", auth(), isMeetingMember, ctrl.getDraft);        // FIXED: was createDraft
router.post("/:id", auth(), isMeetingMember, ctrl.editDraft);
router.get("/meeting/:meetingId", auth(), isMeetingMember, ctrl.getDraftByMeeting);

module.exports = router;