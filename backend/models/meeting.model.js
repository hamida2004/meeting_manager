module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Meeting",
    {
      id_meeting:   { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      title:        { type: DataTypes.STRING(200), allowNull: false },
      site:         { type: DataTypes.STRING(200), allowNull: true },
      timing:       { type: DataTypes.DATE, allowNull: false },
      meeting_type: { type: DataTypes.ENUM("online", "onsite"), defaultValue: "onsite" },
      status:       { type: DataTypes.ENUM("scheduled", "ongoing", "closed", "canceled"), defaultValue: "scheduled" },
      voting_state: { type: DataTypes.ENUM("open", "closed"), defaultValue: "closed" },
      committee_id: { type: DataTypes.BIGINT, allowNull: true },
      creator_id:   { type: DataTypes.BIGINT, allowNull: false },
      reporter_id:  { type: DataTypes.BIGINT, allowNull: true },
    },
    { tableName: "meetings", timestamps: true }
  );
};