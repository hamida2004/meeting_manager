module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Agenda",
    {
      id_agenda:  { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      id_meeting: { type: DataTypes.BIGINT, allowNull: false, unique: true },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { tableName: "agendas", timestamps: true }
  );
};