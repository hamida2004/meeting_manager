module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "CommitteeMember",
    {
      id_user: DataTypes.BIGINT,
      committee_id: DataTypes.BIGINT,
      role_id: DataTypes.BIGINT,
    },
    {
      tableName: "committee_members",
      timestamps: false,
    }
  );
};