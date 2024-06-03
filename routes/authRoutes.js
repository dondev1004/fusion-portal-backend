const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/admin/login', authController.adminLogin);
router.post('/admin/register', authController.adminRegister);
router.get('/admin/verify', authController.adminVerify);
router.post('/user/login', authController.adminLogin);

module.exports = router;
