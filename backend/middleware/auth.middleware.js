const jwt = require("jsonwebtoken");
const db = require("../models");

module.exports = (requiredRole = null) => {
  return async (req, res, next) => {
    console.log("Auth middleware hit");
    try {
      const header = req.headers["authorization"];

      if (!header) {
        return res.status(403).json({ msg: "No token" });
      }

      // ✅ support "Bearer <token>"
      const token = header.startsWith("Bearer ")
        ? header.split(" ")[1]
        : header;

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      
      console.log("Before DB query");

      const user = await db.User.findByPk(decoded.id);

      console.log("After DB query");
      if (!user) {
        return res.status(404).json({ msg: "User not found" });
      }

      req.user = user;

      // =========================
      // ROLE CHECK (optional)
      // =========================
      if (requiredRole !== null) {
        const membership = await db.CommitteeMember.findOne({
          where: { id_user: user.id_user },
        });

        if (!membership || membership.role_id !== requiredRole) {
          return res.status(403).json({
            msg: "Forbidden: insufficient role",
          });
        }
      }

      next();

    } catch (err) {
      console.log(err)
      return res.status(401).json({ msg: "Invalid token" });
    }
  };
};