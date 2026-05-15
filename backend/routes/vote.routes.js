const router = require("express").Router();

const controller = require(
  "../controllers/vote.controller"
);

const {
  auth,
} = require(
  "../middlewares/auth.middleware"
);

// CREATE VOTE
router.post(
  "/point/:id",
  auth(),
  controller.vote
);

// GET POINT VOTES
router.get(
  "/point/:id",
  auth(),
  controller.getVotesForPoint
);

// GET MY VOTE
router.get(
  "/point/:id/me",
  auth(),
  controller.getMyVote
);

module.exports = router;