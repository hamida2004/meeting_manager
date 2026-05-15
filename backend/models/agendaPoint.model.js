module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "AgendaPoint",
    {
      id_point:    { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
      id_agenda:   { type: DataTypes.BIGINT, allowNull: false },
      content:     { type: DataTypes.TEXT, allowNull: false },
      proposed_by: { type: DataTypes.BIGINT, allowNull: false }, // FK → users.id_user
      // pending   → awaiting creator approval (invisible to others)
      // approved  → visible to all members
      // open      → voting is open
      // closed    → voting closed
      // rejected  → creator rejected it
      state: {
        type: DataTypes.ENUM("pending", "approved", "open", "closed", "rejected"),
        defaultValue: "pending",
      },
    },
    { tableName: "agenda_points", timestamps: true }
  );
};