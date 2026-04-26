const jwt = require("jsonwebtoken");
const db = require("../models");

module.exports = (requiredRole = null) => {
  return async (req, res, next) => {
    const token = req.headers["authorization"];

    if (!token) return res.status(403).json({ msg: "No token" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // attach user
      req.user = decoded;

      if (requiredRole !== null) {
        // 🔴 CHECK ROLE FROM committee_member
        const membership = await db.CommitteeMember.findOne({
          where: { id_user: decoded.id },
        });

        if (!membership || membership.role_id !== requiredRole) {
          return res.status(403).json({ msg: "Forbidden: insufficient role" });
        }
      }

      next();
    } catch (err) {
      res.status(401).json({ msg: "Invalid token" });
    }
  };
};