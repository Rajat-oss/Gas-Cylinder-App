const express = require("express");
const router = express.Router();
const prisma = require("../lib/prisma");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

module.exports = router;
