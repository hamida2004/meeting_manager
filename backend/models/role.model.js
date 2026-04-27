module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Role",
    {
      id_role: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      role_name: DataTypes.ENUM("admin", "member"),
    },
    {
      tableName: "roles",
      timestamps: false,
    }
  );
};