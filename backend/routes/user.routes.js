const router = require("express").Router();

const controller = require(
  "../controllers/user.controller"
);

const {
  auth,
  isAdmin,
} = require(
  "../middlewares/auth.middleware"
);

// GET
router.get(
  "/",
  auth(),
  isAdmin,
  controller.getUsers
);

router.get(
  "/:id",
  auth(),
  controller.getUser
);

// UPDATE
router.patch(
  "/:id",
  auth(),
  controller.updateUser
);

// DELETE
router.delete(
  "/:id",
  auth(),
  isAdmin,
  controller.deleteUser
);

// TOGGLE ADMIN
router.patch(
  "/toggle-admin",
  auth(),
  isAdmin,
  controller.switchAdmin
);

module.exports = router;