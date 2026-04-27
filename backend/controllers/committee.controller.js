const db = require("../models");

// CREATE COMMITTEE (admin)
exports.createCommittee = async (req, res) => {
  try {
    const { name, president_id } = req.body;

    if (!president_id) {
      return res.status(400).json({ msg: "President required" });
    }

    const committee = await db.Committee.create({
      name,
      president_id,
    });

    // ✅ FIXED FIELD NAME
    await db.CommitteeMember.create({
      id_user: president_id,
      committee_id: committee.id_committee,
      role_id: 2, // president
    });

    res.json(committee);

  } catch (err) {
    res.status(500).json(err.message);
  }
};


// ADD MEMBERS
exports.addMembers = async (req, res) => {
  const members = req.body.members.map((m) => ({
    id_user: m.user,
    committee_id: req.params.id, // ✅ FIXED
    role_id: 3,
  }));

  await db.CommitteeMember.bulkCreate(members);

  res.json({ msg: "Members added" });
};

// REMOVE MEMBER
exports.removeMember = async (req, res) => {
  try {
    const { id } = req.params; // committee_id
    const { id_user } = req.body;

    // 🔹 1. check committee exists
    const committee = await db.Committee.findByPk(id);
    if (!committee) {
      return res.status(404).json({ msg: "Committee not found" });
    }

    // 🔹 2. prevent removing president
    if (committee.president_id === id_user) {
      return res.status(400).json({
        msg: "Cannot remove president. Assign a new one first.",
      });
    }

    // 🔹 3. check membership exists
    const membership = await db.CommitteeMember.findOne({
      where: {
        id_user,
        committee_id: id,
      },
    });

    if (!membership) {
      return res.status(404).json({ msg: "Member not found in committee" });
    }

    // 🔹 4. remove member
    await membership.destroy();

    // 🔹 5. count remaining members
    const remaining = await db.CommitteeMember.count({
      where: { committee_id: id },
    });

    // 🔹 6. delete committee if empty
    if (remaining === 0) {
      await db.Committee.destroy({
        where: { id_committee: id },
      });

      return res.json({
        msg: "Member removed and committee deleted (no members left)",
      });
    }

    // 🔹 7. success
    res.json({
      msg: "Member removed",
      remaining_members: remaining,
    });

  } catch (err) {
    res.status(500).json(err.message);
  }
};

// SWITCH ROLE
exports.switchRole = async (req, res) => {
  try {
    const { user_id, role_id } = req.body;

    const cm = await db.CommitteeMember.findOne({
      where: {
        id_user: user_id,
        committee_id: req.params.id,
      },
    });

    if (!cm) {
      return res.status(404).json({ msg: "Membership not found" });
    }

    cm.role_id = role_id;
    await cm.save();

    res.json(cm);

  } catch (err) {
    res.status(500).json(err.message);
  }
};

// GET COMMITTEE BY MEMBER
exports.getCommitteeByMember = async (req, res) => {
  try {
    const memberships = await db.CommitteeMember.findAll({
      where: { id_user: req.user.id_user },
      include: [
        {
          model: db.Committee,
          attributes: ["id_committee", "name", "president_id"],
        },
      ],
    });

    // remove nulls + flatten
    const committees = memberships
      .filter(m => m.Committee !== null)
      .map(m => ({
        id_committee: m.Committee.id_committee,
        name: m.Committee.name,
        president_id: m.Committee.president_id,
        role_id: m.role_id,
      }));

    res.json(committees);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllCommittees = async (req, res) => {
  try {
    const committees = await db.Committee.findAll();
    res.json(committees);
  } catch (err) {
    res.status(500).json(err.message);
  }
};

exports.getCommittee = async (req, res) => {
  try {
    const committee = await db.Committee.findByPk(req.params.id, {
      include: [
        {
          model: db.CommitteeMember,
          include: [db.User],
        },
      ],
    });

    if (!committee) {
      return res.status(404).json({ msg: "Not found" });
    }

    res.json(committee);

  } catch (err) {
    res.status(500).json(err.message);
  }
};

exports.updateCommittee = async (req, res) => {
  try {
    const committee = await db.Committee.findByPk(req.params.id);

    if (!committee) {
      return res.status(404).json({ msg: "Not found" });
    }

    await committee.update(req.body);

    res.json(committee);

  } catch (err) {
    res.status(500).json(err.message);
  }
};