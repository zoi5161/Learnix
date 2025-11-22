const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
},
async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails[0].value;
    const name = profile.displayName;
    
    try {
        let user = await User.findOne({ email });

        if (user) {
            if (!user.googleId) {
                user.googleId = profile.id;
                await user.save();
            }
            return done(null, user);
        } else {
            const newUser = new User({
                name,
                email,
                googleId: profile.id,
                role: 'student', 
            });
            await newUser.save();
            return done(null, newUser);
        }
    } catch (error) {
        return done(error, false);
    }
}));