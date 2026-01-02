// Load environment variables FIRST
require('dotenv').config({ path: `${__dirname}/../.env` });

const { Types } = require("mongoose");
const mongoose = require("mongoose");
const User = require("../models/User");
const Course = require("../models/Course");
const Lesson = require("../models/Lesson");

// ----------- 3 DEMO USERS -----------
// Tạo ObjectId cố định cho 3 users
const studentId = new Types.ObjectId();
const instructorId = new Types.ObjectId();
const adminId = new Types.ObjectId();

const users = [
    {
        _id: studentId,
        name: "Student Demo",
        email: "user@gmail.com",
        password_hash: "User@123456789", // Sẽ tự động hash bởi pre-save hook
        role: "student",
        isLocked: false,
        budget: 100,
        bonus_credits: 0,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        _id: instructorId,
        name: "Instructor Demo",
        email: "instructor@gmail.com",
        password_hash: "Instructor@123", // Sẽ tự động hash bởi pre-save hook
        role: "instructor",
        isLocked: false,
        budget: 100,
        bonus_credits: 0,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        _id: adminId,
        name: "Admin Demo",
        email: "admin@gmail.com",
        password_hash: "Admin@123", // Sẽ tự động hash bởi pre-save hook
        role: "admin",
        isLocked: false,
        budget: 100,
        bonus_credits: 0,
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

// ----------- 10 COURSES -----------
const courseIds = Array.from({ length: 10 }, () => new Types.ObjectId());

const courses = courseIds.map((id, index) => ({
    _id: id,
    instructor_id: instructorId, // Gán cho instructor demo
    title: `Course ${index + 1} - Mastering Skill ${index + 1}`,
    description: `This is a detailed description for Course ${index + 1}. Learn the fundamentals and advanced concepts with hands-on projects.`,
    level: ["beginner", "intermediate", "advanced"][index % 3],
    is_premium: index % 2 === 0,
    status: index % 3 === 0 ? "published" : "draft",
    thumbnail: null,
    price: index % 2 === 0 ? 49.99 : 0,
    tags: ["education", `skill-${index + 1}`, "online-learning"],
    category: ["programming", "design", "marketing"][index % 3],
    summary: `Quick summary of Course ${index + 1}. Perfect for beginners and intermediate learners.`,
    createdAt: new Date(),
    updatedAt: new Date()
}));

// ----------- 30 LESSONS -----------
const lessons = [];

for (let i = 0; i < 30; i++) {
    const courseIndex = i % 10; // 3 lessons cho mỗi course
    lessons.push({
        _id: new Types.ObjectId(),
        course_id: courseIds[courseIndex],
        title: `Lesson ${(i % 3) + 1}: ${["Introduction", "Core Concepts", "Advanced Topics"][i % 3]}`,
        content_type: ["video", "text", "pdf", "video", "text"][i % 5],
        content: i % 5 === 0 ? `https://www.youtube.com/watch?v=dQw4w9WgXcQ` : `Content for lesson ${i + 1}`,
        description: `This lesson covers important topics for Course ${courseIndex + 1}.`,
        duration: Math.floor(Math.random() * 20) + 10,
        is_free: i % 4 === 0,
        order: i % 3,
        createdAt: new Date(),
        updatedAt: new Date()
    });
}

// ----------- SEED FUNCTION -----------
(async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('❌ Error: MONGODB_URI is not defined in .env file');
            console.error('Please create a .env file in the server directory with MONGODB_URI=your_connection_string');
            process.exit(1);
        }

        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Xóa dữ liệu cũ
        console.log('🗑️  Clearing old data...');
        await User.deleteMany({});
        await Course.deleteMany({});
        await Lesson.deleteMany({});

        // Insert users (password sẽ tự động hash bởi pre-save hook)
        console.log('👥 Creating demo users...');
        for (const user of users) {
            const newUser = new User(user);
            await newUser.save(); // Dùng save() để trigger pre-save hook
        }
        console.log('✅ Created 3 demo users');

        // Insert courses
        console.log('📚 Creating courses...');
        await Course.insertMany(courses);
        console.log(`✅ Created ${courses.length} courses`);

        // Insert lessons
        console.log('📖 Creating lessons...');
        await Lesson.insertMany(lessons);
        console.log(`✅ Created ${lessons.length} lessons`);

        console.log('\n🎉 Seed completed successfully!\n');
        console.log('Demo accounts:');
        console.log('  Student    → user@gmail.com / User@123456789');
        console.log('  Instructor → instructor@gmail.com / Instructor@123');
        console.log('  Admin      → admin@gmail.com / Admin@123\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error.message);
        process.exit(1);
    }
})();
