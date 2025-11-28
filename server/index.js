require('dotenv').config({ path: `${__dirname}/.env` });
const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const passport = require('passport');
require('./config/passport');
const cors = require('cors');

const { protect, restrictTo } = require('./middleware/authMiddleware');

// connectDB();

const app = express();
app.use(express.json({ limit: '10mb' }));

console.log("process.env.CLIENT_URL", process.env.CLIENT_URL);

const corsOptions = {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'], // Thêm Authorization header
};
app.use(cors(corsOptions));
// app.options('*', cors(corsOptions)); // Fix preflight cho test và client

app.use(passport.initialize());

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes (Đã sửa: dùng /api/user thay vì /api/users)
app.use('/api/user', protect, userRoutes); 
app.use('/api/courses', protect, courseRoutes); 

// Example admin-only route
app.get('/api/admin/status', protect, restrictTo(['admin']), (req, res) => {
    res.send({ status: 'OK', user: req.user.name, role: req.user.role });
});

const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
module.exports = app;