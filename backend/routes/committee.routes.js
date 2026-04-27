// routes/committee.routes.js
const router = require("express").Router();

const ctrl = require("../controllers/committee.controller");
const {
  auth,
  isAdmin,
  isPresident,
} = require("../middleware/auth.middleware");


// =========================
// CREATE (ADMIN)
// =========================
router.post("/", auth(), isAdmin, ctrl.createCommittee);


// =========================
// GET
// =========================

// get all committees (admin or debug)
router.get("/", auth(), ctrl.getAllCommittees);

// get my committees
router.get("/member", auth(), ctrl.getCommitteeByMember);

// get one committee
router.get("/:id", auth(), ctrl.getCommittee);


// =========================
// UPDATE (PRESIDENT)
// =========================
router.put("/:id", auth(), isPresident, ctrl.updateCommittee);




// add members (president)
router.post("/:id/members", auth(), isPresident, ctrl.addMembers);

// remove member (president)
router.delete("/:id/member", auth(), isPresident, ctrl.removeMember);

// switch role (president)
router.patch("/:id/role", auth(), isPresident, ctrl.switchRole);


module.exports = router;