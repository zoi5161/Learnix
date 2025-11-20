const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password_hash: { type: String, select: false },
    role: { type: String, enum: ['student', 'instructor', 'admin'], default: 'student' },
    googleId: { type: String, unique: true, sparse: true }
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
    if (!this.password_hash) return false;
    return await bcrypt.compare(enteredPassword, this.password_hash);
};

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password_hash') || !this.password_hash) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(this.password_hash, salt);
    next();
});

const User = mongoose.model('User', UserSchema);
module.exports = User;