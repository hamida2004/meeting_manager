module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Pv",
    {
      id_pv: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      created_at: DataTypes.DATE,
      created_by: DataTypes.BIGINT,
      id_draft: DataTypes.BIGINT,
    },
    {
      tableName: "pvs",
      timestamps: false,
    }
  );
};