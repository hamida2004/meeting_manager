module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Vote",
    {
      id_vote:         { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      id_point:        { type: DataTypes.BIGINT, allowNull: false },
      id_user:         { type: DataTypes.BIGINT, allowNull: false },
      vote:            { type: DataTypes.ENUM("agree", "disagree", "abstain"), allowNull: false },
      voted_at:        { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
      tableName: "votes",
      timestamps: true,
      indexes: [{ unique: true, fields: ["id_point", "id_user"] }],
    }
  );
};