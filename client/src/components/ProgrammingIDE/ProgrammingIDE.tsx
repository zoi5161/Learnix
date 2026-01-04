import React, { useState, useEffect } from 'react';
import { programmingService, ProgrammingExercise, TestResult, CodeSubmission } from '../../services/programmingService';
import './ProgrammingIDE.css';
import Editor from '@monaco-editor/react';

interface ProgrammingIDEProps {
    courseId: string;
    lessonId: string;
    exercise: ProgrammingExercise;
    onSubmissionComplete?: (submission: any) => void;
}

const ProgrammingIDE: React.FC<ProgrammingIDEProps> = ({
    courseId,
    lessonId,
    exercise,
    onSubmissionComplete
}) => {
    const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'javascript'>(
        exercise.languages[0] || 'python'
    );
    const [code, setCode] = useState<string>(
        exercise.starter_code[selectedLanguage] || ''
    );
    const [running, setRunning] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [runResults, setRunResults] = useState<TestResult[] | null>(null);
    const [submitResults, setSubmitResults] = useState<any | null>(null);
    const [output, setOutput] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [submissions, setSubmissions] = useState<CodeSubmission[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    // Update code when language changes
    useEffect(() => {
        const starterCode = exercise.starter_code[selectedLanguage] || '';
        setCode(starterCode);
        setRunResults(null);
        setSubmitResults(null);
        setOutput('');
        setError('');
    }, [selectedLanguage, exercise]);

    // Load latest submission if exists
    useEffect(() => {
        if (exercise.latest_submission) {
            const submission = exercise.latest_submission;
            if (submission.language === selectedLanguage) {
                setCode(submission.code);
            }
        }
    }, [exercise.latest_submission, selectedLanguage]);

    // Fetch submission history
    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                setLoadingHistory(true);
                const res = await programmingService.getSubmissions(
                    courseId,
                    lessonId,
                    exercise._id
                );
                if (res.success) {
                    setSubmissions(res.data);
                }
            } catch (err) {
                console.error('Error loading submission history:', err);
            } finally {
                setLoadingHistory(false);
            }
        };

        fetchSubmissions();
    }, [courseId, lessonId, exercise._id]);

    const handleRun = async () => {
        if (!code.trim()) {
            setError('Please write some code before running');
            return;
        }

        setRunning(true);
        setError('');
        setOutput('');
        setRunResults(null);

        try {
            const response = await programmingService.runCode(
                courseId,
                lessonId,
                exercise._id,
                code,
                selectedLanguage
            );

            if (response.success) {
                setRunResults(response.data.test_results);
                setOutput(
                    `Ran ${response.data.passed_test_cases}/${response.data.total_test_cases} test cases\n` +
                    `Score: ${response.data.score}%\n` +
                    (response.data.passed ? '✅ All tests passed!' : '❌ Some tests failed')
                );
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error running code');
        } finally {
            setRunning(false);
        }
    };

    const handleSubmit = async () => {
        if (!code.trim()) {
            setError('Please write some code before submitting');
            return;
        }

        if (!window.confirm('Are you sure you want to submit? This will run all test cases including hidden ones.')) {
            return;
        }

        setSubmitting(true);
        setError('');
        setOutput('');
        setRunResults(null);

        try {
            const response = await programmingService.submitCode(
                courseId,
                lessonId,
                exercise._id,
                code,
                selectedLanguage
            );

            if (response.success) {
                setSubmitResults(response.data);
                setRunResults(response.data.test_results);
                setOutput(
                    `Submitted! Ran ${response.data.passed_test_cases}/${response.data.total_test_cases} test cases\n` +
                    `Score: ${response.data.score}%\n` +
                    (response.data.passed ? '🎉 All tests passed!' : '😢 Some tests failed')
                );

                if (onSubmissionComplete) {
                    onSubmissionComplete(response.data.submission);
                }

                // Refresh submission history
                try {
                    const historyRes = await programmingService.getSubmissions(
                        courseId,
                        lessonId,
                        exercise._id
                    );
                    if (historyRes.success) {
                        setSubmissions(historyRes.data);
                    }
                } catch (e) {
                    console.error('Error refreshing history:', e);
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error submitting code');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="programming-ide">
            {/* Header */}
            <div className="programming-ide-header">
                <div className="programming-ide-title-section">
                    <h2 className="programming-ide-title">{exercise.title}</h2>
                    <span className={`programming-ide-difficulty difficulty-${exercise.difficulty}`}>
                        {exercise.difficulty}
                    </span>
                </div>

                {/* Language Selector */}
                <div className="programming-ide-language-selector">
                    {exercise.languages.map((lang) => (
                        <button
                            key={lang}
                            onClick={() => setSelectedLanguage(lang)}
                            className={`programming-ide-lang-btn ${selectedLanguage === lang ? 'active' : ''
                                }`}
                        >
                            {lang === 'python' ? '🐍 Python' : '🟨 JavaScript'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Description */}
            <div className="programming-ide-description">
                <div className="programming-ide-description-content">
                    {exercise.description.split('\n').map((line, idx) => (
                        <p key={idx}>{line}</p>
                    ))}
                </div>
            </div>

            {/* Code Editor */}
            <div className="programming-ide-editor-section">
                <div className="programming-ide-editor-header">
                    <span className="programming-ide-editor-label">Code Editor</span>
                    <div className="programming-ide-actions">
                        <button
                            onClick={handleRun}
                            disabled={running || submitting}
                            className="programming-ide-btn programming-ide-btn-run"
                        >
                            {running ? '⏳ Running...' : '▶️ Run'}
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={running || submitting}
                            className="programming-ide-btn programming-ide-btn-submit"
                        >
                            {submitting ? '⏳ Submitting...' : '🚀 Submit'}
                        </button>
                    </div>
                </div>
                <Editor
                    height="400px"
                    language={selectedLanguage === 'python' ? 'python' : 'javascript'}
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    theme="vs-dark" // hoặc "vs" (light), "hc-black"
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        roundedSelection: false,
                        scrollBeyondLastLine: false,
                        readOnly: false,
                        automaticLayout: true,
                        tabSize: 4,
                        wordWrap: 'on',
                        formatOnPaste: true,
                        formatOnType: true,
                    }}
                    className="programming-ide-code-editor"
                />
            </div>

            {/* Output & Results */}
            <div className="programming-ide-results-section">
                {/* Output Console */}
                {(output || error) && (
                    <div className="programming-ide-output">
                        <div className="programming-ide-output-header">
                            <span>Output</span>
                        </div>
                        <div className={`programming-ide-output-content ${error ? 'error' : ''}`}>
                            {error ? error : output}
                        </div>
                    </div>
                )}

                {/* Test Results */}
                {runResults && runResults.length > 0 && (
                    <div className="programming-ide-test-results">
                        <div className="programming-ide-test-results-header">
                            <span>Test Results</span>
                            <span className="programming-ide-test-summary">
                                {runResults.filter(r => r.passed).length} / {runResults.length} passed
                            </span>
                        </div>
                        <div className="programming-ide-test-list">
                            {runResults.map((result, index) => {
                                const testCase = exercise.test_cases[index];
                                return (
                                    <div
                                        key={index}
                                        className={`programming-ide-test-item ${result.passed ? 'passed' : 'failed'
                                            }`}
                                    >
                                        <div className="programming-ide-test-header">
                                            <span className="programming-ide-test-icon">
                                                {result.passed ? '✅' : '❌'}
                                            </span>
                                            <span className="programming-ide-test-name">
                                                Test Case {index + 1}
                                                {testCase?.description && `: ${testCase.description}`}
                                            </span>
                                            <span className="programming-ide-test-time">
                                                {result.execution_time}ms
                                            </span>
                                        </div>
                                        {!result.passed && (
                                            <div className="programming-ide-test-details">
                                                {testCase?.input && (
                                                    <div className="programming-ide-test-detail-row input">
                                                        <span className="label">Input:</span>
                                                        <code>{testCase.input}</code>
                                                    </div>
                                                )}
                                                <div className="programming-ide-test-detail-row">
                                                    <span className="label">Expected:</span>
                                                    <code>{result.expected_output || '(empty)'}</code>
                                                </div>
                                                <div className="programming-ide-test-detail-row">
                                                    <span className="label">Got:</span>
                                                    <code>{result.output || '(empty)'}</code>
                                                </div>
                                                {result.error && (
                                                    <div className="programming-ide-test-detail-row error">
                                                        <span className="label">Error:</span>
                                                        <code>{result.error}</code>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Submission Results */}
                {submitResults && (
                    <div className={`programming-ide-submission-result ${submitResults.passed ? 'success' : 'failed'
                        }`}>
                        <div className="programming-ide-submission-header">
                            <h3>
                                {submitResults.passed ? '🎉 Congratulations!' : '😢 Not quite there yet'}
                            </h3>
                            <div className="programming-ide-submission-score">
                                Score: {submitResults.score}%
                            </div>
                        </div>
                        <p>
                            You passed {submitResults.passed_test_cases} out of {submitResults.total_test_cases} test cases.
                        </p>
                        {submitResults.passed && (
                            <p className="programming-ide-submission-success-msg">
                                Great job! All test cases passed! 🎊
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Submission History */}
            <div className="programming-ide-history-section">
                <div className="programming-ide-history-header">
                    <h3 className="programming-ide-history-title">
                        📊 Submission History ({submissions.length})
                    </h3>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="programming-ide-history-toggle"
                    >
                        {showHistory ? '▼ Hide' : '▶ Show'}
                    </button>
                </div>

                {showHistory && (
                    <div className="programming-ide-history-content">
                        {loadingHistory ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                                Loading history...
                            </div>
                        ) : submissions.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                                No submissions yet. Submit your code to see your history here.
                            </div>
                        ) : (
                            <div className="programming-ide-history-list">
                                {submissions.map((sub, index) => (
                                    <div
                                        key={sub._id}
                                        className={`programming-ide-history-item ${sub.passed ? 'passed' : 'failed'}`}
                                    >
                                        <div className="programming-ide-history-item-header">
                                            <div className="programming-ide-history-item-info">
                                                <span className="programming-ide-history-attempt">
                                                    Attempt #{sub.attempt_number}
                                                </span>
                                                <span className="programming-ide-history-lang">
                                                    {sub.language === 'python' ? '🐍 Python' : '🟨 JavaScript'}
                                                </span>
                                            </div>
                                            <div className="programming-ide-history-item-result">
                                                <span className={`programming-ide-history-score ${sub.passed ? 'success' : 'failed'}`}>
                                                    {sub.score}%
                                                </span>
                                                <span className="programming-ide-history-status">
                                                    {sub.passed ? '✅ Passed' : '❌ Failed'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="programming-ide-history-item-meta">
                                            <span>
                                                {new Date(sub.createdAt).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                            <span>•</span>
                                            <span>
                                                {sub.test_results?.filter((r: any) => r.passed).length || 0}/
                                                {sub.test_results?.length || 0} tests passed
                                            </span>
                                            <span>•</span>
                                            <span>{sub.execution_time}ms</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (sub.language === selectedLanguage) {
                                                    setCode(sub.code);
                                                } else {
                                                    if (window.confirm(`This submission was in ${sub.language}. Switch to ${sub.language}?`)) {
                                                        setSelectedLanguage(sub.language);
                                                        setCode(sub.code);
                                                    }
                                                }
                                            }}
                                            className="programming-ide-history-load-btn"
                                        >
                                            Load Code
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProgrammingIDE;

