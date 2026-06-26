import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Tag, Button, Avatar, Tooltip, Badge, Table } from 'antd';
import TaskContentLayout from '@components/simulation/TaskContentLayout';
import CommentPanel from '@components/simulation/CommentPanel';
import {
    ArrowLeftOutlined,
    UserOutlined,
    CheckCircleFilled,
    CommentOutlined,
    ClockCircleOutlined,
    PicRightOutlined,
    VerticalAlignBottomOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import PageWrapper from '@components/common/layout/PageWrapper';
import useFetch from '@hooks/useFetch';
import useTranslate from '@hooks/useTranslate';
import useAuth from '@hooks/useAuth';
import useNotification from '@hooks/useNotification';
import useValidatePermission from '@hooks/useValidatePermission';

import apiConfig from '@constants/apiConfig';
import { AppConstants, UserTypes, storageKeys } from '@constants';
import { ReviewStatus } from '@constants';
import { getData } from '@utils/localStorage';
import { commonMessage } from '@locales/intl';

import './StudentReviewDetailPage.scss';

// Enable relativeTime for dayjs
dayjs.extend(relativeTime);

/* ─────────────────────────── Helper Components & Functions ─────────────────────────── */

const parseSubtaskName = (subtask) => {
    const name = subtask?.name || '';
    if (name) {
        const match = name.match(/^SUB_T(\d+)_S(\d+)(_.*)?$/);
        if (match) {
            const suffix = match[3] || '';
            return {
                parentOrder: parseInt(match[1], 10),
                subtaskOrder: parseInt(match[2], 10),
                suffix,
                requiresFileUpload: suffix === '_FILE' || suffix === '_FILE_TEXT',
                requiresTextResponse: suffix === '_TEXT' || suffix === '_FILE_TEXT',
            };
        }
    }
    return {
        parentOrder: subtask?.parent?.orderInParent || 1,
        subtaskOrder: subtask?.orderInParent || 1,
        suffix: '',
        requiresFileUpload: true,
        requiresTextResponse: true,
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

/* ─────────────────────────── Main StudentDiscussionDetailPage ─────────────────────────── */

const StudentDiscussionDetailPage = ({ pageOptions }) => {
    const translate = useTranslate();
    const notify = useNotification();
    const navigate = useNavigate();
    const location = useLocation();
    const { simulationId, username } = useParams();
    const { profile } = useAuth();

    const userType = getData(storageKeys.USER_TYPE);
    const isEducator = userType === UserTypes.EDUCATOR || userType === UserTypes.ADMIN;

    // Active Sidebar / Tab states
    const [selectedParentTaskId, setSelectedParentTaskId] = useState(null);
    const [selectedSubtaskId, setSelectedSubtaskId] = useState(null);
    const [isCompleted, setIsCompleted] = useState(false);

    const [layoutMode, setLayoutMode] = useState(() => {
        try {
            const saved = localStorage.getItem('discussion_layout_mode');
            return saved || 'split';
        } catch (e) {
            return 'split';
        }
    });

    const handleLayoutModeChange = (mode) => {
        setLayoutMode(mode);
        try {
            localStorage.setItem('discussion_layout_mode', mode);
        } catch (e) {
            console.error(e);
        }
    };

    const validatePermission = useValidatePermission();
    const canWriteComment = validatePermission([apiConfig.comment.create.permissionCode]);

    // Simulation Enrollment ID resolution
    const [simulationEnrollmentId, setSimulationEnrollmentId] = useState(
        () => location.state?.simulationEnrollmentId || null,
    );
    const [enrollment, setEnrollment] = useState(null);

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
        if (simulationId && username) {
            fetchEnrollments({
                params: { simulationId, size: 1000 },
                onCompleted: (res) => {
                    const list = res.data?.content || [];
                    const found = list.find((item) => item.student?.profileAccountDto?.username === username);
                    if (found) {
                        setSimulationEnrollmentId(found.id);
                        setEnrollment(found);
                        setIsCompleted(found.reviewStatus === ReviewStatus.REVIEWED || found.isReviewed === true);
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
    }, [simulationId, username]);

    // 4. Load task progress list once simulationEnrollmentId is resolved
    const {
        data: progressList,
        loading: loadingProgress,
        execute: refetchProgress,
    } = useFetch(isEducator ? apiConfig.taskProgress.educatorList : apiConfig.taskProgress.list, {
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

    // 5. Fetch selected subtask details
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
        return progressList.find((p) => String(p.task?.id) === String(selectedSubtaskId));
    }, [selectedSubtaskId, progressList]);

    // 6. Fetch active subtask progress detail (to get actual student submissions)
    const {
        data: progressDetail,
        loading: loadingProgressDetail,
        execute: fetchProgressDetail,
    } = useFetch(isEducator ? apiConfig.taskProgress.educatorGet : apiConfig.taskProgress.get, {
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

    const parsedSubtaskName = useMemo(() => parseSubtaskName(subtaskDetail), [subtaskDetail]);
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

    // Fetch quiz questions for the selected subtask
    const [apiQuizQuestions, setApiQuizQuestions] = useState([]);
    const { execute: fetchApiQuizQuestions } = useFetch(
        isEducator ? apiConfig.taskQuestion.educatorList : apiConfig.taskQuestion.getList,
        {
            immediate: false,
        },
    );

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
        return [];
    }, [apiQuizQuestions, quizSubmissionMap]);

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

    // 7. Fetch Comments API
    const {
        data: commentsData,
        execute: executeFetchComments,
        loading: commentsLoading,
    } = useFetch(isEducator ? apiConfig.comment.list : apiConfig.comment.userList, {
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
        if (selectedSubtaskId && simulationEnrollmentId) {
            loadComments();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSubtaskId, simulationEnrollmentId]);

    const { execute: executeCreateComment } = useFetch(apiConfig.comment.create, { immediate: false });
    const { execute: executeUpdateComment } = useFetch(apiConfig.comment.update, { immediate: false });
    const { execute: executeDeleteComment } = useFetch(apiConfig.comment.delete, { immediate: false });

    const handleSendComment = (content, parentId = 0) => {
        if (!selectedSubtaskId || !simulationEnrollmentId) return;

        executeCreateComment({
            data: {
                content,
                parentId: parentId === 0 ? null : parentId,
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

    const handleDeleteComment = (id) => {
        executeDeleteComment({
            pathParams: { id },
            onCompleted: () => {
                loadComments();
            },
            onError: (err) => {
                notify({ type: 'error', message: err?.message || 'Không thể xóa bình luận!' });
            },
        });
    };

    // Navigation subtask indices
    const activeSubtaskIndex = useMemo(() => {
        return subtasks.findIndex((s) => s.id === selectedSubtaskId);
    }, [subtasks, selectedSubtaskId]);

    const activeParentTaskIndex = useMemo(() => {
        return parentTasks.findIndex((t) => t.id === selectedParentTaskId);
    }, [parentTasks, selectedParentTaskId]);

    // Helper: get sorted subtasks for a given parent task id
    const getSubtasksForParent = (parentId) => {
        return (
            tasks
                ?.filter((t) => t.kind === 2 && (t.parent?.id === parentId || t.parentId === parentId))
                .sort((a, b) => (a.orderInParent || 0) - (b.orderInParent || 0)) || []
        );
    };

    const handleBackSubtask = () => {
        if (activeSubtaskIndex > 0) {
            setSelectedSubtaskId(subtasks[activeSubtaskIndex - 1].id);
        } else if (activeParentTaskIndex > 0) {
            const prevParent = parentTasks[activeParentTaskIndex - 1];
            const prevSubtasks = getSubtasksForParent(prevParent.id);
            setSelectedParentTaskId(prevParent.id);
            if (prevSubtasks.length > 0) {
                setSelectedSubtaskId(prevSubtasks[prevSubtasks.length - 1].id);
            }
        }
    };

    const handleNextSubtask = () => {
        if (activeSubtaskIndex < subtasks.length - 1) {
            setSelectedSubtaskId(subtasks[activeSubtaskIndex + 1].id);
        } else if (activeParentTaskIndex < parentTasks.length - 1) {
            const nextParent = parentTasks[activeParentTaskIndex + 1];
            const nextSubtasks = getSubtasksForParent(nextParent.id);
            setSelectedParentTaskId(nextParent.id);
            if (nextSubtasks.length > 0) {
                setSelectedSubtaskId(nextSubtasks[0].id);
            }
        }
    };

    const isAtGlobalStart = activeParentTaskIndex <= 0 && activeSubtaskIndex <= 0;
    const isAtGlobalEnd = activeParentTaskIndex >= parentTasks.length - 1 && activeSubtaskIndex >= subtasks.length - 1;

    // Extract student details
    const studentInfo = useMemo(() => {
        if (enrollment) {
            return enrollment.profileAccountDto || enrollment.student?.profileAccountDto;
        }
        return null;
    }, [enrollment]);

    const loadingGeneral = loadingTasks || loadingSimulation || loadingProgress;

    const renderCommentPane = () => {
        return (
            <div className="tfo-review-tab-pane" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '16px', background: '#ffffff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div className="tfo-review-section-header" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                    <span className="tfo-review-section-title" style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CommentOutlined style={{ color: '#1890ff' }} /> Thảo luận & Bình luận
                    </span>
                    {commentsData?.content?.length > 0 && (
                        <Badge
                            count={commentsData.content.length}
                            style={{ backgroundColor: '#1890ff' }}
                        />
                    )}
                </div>
                <div style={{ flex: 1, minHeight: 0 }}>
                    <CommentPanel
                        comments={commentsData?.content || []}
                        loading={commentsLoading}
                        profile={profile}
                        readOnly={!canWriteComment}
                        onSendComment={handleSendComment}
                        onUpdateComment={handleUpdateComment}
                        onDeleteComment={handleDeleteComment}
                        studentUsername={username}
                    />
                </div>
            </div>
        );
    };

    return (
        <PageWrapper
            loading={loadingGeneral}
            routes={pageOptions.renderBreadcrumbs(commonMessage, translate, simulationId, username)}
        >
            <div className="tfo-topbar-actions">
                <Button
                    type="link"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(`/simulation-review?simulationId=${simulationId}`)}
                    className="tfo-back-link-btn"
                >
                    Quay lại danh sách
                </Button>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {studentInfo && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32 }}>
                            <Avatar
                                size="small"
                                icon={<UserOutlined />}
                                src={studentInfo.avatar ? `${AppConstants.contentRootUrl}${studentInfo.avatar}` : null}
                            />
                            <strong>{studentInfo.fullName || username}</strong>
                            <Tag color="blue" style={{ margin: 0 }}>
                                {username}
                            </Tag>
                            {isCompleted ? (
                                <Tag
                                    color="success"
                                    icon={<CheckCircleFilled />}
                                    style={{ margin: 0, fontWeight: 600 }}
                                >
                                    Đã nhận xét
                                </Tag>
                            ) : (
                                <Tag
                                    color="warning"
                                    icon={<ClockCircleOutlined />}
                                    style={{ margin: 0, fontWeight: 600 }}
                                >
                                    Chưa nhận xét
                                </Tag>
                            )}
                        </div>
                    )}

                    {/* Layout switcher */}
                    <div className="tfo-layout-switcher">
                        <Tooltip title="Bố cục bên cạnh">
                            <Button
                                icon={<PicRightOutlined />}
                                type={layoutMode === 'split' ? 'primary' : 'text'}
                                onClick={() => handleLayoutModeChange('split')}
                                size="small"
                            />
                        </Tooltip>
                        <Tooltip title="Bố cục bên dưới">
                            <Button
                                icon={<VerticalAlignBottomOutlined />}
                                type={layoutMode === 'bottom' ? 'primary' : 'text'}
                                onClick={() => handleLayoutModeChange('bottom')}
                                size="small"
                            />
                        </Tooltip>
                    </div>
                </div>
            </div>

            <TaskContentLayout
                parentTasks={parentTasks}
                selectedParentTaskId={selectedParentTaskId}
                onSelectParentTask={(id) => { setSelectedParentTaskId(id); setSelectedSubtaskId(null); }}
                subtasks={subtasks}
                selectedSubtaskId={selectedSubtaskId}
                onSelectSubtask={setSelectedSubtaskId}
                pageTitle={simulationDetail?.title || 'Đang xem thảo luận'}
                taskHeading={subtaskDetail?.title || 'Đang tải...'}
                taskDescriptionContent={subtaskDetail?.description || ''}
                content={subtaskDetail?.content || ''}
                mediaPath={subtaskDetail?.imagePath || subtaskDetail?.videoPath}
                loading={loadingGeneral || loadingSubtask || loadingProgressDetail}
                canGoBack={!isAtGlobalStart}
                canGoNext={!isAtGlobalEnd}
                isLastSubtask={isAtGlobalEnd}
                onBack={handleBackSubtask}
                onNext={handleNextSubtask}
                quizSubmissionMap={quizSubmissionMap}
                questionMap={questionMap}
                customTaskCircle={(task, idx, isActive) => {
                    let cls = 'tfo-task-circle';
                    if (isActive) cls += ' active';
                    return (
                        <button className={cls} onClick={() => { setSelectedParentTaskId(task.id); setSelectedSubtaskId(null); }}>
                            {idx + 1}
                        </button>
                    );
                }}
                customStepButton={(st, index, isActiveSub) => {
                    let btnCls = 'tfo-step-btn';
                    if (isActiveSub) btnCls += ' active';
                    return (
                        <Tooltip key={st.id} title={st.title || st.name || 'Bước ' + (index + 1)}>
                            <button className={btnCls} onClick={() => setSelectedSubtaskId(st.id)}>
                                {index + 1}
                            </button>
                        </Tooltip>
                    );
                }}
                rightPane={layoutMode === 'split' ? renderCommentPane() : null}
                reviewPane={layoutMode === 'bottom' ? renderCommentPane() : null}
            >
                {/* File submission section */}
                {requiresFileUpload && fileSub && (
                    <div className="tfo-submission-card">
                        <div className="tfo-submission-title">File học viên nộp</div>
                        <div className="tfo-file-download-box">
                            <a href={getSubmissionAnswer(fileSub).startsWith('http') ? getSubmissionAnswer(fileSub) : `${AppConstants.contentRootUrl}${getSubmissionAnswer(fileSub)}`} target="_blank" rel="noopener noreferrer">
                                Tải xuống bài làm của học viên
                            </a>
                        </div>
                    </div>
                )}

                {/* Text submission section */}
                {requiresTextResponse && textSub && (
                    <div className="tfo-submission-card">
                        <div className="tfo-submission-title">Văn bản học viên nộp</div>
                        <div className="tfo-text-answer-box">{getSubmissionAnswer(textSub)}</div>
                    </div>
                )}

                {/* Quiz History Log */}
                {quizHistory && quizHistory.length > 0 && (
                    <div className="tfo-submission-card" style={{ marginTop: 20 }}>
                        <div className="tfo-submission-title">Lịch sử trả lời trắc nghiệm</div>
                        <Table
                            dataSource={quizHistory}
                            rowKey={(record) => record.id}
                            pagination={{ pageSize: 5 }}
                            size="small"
                            columns={[
                                { title: 'Câu hỏi', dataIndex: 'questionText', render: (text) => <span style={{ fontWeight: 500 }}>{text}</span> },
                                { title: 'Đáp án đúng', dataIndex: 'options', render: (optsStr) => { try { const opts = JSON.parse(optsStr || '[]'); const correct = opts.find((o) => o.answer === true || o.answer === 'true'); return correct ? correct.option || correct.value || 'N/A' : 'N/A'; } catch { return 'N/A'; } } },
                                { title: 'Đáp án chọn', dataIndex: 'selectedAnswer' },
                                { title: 'Kết quả', dataIndex: 'isCorrect', width: 100, align: 'center', render: (isCorr) => <Tag color={isCorr ? 'green' : 'red'}>{isCorr ? 'Đúng' : 'Sai'}</Tag> },
                                { title: 'Thời gian', dataIndex: 'createdDate', width: 150, render: (date) => (date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : '-') },
                            ]}
                        />
                    </div>
                )}
            </TaskContentLayout>
        </PageWrapper>
    );
};

export default StudentDiscussionDetailPage;
