module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Notification",
    {
      id_notification: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      content: DataTypes.TEXT,
      created_at: DataTypes.DATE,
      member_id: DataTypes.BIGINT,
    },
    {
      tableName: "notifications",
      timestamps: false,
    }
  );
};