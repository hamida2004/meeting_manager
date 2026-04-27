module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Meeting",
    {
      id_meeting: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      title: DataTypes.STRING,
      site: DataTypes.STRING,
      timing: DataTypes.DATE,
      status: DataTypes.ENUM("scheduled", "ongoing", "closed","canceled"),
      reporter_id: DataTypes.BIGINT,
      creator_id: DataTypes.BIGINT,
      voting_state: DataTypes.ENUM("open", "closed"),
      meeting_type: DataTypes.ENUM("online","onsite"),
      committee_id:DataTypes.BIGINT
    },
    {
      tableName: "meetings",
      timestamps: false,
    }
  );
};