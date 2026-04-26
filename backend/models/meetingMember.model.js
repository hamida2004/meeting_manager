module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "MeetingMember",
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      id_meeting: DataTypes.BIGINT,
      id_member: DataTypes.BIGINT,
      present: DataTypes.BOOLEAN,
    },
    {
      tableName: "meeting_members",
      timestamps: false,
    }
  );
};