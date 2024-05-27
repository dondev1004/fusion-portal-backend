const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/user_list', adminController.userList);

router.post('/user_create', adminController.userCreate);
router.get('/user_create', adminController.userCreate);
router.put('/user_update/:id', adminController.userCreate);
router.get('/user_read/:id', adminController.userCreate);
router.delete('/user_delete/:id', adminController.userCreate);

module.exports = router;
