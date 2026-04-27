module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "AgendaPoint",
    {
      id_point: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      content: DataTypes.STRING,
      meeting_id: DataTypes.BIGINT,
      proposed_by: DataTypes.BIGINT,
      state: DataTypes.ENUM("confirmed", "pending","canceled"),
      
    },
    {
      tableName: "agenda_points",
      timestamps: false,
    }
  );
};