const router = require("express").Router();

const controller = require(
  "../controllers/draft.controller"
);

const {
  auth,
} = require(
  "../middlewares/auth.middleware"
);

// GET DRAFT
router.get(
  "/meeting/:meetingId",
  auth(),
  controller.getDraftByMeeting
);

// ADD POINT
router.post(
  "/meeting/:meetingId/points",
  auth(),
  controller.addDraftPoint
);

// EDIT POINT
router.patch(
  "/points/:id",
  auth(),
  controller.editDraftPoint
);

// DELETE POINT
router.delete(
  "/points/:id",
  auth(),
  controller.deleteDraftPoint
);

module.exports = router;