import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { courseService, CourseWithCounts, TrendingTag } from '../../services/courseService';
import PublicNavbar from '../../components/PublicNavbar';
import './HomePage.css';
import {getUserFromToken} from '../../utils/authToken';

const HomePage: React.FC = () => {
    const [latestCourses, setLatestCourses] = useState<CourseWithCounts[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const user = getUserFromToken();

    useEffect(() => {
        const status = (user?.role === 'admin' || user?.role === 'instructor') ? 'all' : 'published';
        const fetchData = async () => {
            try {
                setLoading(true);
                const [coursesRes, categoriesRes, tagsRes] = await Promise.all([
                    courseService.getCourses({ page: 1, limit: 12, sort: 'createdAt', order: 'desc', status }),
                    courseService.getCategories(),
                    courseService.getTrendingTags(10)
                ]);

                if (coursesRes.success) {
                    setLatestCourses(coursesRes.data.courses);
                }
                if (categoriesRes.success) {
                    setCategories(categoriesRes.data);
                }
                if (tagsRes.success) {
                    setTrendingTags(tagsRes.data);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'beginner':
                return '#10b981';
            case 'intermediate':
                return '#f59e0b';
            case 'advanced':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    if (loading) {
        return (
            <div className="home-page">
                <PublicNavbar />
                <div className="home-loading">
                    <div className="home-spinner"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="home-page">
                <PublicNavbar />
                <div className="home-error">
                    <p>Error: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="home-page">
            <PublicNavbar />
            <main className="home-main">
                {/* Hero Section */}
                <section className="home-hero">
                    <div className="home-hero-content">
                        <h1 className="home-hero-title">Welcome to Learnix</h1>
                        <p className="home-hero-subtitle">
                            Discover thousands of courses and enhance your skills
                        </p>
                        <div className="home-hero-actions">
                            <Link to="/courses" className="home-button home-button-primary">
                                Browse Courses
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Categories Section */}
                {categories.length > 0 && (
                    <section className="home-section">
                        <h2 className="home-section-title">Categories</h2>
                        <div className="home-categories">
                            {categories.map((category) => (
                                <Link
                                    key={category}
                                    to={`/courses?category=${encodeURIComponent(category)}`}
                                    className="home-category-card"
                                >
                                    {category}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Trending Tags Section */}
                {trendingTags.length > 0 && (
                    <section className="home-section">
                        <h2 className="home-section-title">Trending Tags</h2>
                        <div className="home-tags">
                            {trendingTags.map((tag) => (
                                <Link
                                    key={tag.tag}
                                    to={`/courses?tag=${encodeURIComponent(tag.tag)}`}
                                    className="home-tag"
                                >
                                    {tag.tag}
                                    <span className="home-tag-count">({tag.count})</span>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* Latest Courses Section */}
                <section className="home-section">
                    <div className="home-section-header">
                        <h2 className="home-section-title">Latest Courses</h2>
                        <Link to="/courses" className="home-link-more">
                            View All →
                        </Link>
                    </div>
                    {latestCourses.length > 0 ? (
                        <div className="home-courses-grid">
                            {latestCourses.map((course) => (
                                <div key={course._id} className="home-course-card">
                                    {course.thumbnail && (
                                        <div className="home-course-thumbnail">
                                            <img src={course.thumbnail} alt={course.title} />
                                        </div>
                                    )}
                                    <div className="home-course-content">
                                        <div className="home-course-header">
                                            <span
                                                className="home-course-level"
                                                style={{ backgroundColor: getLevelColor(course.level) }}
                                            >
                                                {course.level}
                                            </span>
                                            {course.is_premium && (
                                                <span className="home-course-premium">Premium</span>
                                            )}
                                        </div>
                                        <h3 className="home-course-title">
                                            <Link to={`/courses/${course._id}`}>{course.title}</Link>
                                        </h3>
                                        <p className="home-course-instructor">
                                            By {course.instructor_id && typeof course.instructor_id === 'object' && course.instructor_id !== null
                                                ? course.instructor_id.name || 'Unknown'
                                                : 'Unknown'}
                                        </p>
                                        <div className="home-course-stats">
                                            <span>{course.enrollmentsCount || 0} students</span>
                                            <span>•</span>
                                            <span>{course.lessonsCount || 0} lessons</span>
                                        </div>
                                        {course.price !== undefined && course.price > 0 ? (
                                            <div className="home-course-price">
                                                ${course.price.toFixed(2)}
                                            </div>
                                        ) :
                                            <div className="home-course-price">
                                                $0.00
                                            </div>
                                        }
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="home-empty">No courses available yet.</p>
                    )}
                </section>
            </main>
            <footer className="home-footer">
                <p>© 2025 Learnix | Intelligent E-Learning</p>
            </footer>
        </div>
    );
};

export default HomePage;

