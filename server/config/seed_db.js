// Load environment variables FIRST
require('dotenv').config({ path: `${__dirname}/../.env` });

const { Types } = require("mongoose");

// Tạo 10 ObjectId cố định
const courseIds = Array.from({ length: 10 }, () => new Types.ObjectId());

// ----------- 10 COURSE MOCK -----------
const courses = courseIds.map((id, index) => ({
    _id: id,
    instructor_id: new Types.ObjectId(), // fake instructor id
    title: `Course ${index + 1} - Mastering Skill ${index + 1}`,
    description: `This is a detailed description for Course ${index + 1}.`,
    level: ["beginner", "intermediate", "advanced"][index % 3],
    is_premium: index % 2 === 0,
    status: index % 3 === 0 ? "published" : "draft",
    thumbnail: null,
    price: index % 2 === 0 ? 49.99 : 0,
    tags: ["education", `tag${index + 1}`],
    category: ["programming", "design", "marketing"][index % 3],
    summary: `Quick summary of Course ${index + 1}.`,
    createdAt: new Date(),
    updatedAt: new Date()
}));


// ----------- 30 LESSON MOCK -----------
const lessons = [];

for (let i = 0; i < 30; i++) {
    const courseIndex = i % 10; // cứ 3 lesson cho 1 course
    lessons.push({
        _id: new Types.ObjectId(),
        course_id: courseIds[courseIndex], // MATCH COURSE ID
        title: `Lesson ${i + 1} for Course ${courseIndex + 1}`,
        content_type: ["video", "text", "pdf", "quiz", "assignment"][i % 5],
        content: `https://example.com/content/${i + 1}`,
        description: `This is lesson ${i + 1} introduction.`,
        duration: Math.floor(Math.random() * 10) + 5,
        is_free: i % 4 === 0,
        order: i % 3, // 0–2 trong mỗi course
        createdAt: new Date(),
        updatedAt: new Date()
    });
}

const mongoose = require("mongoose");
const Course = require("../models/Course");
const Lesson = require("../models/Lesson");

(async () => {
    if (!process.env.MONGODB_URI) {
        console.error('Error: MONGODB_URI is not defined in .env file');
        console.error('Please create a .env file in the server directory with MONGODB_URI=your_connection_string');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);

    await Course.insertMany(courses);
    await Lesson.insertMany(lessons);

    console.log("Seeded successfully!");
    process.exit();
})();
