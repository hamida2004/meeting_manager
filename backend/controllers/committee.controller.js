const db = require("../models");

// =====================================================
// CREATE COMMITTEE
// =====================================================
exports.createCommittee = async (req, res) => {
  const t = await db.sequelize.transaction();

  try {
    const {
      name,
      president_id,
    } = req.body;

    if (!name || !president_id) {
      await t.rollback();

      return res.status(400).json({
        msg: "Name and president are required",
      });
    }

    // check president exists
    const president =
      await db.User.findByPk(
        president_id,
        { transaction: t }
      );

    if (!president) {
      await t.rollback();

      return res.status(404).json({
        msg: "President not found",
      });
    }

    // create committee
    const committee =
      await db.Committee.create(
        {
          name,
          president_id,
        },
        { transaction: t }
      );

    // auto-add president
    await db.CommitteeMember.create(
      {
        committee_id:
          committee.id_committee,

        id_user: president_id,
      },
      { transaction: t }
    );

    await t.commit();

    return res.status(201).json({
      msg: "Committee created",
      committee,
    });

  } catch (err) {
    await t.rollback();

    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// ADD MEMBERS
// =====================================================
exports.addMembers = async (req, res) => {
  try {
    const { members } = req.body;

    const committee =
      await db.Committee.findByPk(
        req.params.id
      );

    if (!committee) {
      return res.status(404).json({
        msg: "Committee not found",
      });
    }

    if (
      !Array.isArray(members) ||
      members.length === 0
    ) {
      return res.status(400).json({
        msg: "Members array required",
      });
    }

    // verify all users exist
    const users =
      await db.User.findAll({
        where: {
          id_user: members,
        },
      });

    if (
      users.length !== members.length
    ) {
      return res.status(400).json({
        msg: "Some users not found",
      });
    }

    const data = members.map(
      (userId) => ({
        committee_id:
          committee.id_committee,

        id_user: userId,
      })
    );

    await db.CommitteeMember.bulkCreate(
      data,
      {
        ignoreDuplicates: true,
      }
    );

    return res.json({
      msg: "Members added",
    });

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// REMOVE MEMBER
// =====================================================
exports.removeMember = async (
  req,
  res
) => {
  try {
    const {
      id,
      userId,
    } = req.params;

    const committee =
      await db.Committee.findByPk(id);

    if (!committee) {
      return res.status(404).json({
        msg: "Committee not found",
      });
    }

    // cannot remove president
    if (
      committee.president_id ==
      userId
    ) {
      return res.status(400).json({
        msg:
          "Cannot remove president. Transfer presidency first.",
      });
    }

    const membership =
      await db.CommitteeMember.findOne({
        where: {
          committee_id: id,
          id_user: userId,
        },
      });

    if (!membership) {
      return res.status(404).json({
        msg: "Member not found",
      });
    }

    await membership.destroy();

    return res.json({
      msg: "Member removed",
    });

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// CHANGE PRESIDENT
// =====================================================
exports.changePresident = async (
  req,
  res
) => {
  try {
    const committee =
      await db.Committee.findByPk(
        req.params.id
      );

    if (!committee) {
      return res.status(404).json({
        msg: "Committee not found",
      });
    }

    // only current president
    if (
      committee.president_id !==
      req.user.id_user
    ) {
      return res.status(403).json({
        msg:
          "Only current president can transfer presidency",
      });
    }

    const {
      new_president_id,
    } = req.body;

    if (!new_president_id) {
      return res.status(400).json({
        msg:
          "new_president_id required",
      });
    }

    // must already belong to committee
    const membership =
      await db.CommitteeMember.findOne({
        where: {
          committee_id:
            committee.id_committee,

          id_user:
            new_president_id,
        },
      });

    if (!membership) {
      return res.status(400).json({
        msg:
          "New president must belong to committee",
      });
    }

    committee.president_id =
      new_president_id;

    await committee.save();

    return res.json({
      msg:
        "President changed successfully",

      committee,
    });

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// GET ALL COMMITTEES
// =====================================================
exports.getAllCommittees =
  async (req, res) => {
    try {
      const committees =
        await db.Committee.findAll({
          include: [
            {
              model: db.User,
              as: "president",
              attributes: [
                "id_user",
                "full_name",
                "email",
              ],
            },
          ],
        });

      return res.json(committees);

    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  };

// =====================================================
// GET ONE COMMITTEE
// =====================================================
exports.getCommittee = async (
  req,
  res
) => {
  try {
    const committee =
      await db.Committee.findByPk(
        req.params.id,
        {
          include: [
            {
              model:
                db.CommitteeMember,
              as: "members",

              include: [
                {
                  model: db.User,
                  as: "user",

                  attributes: [
                    "id_user",
                    "full_name",
                    "email",
                    "is_admin",
                  ],
                },
              ],
            },

            {
              model: db.User,
              as: "president",

              attributes: [
                "id_user",
                "full_name",
                "email",
              ],
            },
          ],
        }
      );

    if (!committee) {
      return res.status(404).json({
        msg: "Committee not found",
      });
    }

    return res.json(committee);

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// UPDATE COMMITTEE
// =====================================================
exports.updateCommittee = async (
  req,
  res
) => {
  try {
    const committee =
      await db.Committee.findByPk(
        req.params.id
      );

    if (!committee) {
      return res.status(404).json({
        msg: "Committee not found",
      });
    }

    await committee.update({
      name:
        req.body.name ||
        committee.name,
    });

    return res.json({
      msg: "Committee updated",
      committee,
    });

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// DELETE COMMITTEE
// =====================================================
exports.deleteCommittee = async (
  req,
  res
) => {
  try {
    const committee =
      await db.Committee.findByPk(
        req.params.id
      );

    if (!committee) {
      return res.status(404).json({
        msg: "Committee not found",
      });
    }

    await committee.destroy();

    return res.json({
      msg: "Committee deleted",
    });

  } catch (err) {
    return res.status(500).json({
      msg: err.message,
    });
  }
};

// =====================================================
// GET MY COMMITTEES
// =====================================================
exports.getMyCommittees =
  async (req, res) => {
    try {
      const memberships =
        await db.CommitteeMember.findAll({
          where: {
            id_user:
              req.user.id_user,
          },

          include: [
            {
              model: db.Committee,
            },
          ],
        });

      return res.json(
        memberships.map(
          (m) => m.Committee
        )
      );

    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  };