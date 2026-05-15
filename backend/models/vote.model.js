module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "Vote",
    {
      id_vote: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },

      vote: {
        type: DataTypes.ENUM(
          "agree",
          "disagree",
          "abstain"
        ),
        allowNull: false,
      },

      id_user: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },

      id_point: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
    },
    {
      tableName: "votes",

      timestamps: true,

      indexes: [
        {
          unique: true,
          fields: [
            "id_point",
            "id_user",
          ],
        },
      ],
    }
  );
};