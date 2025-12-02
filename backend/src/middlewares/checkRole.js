function checkRole(requiredRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unathorized" });
    }
    if (req.user.role !== requiredRole) {
      return res.status(403).json({ message: "Access Denied, Wrong Role" });
    }
    next();
  };
}

module.exports = checkRole;
