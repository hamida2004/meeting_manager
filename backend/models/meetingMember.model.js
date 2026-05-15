module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "MeetingMember",
    {
      id:        { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      id_meeting:{ type: DataTypes.BIGINT, allowNull: false },
      id_user:   { type: DataTypes.BIGINT, allowNull: false },
      invited:   { type: DataTypes.BOOLEAN, defaultValue: true },
      confirmed: { type: DataTypes.BOOLEAN, defaultValue: false }, // member self-confirmed
      attended:  { type: DataTypes.BOOLEAN, defaultValue: false }, // creator validated
    },
    {
      tableName: "meeting_members",
      timestamps: true,
      indexes: [{ unique: true, fields: ["id_meeting", "id_user"] }],
    }
  );
};