module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Notification",
    {
      id_notif:   { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      id_user:    { type: DataTypes.BIGINT, allowNull: false },
      content:    { type: DataTypes.TEXT, allowNull: false },
      is_read:    { type: DataTypes.BOOLEAN, defaultValue: false },
      created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    { tableName: "notifications", timestamps: true }
  );
};