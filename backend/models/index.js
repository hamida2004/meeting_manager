const Sequelize = require("sequelize");
const sequelize = require("../config/db");

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

console.log(require("./user.model"));
// IMPORTANT: these must be FUNCTIONS
db.User = require("./user.model")(sequelize, Sequelize);
db.Meeting = require("./meeting.model")(sequelize, Sequelize);
db.AgendaPoint = require("./agendaPoint.model")(sequelize, Sequelize);
db.Vote = require("./vote.model")(sequelize, Sequelize);
db.Draft = require("./draft.model")(sequelize, Sequelize);
db.DraftPoint = require("./draftPoint.model")(sequelize, Sequelize);
db.Pv = require("./pv.model")(sequelize, Sequelize);
db.PvPoint = require("./pvPoint.model")(sequelize, Sequelize);

module.exports = db;