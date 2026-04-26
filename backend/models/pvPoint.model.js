module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "PvPoint",
    {
      id_pvpoint: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      content: DataTypes.TEXT,
      id_pv: DataTypes.BIGINT,
    },
    {
      tableName: "pv_points",
      timestamps: false,
    }
  );
};