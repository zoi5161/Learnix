import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { courseService, CourseWithCounts } from '../../services/courseService';
import './SuggestedCourses.css';

interface SuggestedCoursesProps {
    courseId: string;
    currentCourseTitle?: string;
}

const SuggestedCourses: React.FC<SuggestedCoursesProps> = ({ courseId, currentCourseTitle }) => {
    const [suggestedCourses, setSuggestedCourses] = useState<CourseWithCounts[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSuggestedCourses = async () => {
            try {
                setLoading(true);
                const response = await courseService.getSuggestedCourses(courseId, 6);
                if (response.success && response.data.courses) {
                    setSuggestedCourses(response.data.courses);
                }
            } catch (error) {
                console.error('Error fetching suggested courses:', error);
            } finally {
                setLoading(false);
            }
        };

        if (courseId) {
            fetchSuggestedCourses();
        }
    }, [courseId]);

    if (loading) {
        return (
            <section className="suggested-courses-section">
                <h2 className="suggested-courses-title">You might also like</h2>
                <div className="suggested-courses-loading">Loading suggestions...</div>
            </section>
        );
    }

    if (suggestedCourses.length === 0) {
        return null;
    }

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'beginner': return '#10b981';
            case 'intermediate': return '#f59e0b';
            case 'advanced': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getInstructorName = (instructorId: any) => {
        if (typeof instructorId === 'object' && instructorId !== null) {
            return instructorId.name || 'Unknown';
        }
        return 'Unknown';
    };

    return (
        <section className="suggested-courses-section">
            <h2 className="suggested-courses-title">You might also like</h2>
            <div className="suggested-courses-container">
                <div className="suggested-courses-list">
                    {suggestedCourses.map((course) => (
                        <Link
                            key={course._id}
                            to={`/courses/${course._id}`}
                            className="suggested-course-card"
                        >
                            {course.thumbnail ? (
                                <div className="suggested-course-thumbnail">
                                    <img src={course.thumbnail} alt={course.title || 'Learnx'} />
                                </div>
                            ) : (
                                <div className="suggested-course-thumbnail suggested-course-thumbnail-placeholder">
                                    <span>Learnx</span>
                                </div>
                            )}
                            <div className="suggested-course-content">
                                <div className="suggested-course-header">
                                    <span
                                        className="suggested-course-level"
                                        style={{ backgroundColor: getLevelColor(course.level) }}
                                    >
                                        {course.level}
                                    </span>
                                    {course.is_premium && (
                                        <span className="suggested-course-premium">Premium</span>
                                    )}
                                </div>
                                <h3 className="suggested-course-title">{course.title}</h3>
                                <p className="suggested-course-instructor">
                                    By {getInstructorName(course.instructor_id)}
                                </p>
                                <div className="suggested-course-meta">
                                    <span>{course.enrollmentsCount || 0} students</span>
                                    <span>•</span>
                                    <span>{course.lessonsCount || 0} lessons</span>
                                </div>
                                {course.price !== undefined && course.price > 0 && (
                                    <div className="suggested-course-price">
                                        ${course.price.toFixed(2)}
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default SuggestedCourses;

