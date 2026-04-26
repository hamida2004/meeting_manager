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


// =========================
// 1. SEED MOCK DATA
// =========================
app.get("/dev/seed",  async (req, res) => {
  try {
    const { User, Meeting, AgendaPoint, Vote, Draft } = db;

    // USERS
    const u1 = await User.create({
      full_name: "User One",
      email: "u1@mail.com",
      password: "123456",
    });

    const u2 = await User.create({
      full_name: "User Two",
      email: "u2@mail.com",
      password: "123456",
    });

    // MEETING
    const meeting = await Meeting.create({
      title: "Test Meeting",
      site: "online",
      timing: new Date(),
      status: "scheduled",
      reporter_id: u1.id_user,
    });

    // DRAFT (auto logic mimic)
    const draft = await Draft.create({
      id_meeting: meeting.id_meeting,
      created_at: new Date(),
    });

    // AGENDA
    const point = await AgendaPoint.create({
      content: "Discuss project",
      meeting_id: meeting.id_meeting,
      proposed_by: u1.id_user,
      voting_state: "open",
    });

    // VOTE
    await Vote.create({
      vote: "agree",
      id_user: u2.id_user,
      id_agenda_point: point.id_point,
      vote_at: new Date(),
    });

    res.json({ msg: "Seeded successfully" });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// =========================
// DEV ONLY - CLEAR DATABASE
// =========================
app.get("/dev/clear-db", async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ msg: "Disabled in production" });
    }

    // Disable FK checks (IMPORTANT)
    await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");

    // Get all models dynamically
    for (const modelName of Object.keys(db)) {
      if (db[modelName]?.destroy) {
        await db[modelName].destroy({
          where: {},
          truncate: true,
          force: true,
        });
      }
    }

    // Enable FK checks again
    await db.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    res.json({ msg: "Database cleared successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// =========================
// 2. GET ALL DATA
// =========================
app.get("/dev/all",async (req, res) => {
  try {
    const data = {};

    for (const modelName of Object.keys(db)) {
      if (db[modelName].findAll) {
        data[modelName] = await db[modelName].findAll();
      }
    }

    res.json(data);
  } catch (err) {
    res.status(500).json(err.message);
  }
});


// =========================
// 3. CLEAR DATABASE
// =========================
app.get("/dev/clear",  async (req, res) => {
  try {
    // Order matters because of FK constraints
    await db.Vote.destroy({ where: {}, truncate: true });
    await db.AgendaPoint.destroy({ where: {}, truncate: true });
    await db.Draft.destroy({ where: {}, truncate: true });
    await db.Meeting.destroy({ where: {}, truncate: true });
    await db.User.destroy({ where: {}, truncate: true });

    res.json({ msg: "Database cleared" });
  } catch (err) {
    res.status(500).json(err.message);
  }
});



db.sequelize.sync({ alter: true }).then(() => {
  app.listen(port, () => console.log("Server running"));
});