import React, { useMemo } from 'react';
import { Spin, Table, Tag } from 'antd';
import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { AppConstants } from '@constants';

import '../../modules/reviewSubmission/StudentReviewDetailPage.scss';

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
            <p key={key++} className="tfo-md-p" dangerouslySetInnerHTML={{ __html: parseInline(line) }} />,
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
            return JSON.parse(blocksJson || '[]');
        } catch {
            return [];
        }
    }, [blocksJson]);

    return (
        <div className="tfo-blocks-content">
            {blocks.map((block, idx) => (
                <BlockItem
                    key={idx}
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
        return (
            <BlocksContent
                blocksJson={content}
                quizSubmissionMap={quizSubmissionMap}
                questionMap={questionMap}
            />
        );
    }
    if (type === 'markdown') return <MarkdownContent text={content} />;
    return <PlainTextContent text={content} />;
}

/* ─────────────────────────── Main Reusable Component ─────────────────────────── */

const StudentSubmissionViewer = ({
    subtaskDetail,
    submissions = [],
    apiQuizQuestions = [],
    loading = false,
}) => {
    const parsedSubtaskName = useMemo(() => parseSubtaskName(subtaskDetail?.name || ''), [subtaskDetail]);
    const requiresFileUpload = parsedSubtaskName?.requiresFileUpload || false;
    const requiresTextResponse = parsedSubtaskName?.requiresTextResponse || false;

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

    const getQuizBlocks = (contentJson) => {
        try {
            const blocks = JSON.parse(contentJson);
            return blocks.filter((b) => b.type === 'quiz');
        } catch {
            return [];
        }
    };

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

    return (
        <Spin spinning={loading}>
            <div className="tfo-task-content" style={{ padding: '0 24px 24px', border: 'none', background: 'transparent' }}>
                <div className="tfo-task-heading-container" style={{ margin: '0 -24px 20px', padding: '0 24px 16px', borderBottom: '1px solid #f1f5f9' }}>
                    <div className="tfo-task-heading">{subtaskDetail?.title || 'Nhiệm vụ'}</div>
                </div>

                <div className="tfo-task-body">
                    {/* Subtask instructions */}
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

                    {/* Attachment media */}
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

                    {/* Student File Submission */}
                    {requiresFileUpload && (
                        <div className="tfo-submission-card">
                            <div className="tfo-submission-title">
                                <FileTextOutlined style={{ marginRight: 6, color: '#1890ff' }} />
                                File học viên nộp
                            </div>
                            {fileSub ? (
                                <div className="tfo-file-download-box">
                                    <DownloadOutlined style={{ color: '#52c41a', fontSize: 16 }} />
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
                                <div className="tfo-empty-submission">
                                    Học viên chưa nộp file
                                </div>
                            )}
                        </div>
                    )}

                    {requiresTextResponse && (
                        <div className="tfo-submission-card">
                            <div className="tfo-submission-title">
                                <FileTextOutlined style={{ marginRight: 6, color: '#1890ff' }} />
                                Văn bản học viên nộp
                            </div>
                            {textSub ? (
                                <div className="tfo-text-answer-box">
                                    {getSubmissionAnswer(textSub)}
                                </div>
                            ) : (
                                <div className="tfo-empty-submission">
                                    Học viên chưa nộp câu trả lời
                                </div>
                            )}
                        </div>
                    )}

                    {/* Quiz History Log */}
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
                                                    (o) => o.answer === true || o.answer === 'true',
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
                                        width: '100px',
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
                                        width: '150px',
                                        render: (date) =>
                                            date
                                                ? dayjs(date).format('DD/MM/YYYY HH:mm:ss')
                                                : '-',
                                    },
                                ]}
                            />
                        </div>
                    )}
                </div>
            </div>
        </Spin>
    );
};

export default StudentSubmissionViewer;
