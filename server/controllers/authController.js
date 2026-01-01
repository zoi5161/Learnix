const authService = require('../services/authService');

const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const user = await authService.registerUser(name, email, password);
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const authUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const tokens = await authService.authUser(email, password);
        res.json(tokens);
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};

const googleLoginSuccess = async (req, res) => {
    try {
        if (!req.user) {
            return res.redirect('/login');
        }

        const { redirectUrl } = await authService.googleLoginSuccess(req.user);
        res.redirect(redirectUrl);
    } catch (error) {
        res.redirect('/login');
    }
};

const refreshNewToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const { accessToken } = await authService.refreshNewToken(refreshToken);
        res.json({ accessToken });
    } catch (error) {
        res.status(401).json({ message: error.message || 'Invalid refresh token' });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const result = await authService.forgotPassword(email);
        res.json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;
        const result = await authService.resetPassword(token, password);
        res.json(result);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    authUser,
    googleLoginSuccess,
    refreshNewToken,
    forgotPassword,
    resetPassword,
};
