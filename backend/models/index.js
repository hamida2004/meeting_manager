const Sequelize = require("sequelize");
const sequelize = require("../config/db");

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// =========================
// LOAD MODELS
// =========================
db.User = require("./user.model")(sequelize, Sequelize);
db.Role = require("./role.model")(sequelize, Sequelize);

db.Committee = require("./committee.model")(sequelize, Sequelize);
db.CommitteeMember = require("./committeeMember.model")(sequelize, Sequelize);

db.Meeting = require("./meeting.model")(sequelize, Sequelize);
db.MeetingMember = require("./meetingMember.model")(sequelize, Sequelize);

db.AgendaPoint = require("./agendaPoint.model")(sequelize, Sequelize);
db.Vote = require("./vote.model")(sequelize, Sequelize);

db.Draft = require("./draft.model")(sequelize, Sequelize);
db.DraftPoint = require("./draftPoint.model")(sequelize, Sequelize);

db.Pv = require("./pv.model")(sequelize, Sequelize);
db.PvPoint = require("./pvPoint.model")(sequelize, Sequelize);

db.Notification = require("./notification.model")(sequelize, Sequelize);

// =========================
// ASSOCIATIONS
// =========================

// USER ↔ ROLE (optional global role)
db.Role.hasMany(db.User, { foreignKey: "role_id" });
db.User.belongsTo(db.Role, { foreignKey: "role_id" });

// COMMITTEE
db.Committee.hasMany(db.CommitteeMember, { foreignKey: "committee_id" });
db.CommitteeMember.belongsTo(db.Committee, { foreignKey: "committee_id" });

db.User.hasMany(db.CommitteeMember, { foreignKey: "id_user" });
db.CommitteeMember.belongsTo(db.User, { foreignKey: "id_user" });

// MEETING
db.Committee.hasMany(db.Meeting, { foreignKey: "committee_id" });
db.Meeting.belongsTo(db.Committee, { foreignKey: "committee_id" });

// meeting creator
db.User.hasMany(db.Meeting, { foreignKey: "creator_id", as: "createdMeetings" });
db.Meeting.belongsTo(db.User, { foreignKey: "creator_id", as: "creator" });

// reporter
db.User.hasMany(db.Meeting, { foreignKey: "reporter_id", as: "reportedMeetings" });
db.Meeting.belongsTo(db.User, { foreignKey: "reporter_id", as: "reporter" });

// MEETING MEMBERS
db.Meeting.hasMany(db.MeetingMember, { foreignKey: "id_meeting" });
db.MeetingMember.belongsTo(db.Meeting, { foreignKey: "id_meeting" });

db.User.hasMany(db.MeetingMember, { foreignKey: "id_user" });
db.MeetingMember.belongsTo(db.User, { foreignKey: "id_user" });

// AGENDA
db.Meeting.hasMany(db.AgendaPoint, { foreignKey: "meeting_id" });
db.AgendaPoint.belongsTo(db.Meeting, { foreignKey: "meeting_id" });

// VOTES
db.AgendaPoint.hasMany(db.Vote, { foreignKey: "id_agenda_point" });
db.Vote.belongsTo(db.AgendaPoint, { foreignKey: "id_agenda_point" });

db.User.hasMany(db.Vote, { foreignKey: "id_user" });
db.Vote.belongsTo(db.User, { foreignKey: "id_user" });

// DRAFT
db.Meeting.hasOne(db.Draft, { foreignKey: "id_meeting" });
db.Draft.belongsTo(db.Meeting, { foreignKey: "id_meeting" });

db.Draft.hasMany(db.DraftPoint, { foreignKey: "id_draft" });
db.DraftPoint.belongsTo(db.Draft, { foreignKey: "id_draft" });

// PV
db.Draft.hasOne(db.Pv, { foreignKey: "id_draft" });
db.Pv.belongsTo(db.Draft, { foreignKey: "id_draft" });

db.Pv.hasMany(db.PvPoint, { foreignKey: "id_pv" });
db.PvPoint.belongsTo(db.Pv, { foreignKey: "id_pv" });

// NOTIFICATIONS
db.User.hasMany(db.Notification, { foreignKey: "member_id" });
db.Notification.belongsTo(db.User, { foreignKey: "member_id" });

module.exports = db;