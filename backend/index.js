const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");

require("dotenv").config();

const db = require("./models");

const app = express();

const port =
  process.env.PORT || 3000;

// =====================================================
// MIDDLEWARES
// =====================================================
app.use(cors());

app.use(express.json());

// =====================================================
// ROUTES
// =====================================================
app.use(
  "/auth",
  require("./routes/auth.routes")
);

app.use(
  "/users",
  require("./routes/user.routes")
);

app.use(
  "/committees",
  require(
    "./routes/committee.routes"
  )
);

app.use(
  "/meetings",
  require(
    "./routes/meeting.routes"
  )
);

app.use(
  "/agenda",
  require(
    "./routes/agenda.routes"
  )
);

app.use(
  "/votes",
  require("./routes/vote.routes")
);

app.use(
  "/draft",
  require("./routes/draft.routes")
);

app.use(
  "/pv",
  require("./routes/pv.routes")
);

app.use(
  "/notifications",
  require(
    "./routes/notification.routes"
  )
);

// =====================================================
// HEALTH
// =====================================================
app.get("/", (req, res) => {
  res.json({
    msg:
      "Meeting organization API running",
  });
});

// =====================================================
// DEV SEED
// =====================================================
app.get(
  "/dev/seed",
  async (req, res) => {
    try {
      if (
        process.env.NODE_ENV ===
        "production"
      ) {
        return res
          .status(403)
          .json({
            msg:
              "Disabled in production",
          });
      }

      const hash =
        await bcrypt.hash(
          "123456",
          10
        );

      // USERS
      const u1 =
        await db.User.create({
          full_name:
            "User One",

          email:
            "u1@mail.com",

          password: hash,

          is_admin: true,
        });

      const u2 =
        await db.User.create({
          full_name:
            "User Two",

          email:
            "u2@mail.com",

          password: hash,
        });

      // COMMITTEE
      const committee =
        await db.Committee.create({
          name:
            "Test Committee",

          president_id:
            u1.id_user,
        });

      // MEMBERS
      await db.CommitteeMember.bulkCreate(
        [
          {
            committee_id:
              committee.id_committee,

            id_user:
              u1.id_user,
          },

          {
            committee_id:
              committee.id_committee,

            id_user:
              u2.id_user,
          },
        ]
      );

      // MEETING
      const meeting =
        await db.Meeting.create({
          title:
            "Test Meeting",

          site: "online",

          timing:
            new Date(),

          status:
            "scheduled",

          creator_id:
            u1.id_user,

          reporter_id:
            u1.id_user,

          committee_id:
            committee.id_committee,

          meeting_type:
            "online",
        });

      // MEETING MEMBERS
      await db.MeetingMember.bulkCreate(
        [
          {
            id_meeting:
              meeting.id_meeting,

            id_user:
              u1.id_user,

            invited: true,
            confirmed: true,
            attended: true,
          },

          {
            id_meeting:
              meeting.id_meeting,

            id_user:
              u2.id_user,

            invited: true,
            confirmed: false,
            attended: false,
          },
        ]
      );

      // DRAFT
      const draft =
        await db.Draft.create({
          id_meeting:
            meeting.id_meeting,
        });

      // AGENDA
      const agenda =
        await db.Agenda.create({
          id_meeting:
            meeting.id_meeting,
        });

      // AGENDA POINT
      const point =
        await db.AgendaPoint.create({
          id_agenda:
            agenda.id_agenda,

          content:
            "Discuss project",

          proposed_by:
            u1.id_user,

          state: "open",
        });

      // VOTE
      await db.Vote.create({
        vote: "agree",

        id_user:
          u2.id_user,

        id_point:
          point.id_point,
      });

      return res.json({
        msg:
          "Database seeded successfully",

        users: [u1, u2],

        committee,
        meeting,
        draft,
        agenda,
        point,
      });

    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  }
);

// =====================================================
// CLEAR DB
// =====================================================
app.get(
  "/dev/clear-db",
  async (req, res) => {
    try {
      // if (
      //   process.env.NODE_ENV ===
      //   "production"
      // ) {
      //   return res
      //     .status(403)
      //     .json({
      //       msg:
      //         "Disabled in production",
      //     });
      // }

      await db.sequelize.query(
        "SET FOREIGN_KEY_CHECKS = 0"
      );

      const models =
        Object.keys(db).filter(
          (m) =>
            db[m]?.destroy
        );

      for (const model of models) {
        await db[model].destroy({
          where: {},
          truncate: true,
          force: true,
        });
      }

      await db.sequelize.query(
        "SET FOREIGN_KEY_CHECKS = 1"
      );

      return res.json({
        msg:
          "Database cleared successfully",
      });

    } catch (err) {
      return res.status(500).json({
        msg: err.message,
      });
    }
  }
);

// =====================================================
// START SERVER
// =====================================================
db.sequelize
  .sync()
  .then(() => {
    app.listen(port, () => {
      console.log(
        `Server running on port ${port}`
      );
    });
  })
  .catch((err) => {
    console.log(err);
  });