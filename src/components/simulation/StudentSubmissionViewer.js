import React, { useMemo } from 'react';
import { Spin, Table, Tag } from 'antd';
import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { AppConstants } from '@constants';

import '../../modules/reviewSubmission/StudentReviewDetailPage.scss';
import TipTapJsonRenderer from '@components/common/editor/TipTapJsonRenderer';
import { isJsonBlocks, extractQuizFromMarkdoc } from '@utils/markdocBlockConverter';

/* ─────────────────────────── Helper Components & Functions ─────────────────────────── */

/**
 * Determines file/text submission requirements from the subtask's submissionType field.
 * submissionType: 0 = none, 1 = file only, 2 = text only, 3 = file + text.
 */
const getSubmissionRequirements = (subtask) => {
    const st = Number(subtask?.submissionType) || 0;
    return {
        requiresFileUpload: st === 1 || st === 3,
        requiresTextResponse: st === 2 || st === 3,
    };
};

const getSubmissionAnswer = (submission = {}) => submission.answer || submission.answear || '';

/* ─────────────────────────── Main Reusable Component ─────────────────────────── */

const StudentSubmissionViewer = ({ subtaskDetail, submissions = [], apiQuizQuestions = [], loading = false }) => {
    const { requiresFileUpload, requiresTextResponse } = useMemo(
        () => getSubmissionRequirements(subtaskDetail),
        [subtaskDetail],
    );

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

    const getQuizBlocks = (content) => {
        if (!content) return [];
        if (isJsonBlocks(content)) {
            try {
                const blocks = JSON.parse(content);
                return blocks.filter((b) => b.type === 'quiz');
            } catch {
                return [];
            }
        } else {
            const extracted = extractQuizFromMarkdoc(content);
            return extracted.map((q) => ({
                question: q.question,
                options: JSON.parse(q.options),
            }));
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
            <div
                className="tfo-task-content"
                style={{ padding: '0 24px 24px', border: 'none', background: 'transparent' }}
            >
                <div
                    className="tfo-task-heading-container"
                    style={{ margin: '0 -24px 20px', padding: '0 24px 16px', borderBottom: '1px solid #f1f5f9' }}
                >
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
                        <TipTapJsonRenderer
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
                                <div className="tfo-empty-submission">Học viên chưa nộp file</div>
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
                                <div className="tfo-text-answer-box">{getSubmissionAnswer(textSub)}</div>
                            ) : (
                                <div className="tfo-empty-submission">Học viên chưa nộp câu trả lời</div>
                            )}
                        </div>
                    )}

                    {/* Quiz History Log */}
                    {quizHistory && quizHistory.length > 0 && (
                        <div className="tfo-submission-card" style={{ marginTop: '20px' }}>
                            <div className="tfo-submission-title">Lịch sử trả lời trắc nghiệm</div>
                            <Table
                                dataSource={quizHistory}
                                rowKey={(record) => record.id}
                                pagination={{ pageSize: 5 }}
                                size="small"
                                columns={[
                                    {
                                        title: 'Câu hỏi',
                                        dataIndex: 'questionText',
                                        render: (text) => <span style={{ fontWeight: '500' }}>{text}</span>,
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
                                                return correct ? correct.option || correct.value || 'N/A' : 'N/A';
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
                                            <Tag color={isCorr ? 'green' : 'red'}>{isCorr ? 'Đúng' : 'Sai'}</Tag>
                                        ),
                                    },
                                    {
                                        title: 'Thời gian',
                                        dataIndex: 'createdDate',
                                        width: '150px',
                                        render: (date) => (date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : '-'),
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
