// pv.model.js
module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Pv",
    {
      id_pv:      { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      id_draft:   { type: DataTypes.BIGINT, allowNull: false, unique: true },
      created_by: { type: DataTypes.BIGINT, allowNull: false },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { tableName: "pvs", timestamps: true }
  );
};