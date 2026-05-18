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
// CLEAR DB
// =====================================================
app.get(
  "/dev/clear-db",
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

// =====================================================================
// GET /dev/seed
// Populates the database with realistic data:
//   10 users · 3 committees · 5 meetings/committee · 4 draft points/meeting
//   agenda points (mixed states) · votes on open points
//   some PVs generated · notifications for every user
// =====================================================================

app.get("/dev/seed", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ msg: "Disabled in production" });
  }

  const t = await db.sequelize.transaction();

  try {
    const hash = await bcrypt.hash("123456", 10);

    // ─── 1. USERS ──────────────────────────────────────────────────
    // u[0] = super admin, u[1-2] = admins, u[3-9] = regular users
    const userDefs = [
      { full_name: "Alice Admin",    email: "alice@mail.com",   is_admin: true  },
      { full_name: "Bob Manager",    email: "bob@mail.com",     is_admin: true  },
      { full_name: "Carol Director", email: "carol@mail.com",   is_admin: true  },
      { full_name: "David Member",   email: "david@mail.com",   is_admin: false },
      { full_name: "Eva Reporter",   email: "eva@mail.com",     is_admin: false },
      { full_name: "Frank User",     email: "frank@mail.com",   is_admin: false },
      { full_name: "Grace Member",   email: "grace@mail.com",   is_admin: false },
      { full_name: "Henry User",     email: "henry@mail.com",   is_admin: false },
      { full_name: "Iris Member",    email: "iris@mail.com",    is_admin: false },
      { full_name: "Jack Reporter",  email: "jack@mail.com",    is_admin: false },
    ];

    const users = await Promise.all(
      userDefs.map((u) =>
        db.User.create({ ...u, password: hash }, { transaction: t })
      )
    );

    // shorthand
    const uid = (i) => users[i].id_user;

    // ─── 2. COMMITTEES ─────────────────────────────────────────────
    // Committee A — president: Alice (u0)
    // Committee B — president: Bob   (u1)
    // Committee C — president: Carol (u2)

    const committees = await Promise.all([
      db.Committee.create({ name: "Strategy Committee",   president_id: uid(0) }, { transaction: t }),
      db.Committee.create({ name: "Operations Committee", president_id: uid(1) }, { transaction: t }),
      db.Committee.create({ name: "Finance Committee",    president_id: uid(2) }, { transaction: t }),
    ]);

    const cid = (i) => committees[i].id_committee;

    // ─── 3. COMMITTEE MEMBERS ──────────────────────────────────────
    // Spread 10 users across 3 committees; members can be in multiple committees
    //
    // Committee A (Strategy):   u0(pres), u1, u3, u4, u5, u7
    // Committee B (Operations): u1(pres), u2, u3, u5, u6, u8, u9
    // Committee C (Finance):    u2(pres), u0, u4, u6, u7, u8, u9

    const committeeMemberships = [
      // Committee A
      { committee_id: cid(0), id_user: uid(0) },
      { committee_id: cid(0), id_user: uid(1) },
      { committee_id: cid(0), id_user: uid(3) },
      { committee_id: cid(0), id_user: uid(4) },
      { committee_id: cid(0), id_user: uid(5) },
      { committee_id: cid(0), id_user: uid(7) },
      // Committee B
      { committee_id: cid(1), id_user: uid(1) },
      { committee_id: cid(1), id_user: uid(2) },
      { committee_id: cid(1), id_user: uid(3) },
      { committee_id: cid(1), id_user: uid(5) },
      { committee_id: cid(1), id_user: uid(6) },
      { committee_id: cid(1), id_user: uid(8) },
      { committee_id: cid(1), id_user: uid(9) },
      // Committee C
      { committee_id: cid(2), id_user: uid(2) },
      { committee_id: cid(2), id_user: uid(0) },
      { committee_id: cid(2), id_user: uid(4) },
      { committee_id: cid(2), id_user: uid(6) },
      { committee_id: cid(2), id_user: uid(7) },
      { committee_id: cid(2), id_user: uid(8) },
      { committee_id: cid(2), id_user: uid(9) },
    ];

    await db.CommitteeMember.bulkCreate(committeeMemberships, {
      ignoreDuplicates: true,
      transaction: t,
    });

    // ─── 4. MEETINGS (5 per committee = 15 total) ──────────────────

    // Meeting configs: [committeeIdx, creatorIdx, reporterIdx, statusIdx]
    // statuses cycling through the 4 values
    const statuses  = ["scheduled", "ongoing", "closed", "canceled", "scheduled"];
    const types     = ["online", "onsite", "online", "onsite", "online"];

    // Committee A members available for meetings: u0,u1,u3,u4,u5,u7
    const cAMembers = [uid(0), uid(1), uid(3), uid(4), uid(5), uid(7)];
    // Committee B members: u1,u2,u3,u5,u6,u8,u9
    const cBMembers = [uid(1), uid(2), uid(3), uid(5), uid(6), uid(8), uid(9)];
    // Committee C members: u2,u0,u4,u6,u7,u8,u9
    const cCMembers = [uid(2), uid(0), uid(4), uid(6), uid(7), uid(8), uid(9)];

    const meetingDefs = [
      // Committee A — 5 meetings
      { committee_id: cid(0), creator_id: uid(0), reporter_id: uid(4), members: cAMembers, title: "Strategy Q1 Review",      idx: 0 },
      { committee_id: cid(0), creator_id: uid(1), reporter_id: uid(3), members: cAMembers, title: "Annual Planning Session",  idx: 1 },
      { committee_id: cid(0), creator_id: uid(0), reporter_id: uid(5), members: cAMembers, title: "Risk Assessment Meeting",  idx: 2 },
      { committee_id: cid(0), creator_id: uid(1), reporter_id: uid(4), members: cAMembers, title: "Stakeholder Alignment",    idx: 3 },
      { committee_id: cid(0), creator_id: uid(0), reporter_id: uid(7), members: cAMembers, title: "Market Expansion Review",  idx: 4 },
      // Committee B — 5 meetings
      { committee_id: cid(1), creator_id: uid(1), reporter_id: uid(9), members: cBMembers, title: "Ops Efficiency Review",    idx: 0 },
      { committee_id: cid(1), creator_id: uid(2), reporter_id: uid(8), members: cBMembers, title: "Supply Chain Planning",    idx: 1 },
      { committee_id: cid(1), creator_id: uid(1), reporter_id: uid(6), members: cBMembers, title: "Process Improvement",      idx: 2 },
      { committee_id: cid(1), creator_id: uid(2), reporter_id: uid(9), members: cBMembers, title: "Vendor Negotiation Prep",  idx: 3 },
      { committee_id: cid(1), creator_id: uid(1), reporter_id: uid(5), members: cBMembers, title: "Q2 Operations Review",     idx: 4 },
      // Committee C — 5 meetings
      { committee_id: cid(2), creator_id: uid(2), reporter_id: uid(4), members: cCMembers, title: "Budget Review FY2025",     idx: 0 },
      { committee_id: cid(2), creator_id: uid(0), reporter_id: uid(9), members: cCMembers, title: "Investment Committee",     idx: 1 },
      { committee_id: cid(2), creator_id: uid(2), reporter_id: uid(8), members: cCMembers, title: "Audit Preparation",        idx: 2 },
      { committee_id: cid(2), creator_id: uid(0), reporter_id: uid(7), members: cCMembers, title: "Financial Risk Review",    idx: 3 },
      { committee_id: cid(2), creator_id: uid(2), reporter_id: uid(4), members: cCMembers, title: "Cost Reduction Planning",  idx: 4 },
    ];

    const meetings = [];
    const drafts   = [];

    for (const def of meetingDefs) {
      const baseDays = def.idx * 7; // spread meetings over weeks
      const timing   = new Date(Date.now() + baseDays * 24 * 60 * 60 * 1000);

      const meeting = await db.Meeting.create(
        {
          title:        def.title,
          site:         types[def.idx] === "online" ? "Zoom / Google Meet" : "Conference Room A",
          timing,
          meeting_type: types[def.idx],
          status:       statuses[def.idx],
          committee_id: def.committee_id,
          creator_id:   def.creator_id,
          reporter_id:  def.reporter_id,
        },
        { transaction: t }
      );
      meetings.push(meeting);

      // Auto-create draft
      const draft = await db.Draft.create(
        {
          id_meeting:      meeting.id_meeting,
          created_at:      new Date(),
          last_updated_at: new Date(),
        },
        { transaction: t }
      );
      drafts.push(draft);

      // Add all committee members to this meeting
      await db.MeetingMember.bulkCreate(
        def.members.map((id_user, i) => ({
          id_meeting: meeting.id_meeting,
          id_user,
          invited:   true,
          confirmed: i < 4, // first 4 confirmed
          attended:  i < 3 && statuses[def.idx] === "closed", // attended if closed
        })),
        { ignoreDuplicates: true, transaction: t }
      );
    }

    // ─── 5. AGENDA + AGENDA POINTS ─────────────────────────────────
    // 4 points per meeting, mixed states
    // states: pending, approved, open, closed  (cycling)
    const pointStates  = ["pending", "approved", "open", "closed"];
    const pointContents = [
      "Review previous meeting action items",
      "Discuss current project status update",
      "Vote on proposed budget allocation",
      "Plan next quarter objectives",
    ];

    const agendas      = [];
    const agendaPoints = [];

    for (let mi = 0; mi < meetings.length; mi++) {
      const meeting = meetings[mi];
      const def     = meetingDefs[mi];

      // skip canceled meetings — no agenda
      if (meeting.status === "canceled") {
        agendas.push(null);
        agendaPoints.push([]);
        continue;
      }

      const agenda = await db.Agenda.create(
        { id_meeting: meeting.id_meeting, created_at: new Date() },
        { transaction: t }
      );
      agendas.push(agenda);

      const points = [];
      for (let pi = 0; pi < 4; pi++) {
        // proposer cycles through the meeting's members
        const proposerIdx = pi % def.members.length;
        const point = await db.AgendaPoint.create(
          {
            id_agenda:   agenda.id_agenda,
            content:     pointContents[pi],
            proposed_by: def.members[proposerIdx],
            state:       pointStates[pi],
          },
          { transaction: t }
        );
        points.push(point);
      }
      agendaPoints.push(points);
    }

    // ─── 6. VOTES (on "open" points) ───────────────────────────────
    const voteOptions = ["agree", "disagree", "abstain"];

    for (let mi = 0; mi < meetings.length; mi++) {
      const def    = meetingDefs[mi];
      const points = agendaPoints[mi];

      for (const point of points) {
        if (point.state !== "open") continue;

        // All meeting members vote (cycling through options)
        const voters = def.members;
        for (let vi = 0; vi < voters.length; vi++) {
          await db.Vote.create(
            {
              id_point: point.id_point,
              id_user:  voters[vi],
              vote:     voteOptions[vi % 3],
              voted_at: new Date(),
            },
            { transaction: t }
          );
        }
      }
    }

    // ─── 7. DRAFT POINTS (4 per draft, reporter as author) ─────────
    const draftContents = [
      "Opening remarks and attendance noted",
      "Previous action items reviewed and updated",
      "Key decisions made during this session",
      "Next steps and assigned responsibilities",
    ];

    const pvMeetings = []; // track which meetings got a PV

    for (let mi = 0; mi < drafts.length; mi++) {
      const draft   = drafts[mi];
      const def     = meetingDefs[mi];
      const meeting = meetings[mi];

      if (meeting.status === "canceled") continue;

      for (let di = 0; di < 4; di++) {
        await db.DraftPoint.create(
          {
            id_draft:  draft.id_draft,
            content:   draftContents[di],
            added_by:  def.reporter_id,
            added_at:  new Date(),
            edited_at: di === 1 ? new Date() : null, // point 2 was edited
          },
          { transaction: t }
        );
      }

      // Update draft timestamp
      await draft.update({ last_updated_at: new Date() }, { transaction: t });

      // Create PV for closed meetings (meetings with idx 2 = "closed" status)
      if (meeting.status === "closed") {
        pvMeetings.push({ mi, draft, def, meeting });
      }
    }

    // ─── 8. PVS ────────────────────────────────────────────────────
    // Create PVs for all "closed" meetings by cloning draft points
    const pvContents = [
      "Meeting called to order. Quorum confirmed.",
      "Previous minutes reviewed and approved.",
      "Agenda items discussed and voted upon.",
      "Resolutions passed as noted in agenda.",
      "Meeting adjourned. Next meeting scheduled.",
    ];

    for (const { mi, draft, def } of pvMeetings) {
      // Get draft points for this meeting
      const draftPointsForMeeting = await db.DraftPoint.findAll({
        where: { id_draft: draft.id_draft },
        transaction: t,
      });

      const pv = await db.Pv.create(
        {
          id_draft:   draft.id_draft,
          created_by: def.reporter_id,
          created_at: new Date(),
        },
        { transaction: t }
      );

      // Clone draft points + add extra PV-only point
      const pvPointsData = [
        ...draftPointsForMeeting.map((dp) => ({ id_pv: pv.id_pv, content: dp.content })),
        { id_pv: pv.id_pv, content: pvContents[4] }, // closing statement
      ];

      await db.PvPoint.bulkCreate(pvPointsData, { transaction: t });
    }

    // ─── 9. NOTIFICATIONS ──────────────────────────────────────────
    // 3 notifications per user — mix of read/unread

    const notifTemplates = [
      (name) => `Welcome to Meeting Manager, ${name}! Your account is ready.`,
      (name) => `You have been added to a new committee. Check your committees.`,
      (name) => `A new meeting has been scheduled. Please confirm your attendance.`,
      (name) => `An agenda point you proposed is pending approval.`,
      (name) => `Voting is now open on an agenda point. Cast your vote!`,
      (name) => `The PV for a recent meeting is now available.`,
      (name) => `Reminder: Meeting starts in 24 hours. Confirm attendance.`,
    ];

    const notifRows = [];
    for (let ui = 0; ui < users.length; ui++) {
      const user = users[ui];
      // Each user gets 3 notifications, cycling through templates
      for (let ni = 0; ni < 3; ni++) {
        const templateIdx = (ui + ni) % notifTemplates.length;
        notifRows.push({
          id_user:    user.id_user,
          content:    notifTemplates[templateIdx](user.full_name),
          is_read:    ni === 0, // first notification is pre-read
          created_at: new Date(Date.now() - ni * 60 * 60 * 1000), // staggered times
        });
      }
    }

    await db.Notification.bulkCreate(notifRows, { transaction: t });

    // ─── COMMIT ────────────────────────────────────────────────────
    await t.commit();

    return res.json({
      msg: "Database seeded successfully",
      summary: {
        users:           users.length,
        committees:      committees.length,
        meetings:        meetings.length,
        agendas:         agendas.filter(Boolean).length,
        agenda_points:   agendaPoints.flat().length,
        open_points_with_votes: agendaPoints.flat().filter((p) => p.state === "open").length,
        draft_points:    meetings.filter((m) => m.status !== "canceled").length * 4,
        pvs_created:     pvMeetings.length,
        notifications:   notifRows.length,
      },
      credentials: {
        note:     "All users have password: 123456",
        admin:    "alice@mail.com",
        reporter: "eva@mail.com",
        member:   "david@mail.com",
      },
    });
  } catch (err) {
    await t.rollback();
    console.error(err);
    return res.status(500).json({ msg: err.message });
  }
});



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

