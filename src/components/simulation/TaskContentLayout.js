import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Spin, message } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import TipTapJsonRenderer from '@components/common/editor/TipTapJsonRenderer';
import useFetch from '@hooks/useFetch';
import { getData } from '@utils/localStorage';
import { storageKeys, UserTypes } from '@constants';
import apiConfig from '@constants/apiConfig';

import './TaskContentLayout.scss';

function QuizBlock({
    block,
    submittedAnswer = null,
    questionId = null,
    onQuizAnswerSubmit = () => {},
    hasCompleted = false,
}) {
    const [selected, setSelected] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);

    const correct = (block.options || []).findIndex((o) => o.answer === true);
    const savedAnswer = submittedAnswer?.answer;
    const savedOptionIndex = (block.options || []).findIndex(
        (o) => o.option === savedAnswer || o.value === savedAnswer,
    );

    const prevQuestionIdRef = useRef(questionId);
    const prevSavedAnswerRef = useRef(savedAnswer);

    useEffect(() => {
        const questionChanged = prevQuestionIdRef.current !== questionId;
        const resetTriggered = Boolean(prevSavedAnswerRef.current) && !savedAnswer;

        if (questionChanged || resetTriggered) {
            setIsRetrying(false);
            setSelected(null);
            setSubmitted(false);
        }

        prevQuestionIdRef.current = questionId;
        prevSavedAnswerRef.current = savedAnswer;
    }, [questionId, savedAnswer]);

    const effectiveSelected = savedAnswer && !isRetrying ? savedOptionIndex : selected;
    const effectiveSubmitted = Boolean(savedAnswer) && !isRetrying ? true : submitted;
    const isCorrect = effectiveSubmitted && effectiveSelected === correct;

    const handleSubmit = () => {
        if (selected === null) return;
        setSubmitted(true);
        const selectedOption = (block.options || [])[selected];
        onQuizAnswerSubmit({
            taskQuestionId: questionId,
            answer: selectedOption?.option || selectedOption?.value || '',
            isCorrect: selected === correct,
        });
    };

    const handleReset = () => {
        setSelected(null);
        setSubmitted(false);
        setIsRetrying(true);
    };

    return (
        <div
            className={`tfo-block-quiz${effectiveSubmitted ? (isCorrect ? ' quiz-correct' : ' quiz-wrong') : ''}`}
            style={{ marginTop: 24 }}
        >
            {/* Question */}
            <div className="tfo-block-quiz-question">
                <span className="tfo-block-quiz-icon">❓</span>
                <span className="tfo-block-quiz-text">{block.question}</span>
            </div>

            {/* Options */}
            <div className="tfo-block-quiz-options">
                {(block.options || []).map((opt, oi) => {
                    const letter = String.fromCharCode(65 + oi);
                    let cls = 'tfo-quiz-option';
                    if (effectiveSelected === oi) cls += ' selected';
                    if (effectiveSubmitted && oi === correct) cls += ' answer-correct';
                    if (effectiveSubmitted && effectiveSelected === oi && oi !== correct) cls += ' answer-wrong';

                    return (
                        <button
                            key={oi}
                            className={cls}
                            disabled={effectiveSubmitted || hasCompleted}
                            onClick={() => !(effectiveSubmitted || hasCompleted) && setSelected(oi)}
                            type="button"
                        >
                            <span className="tfo-quiz-option-letter">{letter}.</span>
                            <span className="tfo-quiz-option-text">{opt.option || opt.value}</span>
                            {effectiveSubmitted && oi === correct && (
                                <span className="tfo-quiz-option-badge correct">✓ Đúng</span>
                            )}
                            {effectiveSubmitted && effectiveSelected === oi && oi !== correct && (
                                <span className="tfo-quiz-option-badge wrong">✗ Sai</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="tfo-block-quiz-footer">
                {!effectiveSubmitted ? (
                    <button
                        className="tfo-quiz-submit-btn"
                        disabled={selected === null || hasCompleted}
                        onClick={handleSubmit}
                        type="button"
                    >
                        Kiểm tra đáp án
                    </button>
                ) : (
                    <div className="tfo-quiz-result-row">
                        <span className={`tfo-quiz-result-label ${isCorrect ? 'correct' : 'wrong'}`}>
                            {isCorrect ? '🎉 Chính xác!' : '😅 Chưa đúng, hãy thử lại!'}
                        </span>
                        {!isCorrect && (
                            <button
                                className="tfo-quiz-retry-btn"
                                disabled={hasCompleted}
                                onClick={handleReset}
                                type="button"
                            >
                                Làm lại
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

const isExternalUrl = (str) => {
    if (!str || typeof str !== 'string') return false;
    return /^(https?:\/\/|www\.)/i.test(str.trim());
};

function FileDropzone({ onFileChange = () => {}, previousFile = null, urlBase = '', disabled = false }) {
    const defaultMode = previousFile && isExternalUrl(previousFile) ? 'link' : 'file';
    const [mode, setMode] = useState(defaultMode);
    const [dragging, setDragging] = useState(false);
    const [file, setFile] = useState(null);
    const [linkInput, setLinkInput] = useState('');

    useEffect(() => {
        setFile(null);
        setLinkInput('');
        if (previousFile && isExternalUrl(previousFile)) {
            setMode('link');
        } else if (previousFile) {
            setMode('file');
        }
    }, [previousFile]);

    const handleDrop = (e) => {
        e.preventDefault();
        if (disabled || mode !== 'file') return;
        setDragging(false);
        const f = e.dataTransfer.files?.[0];
        if (f) {
            setFile(f);
            onFileChange(f);
        }
    };

    const handleFileChange = (e) => {
        if (disabled) return;
        const f = e.target.files?.[0];
        if (f) {
            setFile(f);
            onFileChange(f);
        }
    };

    const handleLinkSubmit = () => {
        if (disabled || !linkInput.trim()) return;
        onFileChange(linkInput.trim());
        setLinkInput('');
    };

    const handleLinkKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleLinkSubmit();
        }
    };

    const getFileName = (path) => {
        if (!path) return '';
        const parts = path.split('/');
        return decodeURIComponent(parts[parts.length - 1]);
    };

    const displayFileName = file ? file.name : previousFile && mode === 'file' ? getFileName(previousFile) : '';

    return (
        <div className={`tfo-upload-card${disabled ? ' disabled' : ''}`}>
            <div className="tfo-upload-label">Nộp Bài Làm Của Bạn</div>

            {!disabled && (
                <div className="tfo-submit-mode-tabs">
                    <button
                        type="button"
                        className={`tfo-submit-mode-tab${mode === 'file' ? ' active' : ''}`}
                        onClick={() => setMode('file')}
                    >
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ marginRight: 6 }}>
                            <path
                                d="M9 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V6L9 1z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M9 1v5h5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        Tải file lên
                    </button>
                    <button
                        type="button"
                        className={`tfo-submit-mode-tab${mode === 'link' ? ' active' : ''}`}
                        onClick={() => setMode('link')}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ marginRight: 6 }}>
                            <path
                                d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        Nhập đường dẫn / URL
                    </button>
                </div>
            )}

            {mode === 'file' && (
                <label
                    className={`tfo-dropzone${dragging ? ' dragging' : ''}${disabled ? ' disabled' : ''}`}
                    onDragOver={(e) => {
                        e.preventDefault();
                        if (!disabled) setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                >
                    {!disabled && <input type="file" style={{ display: 'none' }} onChange={handleFileChange} />}
                    <svg className="tfo-dropzone-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                            d="M8 1v10M4 5l4-4 4 4"
                            stroke="#5f5e5e"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                        <path
                            d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2"
                            stroke="#5f5e5e"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                        />
                    </svg>
                    {displayFileName ? (
                        <span className="tfo-file-chosen">
                            {previousFile && !file ? (
                                <a
                                    href={previousFile.startsWith('http') ? previousFile : `${urlBase}${previousFile}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="tfo-file-download-link"
                                >
                                    {displayFileName} (Tải xuống)
                                </a>
                            ) : (
                                displayFileName
                            )}
                        </span>
                    ) : (
                        <>
                            <span className="tfo-dropzone-select">Chọn một tệp</span>
                            <span className="tfo-dropzone-hint">hoặc kéo thả vào đây.</span>
                        </>
                    )}
                </label>
            )}

            {mode === 'link' && (
                <div className="tfo-link-input-wrapper">
                    {previousFile && isExternalUrl(previousFile) && (
                        <div className="tfo-link-submitted">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                                <path
                                    d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
                                    stroke="#0062E3"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
                                    stroke="#0062E3"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <span className="tfo-link-submitted-label">Đường dẫn đã nộp:</span>
                            <a
                                href={previousFile}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="tfo-file-download-link tfo-link-submitted-url"
                            >
                                {previousFile}
                            </a>
                        </div>
                    )}
                    {previousFile && !isExternalUrl(previousFile) && (
                        <div className="tfo-link-submitted">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                                <path
                                    d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
                                    stroke="#0062E3"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
                                    stroke="#0062E3"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <span className="tfo-link-submitted-label">Đường dẫn đã nộp:</span>
                            <span className="tfo-link-submitted-path">{previousFile}</span>
                        </div>
                    )}
                    {!disabled && (
                        <div className="tfo-link-input-row">
                            <input
                                type="text"
                                className="tfo-link-input"
                                placeholder="Nhập URL hoặc đường dẫn file (vd: https://drive.google.com/...)"
                                value={linkInput}
                                onChange={(e) => setLinkInput(e.target.value)}
                                onKeyDown={handleLinkKeyDown}
                                disabled={disabled}
                            />
                            <button
                                type="button"
                                className="tfo-link-submit-btn"
                                onClick={handleLinkSubmit}
                                disabled={disabled || !linkInput.trim()}
                            >
                                Nộp
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function TaskContentLayout({
    parentTasks = [],
    selectedParentTaskId,
    onSelectParentTask,

    subtasks = [],
    selectedSubtaskId,
    onSelectSubtask,

    pageTitle = '',
    taskHeading = '',
    taskDescriptionContent = '',
    content = '',
    mediaPath = null,
    urlBase = '',

    loading = false,

    canGoBack = false,
    canGoNext = false,
    isLastSubtask = false,
    onBack = () => {},
    onNext = () => {},

    quizSubmissionMap,
    requiresFileUpload: requiresFileUploadProp,
    requiresTextResponse: requiresTextResponseProp,
    previousFile = null,
    previousText = '',
    onFileChange = (fileOrLink) => {
        message.info(
            'Đây là chế độ xem trước (Preview). File nộp thử: ' +
                (typeof fileOrLink === 'string' ? fileOrLink : fileOrLink.name),
        );
    },
    onTextResponseSubmit = (text) => {
        message.info('Đây là chế độ xem trước (Preview). Nội dung nộp thử: ' + text);
    },
    onQuizAnswerSubmit = (ans) => {
        message.info(
            'Đây là chế độ xem trước (Preview). Trả lời quiz: ' +
                ans.answer +
                (ans.isCorrect ? ' (Đúng)' : ' (Chưa đúng)'),
        );
    },
    hasCompleted = false,

    customStepButton,
    customTaskCircle,
    rightPane,
    reviewPane,

    children,
}) {
    // State for subtask questions
    const [subtaskQuestions, setSubtaskQuestions] = useState([]);
    const [questionsLoaded, setQuestionsLoaded] = useState(false);
    const [inlineQuestionIds, setInlineQuestionIds] = useState([]);

    const isEducator = getData(storageKeys.USER_TYPE) === UserTypes.EDUCATOR;
    const { execute: fetchQuestions } = useFetch(
        isEducator ? apiConfig.taskQuestion.educatorList : apiConfig.taskQuestion.getList,
        {
            immediate: false,
            onCompleted: (response) => {
                const resData = response?.data || (response?.result === undefined ? response : null);
                if (resData) {
                    const fetched = (resData.content || []).map((q) => {
                        let parsedOptions = [];
                        const rawOptions =
                            q.options ?? q.answers ?? q.choices ?? q.questionOptions ?? q.taskQuestionOptions;
                        if (rawOptions) {
                            if (Array.isArray(rawOptions)) {
                                parsedOptions = rawOptions;
                            } else if (typeof rawOptions === 'string') {
                                try {
                                    parsedOptions = JSON.parse(rawOptions);
                                } catch (_) {
                                    parsedOptions = [];
                                }
                            }
                        }

                        const mappedOptions = parsedOptions.map((opt) => ({
                            option:
                                opt.option ??
                                opt.content ??
                                opt.value ??
                                opt.text ??
                                opt.choice ??
                                opt.answer ??
                                opt.optionText ??
                                opt.optionContent ??
                                '',
                            answer:
                                opt.answer === true ||
                                opt.isCorrect === true ||
                                opt.is_correct === true ||
                                opt.correct === true ||
                                opt.isAnswer === true ||
                                opt.is_answer === true ||
                                opt.answer === 'true',
                            value:
                                opt.value ??
                                opt.option ??
                                opt.content ??
                                opt.text ??
                                opt.choice ??
                                opt.answer ??
                                opt.optionText ??
                                opt.optionContent ??
                                '',
                        }));

                        return {
                            ...q,
                            question: q.question ?? q.content ?? '',
                            options: mappedOptions,
                        };
                    });
                    setSubtaskQuestions(fetched);
                }
                setQuestionsLoaded(true);
            },
            onError: () => setQuestionsLoaded(true),
        },
    );

    // Load questions whenever a subtask is selected
    useEffect(() => {
        setInlineQuestionIds([]);
        if (selectedSubtaskId) {
            setQuestionsLoaded(false);
            fetchQuestions({ params: { taskId: selectedSubtaskId, page: 0, size: 100 } });
        } else {
            setSubtaskQuestions([]);
            setQuestionsLoaded(true);
        }
    }, [selectedSubtaskId]);

    const currentQuestionMap = useMemo(() => {
        const map = {};
        subtaskQuestions.forEach((q) => {
            if (q.id != null) {
                // Map database ID as string to string ID
                map[String(q.id)] = String(q.id);
                if (q.code) {
                    map[String(q.code)] = String(q.id);
                }
                const textKey = (q.question || '').trim();
                if (textKey) {
                    map[textKey] = String(q.id);
                }
            }
        });
        return map;
    }, [subtaskQuestions]);

    const renderMedia = () => {
        if (!mediaPath) return null;
        const fullMediaPath = mediaPath.startsWith('http') ? mediaPath : `${urlBase}${mediaPath}`;
        const ext = mediaPath.split('.').pop().toLowerCase();

        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
            return (
                <div className="tfo-media-section">
                    <div className="tfo-media-container">
                        <img src={fullMediaPath} alt="Task media" className="tfo-media-img" />
                    </div>
                </div>
            );
        }
        if (['mp4', 'webm', 'ogg'].includes(ext)) {
            return (
                <div className="tfo-media-section">
                    <div className="tfo-media-container">
                        <video controls className="tfo-media-video">
                            <source src={fullMediaPath} type={`video/${ext}`} />
                        </video>
                    </div>
                </div>
            );
        }
        return null;
    };

    const [textInput, setTextInput] = useState('');

    useEffect(() => {
        setTextInput(previousText || '');
    }, [previousText]);

    const selectedSubtask = useMemo(() => {
        return subtasks.find((st) => st.id === selectedSubtaskId);
    }, [subtasks, selectedSubtaskId]);

    const subType = selectedSubtask ? Number(selectedSubtask.submissionType) : 0;
    const finalRequiresFileUpload =
        requiresFileUploadProp !== undefined ? requiresFileUploadProp : subType === 1 || subType === 3;
    const finalRequiresTextResponse =
        requiresTextResponseProp !== undefined ? requiresTextResponseProp : subType === 2 || subType === 3;
    const isCompleted = hasCompleted || false;

    if (loading || !questionsLoaded) {
        return (
            <div
                className="tfo-content-area"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}
            >
                <Spin size="large" />
            </div>
        );
    }

    return (
        <>
            <div className="tfo-content-area">
                <aside className="tfo-sidebar">
                    <div className="tfo-sidebar-header">
                        <span className="tfo-sidebar-header-title">Danh sách nhiệm vụ</span>
                    </div>
                    <div className="tfo-separator" />
                    <div className="tfo-task-list">
                        {parentTasks.map((task, idx) => {
                            const isActive = selectedParentTaskId === task.id;
                            const isLast = idx === parentTasks.length - 1;

                            return (
                                <div key={task.id || idx} className="tfo-task-list-row">
                                    <div className="tfo-task-timeline">
                                        {customTaskCircle ? (
                                            customTaskCircle(task, idx, isActive, isLast)
                                        ) : (
                                            <button
                                                className={`tfo-task-circle${isActive ? ' active' : ''}`}
                                                onClick={() => onSelectParentTask(task.id)}
                                            >
                                                {idx + 1}
                                            </button>
                                        )}
                                        {!isLast && <div className="tfo-task-connector" />}
                                    </div>
                                    <button
                                        className="tfo-task-content-btn"
                                        onClick={() => onSelectParentTask(task.id)}
                                    >
                                        <div className={`tfo-task-title${isActive ? ' active' : ''}`}>
                                            {task.title || task.name}
                                        </div>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </aside>

                <main className="tfo-pane">
                    <div className="tfo-pane-layout">
                        <div className="tfo-pane-left">
                            <div className="tfo-pane-topbar">
                                <div className="tfo-pane-title">{pageTitle}</div>
                                {subtasks.length > 0 && (
                                    <div className="tfo-step-pagination">
                                        {subtasks.map((st, index) => {
                                            const isActiveSub = st.id === selectedSubtaskId;
                                            if (customStepButton) {
                                                return customStepButton(st, index, isActiveSub);
                                            }
                                            return (
                                                <button
                                                    key={st.id}
                                                    className={`tfo-step-btn${isActiveSub ? ' active' : ''}`}
                                                    onClick={() => onSelectSubtask(st.id)}
                                                >
                                                    {index + 1}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="tfo-separator" />

                            <div className="tfo-task-content">
                                <div className="tfo-task-heading-container">
                                    <div className="tfo-task-heading">{taskHeading}</div>
                                </div>

                                <div className="tfo-task-body">
                                    {taskDescriptionContent && (
                                        <p className="tfo-body-text" style={{ whiteSpace: 'pre-line' }}>
                                            {taskDescriptionContent}
                                        </p>
                                    )}

                                    {content && (
                                        <TipTapJsonRenderer
                                            content={content}
                                            quizSubmissionMap={quizSubmissionMap}
                                            questionMap={currentQuestionMap}
                                            onQuestionRendered={setInlineQuestionIds}
                                        />
                                    )}

                                    {!taskDescriptionContent && !content && (
                                        <div className="tfo-empty-body-placeholder">
                                            <FileTextOutlined className="tfo-empty-body-icon" />
                                        </div>
                                    )}

                                    {/* Render questions fetched from API that are not inline */}
                                    {subtaskQuestions && subtaskQuestions.length > 0 && (
                                        <div className="tfo-blocks-content" style={{ marginTop: 24 }}>
                                            {subtaskQuestions
                                                .filter((q) => !inlineQuestionIds.includes(String(q.id)))
                                                .map((block) => (
                                                    <QuizBlock
                                                        key={block.id}
                                                        block={block}
                                                        submittedAnswer={
                                                            quizSubmissionMap
                                                                ? quizSubmissionMap[String(block.id)]
                                                                : null
                                                        }
                                                        questionId={String(block.id)}
                                                        onQuizAnswerSubmit={onQuizAnswerSubmit}
                                                        hasCompleted={hasCompleted}
                                                    />
                                                ))}
                                        </div>
                                    )}

                                    {renderMedia()}

                                    {/* File upload section */}
                                    {finalRequiresFileUpload && (
                                        <div className="tfo-upload-section">
                                            <FileDropzone
                                                onFileChange={onFileChange}
                                                previousFile={previousFile}
                                                urlBase={urlBase}
                                                disabled={isCompleted}
                                            />
                                        </div>
                                    )}

                                    {/* Text response section */}
                                    {finalRequiresTextResponse && (
                                        <div className="tfo-text-response-section">
                                            <div className="tfo-text-response-label">Câu trả lời của bạn</div>
                                            <textarea
                                                className="tfo-text-response-textarea"
                                                placeholder="Nhập câu trả lời của bạn ở đây..."
                                                value={textInput}
                                                onChange={(e) => setTextInput(e.target.value)}
                                                disabled={isCompleted || Boolean(previousText)}
                                                rows={6}
                                            />
                                            <div className="tfo-text-response-footer">
                                                <button
                                                    className="tfo-btn-next tfo-text-submit-btn"
                                                    onClick={() => onTextResponseSubmit(textInput)}
                                                    disabled={isCompleted || Boolean(previousText) || !textInput.trim()}
                                                    type="button"
                                                >
                                                    Nộp câu trả lời
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {children}
                                </div>
                            </div>

                            {reviewPane && <div className="tfo-review-pane-inline">{reviewPane}</div>}
                        </div>

                        {rightPane && <div className="tfo-pane-right">{rightPane}</div>}
                    </div>

                    <footer className="tfo-footer-nav">
                        <div className="tfo-footer-inner">
                            <div className="tfo-footer-buttons">
                                <button className="tfo-btn-back" onClick={onBack} disabled={!canGoBack}>
                                    Quay lại
                                </button>
                                <button className="tfo-btn-next" onClick={onNext} disabled={!canGoNext}>
                                    {isLastSubtask ? 'Hoàn thành' : 'Tiếp tục'}
                                </button>
                            </div>
                        </div>
                    </footer>
                </main>
            </div>
        </>
    );
}
