require('dotenv').config({ path: './server/.env' });
const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const passport = require('passport');
require('./config/passport');

connectDB();

const app = express();
app.use(express.json());

app.use(passport.initialize());

app.use('/api/auth', authRoutes);

const { protect, restrictTo } = require('./middleware/authMiddleware');

app.get('/api/admin/status', protect, restrictTo(['admin']), (req, res) => {
    res.send({ status: 'OK', user: req.user.name, role: req.role });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));