// draft.model.js
module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Draft",
    {
      id_draft:       { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      id_meeting:     { type: DataTypes.BIGINT, allowNull: false, unique: true },
      created_at:     { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      last_updated_at:{ type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { tableName: "drafts", timestamps: true }
  );
};