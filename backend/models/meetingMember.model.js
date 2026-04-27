module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "MeetingMember",
    {
      id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      id_meeting: DataTypes.BIGINT,
      id_user: DataTypes.BIGINT,
      invited: DataTypes.BOOLEAN,
      confirmed: DataTypes.BOOLEAN,
      attended: DataTypes.BOOLEAN,
    },
    {
      tableName: "meeting_members",
      timestamps: false,
    }
  );
};