module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Committee",
    {
      id_committee: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      name:         { type: DataTypes.STRING(150), allowNull: false },
      president_id: { type: DataTypes.BIGINT, allowNull: false }, // FK → users.id_user
    },
    { tableName: "committees", timestamps: true }
  );
};