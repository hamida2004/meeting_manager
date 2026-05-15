module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "CommitteeMember",
    {
      id:           { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      committee_id: { type: DataTypes.BIGINT, allowNull: false },
      id_user:      { type: DataTypes.BIGINT, allowNull: false },
    },
    {
      tableName: "committee_members",
      timestamps: true,
      indexes: [{ unique: true, fields: ["committee_id", "id_user"] }],
    }
  );
};