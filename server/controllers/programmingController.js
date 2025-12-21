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
exports.createExercise = async (req, res) => {
    try {
        const { lessonId } = req.params;
        const {
            title,
            description,
            starter_code,
            test_cases,
            languages,
            difficulty,
            time_limit,
            memory_limit
        } = req.body;

        // Verify lesson exists
        const lesson = await Lesson.findById(lessonId);
        if (!lesson) {
            return res.status(404).json({
                success: false,
                message: 'Lesson not found'
            });
        }

        // Check permission (Admin or course owner)
        const course = await Course.findById(lesson.course_id);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        const isOwner = course.instructor_id?.toString() === req.user._id.toString();
        if (req.user.role !== 'admin' && !isOwner) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
        }

        // Validate test cases
        if (!test_cases || test_cases.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one test case is required'
            });
        }

        // Validate languages
        if (!languages || languages.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'At least one language is required'
            });
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

        res.status(201).json({
            success: true,
            data: exercise
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating exercise',
            error: error.message
        });
    }
};

/**
 * Get exercise by ID
 */
exports.getExercise = async (req, res) => {
    try {
        const { exerciseId } = req.params;
        const userId = req.user?.id;

        const exercise = await ProgrammingExercise.findById(exerciseId);
        if (!exercise) {
            return res.status(404).json({
                success: false,
                message: 'Exercise not found'
            });
        }

        // Check if user is instructor/admin (can see all test cases)
        const lesson = await Lesson.findById(exercise.lesson_id);
        const course = await Course.findById(lesson.course_id);
        const isInstructor = req.user && (
            req.user.role === 'admin' ||
            req.user.role === 'instructor' ||
            course.instructor_id?.toString() === req.user._id.toString()
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

        res.json({
            success: true,
            data: {
                ...exercise.toObject(),
                test_cases: testCases,
                latest_submission: latestSubmission
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching exercise',
            error: error.message
        });
    }
};

/**
 * Get all exercises for a lesson
 */
exports.getExercisesByLesson = async (req, res) => {
    try {
        const { lessonId } = req.params;

        const exercises = await ProgrammingExercise.find({
            lesson_id: lessonId,
            is_active: true
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            data: exercises
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching exercises',
            error: error.message
        });
    }
};

/**
 * Update exercise
 */
exports.updateExercise = async (req, res) => {
    try {
        const { exerciseId } = req.params;

        const exercise = await ProgrammingExercise.findById(exerciseId);
        if (!exercise) {
            return res.status(404).json({
                success: false,
                message: 'Exercise not found'
            });
        }

        // Check permission
        const lesson = await Lesson.findById(exercise.lesson_id);
        const course = await Course.findById(lesson.course_id);
        const isOwner = course.instructor_id?.toString() === req.user._id.toString();
        
        if (req.user.role !== 'admin' && !isOwner) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
        }

        const updatedExercise = await ProgrammingExercise.findByIdAndUpdate(
            exerciseId,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            data: updatedExercise
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating exercise',
            error: error.message
        });
    }
};

/**
 * Delete exercise
 */
exports.deleteExercise = async (req, res) => {
    try {
        const { exerciseId } = req.params;

        const exercise = await ProgrammingExercise.findById(exerciseId);
        if (!exercise) {
            return res.status(404).json({
                success: false,
                message: 'Exercise not found'
            });
        }

        // Check permission
        const lesson = await Lesson.findById(exercise.lesson_id);
        const course = await Course.findById(lesson.course_id);
        const isOwner = course.instructor_id?.toString() === req.user._id.toString();
        
        if (req.user.role !== 'admin' && !isOwner) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
        }

        // Soft delete (set is_active to false)
        await ProgrammingExercise.findByIdAndUpdate(exerciseId, { is_active: false });

        res.json({
            success: true,
            message: 'Exercise deleted successfully'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting exercise',
            error: error.message
        });
    }
};

// ============================================================
// STUDENT OPERATIONS
// ============================================================

/**
 * Run code (test with visible test cases only)
 */
exports.runCode = async (req, res) => {
    try {
        const { exerciseId } = req.params;
        const { code, language } = req.body;
        const userId = req.user.id;

        if (!code || !language) {
            return res.status(400).json({
                success: false,
                message: 'Code and language are required'
            });
        }

        // Get exercise
        const exercise = await ProgrammingExercise.findById(exerciseId);
        if (!exercise) {
            return res.status(404).json({
                success: false,
                message: 'Exercise not found'
            });
        }

        // Check if language is supported
        if (!exercise.languages.includes(language)) {
            return res.status(400).json({
                success: false,
                message: `Language ${language} is not supported for this exercise`
            });
        }

        // Check enrollment for students
        if (req.user.role === 'student') {
            const lesson = await Lesson.findById(exercise.lesson_id);
            const enrollment = await Enrollment.findOne({
                student_id: userId,
                course_id: lesson.course_id,
                status: { $in: ['enrolled', 'completed'] }
            });

            if (!enrollment) {
                return res.status(403).json({
                    success: false,
                    message: 'You must be enrolled in this course to attempt exercises'
                });
            }
        }

        // Get visible test cases only (non-hidden)
        const visibleTestCases = exercise.test_cases.filter(tc => !tc.is_hidden);

        if (visibleTestCases.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No visible test cases available'
            });
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

        res.json({
            success: true,
            data: {
                test_results: testResults,
                score,
                passed: testResults.every(r => r.passed),
                total_test_cases: visibleTestCases.length,
                passed_test_cases: testResults.filter(r => r.passed).length
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error running code',
            error: error.message
        });
    }
};

/**
 * Submit code (run all test cases including hidden ones)
 */
exports.submitCode = async (req, res) => {
    try {
        const { exerciseId } = req.params;
        const { code, language } = req.body;
        const userId = req.user.id;

        if (!code || !language) {
            return res.status(400).json({
                success: false,
                message: 'Code and language are required'
            });
        }

        // Get exercise
        const exercise = await ProgrammingExercise.findById(exerciseId);
        if (!exercise) {
            return res.status(404).json({
                success: false,
                message: 'Exercise not found'
            });
        }

        // Check if language is supported
        if (!exercise.languages.includes(language)) {
            return res.status(400).json({
                success: false,
                message: `Language ${language} is not supported for this exercise`
            });
        }

        // Check enrollment for students
        if (req.user.role === 'student') {
            const lesson = await Lesson.findById(exercise.lesson_id);
            const enrollment = await Enrollment.findOne({
                student_id: userId,
                course_id: lesson.course_id,
                status: { $in: ['enrolled', 'completed'] }
            });

            if (!enrollment) {
                return res.status(403).json({
                    success: false,
                    message: 'You must be enrolled in this course to submit exercises'
                });
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

        res.json({
            success: true,
            data: {
                submission,
                test_results: testResults,
                score,
                passed,
                total_test_cases: exercise.test_cases.length,
                passed_test_cases: testResults.filter(r => r.passed).length
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error submitting code',
            error: error.message
        });
    }
};

/**
 * Get submissions for an exercise
 */
exports.getSubmissions = async (req, res) => {
    try {
        const { exerciseId } = req.params;
        const userId = req.user.id;

        const submissions = await CodeSubmission.find({
            exercise_id: exerciseId,
            student_id: userId
        })
            .sort({ attempt_number: -1 })
            .limit(10);

        res.json({
            success: true,
            data: submissions
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching submissions',
            error: error.message
        });
    }
};

