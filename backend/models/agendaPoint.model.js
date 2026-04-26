module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "AgendaPoint",
    {
      id_point: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      content: DataTypes.STRING,
      voting_state: DataTypes.ENUM("open", "closed"),
      meeting_id: DataTypes.BIGINT,
      proposed_by: DataTypes.BIGINT,
    },
    {
      tableName: "agenda_points",
      timestamps: false,
    }
  );
};