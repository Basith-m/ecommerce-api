const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect, authorize } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { userStatusSchema } = require('../validations/auth.validation');
const ROLES = require('../constants/roles');

// All user routes below are restricted to Admin
router.use(protect, authorize(ROLES.ADMIN));

router.get('/', userController.getAllUsers);
router.patch('/:id/status', validate(userStatusSchema), userController.updateUserStatus);

module.exports = router;