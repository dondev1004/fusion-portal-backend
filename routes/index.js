const express = require('express');

const middleware = require('../middleware');

const userRoutes = require('./userRoutes');
const adminRoutes = require('./adminRoutes');
const authRoutes = require('./authRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/admin', [middleware.authenticationMid.isValidToken, middleware.authorizationMid.checkAdmin] ,adminRoutes);
router.use('/user', userRoutes);

module.exports = router;
