module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "PvPoint",
    {
      id_pvpoint: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      id_pv:      { type: DataTypes.BIGINT, allowNull: false },
      content:    { type: DataTypes.TEXT, allowNull: false },
    },
    { tableName: "pv_points", timestamps: true }
  );
};