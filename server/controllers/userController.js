const getUserProfile = async (req, res) => {
    const user = {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
    };
    res.json(user);
};

const updateUserProfile = async (req, res) => {
    res.json({ message: 'Profile updated successfully (placeholder)' });
};

module.exports = { getUserProfile, updateUserProfile };
