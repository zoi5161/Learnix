import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { courseService, CourseWithCounts, CourseFilters, TrendingTag } from '../../../services/courseService';
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
    const [totalPages, setTotalPages] = useState(1);   // Tổng số trang
    const [total, setTotal] = useState(0);            // Tổng số courses
    const [loading, setLoading] = useState(false);     // Loading chung

    const [categories, setCategories] = useState<string[]>([]);
    const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
    const [selectedTag, setSelectedTag] = useState(searchParams.get('tag') || '');
    const [selectedLevel, setSelectedLevel] = useState(searchParams.get('level') || '');
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>((searchParams.get('order') as 'asc' | 'desc') || 'desc');
    const [isCollapsed, setIsCollapsed] = useState(false);

    // CRUD states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentCourseId, setCurrentCourseId] = useState<string | null>(null);
    const [formData, setFormData] = useState<CourseFormData>(INITIAL_FORM_DATA);
    const [crudLoading, setCrudLoading] = useState(false);

    // 1. Fetch Categories and Trending Tags (Chạy 1 lần)
    useEffect(() => {
        const fetchData = async () => {
            const [categoriesRes, tagsRes] = await Promise.all([
                courseService.getCategories(),
                courseService.getTrendingTags(20)
            ]);
            if (categoriesRes.success) setCategories(categoriesRes.data);
            if (tagsRes.success) setTrendingTags(tagsRes.data);
        };
        fetchData();
    }, []);

    // Đồng bộ searchQuery state với query param trên URL (phục vụ search từ navbar)
    useEffect(() => {
        const paramSearch = searchParams.get('search') || '';
        setSearchQuery(paramSearch);
    }, [searchParams]);

    // 2. Hàm Fetch Data chính
    const fetchCourses = async (page: number) => {
        try {
            setLoading(true);

            // Config filters
            const filters: CourseFilters = {
                page,
                limit: 4, // Mỗi trang hiển thị 4 courses
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
                setCourses(res.data.courses);
                setTotalPages(res.data.pagination.pages);
                setTotal(res.data.pagination.total);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // 3. Effect: Khi Filter thay đổi -> Reset về trang 1
    useEffect(() => {
        setCurrentPage(1); // Reset page về 1

        // Cập nhật URL (Optional)
        const newParams = new URLSearchParams();
        if (selectedCategory) newParams.set('category', selectedCategory);
        if (selectedTag) newParams.set('tag', selectedTag);
        if (selectedLevel) newParams.set('level', selectedLevel);
        if (searchQuery) newParams.set('search', searchQuery);
        setSearchParams(newParams);
    }, [selectedCategory, selectedTag, selectedLevel, searchQuery, sortBy, sortOrder, setSearchParams]);

    // 4. Effect: Fetch data khi page hoặc filters thay đổi
    useEffect(() => {
        fetchCourses(currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, selectedCategory, selectedTag, selectedLevel, searchQuery, sortBy, sortOrder]);

    // 5. Handler: Chuyển trang
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
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
    // Determine if current user can manage a course
    const isCourseOwner = (course: CourseWithCounts) => {
        if (!user) return false;
        if (user.role === 'admin') return true;
        if (user.role !== 'instructor') return false;

        const instructorId = typeof course.instructor_id === 'object' && course.instructor_id !== null
            ? (course.instructor_id as any)._id || (course.instructor_id as any).id
            : course.instructor_id;

        if (!instructorId) return false;
        const currentUserId = (user as any).userId || (user as any)._id || (user as any).id;
        if (!currentUserId) return false;

        return instructorId.toString() === currentUserId.toString();
    };

    // CRUD Handlers
    const openCreateModal = () => {
        setFormData(INITIAL_FORM_DATA);
        setIsEditing(false);
        setCurrentCourseId(null);
        setIsModalOpen(true);
    };

    const openEditModal = (course: CourseWithCounts) => {
        if (!isCourseOwner(course)) {
            alert('Only the course owner can edit this course.');
            return;
        }
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
            // Status không chỉnh trực tiếp từ form nữa, luôn để backend set mặc định (draft)
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
            fetchCourses(1);
        } catch (err: any) {
            alert('Error: ' + (err.response?.data?.message || err.message));
        } finally { setCrudLoading(false); }
    };

    const handleMoveToDraft = async (course: CourseWithCounts) => {
        if (!isCourseOwner(course)) {
            alert('Only the course owner can change this course status.');
            return;
        }

        if (course.status !== 'published') {
            alert('Only published courses can be moved back to draft.');
            return;
        }

        if (!window.confirm('Move this published course back to draft?')) return;

        try {
            await courseService.updateCourseStatus(course._id, 'draft');
            alert('Course has been moved back to draft.');
            setCurrentPage(1);
            fetchCourses(1);
        } catch (err: any) {
            alert('Failed to move to draft: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleSubmitForReview = async (course: CourseWithCounts) => {
        if (!isCourseOwner(course)) {
            alert('Only the course owner can submit this course.');
            return;
        }

        if (!(course.status === 'draft' || course.status === 'rejected')) {
            alert('Only draft or rejected courses can be submitted.');
            return;
        }

        if (!window.confirm('Submit this course for admin review?')) return;

        try {
            await courseService.updateCourseStatus(course._id, 'pending');
            alert('Course submitted for review.');
            setCurrentPage(1);
            fetchCourses(1);
        } catch (err: any) {
            alert('Failed to submit: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async (course: CourseWithCounts) => {
        if (!isCourseOwner(course)) {
            alert('Only the course owner can delete this course.');
            return;
        }
        if (window.confirm('Delete this course?')) {
            try {
                await courseService.deleteCourse(course._id);
                // Refresh lại list
                setCurrentPage(1);
                fetchCourses(1);
            } catch (err: any) { alert('Delete failed: ' + err.message); }
        }
    };

    // Toggle publish/draft handler
    const handlePublishToggle = async (course: CourseWithCounts, nextChecked: boolean) => {
        if (!isCourseOwner(course)) {
            alert('Only the course owner can change this course status.');
            return;
        }

        // Khi đang pending thì không cho thao tác
        if (course.status === 'pending') {
            return;
        }

        // Tắt toggle: từ published -> draft
        if (!nextChecked) {
            if (course.status === 'published') {
                await handleMoveToDraft(course);
            }
            return;
        }

        // Bật toggle: từ draft / rejected -> gửi duyệt (pending)
        if (nextChecked) {
            if (course.status === 'draft' || course.status === 'rejected') {
                await handleSubmitForReview(course);
            }
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
                                <select title="Category" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="course-list-filter-select">
                                    <option value="">All</option>
                                    {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div className="course-list-filter-group">
                                <label>Tag</label>
                                <select title="Tag" value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)} className="course-list-filter-select">
                                    <option value="">All</option>
                                    {trendingTags.map((tagItem) => (
                                        <option key={tagItem.tag} value={tagItem.tag}>
                                            {tagItem.tag} ({tagItem.count})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="course-list-filter-group">
                                <label>Level</label>
                                <select title="Level" value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)} className="course-list-filter-select">
                                    <option value="">All</option>
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>
                            <div className="course-list-filter-group">
                                <label>Sort By</label>
                                <select title="Sort By" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="course-list-filter-select">
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
                                                    <div className="course-list-thumbnail">
                                                        <img 
                                                            src={course.thumbnail || '/logo.png'} 
                                                            alt={course.title || 'Learnx'}
                                                            onError={(e) => {
                                                                e.currentTarget.src = '/logo.png';
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="course-list-card-content">
                                                        <div className="course-list-card-header">
                                                            <span className="course-list-level" style={{ backgroundColor: getLevelColor(course.level) }}>{course.level}</span>
                                                            {course.is_premium && <span className="course-list-premium">Premium</span>}
                                                            {course.status && (
                                                                <span className={`course-status-badge status-${course.status}`}>
                                                                    {course.status === 'draft'
                                                                        ? 'Draft'
                                                                        : course.status === 'published'
                                                                            ? 'Published'
                                                                            : course.status === 'pending'
                                                                                ? 'Pending'
                                                                                : course.status === 'rejected'
                                                                                    ? 'Rejected'
                                                                                    : course.status}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h3 className="course-list-card-title">{course.title}</h3>
                                                        {/* <p className="course-list-card-instructor">By {typeof course.instructor_id === 'object' && course.instructor_id ? course.instructor_id.name : 'Unknown'}</p> */}
                                                        <div className="course-list-card-stats"><span>{course.enrollmentsCount} students</span> • <span>{course.lessonsCount} lessons</span></div>
                                                        <div className="course-list-card-price">{course.price ? `$${course.price}` : 'Free'}</div>

                                                    </div>
                                                </Link>
                                                {user && isCourseOwner(course) && (
                                                    <div className="card-actions">
                                                        <button className="btn-edit" onClick={() => openEditModal(course)}>Edit</button>
                                                        <button className="btn-delete" onClick={() => handleDelete(course)}>Delete</button>
                                                    </div>
                                                )}
                                                {user && isCourseOwner(course) && (
                                                    <div className="publish-toggle-wrapper">
                                                        <span className="publish-toggle-status">
                                                            {course.status === 'published' && 'Published'}
                                                            {course.status === 'draft' && 'Draft'}
                                                            {course.status === 'pending' && 'Pending review'}
                                                            {course.status === 'rejected' && 'Rejected'}
                                                        </span>
                                                        <label className={`toggle-switch ${course.status === 'published' || course.status === 'pending' ? 'checked' : ''} ${course.status === 'pending' ? 'disabled' : ''}`}>
                                                            <input
                                                                type="checkbox"
                                                                checked={course.status === 'published' || course.status === 'pending'}
                                                                disabled={course.status === 'pending'}
                                                                onChange={(e) => handlePublishToggle(course, e.target.checked)}
                                                            />
                                                            <span className="toggle-slider" />
                                                        </label>
                                                    </div>
                                                )}
                                                {user && isCourseOwner(course) &&
                                                    <button className="btn-detail" onClick={() => navigate(`/courses/${course._id}/manage-lessons`)}>Manage lesson</button>
                                                }
                                            </div>
                                        ))}
                                    </div>

                                    {/* PAGINATION */}
                                    {totalPages > 1 && (
                                        <div className="course-list-pagination">
                                            <button
                                                className="course-list-pagination-button"
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1 || loading}
                                            >
                                                Previous
                                            </button>
                                            
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                {/* Show page numbers */}
                                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                    let pageNum;
                                                    if (totalPages <= 5) {
                                                        pageNum = i + 1;
                                                    } else if (currentPage <= 3) {
                                                        pageNum = i + 1;
                                                    } else if (currentPage >= totalPages - 2) {
                                                        pageNum = totalPages - 4 + i;
                                                    } else {
                                                        pageNum = currentPage - 2 + i;
                                                    }
                                                    
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => handlePageChange(pageNum)}
                                                            disabled={loading}
                                                            style={{
                                                                padding: '8px 16px',
                                                                backgroundColor: currentPage === pageNum ? '#2563eb' : '#f3f4f6',
                                                                color: currentPage === pageNum ? 'white' : '#374151',
                                                                border: 'none',
                                                                borderRadius: '6px',
                                                                cursor: 'pointer',
                                                                fontWeight: currentPage === pageNum ? '600' : '400',
                                                                minWidth: '40px'
                                                            }}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            <button
                                                className="course-list-pagination-button"
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage === totalPages || loading}
                                            >
                                                Next
                                            </button>
                                            
                                            <span className="course-list-pagination-info">
                                                Page {currentPage} of {totalPages} ({total} courses)
                                            </span>
                                        </div>
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
                                    <select title="Level" value={formData.level} onChange={e => setFormData({ ...formData, level: e.target.value as any })}>
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