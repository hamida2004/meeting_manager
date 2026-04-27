const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const db = require("./models");
const port = process.env.PORT
app.use(cors());
app.use(express.json());

app.use("/auth", require("./routes/auth.routes"));
app.use("/meetings", require("./routes/meeting.routes"));
app.use("/votes", require("./routes/vote.routes"));
app.use("/agenda", require("./routes/agenda.routes"));
app.use("/draft", require("./routes/draft.routes"));
app.use("/pv", require("./routes/pv.routes"));
app.use("/committees", require("./routes/committee.routes"));
app.use("/notifications", require("./routes/notification.routes"));


const bcrypt = require("bcrypt");

app.get("/dev/seed", async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ msg: "Disabled in production" });
    }

    const {
      User,
      Meeting,
      AgendaPoint,
      Vote,
      Draft,
      Committee,
      MeetingMember,
    } = db;

    // =========================
    // USERS
    // =========================
    const hash = await bcrypt.hash("123456", 10);

    const u1 = await User.create({
      full_name: "User One",
      email: "u1@mail.com",
      password: hash,
    });

    const u2 = await User.create({
      full_name: "User Two",
      email: "u2@mail.com",
      password: hash,
    });

    // =========================
    // COMMITTEE
    // =========================
    const committee = await Committee.create({
      name: "Test Committee",
      president_id: u1.id_user,
    });

    // =========================
    // MEETING
    // =========================
    const meeting = await Meeting.create({
      title: "Test Meeting",
      site: "online",
      timing: new Date(),
      status: "scheduled",
      reporter_id: u1.id_user,
      creator_id: u1.id_user,
      voting_state: "open",
      meeting_type: "online",
      committee_id: committee.id_committee,
    });

    // =========================
    // MEMBERS
    // =========================
    await MeetingMember.bulkCreate([
      {
        id_meeting: meeting.id_meeting,
        id_user: u1.id_user,
        invited: true,
        confirmed: true,
        attended: true,
      },
      {
        id_meeting: meeting.id_meeting,
        id_user: u2.id_user,
        invited: true,
        confirmed: false,
        attended: false,
      },
    ]);

    // =========================
    // DRAFT
    // =========================
    const draft = await Draft.create({
      id_meeting: meeting.id_meeting,
      created_at: new Date(),
    });

    // =========================
    // AGENDA
    // =========================
    const point = await AgendaPoint.create({
      content: "Discuss project",
      meeting_id: meeting.id_meeting,
      proposed_by: u1.id_user,
      state: "pending",
    });

    // =========================
    // VOTE
    // =========================
    await Vote.create({
      vote: "agree",
      id_user: u2.id_user,
      id_agenda_point: point.id_point,
      vote_at: new Date(),
    });

    res.json({
      msg: "Seeded successfully",
      users: [u1, u2],
      committee,
      meeting,
    });

  } catch (err) {
    res.status(500).json(err.message);
  }
});


app.get("/dev/clear-db", async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ msg: "Disabled in production" });
    }

    await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

    const models = Object.keys(db).filter(
      (m) => db[m]?.destroy
    );

    for (const model of models) {
      await db[model].destroy({
        where: {},
        truncate: true,
        force: true,
      });
    }

    await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    res.json({ msg: "Database cleared successfully" });

  } catch (err) {
    res.status(500).json(err.message);
  }
});

db.sequelize.sync().then(() => {
  app.listen(port, () => console.log("Server running"));
});