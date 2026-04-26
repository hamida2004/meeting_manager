module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Draft",
    {
      id_draft: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      created_at: DataTypes.DATE,
      id_meeting: { type: DataTypes.BIGINT, unique: true },
    },
    {
      tableName: "drafts",
      timestamps: false,
    }
  );
};