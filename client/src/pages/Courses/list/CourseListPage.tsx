import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { courseService, CourseWithCounts, CourseFilters } from '../../../services/courseService';
import PublicNavbar from '../../../components/PublicNavbar';
import './CourseListPage.css';

const CourseListPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [courses, setCourses] = useState<CourseWithCounts[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 12,
        total: 0,
        pages: 0
    });

    // Filter states
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
    const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '');
    const [selectedLevel, setSelectedLevel] = useState(searchParams.get('level') || '');
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
        (searchParams.get('order') as 'asc' | 'desc') || 'desc'
    );

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await courseService.getCategories();
                if (res.success) {
                    setCategories(res.data);
                }
            } catch (err) {
                console.error('Failed to fetch categories:', err);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true);
                const page = parseInt(searchParams.get('page') || '1');

                const filters: CourseFilters = {
                    page,
                    limit: 12,
                    sort: sortBy,
                    order: sortOrder
                };

                if (selectedCategory) filters.category = selectedCategory;
                if (selectedTag) filters.tag = selectedTag;
                if (selectedLevel) filters.level = selectedLevel as any;
                if (searchQuery) filters.search = searchQuery;

                const res = await courseService.getCourses(filters);

                if (res.success) {
                    setCourses(res.data.courses);
                    setPagination(res.data.pagination);
                } else {
                    setError('Failed to load courses');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load courses');
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [searchParams, selectedCategory, selectedTag, selectedLevel, searchQuery, sortBy, sortOrder]);

    const handleFilterChange = (key: string, value: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (value) {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }
        newParams.set('page', '1'); // Reset to first page
        setSearchParams(newParams);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilterChange('search', searchQuery);
    };

    const handlePageChange = (newPage: number) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('page', newPage.toString());
        setSearchParams(newParams);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const clearFilters = () => {
        setSelectedCategory('');
        setSelectedTag('');
        setSelectedLevel('');
        setSearchQuery('');
        setSortBy('createdAt');
        setSortOrder('desc');
        setSearchParams({});
    };

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

    return (
        <div className="course-list-page">
            <PublicNavbar />
            <main className="course-list-main">
                <div className="course-list-header">
                    <h1 className="course-list-title">All Courses</h1>
                    <p className="course-list-subtitle">
                        Discover and enroll in courses that match your interests
                    </p>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearch} className="course-list-search">
                    <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="course-list-search-input"
                    />
                    <button type="submit" className="course-list-search-button">
                        Search
                    </button>
                </form>

                <div className="course-list-content">
                    {/* Filters Sidebar */}
                    <aside className="course-list-filters">
                        <div className="course-list-filters-header">
                            <h2>Filters</h2>
                            <button onClick={clearFilters} className="course-list-clear-filters">
                                Clear All
                            </button>
                        </div>

                        {/* Category Filter */}
                        <div className="course-list-filter-group">
                            <label className="course-list-filter-label">Category</label>
                            <select
                                value={selectedCategory}
                                onChange={(e) => {
                                    setSelectedCategory(e.target.value);
                                    handleFilterChange('category', e.target.value);
                                }}
                                className="course-list-filter-select"
                            >
                                <option value="">All Categories</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Level Filter */}
                        <div className="course-list-filter-group">
                            <label className="course-list-filter-label">Level</label>
                            <select
                                value={selectedLevel}
                                onChange={(e) => {
                                    setSelectedLevel(e.target.value);
                                    handleFilterChange('level', e.target.value);
                                }}
                                className="course-list-filter-select"
                            >
                                <option value="">All Levels</option>
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        </div>

                        {/* Sort Options */}
                        <div className="course-list-filter-group">
                            <label className="course-list-filter-label">Sort By</label>
                            <select
                                value={sortBy}
                                onChange={(e) => {
                                    setSortBy(e.target.value);
                                    handleFilterChange('sort', e.target.value);
                                }}
                                className="course-list-filter-select"
                            >
                                <option value="createdAt">Newest First</option>
                                <option value="title">Title A-Z</option>
                                <option value="price">Price</option>
                            </select>
                        </div>

                        <div className="course-list-filter-group">
                            <label className="course-list-filter-label">Order</label>
                            <select
                                value={sortOrder}
                                onChange={(e) => {
                                    setSortOrder(e.target.value as 'asc' | 'desc');
                                    handleFilterChange('order', e.target.value);
                                }}
                                className="course-list-filter-select"
                            >
                                <option value="desc">Descending</option>
                                <option value="asc">Ascending</option>
                            </select>
                        </div>
                    </aside>

                    {/* Courses Grid */}
                    <div className="course-list-results">
                        {loading ? (
                            <div className="course-list-loading">
                                <div className="course-list-spinner"></div>
                                <p>Loading courses...</p>
                            </div>
                        ) : error ? (
                            <div className="course-list-error">
                                <p>Error: {error}</p>
                            </div>
                        ) : courses.length > 0 ? (
                            <>
                                <div className="course-list-grid">
                                    {courses.map((course) => (
                                        <div key={course._id} className="course-list-card">
                                            {course.thumbnail && (
                                                <div className="course-list-thumbnail">
                                                    <img src={course.thumbnail} alt={course.title} />
                                                </div>
                                            )}
                                            <div className="course-list-card-content">
                                                <div className="course-list-card-header">
                                                    <span
                                                        className="course-list-level"
                                                        style={{ backgroundColor: getLevelColor(course.level) }}
                                                    >
                                                        {course.level}
                                                    </span>
                                                    {course.is_premium && (
                                                        <span className="course-list-premium">Premium</span>
                                                    )}
                                                </div>
                                                <h3 className="course-list-card-title">
                                                    <Link to={`/courses/${course._id}`}>{course.title}</Link>
                                                </h3>
                                                <p className="course-list-card-instructor">
                                                    By {course.instructor_id && typeof course.instructor_id === 'object' && course.instructor_id !== null
                                                        ? course.instructor_id.name || 'Unknown'
                                                        : 'Unknown'}
                                                </p>
                                                {course.summary && (
                                                    <p className="course-list-card-summary">{course.summary}</p>
                                                )}
                                                <div className="course-list-card-stats">
                                                    <span>{course.enrollmentsCount || 0} students</span>
                                                    <span>•</span>
                                                    <span>{course.lessonsCount || 0} lessons</span>
                                                </div>
                                                {course.price !== undefined && course.price > 0 && (
                                                    <div className="course-list-card-price">
                                                        ${course.price.toFixed(2)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {pagination.pages > 1 && (
                                    <div className="course-list-pagination">
                                        <button
                                            onClick={() => handlePageChange(pagination.page - 1)}
                                            disabled={pagination.page === 1}
                                            className="course-list-pagination-button"
                                        >
                                            Previous
                                        </button>
                                        <span className="course-list-pagination-info">
                                            Page {pagination.page} of {pagination.pages}
                                        </span>
                                        <button
                                            onClick={() => handlePageChange(pagination.page + 1)}
                                            disabled={pagination.page === pagination.pages}
                                            className="course-list-pagination-button"
                                        >
                                            Next
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="course-list-empty">
                                <p>No courses found. Try adjusting your filters.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <footer className="course-list-footer">
                <p>© 2025 Learnix | Intelligent E-Learning</p>
            </footer>
        </div>
    );
};

export default CourseListPage;

