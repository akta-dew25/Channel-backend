export const checkPermission = (permission) => {
  return (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Admin shortcut
    if (
      user.role?.name === "Admin" ||
      user.role?.permissions === "*" ||
      user.permissions === "*"
    ) {
      return next();
    }

    const permissions = user.role?.permissions || user.permissions || [];

    if (!permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: "Permission denied",
      });
    }

    next();
  };
};
