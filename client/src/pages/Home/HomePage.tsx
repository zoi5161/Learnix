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
                <section className="f8-hero">
                    <div className="f8-hero-content">
                        <h1 className="f8-hero-title">Nền tảng học lập trình hàng đầu</h1>
                        <p className="f8-hero-subtitle">
                            Trở thành lập trình viên chuyên nghiệp với các khóa học chất lượng, thực hành ngay và nhận chứng chỉ sau khóa học.
                        </p>
                        <div className="f8-hero-actions">
                            <Link to="/courses" className="f8-cta-btn f8-cta-primary">
                                HỌC THỬ MIỄN PHÍ
                            </Link>
                            <Link to="/courses" className="f8-cta-btn f8-cta-secondary">
                                MUA NGAY
                            </Link>
                        </div>
                    </div>
                    <div className="f8-hero-illustration">
                        {/* Placeholder for illustration */}
                    </div>
                </section>

                {/* Courses Pro Section */}
                <section className="f8-section">
                    <div className="f8-section-header">
                        <h2 className="f8-section-title">
                            Khóa học Pro <span className="f8-badge-new">MỚI</span>
                        </h2>
                        <Link to="/courses" className="f8-link-more">
                            Xem lộ trình →
                        </Link>
                    </div>
                    {latestCourses.length > 0 ? (
                        <div className="f8-courses-grid">
                            {latestCourses.slice(0, 4).map((course, index) => {
                                const gradients = [
                                    'f8-gradient-blue',
                                    'f8-gradient-yellow',
                                    'f8-gradient-pink',
                                    'f8-gradient-purple'
                                ];
                                const gradient = gradients[index % gradients.length];
                                
                                return (
                                    <Link 
                                        key={course._id} 
                                        to={`/courses/${course._id}`}
                                        className="f8-course-card"
                                    >
                                        <div className={`f8-course-banner ${gradient}`}>
                                            {course.is_premium && (
                                                <div className="f8-crown-icon">👑</div>
                                            )}
                                            <h3 className="f8-course-banner-title">{course.title}</h3>
                                            <p className="f8-course-banner-subtitle">
                                                {course.instructor_id && typeof course.instructor_id === 'object' && course.instructor_id !== null
                                                    ? `Cho ${course.instructor_id.name}` 
                                                    : 'Cho người mới bắt đầu'}
                                            </p>
                                        </div>
                                        <div className="f8-course-info">
                                            <h4 className="f8-course-info-title">{course.title}</h4>
                                            <div className="f8-course-price-wrapper">
                                                {course.price !== undefined && course.price > 0 ? (
                                                    <>
                                                        <span className="f8-price-old">{(course.price * 2).toLocaleString('vi-VN')}đ</span>
                                                        <span className="f8-price-new">{course.price.toLocaleString('vi-VN')}đ</span>
                                                    </>
                                                ) : (
                                                    <span className="f8-price-free">Miễn phí</span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="f8-empty">Chưa có khóa học nào.</p>
                    )}
                </section>

                {/* All Courses Section */}
                {latestCourses.length > 4 && (
                    <section className="f8-section">
                        <div className="f8-section-header">
                            <h2 className="f8-section-title">Khóa học khác</h2>
                            <Link to="/courses" className="f8-link-more">
                                Xem tất cả →
                            </Link>
                        </div>
                        <div className="f8-courses-list">
                            {latestCourses.slice(4).map((course) => (
                                <Link 
                                    key={course._id} 
                                    to={`/courses/${course._id}`}
                                    className="f8-course-item"
                                >
                                    <div className="f8-course-item-left">
                                        {course.thumbnail ? (
                                            <img src={course.thumbnail} alt={course.title} className="f8-course-thumb" />
                                        ) : (
                                            <div className="f8-course-thumb-placeholder"></div>
                                        )}
                                    </div>
                                    <div className="f8-course-item-center">
                                        <h4 className="f8-course-item-title">{course.title}</h4>
                                        <div className="f8-course-item-meta">
                                            <span className="f8-meta-icon">👁</span>
                                            <span>{course.enrollmentsCount || 0}</span>
                                            <span className="f8-meta-divider">•</span>
                                            <span className="f8-meta-icon">👍</span>
                                            <span>{course.lessonsCount || 0}</span>
                                        </div>
                                    </div>
                                    <div className="f8-course-item-right">
                                        {course.price !== undefined && course.price > 0 ? (
                                            <span className="f8-price-new">{course.price.toLocaleString('vi-VN')}đ</span>
                                        ) : (
                                            <span className="f8-price-free">Miễn phí</span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </main>
            
            {/* F8 Footer */}
            <footer className="f8-footer">
                <div className="f8-footer-container">
                    <div className="f8-footer-column">
                        <div className="f8-footer-logo">
                            <img src="/logo.png" alt="Learnix Logo" className="f8-logo-img" />
                            <span className="f8-slogan">Learnix</span>
                        </div>
                        <p className="f8-footer-text">Điện thoại: 0123 456 789</p>
                        <p className="f8-footer-text">Email: example@learnix.com</p>
                        <p className="f8-footer-text">Địa chỉ: 52A Trần Bình Trọng, Quận Bình Thạnh, TP. Hồ Chí Minh</p>
                    </div>
                    
                    <div className="f8-footer-column">
                        <h3 className="f8-footer-heading">VỀ LEARNIX</h3>
                        <ul className="f8-footer-list">
                            <li><a href="#" onClick={(e) => e.preventDefault()}>Giới thiệu</a></li>
                            <li><a href="#" onClick={(e) => e.preventDefault()}>Liên hệ</a></li>
                            <li><a href="#" onClick={(e) => e.preventDefault()}>Điều khoản & Quy định</a></li>
                            <li><a href="#" onClick={(e) => e.preventDefault()}>Chính sách bảo mật</a></li>
                        </ul>
                    </div>
                    
                    <div className="f8-footer-column">
                        <h3 className="f8-footer-heading">HỖ TRỢ</h3>
                        <ul className="f8-footer-list">
                            <li><a href="#" onClick={(e) => e.preventDefault()}>Chính sách thanh toán</a></li>
                            <li><a href="#" onClick={(e) => e.preventDefault()}>Chính sách vận chuyển</a></li>
                            <li><a href="#" onClick={(e) => e.preventDefault()}>Chính sách kiểm hàng</a></li>
                            <li><a href="#" onClick={(e) => e.preventDefault()}>Quy định về giá</a></li>
                        </ul>
                    </div>
                    
                    <div className="f8-footer-column">
                        <h3 className="f8-footer-heading">CÔNG CỤ</h3>
                        <ul className="f8-footer-list">
                            <li><a href="#" onClick={(e) => e.preventDefault()}>Tạo CV xin việc</a></li>
                            <li><a href="#" onClick={(e) => e.preventDefault()}>Rút gọn liên kết</a></li>
                            <li><a href="#" onClick={(e) => e.preventDefault()}>Clip-path maker</a></li>
                            <li><a href="#" onClick={(e) => e.preventDefault()}>Snippet generator</a></li>
                        </ul>
                    </div>
                </div>
                
                <div className="f8-footer-bottom">
                    <p>© 2018 - 2025 Learnix. Nền tảng học lập trình hàng đầu Việt Nam.</p>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;

