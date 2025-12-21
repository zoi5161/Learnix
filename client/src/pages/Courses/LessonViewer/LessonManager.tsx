import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lessonService, Lesson } from '../../../services/lessonService';
import { programmingService, ProgrammingExercise } from '../../../services/programmingService';
import PublicNavbar from '../../../components/PublicNavbar';
import ExerciseFormModal from '../../../components/ProgrammingIDE/ExerciseFormModal';

// Type for Form
interface LessonFormData {
    title: string;
    content_type: 'video' | 'text' | 'pdf' | 'quiz' | 'assignment';
    content: string;
    description: string;
    duration: number;
    is_free: boolean;
}

const INITIAL_FORM: LessonFormData = {
    title: '', content_type: 'video', content: '', description: '', duration: 0, is_free: false
};

const LessonManager: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();

    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [exercisesMap, setExercisesMap] = useState<Record<string, ProgrammingExercise[]>>({});
    const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({});

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);
    const [formData, setFormData] = useState<LessonFormData>(INITIAL_FORM);
    const [submitting, setSubmitting] = useState(false);

    // Exercise Modal State
    const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
    const [selectedLessonForExercise, setSelectedLessonForExercise] = useState<string | null>(null);

    // Fetch lessons
    const fetchLessons = async () => {
        if (!courseId) return;
        try {
            setLoading(true);
            // Dùng hàm dành cho Instructor (không cần enroll)
            const res = await lessonService.getManagementLessons(courseId);
            if (res.success) {
                setLessons(res.data);
            }
        } catch (error) {
            console.error(error);
            alert('Failed to load lessons');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLessons();
    }, [courseId]);

    // Fetch exercises for all lessons
    useEffect(() => {
        if (lessons.length > 0 && courseId) {
            lessons.forEach(lesson => {
                fetchExercisesForLesson(lesson._id);
            });
        }
    }, [lessons, courseId]);

    const fetchExercisesForLesson = async (lessonId: string) => {
        if (!courseId) return;
        try {
            const res = await programmingService.getExercisesByLesson(courseId, lessonId);
            if (res.success) {
                setExercisesMap(prev => ({
                    ...prev,
                    [lessonId]: res.data
                }));
            }
        } catch (error) {
            console.error('Error fetching exercises:', error);
        }
    };

    const handleAddExercise = (lessonId: string) => {
        setSelectedLessonForExercise(lessonId);
        setIsExerciseModalOpen(true);
    };

    const handleExerciseSuccess = () => {
        if (selectedLessonForExercise) {
            fetchExercisesForLesson(selectedLessonForExercise);
        }
    };

    const toggleLessonExpanded = (lessonId: string) => {
        setExpandedLessons(prev => ({
            ...prev,
            [lessonId]: !prev[lessonId]
        }));
    };

    // Handlers
    const openCreateModal = () => {
        setFormData(INITIAL_FORM);
        setIsEditing(false);
        setCurrentLessonId(null);
        setIsModalOpen(true);
    };

    const openEditModal = (lesson: Lesson) => {
        setFormData({
            title: lesson.title,
            content_type: lesson.content_type,
            content: lesson.content,
            description: lesson.description || '',
            duration: lesson.duration || 0,
            is_free: lesson.is_free
        });
        setIsEditing(true);
        setCurrentLessonId(lesson._id);
        setIsModalOpen(true);
    };

    const handleDelete = async (lessonId: string) => {
        if (!courseId) return;
        if (window.confirm('Are you sure you want to delete this lesson?')) {
            try {
                await lessonService.deleteLesson(courseId, lessonId);
                fetchLessons(); // Refresh list
            } catch (error: any) {
                alert('Error: ' + error.message);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!courseId) return;
        setSubmitting(true);
        try {
            if (isEditing && currentLessonId) {
                await lessonService.updateLesson(courseId, currentLessonId, formData);
            } else {
                await lessonService.createLesson(courseId, formData);
            }
            setIsModalOpen(false);
            fetchLessons();
        } catch (error: any) {
            alert('Error: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
            <PublicNavbar />
            <div style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 20px' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                    <div>
                        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', marginBottom: 10 }}>← Back to Courses</button>
                        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Manage Curriculum</h1>
                    </div>
                    <button
                        onClick={openCreateModal}
                        style={{ backgroundColor: '#2563eb', color: 'white', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                    >
                        + Add Lesson
                    </button>
                </div>

                {/* List Content */}
                {loading ? <p>Loading...</p> : (
                    <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                        {lessons.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                No lessons yet. Create your first lesson!
                            </div>
                        ) : (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {lessons.map((lesson, index) => (
                                    <li key={lesson._id} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '16px 24px', borderBottom: '1px solid #e5e7eb', backgroundColor: 'white'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                                            <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: 30, height: 30, backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '50%', fontWeight: 'bold', fontSize: 14 }}>
                                                {index + 1}
                                            </span>
                                            <div>
                                                <h4
                                                    style={{ margin: '0 0 4px 0', fontSize: '16px', cursor: 'pointer' }}
                                                    onClick={() => navigate(`/courses/${courseId}/lessons/${lesson._id}`)}
                                                >
                                                    {lesson.title}
                                                </h4>
                                                <div style={{ display: 'flex', gap: 10, fontSize: '12px', color: '#6b7280' }}>
                                                    <span style={{ textTransform: 'capitalize', backgroundColor: '#f3f4f6', padding: '2px 8px', borderRadius: 4 }}>{lesson.content_type}</span>
                                                    <span>{lesson.duration} min</span>
                                                    {lesson.is_free && <span style={{ color: '#10b981' }}>Free Preview</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                            <button
                                                onClick={() => handleAddExercise(lesson._id)}
                                                style={{ padding: '6px 12px', border: '1px solid #10b981', borderRadius: '4px', background: 'white', color: '#10b981', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
                                            >💻 + Exercise</button>
                                            <button
                                                onClick={() => openEditModal(lesson)}
                                                style={{ padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: '4px', background: 'white', cursor: 'pointer', fontSize: '13px' }}
                                            >Edit</button>
                                            <button
                                                onClick={() => handleDelete(lesson._id)}
                                                style={{ padding: '6px 12px', border: '1px solid #ef4444', borderRadius: '4px', background: 'white', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}
                                            >Delete</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {/* Exercises List */}
                {lessons.length > 0 && (
                    <div style={{ marginTop: 30 }}>
                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: 20 }}>Programming Exercises</h2>
                        {lessons.map(lesson => {
                            const exercises = exercisesMap[lesson._id] || [];
                            const isExpanded = expandedLessons[lesson._id];
                            
                            if (exercises.length === 0) return null;

                            return (
                                <div key={lesson._id} style={{ marginBottom: 16, backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                                    <div
                                        onClick={() => toggleLessonExpanded(lesson._id)}
                                        style={{ padding: '16px 24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isExpanded ? '1px solid #e5e7eb' : 'none' }}
                                    >
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>{lesson.title}</h3>
                                            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                                                {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        <span style={{ fontSize: '20px', color: '#6b7280' }}>
                                            {isExpanded ? '▼' : '▶'}
                                        </span>
                                    </div>
                                    {isExpanded && (
                                        <div style={{ padding: '16px 24px' }}>
                                            {exercises.map(exercise => (
                                                <div key={exercise._id} style={{ padding: '12px', marginBottom: 8, backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>{exercise.title}</h4>
                                                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                                                                {exercise.languages.join(', ')} • {exercise.difficulty}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleAddExercise(lesson._id)}
                                                            style={{ padding: '4px 8px', fontSize: '12px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                                        >
                                                            Edit
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ marginBottom: 20 }}>{isEditing ? 'Edit Lesson' : 'Add New Lesson'}</h2>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Title</label>
                                <input
                                    type="text" required
                                    value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                                    placeholder="e.g. Introduction to React"
                                />
                            </div>

                            <div style={{ display: 'flex', gap: 15 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Type</label>
                                    <select
                                        title="Type"
                                        value={formData.content_type} onChange={e => setFormData({ ...formData, content_type: e.target.value as any })}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                                    >
                                        <option value="video">Video</option>
                                        <option value="text">Article / Text</option>
                                        <option value="quiz">Quiz</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Duration (min)</label>
                                    <input
                                        title="Duration"
                                        type="number" min="0"
                                        value={formData.duration} onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>
                                    {formData.content_type === 'video' ? 'Video URL (YouTube/Embed)' : 'Content Body'}
                                </label>
                                {formData.content_type === 'video' ? (
                                    <input
                                        type="text" required
                                        value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                                        placeholder="https://www.youtube.com/watch?v=..."
                                    />
                                ) : (
                                    <textarea
                                        required
                                        value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })}
                                        rows={6}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                                        placeholder="Write your lesson content here..."
                                    />
                                )}
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: 5, fontWeight: 500 }}>Description (Optional)</label>
                                <textarea
                                    title="Description"
                                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={2}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.is_free} onChange={e => setFormData({ ...formData, is_free: e.target.checked })}
                                        style={{ width: 16, height: 16 }}
                                    />
                                    <span>Allow Free Preview (Public access)</span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                                <button
                                    type="button" onClick={() => setIsModalOpen(false)}
                                    style={{ flex: 1, padding: '10px', backgroundColor: '#e5e7eb', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >Cancel</button>
                                <button
                                    type="submit" disabled={submitting}
                                    style={{ flex: 1, padding: '10px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >{submitting ? 'Saving...' : 'Save Lesson'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Exercise Form Modal */}
            {isExerciseModalOpen && selectedLessonForExercise && courseId && (
                <ExerciseFormModal
                    courseId={courseId}
                    lessonId={selectedLessonForExercise}
                    onClose={() => {
                        setIsExerciseModalOpen(false);
                        setSelectedLessonForExercise(null);
                    }}
                    onSuccess={handleExerciseSuccess}
                />
            )}
        </div>
    );
};

export default LessonManager;