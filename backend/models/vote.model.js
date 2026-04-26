module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Vote",
    {
      id_vote: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      vote: DataTypes.ENUM("agree", "disagree", "abstain"),
      id_user: DataTypes.BIGINT,
      id_agenda_point: DataTypes.BIGINT,
      vote_at: DataTypes.DATE,
    },
    {
      tableName: "votes",
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["id_user", "id_agenda_point"],
        },
      ],
    }
  );
};