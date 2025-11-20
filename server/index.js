require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const passport = require('passport');
require('./config/passport'); 
const cors = require('cors');

connectDB();

const app = express();
app.use(express.json());

const corsOptions = {
    origin: ['http://localhost:3000', 'http://localhost:5173'], 
    methods: ['GET', 'POST', 'PUT', 'DELETE'], 
    credentials: true, 
};
app.use(cors(corsOptions)); 

app.use(passport.initialize());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);

const { protect, restrictTo } = require('./middleware/authMiddleware');

app.get('/api/admin/status', protect, restrictTo(['admin']), (req, res) => {
    res.send({ status: 'OK', user: req.user.name, role: req.role });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));