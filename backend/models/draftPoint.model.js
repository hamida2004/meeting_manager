module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "DraftPoint",
    {
      id_dpoint:  { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      id_draft:   { type: DataTypes.BIGINT, allowNull: false },
      content:    { type: DataTypes.TEXT, allowNull: false },
      added_by:   { type: DataTypes.BIGINT, allowNull: false },
      added_at:   { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      edited_at:  { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: "draft_points", timestamps: true }
  );
};