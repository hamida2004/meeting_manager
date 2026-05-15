const Sequelize = require("sequelize");
const sequelize = require("../config/db");

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// ── Load models ────────────────────────────────────────────────
db.User            = require("./user.model")(sequelize, Sequelize.DataTypes);
db.Committee       = require("./committee.model")(sequelize, Sequelize.DataTypes);
db.CommitteeMember = require("./committeeMember.model")(sequelize, Sequelize.DataTypes);
db.Meeting         = require("./meeting.model")(sequelize, Sequelize.DataTypes);
db.MeetingMember   = require("./meetingMember.model")(sequelize, Sequelize.DataTypes);
db.Agenda          = require("./agenda.model")(sequelize, Sequelize.DataTypes);
db.AgendaPoint     = require("./agendaPoint.model")(sequelize, Sequelize.DataTypes);
db.Vote            = require("./vote.model")(sequelize, Sequelize.DataTypes);
db.Draft           = require("./draft.model")(sequelize, Sequelize.DataTypes);
db.DraftPoint      = require("./draftPoint.model")(sequelize, Sequelize.DataTypes);
db.Pv              = require("./pv.model")(sequelize, Sequelize.DataTypes);
db.PvPoint         = require("./pvPoint.model")(sequelize, Sequelize.DataTypes);
db.Notification    = require("./notification.model")(sequelize, Sequelize.DataTypes);

// ── Associations ───────────────────────────────────────────────

// Committee ↔ User (president)
db.User.hasMany(db.Committee, { foreignKey: "president_id", as: "presidedCommittees" });
db.Committee.belongsTo(db.User, { foreignKey: "president_id", as: "president" });

// Committee ↔ CommitteeMember ↔ User
db.Committee.hasMany(db.CommitteeMember, { foreignKey: "committee_id", as: "members" });
db.CommitteeMember.belongsTo(db.Committee, { foreignKey: "committee_id" });
db.User.hasMany(db.CommitteeMember, { foreignKey: "id_user", as: "committeeMembers" });
db.CommitteeMember.belongsTo(db.User, { foreignKey: "id_user", as: "user" });

// Committee ↔ Meeting
db.Committee.hasMany(db.Meeting, { foreignKey: "committee_id", as: "meetings" });
db.Meeting.belongsTo(db.Committee, { foreignKey: "committee_id", as: "committee" });

// Meeting creator / reporter
db.User.hasMany(db.Meeting, { foreignKey: "creator_id", as: "createdMeetings" });
db.Meeting.belongsTo(db.User, { foreignKey: "creator_id", as: "creator" });
db.User.hasMany(db.Meeting, { foreignKey: "reporter_id", as: "reportedMeetings" });
db.Meeting.belongsTo(db.User, { foreignKey: "reporter_id", as: "reporter" });

// Meeting ↔ MeetingMember ↔ User
db.Meeting.hasMany(db.MeetingMember, { foreignKey: "id_meeting", as: "meetingMembers" });
db.MeetingMember.belongsTo(db.Meeting, { foreignKey: "id_meeting" });
db.User.hasMany(db.MeetingMember, { foreignKey: "id_user", as: "meetingMemberships" });
db.MeetingMember.belongsTo(db.User, { foreignKey: "id_user", as: "user" });

// Meeting ↔ Agenda (1:1)
db.Meeting.hasOne(db.Agenda, { foreignKey: "id_meeting", as: "agenda" });
db.Agenda.belongsTo(db.Meeting, { foreignKey: "id_meeting" });

// Agenda ↔ AgendaPoint
db.Agenda.hasMany(db.AgendaPoint, { foreignKey: "id_agenda", as: "points" });
db.AgendaPoint.belongsTo(db.Agenda, { foreignKey: "id_agenda" });
db.User.hasMany(db.AgendaPoint, { foreignKey: "proposed_by", as: "proposedPoints" });
db.AgendaPoint.belongsTo(db.User, { foreignKey: "proposed_by", as: "proposer" });

// AgendaPoint ↔ Vote
db.AgendaPoint.hasMany(db.Vote, { foreignKey: "id_point", as: "votes" });
db.Vote.belongsTo(db.AgendaPoint, { foreignKey: "id_point" });
db.User.hasMany(db.Vote, { foreignKey: "id_user", as: "votes" });
db.Vote.belongsTo(db.User, { foreignKey: "id_user", as: "voter" });

// Meeting ↔ Draft (1:1)
db.Meeting.hasOne(db.Draft, { foreignKey: "id_meeting", as: "draft" });
db.Draft.belongsTo(db.Meeting, { foreignKey: "id_meeting" });
db.Draft.hasMany(db.DraftPoint, { foreignKey: "id_draft", as: "points" });
db.DraftPoint.belongsTo(db.Draft, { foreignKey: "id_draft" });
db.User.hasMany(db.DraftPoint, { foreignKey: "added_by", as: "draftPoints" });
db.DraftPoint.belongsTo(db.User, { foreignKey: "added_by", as: "author" });

// Draft ↔ Pv (1:1)
db.Draft.hasOne(db.Pv, { foreignKey: "id_draft", as: "pv" });
db.Pv.belongsTo(db.Draft, { foreignKey: "id_draft" });
db.Pv.hasMany(db.PvPoint, { foreignKey: "id_pv", as: "points" });
db.PvPoint.belongsTo(db.Pv, { foreignKey: "id_pv" });
db.User.hasMany(db.Pv, { foreignKey: "created_by", as: "createdPvs" });
db.Pv.belongsTo(db.User, { foreignKey: "created_by", as: "reporter" });

// Notification
db.User.hasMany(db.Notification, { foreignKey: "id_user", as: "notifications" });
db.Notification.belongsTo(db.User, { foreignKey: "id_user" });

module.exports = db;