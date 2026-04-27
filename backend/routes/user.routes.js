const router = require("express").Router();
const ctrl = require("../controllers/user.controller");
const { auth, isAdmin } = require("../middleware/auth.middleware");

// users CRUD
router.get("/", auth(), isAdmin, ctrl.getUsers);
router.get("/:id", auth(), ctrl.getUser);
router.put("/:id", auth(), ctrl.updateUser);
router.delete("/:id", auth(), isAdmin, ctrl.deleteUser);

// roles
router.get("/roles/all", auth(), ctrl.getRoles);

// switch global role (admin ↔ member)
router.patch("/switch-role", auth(), isAdmin, ctrl.switchRole);

module.exports = router;