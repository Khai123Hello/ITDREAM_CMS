import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, Tag, Button, Space, Modal, Spin, Avatar, Input, message, Tooltip, Table } from 'antd';
import {
    ArrowLeftOutlined,
    CloseOutlined,
    EditOutlined,
    DeleteOutlined,
    SaveOutlined,
    DownloadOutlined,
    MessageOutlined,
    UserOutlined,
    CheckCircleFilled,
    SendOutlined,
    CheckOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import PageWrapper from '@components/common/layout/PageWrapper';
import useFetch from '@hooks/useFetch';
import useTranslate from '@hooks/useTranslate';
import useAuth from '@hooks/useAuth';
import useNotification from '@hooks/useNotification';

import apiConfig from '@constants/apiConfig';
import { AppConstants, UserTypes, storageKeys } from '@constants';
import { getData } from '@utils/localStorage';
import { commonMessage } from '@locales/intl';

import './StudentReviewDetailPage.scss';

// Enable relativeTime for dayjs and set Vietnamese locale
dayjs.extend(relativeTime);

/* ─────────────────────────── Helper Components & Functions ─────────────────────────── */

const parseSubtaskName = (name = '') => {
    const match = name.match(/^SUB_T(\d+)_S(\d+)(_.*)?$/);
    if (!match) return null;

    const suffix = match[3] || '';
    return {
        parentOrder: parseInt(match[1], 10),
        subtaskOrder: parseInt(match[2], 10),
        suffix,
        requiresFileUpload: suffix === '_FILE' || suffix === '_FILE_TEXT',
        requiresTextResponse: suffix === '_TEXT' || suffix === '_FILE_TEXT',
    };
};

const getSubmissionAnswer = (submission = {}) => submission.answer || submission.answear || '';

const getSubmissions = (progressDetail = {}) => {
    if (Array.isArray(progressDetail?.studentSubmission?.content)) {
        return progressDetail.studentSubmission.content;
    }
    if (Array.isArray(progressDetail?.studentSubmission)) {
        return progressDetail.studentSubmission;
    }
    if (Array.isArray(progressDetail?.content)) {
        return progressDetail.content;
    }
    return [];
};

function detectContentType(content) {
    if (!content || typeof content !== 'string') return 'empty';
    const trimmed = content.trim();
    if (trimmed.startsWith('[')) {
        try {
            const p = JSON.parse(trimmed);
            if (Array.isArray(p)) return 'blocks';
        } catch {
            // ignore
        }
    }
    if (/^#{1,3}\s|\*\s|\*\*/m.test(trimmed)) return 'markdown';
    return 'text';
}

function parseInline(text) {
    if (!text) return '';
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

function PlainTextContent({ text }) {
    return (
        <div className="tfo-plain-text">
            {text.split('\n\n').map((para, i) => (
                <p key={i}>{para.trim()}</p>
            ))}
        </div>
    );
}

function MarkdownContent({ text }) {
    const lines = text.split('\n');
    const elements = [];
    let listItems = [];
    let key = 0;

    const flushList = () => {
        if (listItems.length) {
            elements.push(
                <ul key={key++} className="tfo-md-list">
                    {listItems.map((li, i) => (
                        <li key={i} dangerouslySetInnerHTML={{ __html: parseInline(li) }} />
                    ))}
                </ul>,
            );
            listItems = [];
        }
    };

    lines.forEach((line) => {
        const h3 = line.match(/^###\s+(.+)/);
        const h2 = line.match(/^##\s+(.+)/);
        const h1 = line.match(/^#\s+(.+)/);
        const li = line.match(/^\*\s+(.+)/);
        const blank = line.trim() === '';

        if (h1) {
            flushList();
            elements.push(
                <h2 key={key++} className="tfo-block-h1">
                    {h1[1]}
                </h2>,
            );
            return;
        }
        if (h2) {
            flushList();
            elements.push(
                <h2 key={key++} className="tfo-block-h2">
                    {h2[1]}
                </h2>,
            );
            return;
        }
        if (h3) {
            flushList();
            elements.push(
                <h3 key={key++} className="tfo-block-h3">
                    {h3[1]}
                </h3>,
            );
            return;
        }
        if (li) {
            listItems.push(li[1]);
            return;
        }
        if (blank) {
            flushList();
            return;
        }
        flushList();
        elements.push(
            <p key={key++} className="tfo-block-text" dangerouslySetInnerHTML={{ __html: parseInline(line) }} />,
        );
    });
    flushList();
    return <div className="tfo-markdown-content">{elements}</div>;
}

function QuizBlock({ block, studentAnswer = null, correctIndex = null }) {
    return (
        <div
            className={`tfo-block-quiz${studentAnswer ? (studentAnswer.isCorrect ? ' quiz-correct' : ' quiz-wrong') : ''}`}
        >
            <div className="tfo-block-quiz-question">
                <span className="tfo-block-quiz-icon">❓</span>
                <span className="tfo-block-quiz-text">{block.question}</span>
            </div>

            <div className="tfo-block-quiz-options">
                {(block.options || []).map((opt, oi) => {
                    const letter = String.fromCharCode(65 + oi);
                    let cls = 'tfo-quiz-option';

                    const isSelected = studentAnswer?.answer === opt.option || studentAnswer?.answer === opt.value;
                    const isCorrect = oi === correctIndex;

                    if (isSelected) cls += ' selected';
                    if (isCorrect) cls += ' answer-correct';
                    if (isSelected && !isCorrect) cls += ' answer-wrong';

                    return (
                        <div key={oi} className={cls}>
                            <span className="tfo-quiz-option-letter">{letter}.</span>
                            <span className="tfo-quiz-option-text">{opt.option}</span>
                            {isCorrect && <span className="tfo-quiz-option-badge correct">✓ Đúng</span>}
                            {isSelected && !isCorrect && (
                                <span className="tfo-quiz-option-badge wrong">✗ Học viên chọn</span>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="tfo-block-quiz-footer">
                {studentAnswer ? (
                    <span className={`tfo-quiz-result-label ${studentAnswer.isCorrect ? 'correct' : 'wrong'}`}>
                        {studentAnswer.isCorrect ? '🎉 Học viên trả lời chính xác!' : '😅 Học viên trả lời chưa đúng!'}
                    </span>
                ) : (
                    <span className="tfo-quiz-result-label" style={{ color: '#8c8c8c' }}>
                        Học viên chưa làm câu này.
                    </span>
                )}
            </div>
        </div>
    );
}

function BlockItem({ block, idx, allBlocks, quizSubmissionMap = {}, questionMap = {} }) {
    switch (block.type) {
                    case 'meta':
                        return (
                            <div className="tfo-block-meta">
                                <span className="tfo-block-meta-val">{block.duration}</span>
                                <span className="tfo-block-meta-dot">·</span>
                                <span className="tfo-block-meta-val">{block.level}</span>
                            </div>
                        );

                    case 'section':
                        return (
                            <div className="tfo-block-section">
                                <div className="tfo-block-section-header">
                                    <span className="tfo-block-section-icon">{block.icon}</span>
                                    <span className="tfo-block-section-title">{block.title}</span>
                                </div>
                                <ul className="tfo-block-section-list">
                                    {(block.bullets || []).filter(Boolean).map((b, i) => (
                                        <li key={i}>{b}</li>
                                    ))}
                                </ul>
                            </div>
                        );

                    case 'text':
                        return <p className="tfo-block-text">{block.content}</p>;

                    case 'h1':
                        return <h2 className="tfo-block-h1">{block.content}</h2>;

                    case 'h2':
                        return <h3 className="tfo-block-h2">{block.content}</h3>;

                    case 'h3':
                        return <h4 className="tfo-block-h3">{block.content}</h4>;

                    case 'bullet':
                        return (
                            <div className="tfo-block-bullet-wrap">
                                <span className="tfo-block-bullet-dot">•</span>
                                <span className="tfo-block-bullet-text">{block.content}</span>
                            </div>
                        );

                    case 'numbered': {
                        const num = allBlocks.filter((b, i) => b.type === 'numbered' && i <= idx).length;
                        return (
                            <div className="tfo-block-bullet-wrap">
                                <span className="tfo-block-num-label">{num}.</span>
                                <span className="tfo-block-bullet-text">{block.content}</span>
                            </div>
                        );
                    }

                    case 'divider':
                        return <hr className="tfo-block-divider" />;

                    case 'callout':
                        return (
                            <div className="tfo-block-callout">
                                <span className="tfo-block-callout-icon">{block.icon || '💡'}</span>
                                <span className="tfo-block-callout-text">{block.content}</span>
                            </div>
                        );

                    case 'code':
                        return (
                            <div className="tfo-block-code">
                                <pre>{block.content}</pre>
                            </div>
                        );

                    case 'step': {
                        const renderStepBody = (text) => {
                            if (!text) return '';
                            const parts = text.split(/(`[^`]+`)/g);
                            return parts.map((part, pi) => {
                                if (part.startsWith('`') && part.endsWith('`')) {
                                    return <code key={pi}>{part.slice(1, -1)}</code>;
                                }
                                return part;
                            });
                        };
                        return (
                            <div className="tfo-block-step">
                                <div className="tfo-block-step-badge">{idx + 1}</div>
                                <div className="tfo-block-step-content">
                                    <span className="tfo-block-step-label">{block.label}</span>
                                    <span className="tfo-block-step-body">{renderStepBody(block.body)}</span>
                                </div>
                            </div>
                        );
                    }

                    case 'quiz': {
                        const questionKey = (block.question || '').trim();
                        const questionId = questionKey ? (questionMap[questionKey] ?? null) : null;
                        const studentAnswer = questionId ? quizSubmissionMap[questionId] : null;
                        const correctIndex = (block.options || []).findIndex((o) => o.answer === true);
                        return <QuizBlock block={block} studentAnswer={studentAnswer} correctIndex={correctIndex} />;
                    }

                    default:
                        return null;
    }
}

function BlocksContent({ blocksJson, quizSubmissionMap = {}, questionMap = {} }) {
    const blocks = useMemo(() => {
        try {
            return JSON.parse(blocksJson);
        } catch {
            return [];
        }
    }, [blocksJson]);

    return (
        <div className="tfo-blocks-content">
            {blocks.map((block, idx) => (
                <BlockItem
                    key={block.id || idx}
                    block={block}
                    idx={idx}
                    allBlocks={blocks}
                    quizSubmissionMap={quizSubmissionMap}
                    questionMap={questionMap}
                />
            ))}
        </div>
    );
}

function ContentRenderer({ content, quizSubmissionMap = {}, questionMap = {} }) {
    const type = useMemo(() => detectContentType(content), [content]);
    if (type === 'empty') return <p className="tfo-empty-content">Không có nội dung.</p>;
    if (type === 'blocks') {
        return <BlocksContent blocksJson={content} quizSubmissionMap={quizSubmissionMap} questionMap={questionMap} />;
    }
    if (type === 'markdown') return <MarkdownContent text={content} />;
    return <PlainTextContent text={content} />;
}

/* ─────────────────────────── CommentPanel Component ─────────────────────────── */

const getInitials = (fullName) => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const getAvatarColor = (name) => {
    const colors = [
        'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
        'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
        'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    ];
    let hash = 0;
    const cleanName = name || '';
    for (let i = 0; i < cleanName.length; i++) {
        hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

function CommentPanel({
    comments = [],
    loading = false,
    profile = {},
    onClose = () => {},
    onSendComment = () => {},
    onUpdateComment = () => {},
}) {
    const [mainText, setMainText] = useState('');
    const [replyingToId, setReplyingToId] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');
    const listEndRef = useRef(null);

    const rootComments = useMemo(() => {
        return comments.filter((c) => !c.parentId || c.parentId === 0);
    }, [comments]);

    const repliesMap = useMemo(() => {
        const map = {};
        const childComments = comments.filter((c) => c.parentId && c.parentId !== 0);

        childComments.forEach((reply) => {
            let rootId = reply.parentId;
            let parent = comments.find((c) => c.id === rootId);

            while (parent && parent.parentId && parent.parentId !== 0) {
                rootId = parent.parentId;
                parent = comments.find((c) => c.id === rootId);
            }

            if (!map[rootId]) {
                map[rootId] = [];
            }
            map[rootId].push(reply);
        });

        Object.keys(map).forEach((rootId) => {
            map[rootId].sort((a, b) => new Date(a.createdDate) - new Date(b.createdDate));
        });

        return map;
    }, [comments]);

    const handleMainSubmit = (e) => {
        e.preventDefault();
        if (!mainText.trim()) return;
        onSendComment(mainText.trim(), 0);
        setMainText('');
    };

    const handleReplySubmit = (e, parentId) => {
        e.preventDefault();
        if (!replyText.trim()) return;
        onSendComment(replyText.trim(), parentId);
        setReplyText('');
        setReplyingToId(null);
    };

    const handleEditSubmit = (e, commentId) => {
        e.preventDefault();
        if (!editText.trim()) return;
        onUpdateComment(commentId, editText.trim());
        setEditingId(null);
        setEditText('');
    };

    useEffect(() => {
        if (listEndRef.current) {
            listEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [comments.length]);

    const renderAvatar = (user) => {
        const fullName = user?.fullName || user?.username || 'Học viên';
        const initials = getInitials(fullName);
        const bg = getAvatarColor(fullName);

        if (user?.avatar && user.avatar.startsWith('http')) {
            return <img src={user.avatar} alt={fullName} className="tfo-comment-avatar" />;
        }

        return (
            <div className="tfo-comment-avatar-initials" style={{ background: bg }}>
                {initials}
            </div>
        );
    };

    const currentUsername = profile?.username || '';

    const renderCommentCard = (comment, isReply = false) => {
        const isSelf = comment.user?.username === currentUsername;
        const isEditing = editingId === comment.id;
        const isReplying = replyingToId === comment.id;

        return (
            <div key={comment.id} className={`tfo-comment-card${isReply ? ' reply' : ''}`}>
                <div className="tfo-comment-card-header">
                    {renderAvatar(comment.user)}
                    <div className="tfo-comment-user-info">
                        <span className="tfo-comment-fullname">
                            {comment.user?.fullName || comment.user?.username || 'Học viên'}
                        </span>
                        <span className="tfo-comment-time">{dayjs(comment.createdDate).fromNow()}</span>
                    </div>
                    {isSelf && !isEditing && (
                        <button
                            className="tfo-comment-edit-btn"
                            onClick={() => {
                                setEditingId(comment.id);
                                setEditText(comment.content);
                                setReplyingToId(null);
                            }}
                            title="Sửa bình luận"
                        >
                            <EditOutlined style={{ fontSize: 12 }} />
                        </button>
                    )}
                </div>

                <div className="tfo-comment-card-body">
                    {isEditing ? (
                        <form onSubmit={(e) => handleEditSubmit(e, comment.id)} className="tfo-comment-edit-form">
                            <textarea
                                className="tfo-comment-input-textarea"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                rows={2}
                                autoFocus
                            />
                            <div className="tfo-comment-input-actions">
                                <button
                                    type="button"
                                    className="tfo-comment-btn-text"
                                    onClick={() => setEditingId(null)}
                                >
                                    Hủy
                                </button>
                                <button type="submit" className="tfo-comment-btn-filled" disabled={!editText.trim()}>
                                    Lưu
                                </button>
                            </div>
                        </form>
                    ) : (
                        <p className="tfo-comment-text">
                            {comment.replyToUser && (
                                <span className="tfo-comment-mention">@{comment.replyToUser} </span>
                            )}
                            {comment.content}
                        </p>
                    )}
                </div>

                {!isEditing && (
                    <div className="tfo-comment-card-footer">
                        <button
                            className="tfo-comment-action-link"
                            onClick={() => {
                                setReplyingToId(comment.id);
                                setReplyText('');
                                setEditingId(null);
                            }}
                        >
                            Trả lời
                        </button>
                    </div>
                )}

                {isReplying && (
                    <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="tfo-comment-reply-form">
                        <textarea
                            className="tfo-comment-input-textarea"
                            placeholder={`Trả lời...`}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={2}
                            autoFocus
                        />
                        <div className="tfo-comment-input-actions">
                            <button
                                type="button"
                                className="tfo-comment-btn-text"
                                onClick={() => setReplyingToId(null)}
                            >
                                Hủy
                            </button>
                            <button type="submit" className="tfo-comment-btn-filled" disabled={!replyText.trim()}>
                                Gửi
                            </button>
                        </div>
                    </form>
                )}
            </div>
        );
    };

    return (
        <div className="tfo-comments-panel">
            <div className="tfo-comments-panel-header">
                <h3 className="tfo-comments-panel-title">Bình luận ({comments.length})</h3>
                <button className="tfo-comments-close-btn" onClick={onClose} title="Đóng bình luận">
                    <CloseOutlined style={{ fontSize: 16 }} />
                </button>
            </div>

            <div className="tfo-comments-list-container">
                {loading && comments.length === 0 ? (
                    <div className="tfo-comments-loading" style={{ padding: '24px', textAlign: 'center' }}>
                        <Spin size="medium" />
                    </div>
                ) : comments.length === 0 ? (
                    <div
                        className="tfo-comments-empty"
                        style={{ padding: '24px', textAlign: 'center', color: '#8c8c8c' }}
                    >
                        <p>Chưa có bình luận nào. Hãy bắt đầu cuộc trò chuyện!</p>
                    </div>
                ) : (
                    <div className="tfo-comments-scrollable">
                        {rootComments.map((root) => {
                            const threadReplies = repliesMap[root.id] || [];
                            return (
                                <div key={root.id} className="tfo-comment-thread">
                                    {renderCommentCard(root, false)}
                                    {threadReplies.length > 0 && (
                                        <div className="tfo-comment-thread-replies">
                                            <div className="tfo-comment-thread-line" />
                                            <div className="tfo-comment-replies-list">
                                                {threadReplies.map((reply) => (
                                                    <div key={reply.id} className="tfo-comment-reply-item">
                                                        <span style={{ color: '#d9d9d9', marginRight: 4 }}>↳</span>
                                                        {renderCommentCard(reply, true)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        <div ref={listEndRef} />
                    </div>
                )}
            </div>

            <form onSubmit={handleMainSubmit} className="tfo-comments-panel-footer">
                <textarea
                    className="tfo-comments-main-textarea"
                    placeholder="Viết bình luận..."
                    value={mainText}
                    onChange={(e) => setMainText(e.target.value)}
                    rows={2}
                />
                <button
                    type="submit"
                    className="tfo-comments-send-btn"
                    disabled={!mainText.trim()}
                    title="Gửi bình luận"
                >
                    <SaveOutlined style={{ fontSize: 16 }} />
                </button>
            </form>
        </div>
    );
}

/* ─────────────────────────── Main StudentReviewDetailPage ─────────────────────────── */

const StudentReviewDetailPage = ({ pageOptions }) => {
    const translate = useTranslate();
    const notify = useNotification();
    const navigate = useNavigate();
    const location = useLocation();
    const { simulationId, username } = useParams();
    const { profile } = useAuth();

    const userType = getData(storageKeys.USER_TYPE);
    const isEducator = userType === UserTypes.EDUCATOR;

    // State
    const [simulationEnrollmentId, setSimulationEnrollmentId] = useState(
        () => location.state?.simulationEnrollmentId || null,
    );
    const [enrollment, setEnrollment] = useState(null);
    const [selectedParentTaskId, setSelectedParentTaskId] = useState(null);
    const [selectedSubtaskId, setSelectedSubtaskId] = useState(null);
    const [isCompleted, setIsCompleted] = useState(false);

    // Educator review editing states (per subtask)
    const [reviewContentInput, setReviewContentInput] = useState('');
    const [isEditingReview, setIsEditingReview] = useState(false);

    // Comments Panel state
    const [showComments, setShowComments] = useState(false);

    // API calls

    // 1. Fetch simulation detail
    const { data: simulationDetail, loading: loadingSimulation } = useFetch(
        isEducator ? apiConfig.simulation.getSimulationForEducator : apiConfig.simulation.getById,
        {
            immediate: true,
            pathParams: { id: simulationId },
            mappingData: (res) => res.data,
        },
    );

    // 2. Fetch tasks for sidebar timeline
    const { data: tasks, loading: loadingTasks } = useFetch(
        isEducator ? apiConfig.task.listByEducator : apiConfig.task.getList,
        {
            immediate: true,
            params: { simulationId, size: 1000 },
            mappingData: (res) => res.data?.content || [],
        },
    );

    // 3. Fallback: Fetch student completes to resolve simulationEnrollmentId if missing in state
    const { execute: fetchEnrollments } = useFetch(apiConfig.simulation.studentComplete, {
        immediate: false,
    });

    useEffect(() => {
        if (!simulationEnrollmentId && simulationId) {
            fetchEnrollments({
                params: { simulationId },
                onCompleted: (res) => {
                    const list = res.data?.content || [];
                    // API trả về { student: { profileAccountDto }, isReviewed }
                    const found = list.find((item) => item.student?.profileAccountDto?.username === username);
                    if (found) {
                        setSimulationEnrollmentId(found.id);
                        setEnrollment(found);
                    } else {
                        notify({
                            type: 'error',
                            message: 'Không tìm thấy thông tin đăng ký của học viên này!',
                        });
                    }
                },
                onError: () => {
                    notify({
                        type: 'error',
                        message: 'Lỗi tải danh sách học viên hoàn thành!',
                    });
                },
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [simulationEnrollmentId, simulationId, username]);

    // 4. Load task progress list once simulationEnrollmentId is resolved
    const {
        data: progressList,
        loading: loadingProgress,
        execute: refetchProgress,
    } = useFetch(apiConfig.taskProgress.list, {
        immediate: false,
        mappingData: (res) => res.data?.content || [],
    });

    useEffect(() => {
        if (simulationEnrollmentId) {
            refetchProgress({
                params: { simulationEnrollmentId, size: 1000 },
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [simulationEnrollmentId]);

    // 5. Load educator reviews for the simulation enrollment to map them
    const { data: educatorReviews, execute: refetchReviews } = useFetch(apiConfig.reviewSubmission.educatorList, {
        immediate: false,
        mappingData: (res) => res.data?.content || [],
    });

    useEffect(() => {
        if (simulationEnrollmentId) {
            refetchReviews({
                params: { simulationEnrollmentId, size: 1000 },
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [simulationEnrollmentId]);

    // Map parent tasks and subtasks
    const parentTasks = useMemo(() => tasks?.filter((t) => t.kind === 1) || [], [tasks]);

    // Handle initial selections
    useEffect(() => {
        if (parentTasks.length > 0 && !selectedParentTaskId) {
            setSelectedParentTaskId(parentTasks[0].id);
        }
    }, [parentTasks, selectedParentTaskId]);

    const subtasks = useMemo(() => {
        if (!selectedParentTaskId) return [];
        return (
            tasks
                ?.filter(
                    (t) =>
                        t.kind === 2 && (t.parent?.id === selectedParentTaskId || t.parentId === selectedParentTaskId),
                )
                .sort((a, b) => (a.orderInParent || 0) - (b.orderInParent || 0)) || []
        );
    }, [tasks, selectedParentTaskId]);

    useEffect(() => {
        if (subtasks.length > 0) {
            const exists = subtasks.some((s) => s.id === selectedSubtaskId);
            if (!selectedSubtaskId || !exists) {
                setSelectedSubtaskId(subtasks[0].id);
            }
        } else {
            setSelectedSubtaskId(null);
        }
    }, [subtasks, selectedSubtaskId]);

    // 6. Fetch selected subtask details
    const {
        data: subtaskDetail,
        loading: loadingSubtask,
        execute: fetchSubtaskDetail,
    } = useFetch(isEducator ? apiConfig.task.getByEducator : apiConfig.task.getById, {
        immediate: false,
        mappingData: (res) => res.data,
    });

    useEffect(() => {
        if (selectedSubtaskId) {
            fetchSubtaskDetail({
                pathParams: { id: selectedSubtaskId },
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSubtaskId]);

    // Find progress ID for active subtask
    const activeSubtaskProgress = useMemo(() => {
        if (!selectedSubtaskId || !progressList) return null;
        return progressList.find((p) => p.task?.id === selectedSubtaskId);
    }, [selectedSubtaskId, progressList]);

    // 7. Fetch active subtask progress detail (to get actual student submissions)
    // FIX: dùng educatorGet thay vì get — endpoint /get/:id yêu cầu isAdmin(), educator dùng /educator_get/:id
    const {
        data: progressDetail,
        loading: loadingProgressDetail,
        execute: fetchProgressDetail,
    } = useFetch(apiConfig.taskProgress.educatorGet, {
        immediate: false,
        mappingData: (res) => res.data,
    });

    useEffect(() => {
        if (activeSubtaskProgress?.id) {
            fetchProgressDetail({
                pathParams: { id: activeSubtaskProgress.id },
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSubtaskProgress?.id]);

    // Build submissions data
    const submissions = useMemo(() => getSubmissions(progressDetail), [progressDetail]);

    const parsedSubtaskName = useMemo(() => parseSubtaskName(subtaskDetail?.name || ''), [subtaskDetail]);
    const requiresFileUpload = parsedSubtaskName?.requiresFileUpload || false;
    const requiresTextResponse = parsedSubtaskName?.requiresTextResponse || false;

    const fileSub = useMemo(() => {
        if (!requiresFileUpload) return null;
        return submissions.find(
            (s) => !s.taskQuestion && (getSubmissionAnswer(s).includes('/') || getSubmissionAnswer(s).includes('.')),
        );
    }, [submissions, requiresFileUpload]);

    const textSub = useMemo(() => {
        if (!requiresTextResponse) return null;
        return submissions.find(
            (s) => !s.taskQuestion && !(getSubmissionAnswer(s).includes('/') || getSubmissionAnswer(s).includes('.')),
        );
    }, [submissions, requiresTextResponse]);

    // Build Quiz Submission Map
    const [apiQuizQuestions, setApiQuizQuestions] = useState([]);

    // Fetch quiz questions for the selected subtask from the educatorList endpoint
    const { execute: fetchApiQuizQuestions } = useFetch(apiConfig.taskQuestion.educatorList, {
        immediate: false,
    });

    const getQuizBlocks = (contentJson) => {
        try {
            const blocks = JSON.parse(contentJson);
            return blocks.filter((b) => b.type === 'quiz');
        } catch {
            return [];
        }
    };

    useEffect(() => {
        if (selectedSubtaskId) {
            fetchApiQuizQuestions({
                params: { taskId: selectedSubtaskId, size: 1000 },
                onCompleted: (res) => {
                    setApiQuizQuestions(res.data?.content || []);
                },
                onError: () => {
                    setApiQuizQuestions([]);
                },
            });
        } else {
            setApiQuizQuestions([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSubtaskId]);

    const questionMap = useMemo(() => {
        const map = {};
        if (apiQuizQuestions) {
            apiQuizQuestions.forEach((q) => {
                const key = (q.question || '').trim();
                if (key && q.id != null) {
                    map[key] = String(q.id);
                }
            });
        }
        return map;
    }, [apiQuizQuestions]);

    const quizSubmissionMap = useMemo(() => {
        const map = {};
        submissions.forEach((submission) => {
            let qId = null;
            if (submission.taskQuestionId != null) {
                qId = String(submission.taskQuestionId);
            } else if (submission.taskQuestion?.id != null) {
                qId = String(submission.taskQuestion.id);
            }

            if (qId) {
                map[qId] = {
                    answer: getSubmissionAnswer(submission),
                    isCorrect: submission.isCorrect === true || submission.isCorrect === 1,
                    createdDate: submission.createdDate,
                };
            }
        });
        return map;
    }, [submissions]);

    const quizHistory = useMemo(() => {
        const list = apiQuizQuestions || [];
        if (list.length > 0) {
            return list.map((q) => {
                const answerInfo = quizSubmissionMap[String(q.id)];
                return {
                    id: q.id,
                    questionText: q.question,
                    options: q.options,
                    selectedAnswer: answerInfo ? answerInfo.answer : 'Chưa trả lời',
                    isCorrect: answerInfo ? answerInfo.isCorrect : false,
                    createdDate: answerInfo ? answerInfo.createdDate : null,
                };
            });
        }

        // Fallback: parse from subtask content json
        const quizBlocks = getQuizBlocks(subtaskDetail?.content);
        return quizBlocks.map((block, index) => {
            const matchedSub = submissions.find((s) => {
                const qText = (s.taskQuestion?.question || '').trim().toLowerCase();
                const blockText = (block.question || '').trim().toLowerCase();
                return qText === blockText;
            });

            return {
                id: matchedSub?.id || `mock-${index}`,
                questionText: block.question,
                options: JSON.stringify(block.options || []),
                selectedAnswer: matchedSub ? getSubmissionAnswer(matchedSub) : 'Chưa trả lời',
                isCorrect: matchedSub ? matchedSub.isCorrect === true || matchedSub.isCorrect === 1 : false,
                createdDate: matchedSub ? matchedSub.createdDate : null,
            };
        });
    }, [apiQuizQuestions, quizSubmissionMap, subtaskDetail, submissions]);

    // Educator Review linking logic
    // Key by studentTaskProgressId or studentSubmissionId
    const subtaskReview = useMemo(() => {
        if (!educatorReviews) return null;

        // Find review linked to this progress
        if (activeSubtaskProgress?.id) {
            const foundByProgress = educatorReviews.find((r) => r.studentTaskProgress?.id === activeSubtaskProgress.id);
            if (foundByProgress) return foundByProgress;
        }

        // Or linked to the submission
        const subId = fileSub?.id || textSub?.id;
        if (subId) {
            const foundBySub = educatorReviews.find((r) => r.studentSubmission?.id === subId);
            if (foundBySub) return foundBySub;
        }

        return null;
    }, [educatorReviews, activeSubtaskProgress, fileSub, textSub]);

    useEffect(() => {
        if (subtaskReview) {
            setReviewContentInput(subtaskReview.content || '');
            setIsEditingReview(false);
        } else {
            setReviewContentInput('');
            setIsEditingReview(false);
        }
    }, [subtaskReview, selectedSubtaskId]);

    // Educator Review CRUD API Executions
    const { execute: executeCreateReview, loading: loadingCreateReview } = useFetch(apiConfig.reviewSubmission.create, {
        immediate: false,
    });

    const { execute: executeUpdateReview, loading: loadingUpdateReview } = useFetch(apiConfig.reviewSubmission.update, {
        immediate: false,
    });

    const { execute: executeDeleteReview, loading: loadingDeleteReview } = useFetch(apiConfig.reviewSubmission.delete, {
        immediate: false,
    });

    const { execute: executeCompleteReview, loading: loadingCompleteReview } = useFetch(
        apiConfig.reviewSubmission.completeReview,
        {
            immediate: false,
        },
    );

    const handleCompleteReview = () => {
        Modal.confirm({
            title: 'Hoàn tất nhận xét bài làm',
            content: (
                <div>
                    <p>
                        Bạn có chắc chắn muốn hoàn tất nhận xét và gửi thông báo cho học viên{' '}
                        <strong>{username}</strong> không?
                    </p>
                    <p style={{ color: '#8c8c8c', fontSize: 13, marginTop: 8 }}>
                        Học viên sẽ nhận được thông báo và có thể xem toàn bộ nhận xét của bạn.
                    </p>
                </div>
            ),
            okText: 'Hoàn tất & Gửi thông báo',
            cancelText: 'Hủy',
            okButtonProps: { type: 'primary', icon: <SendOutlined /> },
            onOk: () => {
                executeCompleteReview({
                    data: {
                        simulationId: parseInt(simulationId, 10),
                        studentUsername: username,
                    },
                    onCompleted: () => {
                        setIsCompleted(true);
                        notify({
                            type: 'success',
                            message: 'Đã hoàn tất nhận xét! Học viên đã được thông báo.',
                        });
                    },
                    onError: (err) => {
                        notify({
                            type: 'error',
                            message: err?.message || 'Lỗi khi gửi thông báo hoàn tất!',
                        });
                    },
                });
            },
        });
    };

    const handleSaveReview = () => {
        if (!reviewContentInput.trim()) {
            message.warning('Vui lòng nhập nội dung nhận xét!');
            return;
        }

        if (subtaskReview?.id) {
            // Update
            executeUpdateReview({
                data: {
                    id: subtaskReview.id,
                    content: reviewContentInput.trim(),
                },
                onCompleted: () => {
                    notify({ type: 'success', message: 'Cập nhật nhận xét thành công!' });
                    refetchReviews({ params: { simulationEnrollmentId, size: 1000 } });
                    setIsEditingReview(false);
                },
                onError: (err) => {
                    notify({ type: 'error', message: err?.message || 'Lỗi cập nhật nhận xét!' });
                },
            });
        } else {
            // Create
            const activeSubtaskProgressId = activeSubtaskProgress?.id || null;
            const activeSubmissionId = fileSub?.id || textSub?.id || null;

            executeCreateReview({
                data: {
                    content: reviewContentInput.trim(),
                    studentSubmissionId: activeSubmissionId,
                    studentTaskProgressId: activeSubtaskProgressId,
                },
                onCompleted: () => {
                    notify({ type: 'success', message: 'Tạo nhận xét thành công!' });
                    refetchReviews({ params: { simulationEnrollmentId, size: 1000 } });
                },
                onError: (err) => {
                    notify({ type: 'error', message: err?.message || 'Lỗi lưu nhận xét!' });
                },
            });
        }
    };

    const handleDeleteReview = () => {
        if (!subtaskReview?.id) return;

        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bạn có chắc chắn muốn xóa nhận xét này không?',
            okText: 'Xóa',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            onOk: () => {
                executeDeleteReview({
                    pathParams: { id: subtaskReview.id },
                    onCompleted: () => {
                        notify({ type: 'success', message: 'Xóa nhận xét thành công!' });
                        refetchReviews({ params: { simulationEnrollmentId, size: 1000 } });
                    },
                    onError: (err) => {
                        notify({ type: 'error', message: err?.message || 'Lỗi xóa nhận xét!' });
                    },
                });
            },
        });
    };

    // 8. Fetch Comments API
    const {
        data: commentsData,
        execute: executeFetchComments,
        loading: commentsLoading,
    } = useFetch(apiConfig.comment.list, {
        immediate: false,
        mappingData: (res) => res.data || {},
    });

    const loadComments = () => {
        if (selectedSubtaskId && simulationEnrollmentId) {
            executeFetchComments({
                params: { taskId: selectedSubtaskId, simulationEnrollmentId, size: 1000 },
            });
        }
    };

    useEffect(() => {
        if (showComments) {
            loadComments();
        }
    }, [selectedSubtaskId, simulationEnrollmentId, showComments]);

    const { execute: executeCreateComment } = useFetch(apiConfig.comment.create, { immediate: false });
    const { execute: executeUpdateComment } = useFetch(apiConfig.comment.update, { immediate: false });

    const handleSendComment = (content, parentId = 0) => {
        if (!selectedSubtaskId || !simulationEnrollmentId) return;

        executeCreateComment({
            data: {
                content,
                parentId,
                taskId: selectedSubtaskId,
                simulationEnrollmentId,
            },
            onCompleted: () => {
                loadComments();
            },
            onError: (err) => {
                notify({ type: 'error', message: err?.message || 'Không thể gửi bình luận!' });
            },
        });
    };

    const handleUpdateComment = (id, content) => {
        executeUpdateComment({
            data: { id, content },
            onCompleted: () => {
                loadComments();
            },
            onError: (err) => {
                notify({ type: 'error', message: err?.message || 'Không thể cập nhật bình luận!' });
            },
        });
    };

    // Navigation subtask indices
    const activeSubtaskIndex = useMemo(() => {
        return subtasks.findIndex((s) => s.id === selectedSubtaskId);
    }, [subtasks, selectedSubtaskId]);

    const handleBackSubtask = () => {
        if (activeSubtaskIndex > 0) {
            setSelectedSubtaskId(subtasks[activeSubtaskIndex - 1].id);
        }
    };

    const handleNextSubtask = () => {
        if (activeSubtaskIndex < subtasks.length - 1) {
            setSelectedSubtaskId(subtasks[activeSubtaskIndex + 1].id);
        }
    };

    // Build a set of reviewed subtask IDs from educatorReviews (based on taskQuestion.task.id)
    const reviewedTaskIds = useMemo(() => {
        if (!educatorReviews || educatorReviews.length === 0) return new Set();
        const ids = new Set();
        educatorReviews.forEach((r) => {
            const taskId = r.studentSubmission?.taskQuestion?.task?.id;
            if (taskId) ids.add(taskId);
            // Also track by studentTaskProgress
            if (r.studentTaskProgress?.task?.id) ids.add(r.studentTaskProgress.task.id);
        });
        return ids;
    }, [educatorReviews]);

    // Count reviews per parent task
    const reviewCountByParentTask = useMemo(() => {
        const countMap = {};
        if (!tasks || !educatorReviews) return countMap;
        parentTasks.forEach((pt) => {
            const subs = tasks.filter((t) => t.kind === 2 && (t.parent?.id === pt.id || t.parentId === pt.id));
            const reviewed = subs.filter((s) => {
                const foundByProgress = progressList?.find((p) => p.task?.id === s.id);
                if (foundByProgress) {
                    return educatorReviews.some((r) => r.studentTaskProgress?.id === foundByProgress.id);
                }
                return reviewedTaskIds.has(s.id);
            });
            countMap[pt.id] = { total: subs.length, reviewed: reviewed.length };
        });
        return countMap;
    }, [tasks, educatorReviews, parentTasks, progressList, reviewedTaskIds]);

    // Extract student details
    const studentInfo = useMemo(() => {
        if (enrollment) {
            return enrollment.profileAccountDto || enrollment.student?.profileAccountDto;
        }
        return null;
    }, [enrollment]);

    const loadingGeneral = loadingTasks || loadingSimulation || loadingProgress;

    const commentsCount = commentsData?.content?.length || 0;

    // Total review progress
    const totalSubtasks = useMemo(() => {
        return tasks?.filter((t) => t.kind === 2)?.length || 0;
    }, [tasks]);
    const totalReviewed = useMemo(() => educatorReviews?.length || 0, [educatorReviews]);

    return (
        <PageWrapper
            loading={loadingGeneral}
            routes={pageOptions.renderBreadcrumbs(commonMessage, translate, simulationId, username)}
        >
            <div className="tfo-topbar-actions">
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/simulation-review')} size="large">
                    Quay lại danh sách
                </Button>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {studentInfo && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Avatar
                                size="small"
                                icon={<UserOutlined />}
                                src={studentInfo.avatar ? `${AppConstants.contentRootUrl}${studentInfo.avatar}` : null}
                            />
                            <strong>{studentInfo.fullName || username}</strong>
                            <Tag color="blue">{username}</Tag>
                        </div>
                    )}

                    {/* Progress indicator */}
                    <div className="tfo-review-progress-badge">
                        <CheckCircleFilled style={{ color: totalReviewed > 0 ? '#52c41a' : '#d9d9d9', fontSize: 16 }} />
                        <span>
                            {totalReviewed}/{totalSubtasks} nhiệm vụ đã nhận xét
                        </span>
                    </div>

                    {/* Complete Review Button */}
                    <Tooltip
                        title={isCompleted ? 'Đã hoàn tất nhận xét' : 'Hoàn tất nhận xét & gửi thông báo cho học viên'}
                    >
                        <Button
                            type="primary"
                            icon={isCompleted ? <CheckOutlined /> : <SendOutlined />}
                            onClick={handleCompleteReview}
                            loading={loadingCompleteReview}
                            disabled={isCompleted}
                            className={isCompleted ? 'tfo-complete-btn completed' : 'tfo-complete-btn'}
                            size="large"
                        >
                            {isCompleted ? 'Đã hoàn tất' : 'Hoàn tất & Thông báo'}
                        </Button>
                    </Tooltip>
                </div>
            </div>

            <Spin spinning={loadingGeneral}>
                <div className="tfo-content-area">
                    {/* Left Sidebar: Timeline of Parent Tasks */}
                    <aside className="tfo-sidebar">
                        <div className="tfo-sidebar-header">
                            <span className="tfo-sidebar-label">Danh sách nhiệm vụ</span>
                        </div>
                        <div className="tfo-task-list">
                            {parentTasks.map((task, idx) => {
                                const isActive = selectedParentTaskId === task.id;
                                const isLast = idx === parentTasks.length - 1;
                                const taskCount = reviewCountByParentTask[task.id];
                                const allReviewed =
                                    taskCount && taskCount.total > 0 && taskCount.reviewed === taskCount.total;

                                return (
                                    <div key={task.id || idx} className="tfo-task-list-row">
                                        <div className="tfo-task-timeline">
                                            <button
                                                className={`tfo-task-circle${isActive ? ' active' : ''}${allReviewed ? ' reviewed' : ''}`}
                                                onClick={() => {
                                                    setSelectedParentTaskId(task.id);
                                                    setSelectedSubtaskId(null);
                                                }}
                                            >
                                                {allReviewed ? <CheckOutlined style={{ fontSize: 12 }} /> : idx + 1}
                                            </button>
                                            {!isLast && <div className="tfo-task-connector" />}
                                        </div>

                                        <button
                                            className="tfo-task-content-btn"
                                            onClick={() => {
                                                setSelectedParentTaskId(task.id);
                                                setSelectedSubtaskId(null);
                                            }}
                                        >
                                            <div className={`tfo-task-title${isActive ? ' active' : ''}`}>
                                                {task.title || task.name}
                                            </div>
                                            {taskCount && (
                                                <div className={`tfo-task-review-count${allReviewed ? ' done' : ''}`}>
                                                    {allReviewed ? (
                                                        <>
                                                            <CheckCircleFilled style={{ marginRight: 4 }} />
                                                            Đã nhận xét hết
                                                        </>
                                                    ) : (
                                                        `${taskCount.reviewed}/${taskCount.total} nhận xét`
                                                    )}
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </aside>

                    {/* Right Workspace Pane */}
                    <div className="tfo-pane">
                        <div className="tfo-pane-layout">
                            <div className="tfo-pane-left">
                                {/* Top Bar pagination of subtasks */}
                                <div className="tfo-pane-topbar">
                                    <div className="tfo-pane-title">
                                        {simulationDetail?.title || 'Đang xem bài làm'}
                                    </div>
                                    {subtasks.length > 0 && (
                                        <div className="tfo-step-pagination">
                                            {subtasks.map((st, index) => {
                                                const subProgress = progressList?.find((p) => p.task?.id === st.id);
                                                const isSubReviewed = subProgress
                                                    ? educatorReviews?.some(
                                                        (r) => r.studentTaskProgress?.id === subProgress.id,
                                                    )
                                                    : reviewedTaskIds.has(st.id);
                                                const isActiveSub = st.id === selectedSubtaskId;

                                                let btnCls = 'tfo-step-btn';
                                                if (isActiveSub) btnCls += ' active';
                                                if (isSubReviewed && !isActiveSub) btnCls += ' reviewed';

                                                return (
                                                    <Tooltip
                                                        key={st.id}
                                                        title={`${st.title || st.name || 'Bước ' + (index + 1)}${isSubReviewed ? ' ✓ Đã nhận xét' : ''}`}
                                                    >
                                                        <button
                                                            className={btnCls}
                                                            onClick={() => setSelectedSubtaskId(st.id)}
                                                        >
                                                            {isSubReviewed && !isActiveSub ? (
                                                                <CheckOutlined style={{ fontSize: 11 }} />
                                                            ) : (
                                                                index + 1
                                                            )}
                                                        </button>
                                                    </Tooltip>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <div className="tfo-separator" />

                                <Spin spinning={loadingSubtask || loadingProgressDetail}>
                                    <div className="tfo-task-content">
                                        <div className="tfo-task-heading-container">
                                            <div className="tfo-task-heading">{subtaskDetail?.title || 'Nhiệm vụ'}</div>

                                            {selectedSubtaskId && (
                                                <button
                                                    className={`tfo-comments-toggle-btn${showComments ? ' active' : ''}`}
                                                    onClick={() => setShowComments(!showComments)}
                                                >
                                                    <MessageOutlined style={{ marginRight: 6 }} />
                                                    <span>Thảo luận ({commentsCount})</span>
                                                </button>
                                            )}
                                        </div>

                                        <div className="tfo-task-body">
                                            {/* Subtask instruction body */}
                                            {subtaskDetail?.description && (
                                                <p className="tfo-body-text" style={{ whiteSpace: 'pre-line' }}>
                                                    {subtaskDetail.description}
                                                </p>
                                            )}

                                            {subtaskDetail?.content && (
                                                <ContentRenderer
                                                    content={subtaskDetail.content}
                                                    quizSubmissionMap={quizSubmissionMap}
                                                    questionMap={questionMap}
                                                />
                                            )}

                                            {/* Media image / video rendering */}
                                            {subtaskDetail?.imagePath && (
                                                <div className="tfo-media-section">
                                                    <div className="tfo-media-container">
                                                        <img
                                                            src={
                                                                subtaskDetail.imagePath.startsWith('http')
                                                                    ? subtaskDetail.imagePath
                                                                    : `${AppConstants.contentRootUrl}${subtaskDetail.imagePath}`
                                                            }
                                                            alt="Subtask attachment"
                                                            className="tfo-media-img"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {subtaskDetail?.videoPath && (
                                                <div className="tfo-media-section">
                                                    <div className="tfo-media-container">
                                                        <video controls className="tfo-media-video">
                                                            <source
                                                                src={
                                                                    subtaskDetail.videoPath.startsWith('http')
                                                                        ? subtaskDetail.videoPath
                                                                        : `${AppConstants.contentRootUrl}${subtaskDetail.videoPath}`
                                                                }
                                                                type="video/mp4"
                                                            />
                                                        </video>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Render student submissions */}
                                            {requiresFileUpload && (
                                                <div className="tfo-submission-card">
                                                    <div className="tfo-submission-title">File học viên nộp</div>
                                                    {fileSub ? (
                                                        <div className="tfo-file-download-box">
                                                            <DownloadOutlined
                                                                style={{ color: '#1890ff', fontSize: 16 }}
                                                            />
                                                            <a
                                                                href={
                                                                    getSubmissionAnswer(fileSub).startsWith('http')
                                                                        ? getSubmissionAnswer(fileSub)
                                                                        : `${AppConstants.contentRootUrl}${getSubmissionAnswer(fileSub)}`
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                Tải xuống bài làm của học viên
                                                            </a>
                                                        </div>
                                                    ) : (
                                                        <div style={{ color: '#8c8c8c', fontStyle: 'italic' }}>
                                                            Học viên chưa nộp file
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {requiresTextResponse && (
                                                <div className="tfo-submission-card">
                                                    <div className="tfo-submission-title">Văn bản học viên nộp</div>
                                                    {textSub ? (
                                                        <div className="tfo-text-answer-box">
                                                            {getSubmissionAnswer(textSub)}
                                                        </div>
                                                    ) : (
                                                        <div style={{ color: '#8c8c8c', fontStyle: 'italic' }}>
                                                            Học viên chưa nộp câu trả lời
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Quiz Answer History Log */}
                                            {quizHistory && quizHistory.length > 0 && (
                                                <div className="tfo-submission-card" style={{ marginTop: '20px' }}>
                                                    <div className="tfo-submission-title">
                                                        Lịch sử trả lời trắc nghiệm
                                                    </div>
                                                    <Table
                                                        dataSource={quizHistory}
                                                        rowKey={(record) => record.id}
                                                        pagination={{ pageSize: 5 }}
                                                        size="small"
                                                        columns={[
                                                            {
                                                                title: 'Câu hỏi',
                                                                dataIndex: 'questionText',
                                                                render: (text) => (
                                                                    <span style={{ fontWeight: '500' }}>{text}</span>
                                                                ),
                                                            },
                                                            {
                                                                title: 'Đáp án đúng',
                                                                dataIndex: 'options',
                                                                render: (optsStr) => {
                                                                    try {
                                                                        const opts = JSON.parse(optsStr || '[]');
                                                                        const correct = opts.find(
                                                                            (o) =>
                                                                                o.answer === true ||
                                                                                o.answer === 'true',
                                                                        );
                                                                        return correct
                                                                            ? correct.option || correct.value || 'N/A'
                                                                            : 'N/A';
                                                                    } catch {
                                                                        return 'N/A';
                                                                    }
                                                                },
                                                            },
                                                            {
                                                                title: 'Đáp án chọn',
                                                                dataIndex: 'selectedAnswer',
                                                            },
                                                            {
                                                                title: 'Kết quả',
                                                                dataIndex: 'isCorrect',
                                                                width: '120px',
                                                                align: 'center',
                                                                render: (isCorr) => (
                                                                    <Tag color={isCorr ? 'green' : 'red'}>
                                                                        {isCorr ? 'Đúng' : 'Sai'}
                                                                    </Tag>
                                                                ),
                                                            },
                                                            {
                                                                title: 'Thời gian',
                                                                dataIndex: 'createdDate',
                                                                width: '180px',
                                                                render: (date) =>
                                                                    date
                                                                        ? dayjs(date).format('DD/MM/YYYY HH:mm:ss')
                                                                        : '-',
                                                            },
                                                        ]}
                                                    />
                                                </div>
                                            )}

                                            {/* Educator Review / Assessment Card */}
                                            <div className="tfo-review-section">
                                                {subtaskReview && !isEditingReview ? (
                                                    <div className="tfo-review-card">
                                                        <div className="tfo-review-header">
                                                            <div
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 8,
                                                                }}
                                                            >
                                                                <CheckCircleFilled
                                                                    style={{ color: '#52c41a', fontSize: 18 }}
                                                                />
                                                                <span className="tfo-review-title">
                                                                    Nhận xét của Giáo viên
                                                                </span>
                                                            </div>
                                                            <div className="tfo-review-actions">
                                                                <Button
                                                                    type="text"
                                                                    icon={<EditOutlined />}
                                                                    onClick={() => setIsEditingReview(true)}
                                                                    style={{ color: '#fa8c16' }}
                                                                >
                                                                    Sửa
                                                                </Button>
                                                                <Button
                                                                    type="text"
                                                                    icon={<DeleteOutlined />}
                                                                    onClick={handleDeleteReview}
                                                                    loading={loadingDeleteReview}
                                                                    danger
                                                                >
                                                                    Xóa
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        <div className="tfo-review-content">
                                                            {subtaskReview.content}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Card
                                                        title={
                                                            <div
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 8,
                                                                }}
                                                            >
                                                                <span>
                                                                    {subtaskReview
                                                                        ? 'Sửa nhận xét bài làm'
                                                                        : 'Nhận xét & Đánh giá bài làm'}
                                                                </span>
                                                                {!subtaskReview && (
                                                                    <Tag color="orange">Chưa nhận xét</Tag>
                                                                )}
                                                            </div>
                                                        }
                                                        size="small"
                                                        style={{ borderLeft: '4px solid #fa8c16' }}
                                                    >
                                                        <Input.TextArea
                                                            rows={4}
                                                            placeholder="Nhập nội dung nhận xét, phản hồi hoặc hướng dẫn cải thiện cho bài làm của học viên..."
                                                            value={reviewContentInput}
                                                            onChange={(e) => setReviewContentInput(e.target.value)}
                                                        />
                                                        <Space style={{ marginTop: 12 }}>
                                                            <Button
                                                                type="primary"
                                                                icon={<SaveOutlined />}
                                                                onClick={handleSaveReview}
                                                                loading={loadingCreateReview || loadingUpdateReview}
                                                                style={{
                                                                    backgroundColor: '#fa8c16',
                                                                    borderColor: '#fa8c16',
                                                                }}
                                                            >
                                                                {subtaskReview ? 'Cập nhật' : 'Lưu nhận xét'}
                                                            </Button>
                                                            {isEditingReview && (
                                                                <Button onClick={() => setIsEditingReview(false)}>
                                                                    Hủy
                                                                </Button>
                                                            )}
                                                        </Space>
                                                    </Card>
                                                )}
                                            </div>
                                        </div>

                                        {/* Subtask pagination buttons + complete bar at the bottom */}
                                        <div className="tfo-bottom-nav">
                                            <div style={{ display: 'flex', gap: 12 }}>
                                                <Button onClick={handleBackSubtask} disabled={activeSubtaskIndex <= 0}>
                                                    Nhiệm vụ trước
                                                </Button>
                                                <Button
                                                    onClick={handleNextSubtask}
                                                    disabled={activeSubtaskIndex >= subtasks.length - 1}
                                                >
                                                    Nhiệm vụ sau
                                                </Button>
                                            </div>

                                            {/* Complete Review action bar */}
                                            <div className={`tfo-complete-bar${isCompleted ? ' completed' : ''}`}>
                                                {isCompleted ? (
                                                    <div className="tfo-complete-bar-done">
                                                        <CheckCircleFilled style={{ fontSize: 20, color: '#52c41a' }} />
                                                        <span>Đã hoàn tất nhận xét và thông báo cho học viên</span>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="tfo-complete-bar-info">
                                                            <span>
                                                                Đã nhận xét{' '}
                                                                <strong>
                                                                    {totalReviewed}/{totalSubtasks}
                                                                </strong>{' '}
                                                                nhiệm vụ.
                                                            </span>
                                                            {totalReviewed === 0 && (
                                                                <span style={{ color: '#ff4d4f', marginLeft: 8 }}>
                                                                    Vui lòng nhận xét ít nhất 1 nhiệm vụ trước khi hoàn
                                                                    tất.
                                                                </span>
                                                            )}
                                                        </div>
                                                        <Button
                                                            type="primary"
                                                            icon={<SendOutlined />}
                                                            onClick={handleCompleteReview}
                                                            loading={loadingCompleteReview}
                                                            disabled={totalReviewed === 0}
                                                            className="tfo-complete-btn"
                                                        >
                                                            Hoàn tất & Gửi thông báo cho học viên
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Spin>
                            </div>

                            {/* Optional comments panel on the right */}
                            {showComments && (
                                <CommentPanel
                                    comments={commentsData?.content || []}
                                    loading={commentsLoading}
                                    profile={profile}
                                    onClose={() => setShowComments(false)}
                                    onSendComment={handleSendComment}
                                    onUpdateComment={handleUpdateComment}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </Spin>
        </PageWrapper>
    );
};

export default StudentReviewDetailPage;
