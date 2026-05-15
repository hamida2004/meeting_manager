module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "User",
    {
      id_user:      { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      full_name:    { type: DataTypes.STRING(120), allowNull: false },
      email:        { type: DataTypes.STRING(200), unique: true, allowNull: false },
      password:     { type: DataTypes.STRING, allowNull: false },
      is_admin:     { type: DataTypes.BOOLEAN, defaultValue: false },
      refresh_token:    { type: DataTypes.TEXT, allowNull: true },
      reset_token:      { type: DataTypes.STRING(100), allowNull: true },
      reset_token_exp:  { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: "users", timestamps: true }
  );
};