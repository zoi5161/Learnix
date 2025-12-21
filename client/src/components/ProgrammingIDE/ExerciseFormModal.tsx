import React, { useState } from 'react';
import { programmingService } from '../../services/programmingService';
import './ExerciseFormModal.css';

interface ExerciseFormModalProps {
    courseId: string;
    lessonId: string;
    exercise?: any;
    onClose: () => void;
    onSuccess: () => void;
}

const ExerciseFormModal: React.FC<ExerciseFormModalProps> = ({
    courseId,
    lessonId,
    exercise,
    onClose,
    onSuccess
}) => {
    const isEditing = !!exercise;

    const [formData, setFormData] = useState({
        title: exercise?.title || '',
        description: exercise?.description || '',
        starter_code: exercise?.starter_code || {
            python: `def solution(a, b):
    """
    Write your solution here.
    The function will be called automatically with test case inputs.
    Return the result (don't use print).
    """
    # Your code here
    return a + b`,
            javascript: `function solution(a, b) {
    /**
     * Write your solution here.
     * The function will be called automatically with test case inputs.
     * Return the result (don't use console.log).
     */
    // Your code here
    return a + b;
}`
        },
        languages: exercise?.languages || ['python'],
        difficulty: exercise?.difficulty || 'easy',
        time_limit: exercise?.time_limit || 5,
        memory_limit: exercise?.memory_limit || 128,
        function_name: exercise?.function_name || 'solution',
        input_format: exercise?.input_format || 'json',
        test_cases: exercise?.test_cases || [
            { input: '', expected_output: '', is_hidden: false, points: 1, description: '' }
        ]
    });

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleAddTestCase = () => {
        setFormData({
            ...formData,
            test_cases: [
                ...formData.test_cases,
                { input: '', expected_output: '', is_hidden: false, points: 1, description: '' }
            ]
        });
    };

    const handleRemoveTestCase = (index: number) => {
        if (formData.test_cases.length <= 1) {
            alert('At least one test case is required');
            return;
        }
        setFormData({
            ...formData,
            test_cases: formData.test_cases.filter((_: any, i: number) => i !== index)
        });
    };

    const handleUpdateTestCase = (index: number, field: string, value: any) => {
        const updated = [...formData.test_cases];
        updated[index] = { ...updated[index], [field]: value };
        setFormData({ ...formData, test_cases: updated });
    };

    const handleLanguageToggle = (lang: 'python' | 'javascript') => {
        if (formData.languages.includes(lang)) {
            if (formData.languages.length <= 1) {
                alert('At least one language must be selected');
                return;
            }
            setFormData({
                ...formData,
                languages: formData.languages.filter((l: any) => l !== lang)
            });
        } else {
            setFormData({
                ...formData,
                languages: [...formData.languages, lang]
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.title.trim()) {
            setError('Title is required');
            return;
        }
        if (!formData.description.trim()) {
            setError('Description is required');
            return;
        }
        if (formData.test_cases.length === 0) {
            setError('At least one test case is required');
            return;
        }
        if (formData.languages.length === 0) {
            setError('At least one language must be selected');
            return;
        }

        // Validate test cases
        for (let i = 0; i < formData.test_cases.length; i++) {
            const tc = formData.test_cases[i];
            if (!tc.input.trim() && !tc.expected_output.trim()) {
                setError(`Test case ${i + 1} is incomplete`);
                return;
            }
        }

        setSubmitting(true);
        try {
            if (isEditing) {
                await programmingService.updateExercise(
                    courseId,
                    lessonId,
                    exercise._id,
                    formData
                );
            } else {
                await programmingService.createExercise(courseId, lessonId, formData);
            }
            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error saving exercise');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="exercise-form-modal-overlay" onClick={onClose}>
            <div className="exercise-form-modal" onClick={(e) => e.stopPropagation()}>
                <div className="exercise-form-modal-header">
                    <h2>{isEditing ? 'Edit Programming Exercise' : 'Add Programming Exercise'}</h2>
                    <button className="exercise-form-modal-close" onClick={onClose}>×</button>
                </div>

                {error && (
                    <div className="exercise-form-modal-error">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="exercise-form-modal-form">
                    {/* Basic Info */}
                    <div className="exercise-form-section">
                        <h3 className="exercise-form-section-title">Basic Information</h3>
                        
                        <div className="exercise-form-field">
                            <label>Title *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. Two Sum"
                                required
                            />
                        </div>

                        <div className="exercise-form-field">
                            <label>Description *</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe the problem statement..."
                                rows={4}
                                required
                            />
                        </div>

                        <div className="exercise-form-row">
                            <div className="exercise-form-field">
                                <label>Difficulty</label>
                                <select
                                    title="Difficulty"
                                    value={formData.difficulty}
                                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>

                            <div className="exercise-form-field">
                                <label>Time Limit (seconds)</label>
                                <input
                                    title="Time Limit"
                                    type="number"
                                    min="1"
                                    max="30"
                                    value={formData.time_limit}
                                    onChange={(e) => setFormData({ ...formData, time_limit: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Languages */}
                    <div className="exercise-form-section">
                        <h3 className="exercise-form-section-title">Supported Languages *</h3>
                        <div className="exercise-form-languages">
                            <label className="exercise-form-language-option">
                                <input
                                    type="checkbox"
                                    checked={formData.languages.includes('python')}
                                    onChange={() => handleLanguageToggle('python')}
                                />
                                <span>🐍 Python</span>
                            </label>
                            <label className="exercise-form-language-option">
                                <input
                                    type="checkbox"
                                    checked={formData.languages.includes('javascript')}
                                    onChange={() => handleLanguageToggle('javascript')}
                                />
                                <span>🟨 JavaScript</span>
                            </label>
                        </div>
                    </div>

                    {/* Function Settings */}
                    <div className="exercise-form-section">
                        <h3 className="exercise-form-section-title">Function Settings</h3>
                        <div className="exercise-form-field">
                            <label>Function Name</label>
                            <input
                                type="text"
                                value={formData.function_name}
                                onChange={(e) => setFormData({ ...formData, function_name: e.target.value })}
                                placeholder="solution"
                                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                            />
                            <small style={{ display: 'block', marginTop: '4px', color: '#6b7280', fontSize: '12px' }}>
                                Name of the function students should implement (default: "solution")
                            </small>
                        </div>
                        <div className="exercise-form-field">
                            <label>Input Format</label>
                            <select
                                title="Input Format"
                                value={formData.input_format}
                                onChange={(e) => setFormData({ ...formData, input_format: e.target.value })}
                                style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                            >
                                <option value="json">JSON Array (e.g., [5, 10])</option>
                                <option value="space_separated">Space Separated (e.g., "5 10")</option>
                                <option value="line_separated">Line Separated (e.g., "5\n10")</option>
                            </select>
                            <small style={{ display: 'block', marginTop: '4px', color: '#6b7280', fontSize: '12px' }}>
                                How test case inputs should be parsed into function arguments
                            </small>
                        </div>
                    </div>

                    {/* Starter Code */}
                    <div className="exercise-form-section">
                        <h3 className="exercise-form-section-title">Starter Code</h3>
                        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                            Provide starter code with a function. The function will be called automatically with test case inputs (like LeetCode).
                        </p>
                        
                        {formData.languages.includes('python') && (
                            <div className="exercise-form-field">
                                <label>Python Starter Code</label>
                                <small style={{ display: 'block', marginBottom: '6px', color: '#6b7280', fontSize: '12px' }}>
                                    Write a function named <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>{formData.function_name}</code>. Return the result (don't use print).
                                </small>
                                <textarea
                                    value={formData.starter_code.python}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        starter_code: { ...formData.starter_code, python: e.target.value }
                                    })}
                                    rows={10}
                                    className="exercise-form-code-input"
                                    placeholder="# Write starter code for Python"
                                />
                            </div>
                        )}

                        {formData.languages.includes('javascript') && (
                            <div className="exercise-form-field">
                                <label>JavaScript Starter Code</label>
                                <small style={{ display: 'block', marginBottom: '6px', color: '#6b7280', fontSize: '12px' }}>
                                    Write a function named <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>{formData.function_name}</code>. Return the result (don't use console.log).
                                </small>
                                <textarea
                                    value={formData.starter_code.javascript}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        starter_code: { ...formData.starter_code, javascript: e.target.value }
                                    })}
                                    rows={10}
                                    className="exercise-form-code-input"
                                    placeholder="// Write starter code for JavaScript"
                                />
                            </div>
                        )}
                    </div>

                    {/* Test Cases */}
                    <div className="exercise-form-section">
                        <div className="exercise-form-section-header">
                            <h3 className="exercise-form-section-title">Test Cases *</h3>
                            <button
                                type="button"
                                onClick={handleAddTestCase}
                                className="exercise-form-add-test-btn"
                            >
                                + Add Test Case
                            </button>
                        </div>

                        {formData.test_cases.map((testCase: any, index: number) => (
                            <div key={index} className="exercise-form-test-case">
                                <div className="exercise-form-test-case-header">
                                    <span className="exercise-form-test-case-number">Test Case {index + 1}</span>
                                    {formData.test_cases.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTestCase(index)}
                                            className="exercise-form-remove-test-btn"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>

                                <div className="exercise-form-field">
                                    <label>Description (Optional)</label>
                                    <input
                                        type="text"
                                        value={testCase.description || ''}
                                        onChange={(e) => handleUpdateTestCase(index, 'description', e.target.value)}
                                        placeholder="e.g. Basic test case"
                                    />
                                </div>

                                <div className="exercise-form-field">
                                    <label>Input *</label>
                                    <small style={{ display: 'block', marginBottom: '6px', color: '#6b7280', fontSize: '12px' }}>
                                        {formData.input_format === 'json' && (
                                            <>
                                                Enter input as JSON array (will be passed as function arguments).
                                                <br />Example: <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>[5, 10]</code> for two numbers, or <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>["hello", "world"]</code> for strings.
                                            </>
                                        )}
                                        {formData.input_format === 'space_separated' && (
                                            <>
                                                Enter input as space-separated values (will be parsed and passed as function arguments).
                                                <br />Example: <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>5 10</code> for two numbers, or <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>hello world</code> for strings.
                                            </>
                                        )}
                                        {formData.input_format === 'line_separated' && (
                                            <>
                                                Enter input as line-separated values (each line will be parsed and passed as function arguments).
                                                <br />Example: <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>5{'\n'}10</code> for two numbers, or <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>hello{'\n'}world</code> for strings.
                                            </>
                                        )}
                                    </small>
                                    <textarea
                                        value={testCase.input}
                                        onChange={(e) => handleUpdateTestCase(index, 'input', e.target.value)}
                                        rows={3}
                                        placeholder={
                                            formData.input_format === 'json' 
                                                ? 'Example: [5, 10] or ["hello", "world"]'
                                                : formData.input_format === 'space_separated'
                                                ? 'Example: 5 10 or hello world'
                                                : 'Example: 5\n10 or hello\nworld'
                                        }
                                        required
                                    />
                                </div>

                                <div className="exercise-form-field">
                                    <label>Expected Output *</label>
                                    <small style={{ display: 'block', marginBottom: '6px', color: '#6b7280', fontSize: '12px' }}>
                                        The expected return value from the function. For arrays/objects, use JSON format.
                                        <br />Example: <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>15</code> for number, or <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: '3px' }}>[0, 1]</code> for array.
                                    </small>
                                    <textarea
                                        value={testCase.expected_output}
                                        onChange={(e) => handleUpdateTestCase(index, 'expected_output', e.target.value)}
                                        rows={3}
                                        placeholder='Example: 15 or [0, 1] or "hello"'
                                        required
                                    />
                                </div>

                                <div className="exercise-form-row">
                                    <div className="exercise-form-field">
                                        <label>Points</label>
                                        <input
                                            title="Points"
                                            type="number"
                                            min="1"
                                            value={testCase.points || 1}
                                            onChange={(e) => handleUpdateTestCase(index, 'points', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <label className="exercise-form-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={testCase.is_hidden || false}
                                            onChange={(e) => handleUpdateTestCase(index, 'is_hidden', e.target.checked)}
                                        />
                                        <span>Hidden Test Case</span>
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="exercise-form-actions">
                        <button
                            type="button"
                            onClick={onClose}
                            className="exercise-form-btn exercise-form-btn-cancel"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="exercise-form-btn exercise-form-btn-submit"
                        >
                            {submitting ? 'Saving...' : isEditing ? 'Update Exercise' : 'Create Exercise'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExerciseFormModal;

