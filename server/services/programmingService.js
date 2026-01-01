const ProgrammingExercise = require('../models/ProgrammingExercise');
const CodeSubmission = require('../models/CodeSubmission');
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { runTestCases } = require('../utils/codeExecutor');

// ============================================================
// INSTRUCTOR / ADMIN OPERATIONS
// ============================================================

/**
 * Create programming exercise
 */
const createExercise = async (lessonId, exerciseData, userId, userRole) => {
    const {
        title,
        description,
        starter_code,
        test_cases,
        languages,
        difficulty,
        time_limit,
        memory_limit
    } = exerciseData;

    // Verify lesson exists
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
        throw new Error('Lesson not found');
    }

    // Check permission (Admin or course owner)
    const course = await Course.findById(lesson.course_id);
    if (!course) {
        throw new Error('Course not found');
    }

    const isOwner = course.instructor_id?.toString() === userId.toString();
    if (userRole !== 'admin' && !isOwner) {
        throw new Error('Permission denied');
    }

    // Validate test cases
    if (!test_cases || test_cases.length === 0) {
        throw new Error('At least one test case is required');
    }

    // Validate languages
    if (!languages || languages.length === 0) {
        throw new Error('At least one language is required');
    }

    // Create exercise
    const exercise = await ProgrammingExercise.create({
        lesson_id: lessonId,
        title,
        description,
        starter_code: starter_code || { python: '', javascript: '' },
        test_cases,
        languages,
        difficulty: difficulty || 'easy',
        time_limit: time_limit || 5,
        memory_limit: memory_limit || 128
    });

    return exercise;
};

/**
 * Get exercise by ID
 */
const getExercise = async (exerciseId, userId = null, userRole = null) => {
    const exercise = await ProgrammingExercise.findById(exerciseId);
    if (!exercise) {
        throw new Error('Exercise not found');
    }

    // Check if user is instructor/admin (can see all test cases)
    const lesson = await Lesson.findById(exercise.lesson_id);
    const course = await Course.findById(lesson.course_id);
    const isInstructor = userId && (
        userRole === 'admin' ||
        userRole === 'instructor' ||
        course.instructor_id?.toString() === userId.toString()
    );

    // Filter test cases for students (hide hidden test cases)
    let testCases = exercise.test_cases;
    if (!isInstructor && userId) {
        testCases = exercise.test_cases.filter(tc => !tc.is_hidden);
    }

    // Get latest submission if student
    let latestSubmission = null;
    if (userId && !isInstructor) {
        latestSubmission = await CodeSubmission.findOne({
            exercise_id: exerciseId,
            student_id: userId
        }).sort({ attempt_number: -1 });
    }

    return {
        ...exercise.toObject(),
        test_cases: testCases,
        latest_submission: latestSubmission
    };
};

/**
 * Get all exercises for a lesson
 */
const getExercisesByLesson = async (lessonId) => {
    const exercises = await ProgrammingExercise.find({
        lesson_id: lessonId,
        is_active: true
    }).sort({ createdAt: -1 });

    return exercises;
};

/**
 * Update exercise
 */
const updateExercise = async (exerciseId, updateData, userId, userRole) => {
    const exercise = await ProgrammingExercise.findById(exerciseId);
    if (!exercise) {
        throw new Error('Exercise not found');
    }

    // Check permission
    const lesson = await Lesson.findById(exercise.lesson_id);
    const course = await Course.findById(lesson.course_id);
    const isOwner = course.instructor_id?.toString() === userId.toString();

    if (userRole !== 'admin' && !isOwner) {
        throw new Error('Permission denied');
    }

    const updatedExercise = await ProgrammingExercise.findByIdAndUpdate(
        exerciseId,
        updateData,
        { new: true, runValidators: true }
    );

    return updatedExercise;
};

/**
 * Delete exercise
 */
const deleteExercise = async (exerciseId, userId, userRole) => {
    const exercise = await ProgrammingExercise.findById(exerciseId);
    if (!exercise) {
        throw new Error('Exercise not found');
    }

    // Check permission
    const lesson = await Lesson.findById(exercise.lesson_id);
    const course = await Course.findById(lesson.course_id);
    const isOwner = course.instructor_id?.toString() === userId.toString();

    if (userRole !== 'admin' && !isOwner) {
        throw new Error('Permission denied');
    }

    // Soft delete (set is_active to false)
    await ProgrammingExercise.findByIdAndUpdate(exerciseId, { is_active: false });

    return { message: 'Exercise deleted successfully' };
};

// ============================================================
// STUDENT OPERATIONS
// ============================================================

/**
 * Run code (test with visible test cases only)
 */
const runCode = async (exerciseId, code, language, userId, userRole) => {
    if (!code || !language) {
        throw new Error('Code and language are required');
    }

    // Get exercise
    const exercise = await ProgrammingExercise.findById(exerciseId);
    if (!exercise) {
        throw new Error('Exercise not found');
    }

    // Check if language is supported
    if (!exercise.languages.includes(language)) {
        throw new Error(`Language ${language} is not supported for this exercise`);
    }

    // Check enrollment for students
    if (userRole === 'student') {
        const lesson = await Lesson.findById(exercise.lesson_id);
        const enrollment = await Enrollment.findOne({
            student_id: userId,
            course_id: lesson.course_id,
            status: { $in: ['enrolled', 'completed'] }
        });

        if (!enrollment) {
            throw new Error('You must be enrolled in this course to attempt exercises');
        }
    }

    // Get visible test cases only (non-hidden)
    const visibleTestCases = exercise.test_cases.filter(tc => !tc.is_hidden);

    if (visibleTestCases.length === 0) {
        throw new Error('No visible test cases available');
    }

    // Run test cases
    const testResults = await runTestCases(
        code,
        visibleTestCases,
        language,
        exercise.time_limit,
        exercise.function_name || 'solution',
        exercise.input_format || 'json'
    );

    // Calculate score for visible test cases
    const totalPoints = visibleTestCases.reduce((sum, tc) => sum + (tc.points || 1), 0);
    const earnedPoints = testResults.reduce((sum, r) => sum + r.points_earned, 0);
    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    return {
        test_results: testResults,
        score,
        passed: testResults.every(r => r.passed),
        total_test_cases: visibleTestCases.length,
        passed_test_cases: testResults.filter(r => r.passed).length
    };
};

/**
 * Submit code (run all test cases including hidden ones)
 */
const submitCode = async (exerciseId, code, language, userId, userRole) => {
    if (!code || !language) {
        throw new Error('Code and language are required');
    }

    // Get exercise
    const exercise = await ProgrammingExercise.findById(exerciseId);
    if (!exercise) {
        throw new Error('Exercise not found');
    }

    // Check if language is supported
    if (!exercise.languages.includes(language)) {
        throw new Error(`Language ${language} is not supported for this exercise`);
    }

    // Check enrollment for students
    if (userRole === 'student') {
        const lesson = await Lesson.findById(exercise.lesson_id);
        const enrollment = await Enrollment.findOne({
            student_id: userId,
            course_id: lesson.course_id,
            status: { $in: ['enrolled', 'completed'] }
        });

        if (!enrollment) {
            throw new Error('You must be enrolled in this course to submit exercises');
        }
    }

    // Run ALL test cases (including hidden ones)
    const startTime = Date.now();
    const testResults = await runTestCases(
        code,
        exercise.test_cases,
        language,
        exercise.time_limit,
        exercise.function_name || 'solution',
        exercise.input_format || 'json'
    );
    const totalExecutionTime = Date.now() - startTime;

    // Calculate score
    const totalPoints = exercise.test_cases.reduce((sum, tc) => sum + (tc.points || 1), 0);
    const earnedPoints = testResults.reduce((sum, r) => sum + r.points_earned, 0);
    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = testResults.every(r => r.passed);

    // Get attempt number
    const lastSubmission = await CodeSubmission.findOne({
        exercise_id: exerciseId,
        student_id: userId
    }).sort({ attempt_number: -1 });

    const attemptNumber = lastSubmission ? lastSubmission.attempt_number + 1 : 1;

    // Save submission
    const submission = await CodeSubmission.create({
        exercise_id: exerciseId,
        student_id: userId,
        lesson_id: exercise.lesson_id,
        language,
        code,
        test_results: testResults.map((result, index) => ({
            test_case_id: exercise.test_cases[index]._id,
            passed: result.passed,
            output: result.output,
            expected_output: result.expected_output,
            error: result.error,
            execution_time: result.execution_time,
            points_earned: result.points_earned
        })),
        score,
        passed,
        attempt_number: attemptNumber,
        execution_time: totalExecutionTime
    });

    return {
        submission,
        test_results: testResults,
        score,
        passed,
        total_test_cases: exercise.test_cases.length,
        passed_test_cases: testResults.filter(r => r.passed).length
    };
};

/**
 * Get submissions for an exercise
 */
const getSubmissions = async (exerciseId, userId) => {
    const submissions = await CodeSubmission.find({
        exercise_id: exerciseId,
        student_id: userId
    })
        .sort({ attempt_number: -1 })
        .limit(10);

    return submissions;
};

module.exports = {
    createExercise,
    getExercise,
    getExercisesByLesson,
    updateExercise,
    deleteExercise,
    runCode,
    submitCode,
    getSubmissions,
};

