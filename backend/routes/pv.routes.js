const router = require("express").Router();

const controller = require(
  "../controllers/pv.controller"
);

const {
  auth,
} = require(
  "../middlewares/auth.middleware"
);

// CREATE PV
router.post(
  "/meeting/:meetingId",
  auth(),
  controller.createPV
);

// GET PV
router.get(
  "/meeting/:meetingId",
  auth(),
  controller.getPvByMeeting
);

// ADD POINT
router.post(
  "/:pvId/points",
  auth(),
  controller.addPointToPv
);

module.exports = router;