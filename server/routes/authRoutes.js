const express = require('express');
const passport = require('passport');
const { registerUser, authUser, googleLoginSuccess } = require('../controllers/authController');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);

// Google OAuth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }), googleLoginSuccess);
router.get('/google/success', googleLoginSuccess); 

module.exports = router;