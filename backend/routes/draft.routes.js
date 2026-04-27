const router = require("express").Router();
const ctrl = require("../controllers/draft.controller");
const { auth, isMeetingMember, isReporter } = require("../middleware/auth.middleware");

// get draft
router.get("/:id", auth(), isMeetingMember, ctrl.createDraft);

// edit draft
router.post("/:id", auth(), isMeetingMember, ctrl.editDraft);

router.get(
  "/meeting/:meetingId",
  auth(),
  isMeetingMember, // recommended
  ctrl.getDraftByMeeting
);

module.exports = router;