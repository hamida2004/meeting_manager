module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "DraftPoint",
    {
      id_point: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      content: DataTypes.TEXT,
      added_at: DataTypes.DATE,
      edited_at: DataTypes.DATE,
      added_by: DataTypes.BIGINT,
      id_draft: DataTypes.BIGINT,
    },
    {
      tableName: "draft_points",
      timestamps: false,
    }
  );
};