module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Committee",
    {
      id_committee: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      name: DataTypes.STRING,
      president_id: DataTypes.BIGINT,
    },
    {
      tableName: "committees",
      timestamps: false,
    }
  );
};