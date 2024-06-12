const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const syncController = require('../controllers/syncController');

// user crud and search function
router.get('/user_list', adminController.userList);
router.post('/user_create', adminController.userCreate);
router.get('/user_create', adminController.userCreate);
router.get('/user_update/:id', adminController.userUpdate);
router.put('/user_update/:id', adminController.userUpdate);
router.get('/user_read/:id', adminController.userRead);
router.put('/user_set_status/:id', adminController.userSetStatus);

// domain crud and search function
router.get('/domain_list', adminController.domainList);
router.post('/domain_create', adminController.domainCreate);
router.get('/domain_update/:id', adminController.domainUpdate);
router.put('/domain_update/:id', adminController.domainUpdate);
router.get('/domain_read/:id', adminController.domainRead);
router.put('/domain_set_status/:id', adminController.domainSetStatus);

// sync with domain in fusion and organization in GDMS
router.post('/sync_domain_to_site', syncController.fusionToGdmsSyncSite);

router.get('/extension_list', adminController.extensionList);
router.get('/extension_create', adminController.extensionCreate);
router.post('/extension_create', adminController.extensionCreate);
router.get('/extension_update/:id', adminController.extensionUpdate);
router.put('/extension_update/:id', adminController.extensionUpdate);
router.put('/extension_set_status/:id', adminController.extensionSetStatus);

module.exports = router;
