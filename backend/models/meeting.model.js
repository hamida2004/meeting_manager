module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Meeting",
    {
      id_meeting: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      title: DataTypes.STRING,
      site: DataTypes.STRING,
      timing: DataTypes.DATE,
      status: DataTypes.ENUM("scheduled", "ongoing", "closed"),
      reporter_id: DataTypes.BIGINT,
      meeting_type: DataTypes.STRING,
    },
    {
      tableName: "meetings",
      timestamps: false,
    }
  );
};