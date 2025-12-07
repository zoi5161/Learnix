import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { courseService, CourseWithCounts, CourseFilters } from '../../../services/courseService';
import PublicNavbar from '../../../components/PublicNavbar';
import './CourseListPage.css';
import { getUserFromToken } from '../../../utils/authToken';

// Interface Form
interface CourseFormData {
    title: string;
    description: string;
    summary: string;
    price: number;
    level: 'beginner' | 'intermediate' | 'advanced';
    category: string;
    thumbnail: string;
    tags: string;
    is_premium: boolean;
    published: boolean;
}

const INITIAL_FORM_DATA: CourseFormData = {
    title: '', description: '', summary: '', price: 0, level: 'beginner', category: '', thumbnail: '', tags: '', is_premium: false, published: true
};

const CourseListPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const user = getUserFromToken();

    // === STATE QUẢN LÝ DỮ LIỆU & PHÂN TRANG ===
    const [courses, setCourses] = useState<CourseWithCounts[]>([]);
    const [currentPage, setCurrentPage] = useState(1); // Trang hiện tại
    const [hasMore, setHasMore] = useState(false);     // Còn dữ liệu để load không?
    const [loading, setLoading] = useState(false);     // Loading chung
    const [loadingMore, setLoadingMore] = useState(false); // Loading riêng nút Load More

    const [categories, setCategories] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
    const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '');
    const [selectedLevel, setSelectedLevel] = useState(searchParams.get('level') || '');
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>((searchParams.get('order') as 'asc' | 'desc') || 'desc');
    const [isCollapsed, setIsCollapsed] = useState(true);

    // CRUD states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentCourseId, setCurrentCourseId] = useState<string | null>(null);
    const [formData, setFormData] = useState<CourseFormData>(INITIAL_FORM_DATA);
    const [crudLoading, setCrudLoading] = useState(false);

    // 1. Fetch Categories (Chạy 1 lần)
    useEffect(() => {
        const fetchCategories = async () => {
            const res = await courseService.getCategories();
            if (res.success) setCategories(res.data);
        };
        fetchCategories();
    }, []);

    // 2. Hàm Fetch Data chính (Xử lý cả Filter và Load More)
    const fetchCourses = async (page: number, isLoadMore: boolean = false) => {
        try {
            if (isLoadMore) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }

            // Config filters
            const filters: CourseFilters = {
                page,
                limit: 8, // 👈 Tăng số lượng hiển thị mỗi lần load (bạn có thể để 12)
                sort: sortBy,
                order: sortOrder,
                category: selectedCategory,
                tag: selectedTag,
                level: selectedLevel as any,
                search: searchQuery,
                status: (user?.role === 'admin' || user?.role === 'instructor') ? 'all' : 'published',
            };

            const res = await courseService.getCourses(filters);

            if (res.success) {
                const newCourses = res.data.courses;

                if (isLoadMore) {
                    // Nếu là Load More -> Nối thêm vào danh sách cũ
                    setCourses(prev => [...prev, ...newCourses]);
                } else {
                    // Nếu là Filter mới -> Thay thế hoàn toàn
                    setCourses(newCourses);
                }

                // Check xem còn trang sau không
                setHasMore(page < res.data.pagination.pages);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // 3. Effect: Khi Filter thay đổi -> Reset về trang 1
    useEffect(() => {
        setCurrentPage(1); // Reset page về 1
        fetchCourses(1, false); // Fetch trang 1, chế độ "Replace"

        // Cập nhật URL (Optional)
        const newParams = new URLSearchParams();
        if (selectedCategory) newParams.set('category', selectedCategory);
        if (selectedLevel) newParams.set('level', selectedLevel);
        if (searchQuery) newParams.set('search', searchQuery);
        setSearchParams(newParams);

    }, [selectedCategory, selectedTag, selectedLevel, searchQuery, sortBy, sortOrder]);

    // 4. Handler: Bấm nút Load More
    const handleLoadMore = () => {
        const nextPage = currentPage + 1;
        setCurrentPage(nextPage);
        fetchCourses(nextPage, true); // Fetch trang tiếp, chế độ "Append"
    };

    // Filter Handlers
    const clearFilters = () => {
        setSelectedCategory(''); setSelectedTag(''); setSelectedLevel(''); setSearchQuery('');
        setSortBy('createdAt'); setSortOrder('desc');
    };
    const getLevelColor = (level: string) => {
        switch (level) { case 'beginner': return '#10b981'; case 'intermediate': return '#f59e0b'; case 'advanced': return '#ef4444'; default: return '#6b7280'; }
    };

    // CRUD Handlers
    // CRUD Handlers
    const openCreateModal = () => {
        setFormData(INITIAL_FORM_DATA);
        setIsEditing(false);
        setCurrentCourseId(null);
        setIsModalOpen(true);
    };

    const openEditModal = (course: CourseWithCounts) => {
        setFormData({
            title: course.title || '',
            description: course.description || '',
            summary: course.summary || '',
            price: course.price || 0,
            level: course.level || 'beginner',
            category: course.category || '',
            thumbnail: course.thumbnail || '',
            // Xử lý tags: nếu là mảng thì join, nếu null thì rỗng
            tags: Array.isArray(course.tags) ? course.tags.join(', ') : '',
            is_premium: course.is_premium || false,
            published: course.status === 'published'
        });
        setIsEditing(true);
        setCurrentCourseId(course._id);
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCrudLoading(true);
        const payload = {
            title: formData.title, description: formData.description, summary: formData.summary,
            price: Number(formData.price), level: formData.level, category: formData.category,
            thumbnail: formData.thumbnail, is_premium: formData.is_premium,
            status: (formData.published ? 'published' : 'draft') as 'published' | 'draft',
            tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
        };
        try {
            if (isEditing && currentCourseId) {
                await courseService.updateCourse(currentCourseId, payload);
                alert('Updated successfully!');
            } else {
                await courseService.createCourse(payload);
                alert('Created successfully!');
            }
            setIsModalOpen(false);
            // Sau khi Create/Update xong, refresh lại list từ đầu
            setCurrentPage(1);
            fetchCourses(1, false);
        } catch (err: any) {
            alert('Error: ' + (err.response?.data?.message || err.message));
        } finally { setCrudLoading(false); }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Delete this course?')) {
            try {
                await courseService.deleteCourse(id);
                // Refresh lại list
                setCurrentPage(1);
                fetchCourses(1, false);
            } catch (err: any) { alert('Delete failed: ' + err.message); }
        }
    };

    return (
        <div className="course-list-page">
            <PublicNavbar />
            <main className="course-list-main">
                {/* Header */}
                <div className="course-list-header">
                    <div className="course-list-back"><button onClick={() => navigate('/dashboard')} className="course-list-back-btn">← Back</button></div>
                    <div className="header-actions" style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'center' }}>
                        <div>
                            <h1 className="course-list-title">All Courses</h1>
                            <p className="course-list-subtitle">Manage your learning content</p>
                            {(user?.role === 'admin' || user?.role === 'instructor') && (
                                <button className="btn-create" onClick={openCreateModal}>
                                    + Create New
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Search */}
                <form onSubmit={(e) => { e.preventDefault(); /* Search handled by effect */ }} className="course-list-search">
                    <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="course-list-search-input" />
                </form>

                <div className="course-list-content">
                    {/* Filters Sidebar */}
                    <aside className={`course-list-filters ${isCollapsed ? "collapsed" : ""}`}>
                        <div className="course-list-filters-header">
                            <h2>Filters</h2>
                            <button className="course-list-toggle-btn" onClick={() => setIsCollapsed(!isCollapsed)}>{isCollapsed ? "Show" : "Hide"}</button>
                        </div>
                        <div className={`course-filters-collapse ${isCollapsed ? "collapsed" : ""}`}>
                            <div style={{ textAlign: 'right', marginBottom: 5 }}><button onClick={clearFilters} className="course-list-clear-filters">Clear</button></div>
                            <div className="course-list-filter-group">
                                <label>Category</label>
                                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="course-list-filter-select">
                                    <option value="">All</option>
                                    {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div className="course-list-filter-group">
                                <label>Level</label>
                                <select value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} className="course-list-filter-select">
                                    <option value="">All</option>
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>
                            <div className="course-list-filter-group">
                                <label>Sort By</label>
                                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="course-list-filter-select">
                                    <option value="createdAt">Newest</option>
                                    <option value="title">A-Z</option>
                                    <option value="price">Price</option>
                                </select>
                            </div>
                        </div>
                    </aside>

                    {/* Results */}
                    <div className="course-list-results">
                        {/* Loading lần đầu */}
                        {loading ? <div className="course-list-loading">Loading courses...</div> : error ? <div className="course-list-error">{error}</div> :
                            courses.length > 0 ? (
                                <>
                                    <div className="course-list-grid">
                                        {courses.map((course) => (
                                            <div key={course._id} className="course-list-card">
                                                <Link to={`/courses/${course._id}`} className="course-card-link">
                                                    {course.thumbnail && <div className="course-list-thumbnail"><img src={course.thumbnail} alt={course.title} /></div>}
                                                    <div className="course-list-card-content">
                                                        <div className="course-list-card-header">
                                                            <span className="course-list-level" style={{ backgroundColor: getLevelColor(course.level) }}>{course.level}</span>
                                                            {course.is_premium && <span className="course-list-premium">Premium</span>}
                                                            {course.status === 'draft' && <span style={{ background: '#9ca3af', color: 'white', padding: '4px', borderRadius: 4, fontSize: 11, height: 'fit-content' }}>Draft</span>}
                                                        </div>
                                                        <h3 className="course-list-card-title">{course.title}</h3>
                                                        {/* <p className="course-list-card-instructor">By {typeof course.instructor_id === 'object' && course.instructor_id ? course.instructor_id.name : 'Unknown'}</p> */}
                                                        <div className="course-list-card-stats"><span>{course.enrollmentsCount} students</span> • <span>{course.lessonsCount} lessons</span></div>
                                                        <div className="course-list-card-price">{course.price ? `$${course.price}` : 'Free'}</div>
                                                        {user?.role !== 'student' &&
                                                            <div className="card-actions">
                                                                <button className="btn-edit" onClick={() => openEditModal(course)}>Edit</button>
                                                                <button className="btn-delete" onClick={() => handleDelete(course._id)}>Delete</button>
                                                            </div>}
                                                    </div>
                                                </Link>
                                                {user?.role !== 'student' &&
                                                    <button className="btn-detail" onClick={() => navigate(`/courses/${course._id}/manage-lessons`)}>Manage lesson</button>
                                                }
                                            </div>
                                        ))}
                                    </div>

                                    {/* LOAD MORE BUTTON */}
                                    {hasMore && (
                                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 30, marginBottom: 50 }}>
                                            <button
                                                onClick={handleLoadMore}
                                                disabled={loadingMore}
                                                style={{
                                                    padding: '10px 30px',
                                                    fontSize: '16px',
                                                    backgroundColor: '#2563eb',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '50px',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                                    opacity: loadingMore ? 0.7 : 1
                                                }}
                                            >
                                                {loadingMore ? 'Loading more...' : 'Load More Courses'}
                                            </button>
                                        </div>
                                    )}

                                    {!hasMore && courses.length > 0 && (
                                        <p style={{ textAlign: 'center', color: '#6b7280', marginTop: 20 }}>No more courses to load.</p>
                                    )}
                                </>
                            ) : <div className="course-list-empty">No courses found matching your criteria.</div>}
                    </div>
                </div>
            </main>

            {/* MODAL FORM */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '600px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ marginBottom: 15 }}>{isEditing ? 'Edit Course' : 'Create New Course'}</h2>

                        <form onSubmit={handleFormSubmit}>
                            {/* Title */}
                            <div className="form-group">
                                <label>Title <span style={{ color: 'red' }}>*</span></label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Complete Python Bootcamp 2025"
                                    required
                                />
                            </div>

                            {/* Category & Level */}
                            <div style={{ display: 'flex', gap: 10 }}>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Category</label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        placeholder="e.g. Web Development"
                                    />
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label>Level</label>
                                    <select value={formData.level} onChange={e => setFormData({ ...formData, level: e.target.value as any })}>
                                        <option value="beginner">Beginner</option>
                                        <option value="intermediate">Intermediate</option>
                                        <option value="advanced">Advanced</option>
                                    </select>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="form-group">
                                <label>Price ($)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                                    placeholder="0.00 (Leave 0 for Free)"
                                />
                            </div>

                            {/* Description */}
                            <div className="form-group">
                                <label>Description <span style={{ color: 'red' }}>*</span></label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={5}
                                    required
                                    placeholder="Enter a detailed description of what students will learn..."
                                />
                            </div>

                            {/* Summary */}
                            <div className="form-group">
                                <label>Summary</label>
                                <textarea
                                    value={formData.summary}
                                    onChange={e => setFormData({ ...formData, summary: e.target.value })}
                                    rows={2}
                                    placeholder="A short tagline for the course card (max 2-3 sentences)."
                                />
                            </div>

                            {/* Thumbnail */}
                            <div className="form-group">
                                <label>Thumbnail URL</label>
                                <input
                                    type="text"
                                    value={formData.thumbnail}
                                    onChange={e => setFormData({ ...formData, thumbnail: e.target.value })}
                                    placeholder="https://example.com/image.jpg"
                                />
                                {/* Preview ảnh nhỏ nếu có link */}
                                {formData.thumbnail && (
                                    <div style={{ marginTop: 5 }}>
                                        <img src={formData.thumbnail} alt="Preview" style={{ height: 50, objectFit: 'cover', borderRadius: 4 }} onError={(e) => (e.target as HTMLImageElement).style.display = 'none'} />
                                    </div>
                                )}
                            </div>

                            {/* Tags */}
                            <div className="form-group">
                                <label>Tags</label>
                                <input
                                    type="text"
                                    value={formData.tags}
                                    onChange={e => setFormData({ ...formData, tags: e.target.value })}
                                    placeholder="e.g. javascript, react, frontend (comma separated)"
                                />
                            </div>

                            {/* Checkboxes */}
                            <div style={{ display: 'flex', gap: 20, marginTop: 10, marginBottom: 20, padding: '10px', background: '#f3f4f6', borderRadius: '6px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={formData.is_premium} onChange={e => setFormData({ ...formData, is_premium: e.target.checked })} style={{ marginRight: 8, width: 16, height: 16 }} />
                                    Premium Course
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={formData.published} onChange={e => setFormData({ ...formData, published: e.target.checked })} style={{ marginRight: 8, width: 16, height: 16 }} />
                                    Publish Immediately
                                </label>
                            </div>

                            {/* Actions */}
                            <div className="modal-actions">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-cancel">Cancel</button>
                                <button type="submit" disabled={crudLoading} className="btn-save">
                                    {crudLoading ? 'Saving...' : (isEditing ? 'Update Course' : 'Create Course')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <footer className="course-list-footer"><p>© 2025 Learnix</p></footer>
        </div>
    );
};

export default CourseListPage;