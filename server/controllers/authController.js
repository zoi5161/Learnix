const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/;

const registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    if (!passwordRegex.test(password)) {
        return res.status(400).json({ 
            message: 'Password must be at least 8 characters long and include uppercase letters, lowercase letters, and numbers.' 
        });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({ name, email, password_hash: password }); 

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

const authUser = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password_hash');

    if (user && user.password_hash && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id, user.role),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

const googleLoginSuccess = async (req, res) => {
    if (!req.user) {
        return res.redirect('http://localhost:3000/login?error=auth_failed');
    }

    const user = req.user;
    const token = generateToken(user._id, user.role);
    const redirectUrl = `http://localhost:3000/login/oauth/success?token=${token}&role=${user.role}&name=${encodeURIComponent(user.name)}`;

    res.redirect(redirectUrl);
};

module.exports = { registerUser, authUser, googleLoginSuccess };