const router = require("express").Router();

const controller = require(
  "../controllers/committee.controller"
);

const {
  auth,
  isAdmin,
  isPresident,
} = require(
  "../middlewares/auth.middleware"
);

// GET
router.get(
  "/",
  auth(),
  isAdmin,
  controller.getAllCommittees
);

router.get(
  "/mine",
  auth(),
  controller.getMyCommittees
);

router.get(
  "/:id",
  auth(),
  controller.getCommittee
);

// CREATE
router.post(
  "/",
  auth(),
  isAdmin,
  controller.createCommittee
);

// UPDATE
router.patch(
  "/:id",
  auth(),
  isAdmin,
  controller.updateCommittee
);

// DELETE
router.delete(
  "/:id",
  auth(),
  isAdmin,
  controller.deleteCommittee
);

// MEMBERS
router.post(
  "/:id/members",
  auth(),
  controller.addMembers
);

router.delete(
  "/:id/members/:userId",
  auth(),
  controller.removeMember
);

// PRESIDENT
router.patch(
  "/:id/change-president",
  auth(),
  isPresident,
  controller.changePresident
);

module.exports = router;