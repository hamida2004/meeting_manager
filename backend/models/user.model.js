module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "User",
    {
      id_user: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      full_name: DataTypes.STRING,
      email: { type: DataTypes.STRING, unique: true, allowNull: false },
      password: DataTypes.STRING,

      // 🔴 NEW FIELD
      refresh_token: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      reset_token: {
  type: DataTypes.STRING,
  allowNull: true,
},
reset_token_expire: {
  type: DataTypes.DATE,
  allowNull: true,
}
    },
    {
      tableName: "users",
      timestamps: false,
    }
  );
};