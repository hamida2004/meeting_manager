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
    return res.status(403).json({
      msg: "Disabled in production",
    });
  }

  const t =
    await db.sequelize.transaction();

  try {

    const hash =
      await bcrypt.hash(
        "123456",
        10
      );

    // =====================================================
    // USERS
    // =====================================================

    const userDefs = [

      {
        full_name:
          "أحمد بن يوسف",

        email:
          "admin@lajna.dz",

        is_admin: true,
      },

      {
        full_name:
          "فاطمة الزهراء",

        email:
          "fatima@lajna.dz",

        is_admin: true,
      },

      {
        full_name:
          "محمد قاسمي",

        email:
          "mohamed@lajna.dz",

        is_admin: false,
      },

      {
        full_name:
          "خالد بوعلام",

        email:
          "khaled@lajna.dz",

        is_admin: false,
      },

      {
        full_name:
          "سميرة لعربي",

        email:
          "samira@lajna.dz",

        is_admin: false,
      },

      {
        full_name:
          "عبد القادر شريف",

        email:
          "abdelkader@lajna.dz",

        is_admin: false,
      },

      {
        full_name:
          "ليلى بن ناصر",

        email:
          "leila@lajna.dz",

        is_admin: false,
      },

      {
        full_name:
          "يوسف زروقي",

        email:
          "youssef@lajna.dz",

        is_admin: false,
      },

      {
        full_name:
          "نادية حمادي",

        email:
          "nadia@lajna.dz",

        is_admin: false,
      },

      {
        full_name:
          "إبراهيم خوجة",

        email:
          "ibrahim@lajna.dz",

        is_admin: false,
      },
    ];

    const users =
      await Promise.all(

        userDefs.map(
          (u) =>
            db.User.create(
              {
                ...u,
                password: hash,
              },
              {
                transaction: t,
              }
            )
        )
      );

    const uid =
      (i) =>
        users[i].id_user;

    // =====================================================
    // COMMITTEES
    // =====================================================

    const committees =
      await Promise.all([

        db.Committee.create(
          {
            name:
              "لجنة المنح والمساعدات",

            president_id:
              uid(0),
          },
          {
            transaction: t,
          }
        ),

        db.Committee.create(
          {
            name:
              "لجنة النشاطات الثقافية والرياضية",

            president_id:
              uid(1),
          },
          {
            transaction: t,
          }
        ),

        db.Committee.create(
          {
            name:
              "لجنة الخدمات الاجتماعية",

            president_id:
              uid(2),
          },
          {
            transaction: t,
          }
        ),
      ]);

    const cid =
      (i) =>
        committees[i]
          .id_committee;

    // =====================================================
    // COMMITTEE MEMBERS
    // =====================================================

    const memberships = [

      // اللجنة 1
      {
        committee_id:
          cid(0),

        id_user:
          uid(0),
      },

      {
        committee_id:
          cid(0),

        id_user:
          uid(3),
      },

      {
        committee_id:
          cid(0),

        id_user:
          uid(4),
      },

      {
        committee_id:
          cid(0),

        id_user:
          uid(5),
      },

      // اللجنة 2
      {
        committee_id:
          cid(1),

        id_user:
          uid(1),
      },

      {
        committee_id:
          cid(1),

        id_user:
          uid(6),
      },

      {
        committee_id:
          cid(1),

        id_user:
          uid(7),
      },

      {
        committee_id:
          cid(1),

        id_user:
          uid(8),
      },

      // اللجنة 3
      {
        committee_id:
          cid(2),

        id_user:
          uid(2),
      },

      {
        committee_id:
          cid(2),

        id_user:
          uid(3),
      },

      {
        committee_id:
          cid(2),

        id_user:
          uid(4),
      },

      {
        committee_id:
          cid(2),

        id_user:
          uid(9),
      },
    ];

    await db.CommitteeMember.bulkCreate(
      memberships,
      {
        ignoreDuplicates: true,
        transaction: t,
      }
    );

    // =====================================================
    // MEETINGS
    // =====================================================

    const meetingsDefs = [

      {
        title:
          "اجتماع دراسة ملفات المنح الاجتماعية",

        committee_id:
          cid(0),

        creator_id:
          uid(0),

        reporter_id:
          uid(4),

        status:
          "scheduled",

        meeting_type:
          "onsite",

        site:
          "قاعة الاجتماعات الرئيسية",
      },

      {
        title:
          "اجتماع تنظيم الرحلة الثقافية",

        committee_id:
          cid(1),

        creator_id:
          uid(1),

        reporter_id:
          uid(7),

        status:
          "ongoing",

        meeting_type:
          "onsite",

        site:
          "قاعة النشاطات",
      },

      {
        title:
          "اجتماع دراسة طلبات السكن",

        committee_id:
          cid(2),

        creator_id:
          uid(2),

        reporter_id:
          uid(9),

        status:
          "closed",

        meeting_type:
          "online",

        site:
          "Google Meet",
      },
    ];

    const meetings = [];

    for (
      const def
      of meetingsDefs
    ) {

      const meeting =
        await db.Meeting.create(
          {
            ...def,

            timing:
              new Date(
                Date.now() +
                Math.random() *
                7 *
                24 *
                60 *
                60 *
                1000
              ),
          },
          {
            transaction: t,
          }
        );

      meetings.push(
        meeting
      );
    }

    // =====================================================
    // MEETING MEMBERS
    // =====================================================

    for (
      const meeting
      of meetings
    ) {

      const members =
        await db.CommitteeMember.findAll({
          where: {
            committee_id:
              meeting.committee_id,
          },

          transaction: t,
        });

      await db.MeetingMember.bulkCreate(

        members.map(
          (m, index) => ({
            id_meeting:
              meeting.id_meeting,

            id_user:
              m.id_user,

            invited: true,

            confirmed:
              index < 3,

            attended:
              meeting.status ===
              "closed",
          })
        ),

        {
          transaction: t,
        }
      );
    }

    // =====================================================
    // AGENDAS
    // =====================================================

    const agendaTitles = [

      "دراسة الملفات المقبولة",

      "مناقشة الميزانية",

      "تحديد المستفيدين",

      "تنظيم النشاطات القادمة",
    ];

    for (
      const meeting
      of meetings
    ) {

      const agenda =
        await db.Agenda.create(
          {
            id_meeting:
              meeting.id_meeting,
          },
          {
            transaction: t,
          }
        );

      for (
        let i = 0;
        i < 4;
        i++
      ) {

        await db.AgendaPoint.create(
          {
            id_agenda:
              agenda.id_agenda,

            content:
              agendaTitles[i],

            proposed_by:
              uid(i),

            state:
              i === 0
                ? "approved"
                : i === 1
                ? "open"
                : "pending",
          },
          {
            transaction: t,
          }
        );
      }
    }

    // =====================================================
    // DRAFTS
    // =====================================================

    for (
      const meeting
      of meetings
    ) {

      const draft =
        await db.Draft.create(
          {
            id_meeting:
              meeting.id_meeting,
          },
          {
            transaction: t,
          }
        );

      await db.DraftPoint.bulkCreate(

        [
          {
            id_draft:
              draft.id_draft,

            content:
              "تم افتتاح الجلسة بحضور الأعضاء المعنيين.",

            added_by:
              meeting.reporter_id,
          },

          {
            id_draft:
              draft.id_draft,

            content:
              "تمت مناقشة النقاط المدرجة في جدول الأعمال.",

            added_by:
              meeting.reporter_id,
          },

          {
            id_draft:
              draft.id_draft,

            content:
              "تم الاتفاق على رفع التوصيات للإدارة.",

            added_by:
              meeting.reporter_id,
          },
        ],

        {
          transaction: t,
        }
      );
    }

    // =====================================================
    // PV
    // =====================================================

    const closedMeetings =
      meetings.filter(
        (m) =>
          m.status ===
          "closed"
      );

    for (
      const meeting
      of closedMeetings
    ) {

      const draft =
        await db.Draft.findOne({
          where: {
            id_meeting:
              meeting.id_meeting,
          },

          transaction: t,
        });

      const pv =
        await db.Pv.create(
          {
            id_draft:
              draft.id_draft,

            created_by:
              meeting.reporter_id,
          },
          {
            transaction: t,
          }
        );

      await db.PvPoint.bulkCreate(

        [
          {
            id_pv:
              pv.id_pv,

            content:
              "تمت المصادقة على الملفات المقبولة.",
          },

          {
            id_pv:
              pv.id_pv,

            content:
              "تم تحديد قائمة المستفيدين النهائية.",
          },

          {
            id_pv:
              pv.id_pv,

            content:
              "اختتم الاجتماع على الساعة 12:30.",
          },
        ],

        {
          transaction: t,
        }
      );
    }

    // =====================================================
    // NOTIFICATIONS
    // =====================================================

    const notifications = [];

    for (
      const user
      of users
    ) {

      notifications.push({

        id_user:
          user.id_user,

        content:
          `مرحبًا ${user.full_name}، تم تفعيل حسابك بنجاح.`,

        is_read: false,
      });

      notifications.push({

        id_user:
          user.id_user,

        content:
          "لديك اجتماع جديد ضمن لجنتك.",

        is_read: false,
      });

      notifications.push({

        id_user:
          user.id_user,

        content:
          "يرجى تأكيد حضورك للاجتماع القادم.",

        is_read: true,
      });
    }

    await db.Notification.bulkCreate(
      notifications,
      {
        transaction: t,
      }
    );

    // =====================================================
    // COMMIT
    // =====================================================

    await t.commit();

    return res.json({

      msg:
        "تم ملء قاعدة البيانات بنجاح",

      credentials: {

        password:
          "123456",

        admin:
          "admin@lajna.dz",

        user:
          "mohamed@lajna.dz",
      },

      stats: {

        users:
          users.length,

        committees:
          committees.length,

        meetings:
          meetings.length,

        notifications:
          notifications.length,
      },
    });

  } catch (err) {

    await t.rollback();

    console.error(err);

    return res.status(500).json({
      msg:
        err.message,
    });
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

