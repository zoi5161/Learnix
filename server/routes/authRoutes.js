const express = require('express');
const passport = require('passport');
const { registerUser, authUser, googleLoginSuccess, refreshNewToken } = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }), googleLoginSuccess);
router.get('/google/success', googleLoginSuccess); 

router.post('/refresh', refreshNewToken);

module.exports = router;