import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, Tag, Button, Space, Modal, Spin, Avatar, Input, message, Tooltip } from 'antd';
import StudentSubmissionViewer from '@components/simulation/StudentSubmissionViewer';
import CommentPanel from '@components/simulation/CommentPanel';
import {
    ArrowLeftOutlined,
    EditOutlined,
    DeleteOutlined,
    SaveOutlined,
    UserOutlined,
    CheckCircleFilled,
    SendOutlined,
    CheckOutlined,
    CommentOutlined,
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



/* ─────────────────────────── Main StudentReviewDetailPage ─────────────────────────── */

const quickReviewTemplates = [
    'Bài làm rất tốt, lập luận chặt chẽ và chính xác.',
    'Nội dung đầy đủ, tuy nhiên cần giải thích chi tiết hơn ở phần phân tích.',
    'Cần xem lại kết quả trắc nghiệm và bổ sung tài liệu tham khảo.',
    'Bài làm chưa đạt yêu cầu, vui lòng chỉnh sửa và nộp lại.',
];

const StudentReviewDetailPage = ({ pageOptions }) => {
    const translate = useTranslate();
    const notify = useNotification();
    const navigate = useNavigate();
    const location = useLocation();
    const { simulationId, username } = useParams();
    const { profile } = useAuth();

    const userType = getData(storageKeys.USER_TYPE);
    const isEducator = userType === UserTypes.EDUCATOR;

    // Active Sidebar / Tab states
    const [selectedParentTaskId, setSelectedParentTaskId] = useState(null);
    const [selectedSubtaskId, setSelectedSubtaskId] = useState(null);
    const [isCompleted, setIsCompleted] = useState(false);
    const [activeRightTab, setActiveRightTab] = useState('comments'); // comments, review

    // Educator review editing states (per subtask)
    const [reviewContentInput, setReviewContentInput] = useState('');
    const [isEditingReview, setIsEditingReview] = useState(false);

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
        if (!simulationEnrollmentId && simulationId) {
            fetchEnrollments({
                params: { simulationId },
                onCompleted: (res) => {
                    const list = res.data?.content || [];
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

    // 5. Load educator reviews for the simulation enrollment to map them
    const { data: educatorReviews, execute: refetchReviews } = useFetch(apiConfig.reviewSubmission.educatorList, {
        immediate: false,
        mappingData: (res) => res.data?.content || [],
    });

    useEffect(() => {
        if (simulationEnrollmentId) {
            refetchReviews({
                params: { size: 1000 },
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [simulationEnrollmentId]);

    // Filter reviews strictly belonging to the active student's enrollment
    const filteredEducatorReviews = useMemo(() => {
        if (!educatorReviews || !simulationEnrollmentId) return [];
        return educatorReviews.filter(
            (r) => r.studentSubmission?.studentTaskProgress?.simulationEnrollment?.id === simulationEnrollmentId,
        );
    }, [educatorReviews, simulationEnrollmentId]);

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

    // Fetch quiz questions for the selected subtask
    const [apiQuizQuestions, setApiQuizQuestions] = useState([]);
    const { execute: fetchApiQuizQuestions } = useFetch(apiConfig.taskQuestion.educatorList, {
        immediate: false,
    });

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



    // Find the review linked to the active subtask progress
    const subtaskReview = useMemo(() => {
        if (!filteredEducatorReviews) return null;
        if (activeSubtaskProgress?.id) {
            const foundByProgress = filteredEducatorReviews.find(
                (r) => r.studentSubmission?.studentTaskProgress?.id === activeSubtaskProgress.id,
            );
            if (foundByProgress) return foundByProgress;
        }

        const subId = fileSub?.id || textSub?.id;
        if (subId) {
            const foundBySub = filteredEducatorReviews.find((r) => r.studentSubmission?.id === subId);
            if (foundBySub) return foundBySub;
        }

        return null;
    }, [filteredEducatorReviews, activeSubtaskProgress, fileSub, textSub]);

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
            // Update review
            executeUpdateReview({
                data: {
                    id: subtaskReview.id,
                    content: reviewContentInput.trim(),
                },
                onCompleted: () => {
                    notify({ type: 'success', message: 'Cập nhật nhận xét thành công!' });
                    refetchReviews({ params: { size: 1000 } });
                    setIsEditingReview(false);
                },
                onError: (err) => {
                    notify({ type: 'error', message: err?.message || 'Lỗi cập nhật nhận xét!' });
                },
            });
        } else {
            // Create review
            const activeSubtaskProgressId = activeSubtaskProgress?.id || null;
            const activeSubmissionId = fileSub?.id || textSub?.id || (submissions.length > 0 ? submissions[0].id : null);

            if (!activeSubmissionId) {
                notify({ type: 'warning', message: 'Không tìm thấy bài nộp hợp lệ để gắn nhận xét!' });
                return;
            }

            executeCreateReview({
                data: {
                    content: reviewContentInput.trim(),
                    studentSubmissionId: activeSubmissionId,
                    studentTaskProgressId: activeSubtaskProgressId,
                },
                onCompleted: () => {
                    notify({ type: 'success', message: 'Tạo nhận xét thành công!' });
                    refetchReviews({ params: { size: 1000 } });
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
                        refetchReviews({ params: { size: 1000 } });
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

    const handleDeleteComment = (id) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bạn có chắc chắn muốn xóa bình luận này không?',
            okText: 'Xóa',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            onOk: () => {
                executeDeleteComment({
                    pathParams: { id },
                    onCompleted: () => {
                        loadComments();
                    },
                    onError: (err) => {
                        notify({ type: 'error', message: err?.message || 'Không thể xóa bình luận!' });
                    },
                });
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

    // Build a map of studentSubmissionId -> taskId based on progressList
    const submissionToTaskMap = useMemo(() => {
        const map = {};
        if (progressList) {
            progressList.forEach((p) => {
                const taskId = p.task?.id;
                if (taskId) {
                    const subs = getSubmissions(p);
                    subs.forEach((sub) => {
                        map[sub.id] = taskId;
                    });
                }
            });
        }
        return map;
    }, [progressList]);

    // Build a set of reviewed subtask IDs from filtered reviews by mapping studentSubmission.id back to taskId
    const reviewedTaskIds = useMemo(() => {
        const ids = new Set();
        if (filteredEducatorReviews) {
            filteredEducatorReviews.forEach((r) => {
                const subId = r.studentSubmission?.id;
                if (subId && submissionToTaskMap[subId]) {
                    ids.add(submissionToTaskMap[subId]);
                }
            });
        }
        return ids;
    }, [filteredEducatorReviews, submissionToTaskMap]);

    // Count reviews per parent task
    const reviewCountByParentTask = useMemo(() => {
        const countMap = {};
        if (!tasks || !filteredEducatorReviews) return countMap;
        parentTasks.forEach((pt) => {
            const subs = tasks.filter((t) => t.kind === 2 && (t.parent?.id === pt.id || t.parentId === pt.id));
            const reviewed = subs.filter((s) => reviewedTaskIds.has(s.id));
            countMap[pt.id] = { total: subs.length, reviewed: reviewed.length };
        });
        return countMap;
    }, [tasks, filteredEducatorReviews, parentTasks, reviewedTaskIds]);

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
    const totalReviewed = useMemo(() => reviewedTaskIds.size, [reviewedTaskIds]);

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

                    {/* Split Workspace Layout */}
                    <div className="tfo-workspace-grid">
                        
                        {/* Middle Pane: Submission reader */}
                        <div className="tfo-pane-middle">
                            <div className="tfo-pane-topbar">
                                <div className="tfo-pane-title">
                                    {simulationDetail?.title || 'Đang xem bài làm'}
                                </div>
                                {subtasks.length > 0 && (
                                    <div className="tfo-step-pagination">
                                        {subtasks.map((st, index) => {
                                            const subProgress = progressList?.find((p) => p.task?.id === st.id);
                                            const isSubReviewed = subProgress
                                                ? filteredEducatorReviews?.some(
                                                    (r) => r.studentSubmission?.studentTaskProgress?.id === subProgress.id,
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

                            <StudentSubmissionViewer
                                subtaskDetail={subtaskDetail}
                                submissions={submissions}
                                apiQuizQuestions={apiQuizQuestions}
                                loading={loadingSubtask || loadingProgressDetail}
                            />

                            {/* Bottom Pagination */}
                            <div className="tfo-bottom-nav" style={{ padding: '0 24px 24px' }}>
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
                            </div>
                        </div>

                        {/* Right Pane: Collaboration Workspace */}
                        <div className="tfo-pane-right">
                            <div className="tfo-right-tabs-header">
                                <button 
                                    className={`tfo-right-tab-btn${activeRightTab === 'comments' ? ' active' : ''}`}
                                    onClick={() => setActiveRightTab('comments')}
                                >
                                    <CommentOutlined /> Thảo luận ({commentsCount})
                                </button>
                                <button 
                                    className={`tfo-right-tab-btn${activeRightTab === 'review' ? ' active' : ''}`}
                                    onClick={() => setActiveRightTab('review')}
                                >
                                    <CheckCircleFilled /> Nhận xét
                                </button>
                            </div>

                            <div className="tfo-right-tabs-content">
                                {activeRightTab === 'comments' ? (
                                    <CommentPanel
                                        comments={commentsData?.content || []}
                                        loading={commentsLoading}
                                        profile={profile}
                                        onSendComment={handleSendComment}
                                        onUpdateComment={handleUpdateComment}
                                        onDeleteComment={handleDeleteComment}
                                    />
                                ) : (
                                    <div className="tfo-review-tab-pane">
                                        {subtaskReview && !isEditingReview ? (() => {
                                            const isOwnReview = !subtaskReview.createdBy || subtaskReview.createdBy === profile?.username;
                                            const reviewerName = isOwnReview ? (profile?.fullName || profile?.username || 'Giáo viên') : subtaskReview.createdBy;
                                            const reviewerAvatar = isOwnReview && profile?.avatar ? `${AppConstants.contentRootUrl}${profile.avatar}` : null;
                                            const initials = getInitials(reviewerName);
                                            const avatarBg = getAvatarColor(reviewerName);
                                            return (
                                                <div className="tfo-review-card" style={{ padding: 16, borderRadius: 12, border: '1px solid #f1f5f9', background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                                        {reviewerAvatar ? (
                                                            <img 
                                                                src={reviewerAvatar} 
                                                                alt={reviewerName} 
                                                                style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #e2e8f0', objectFit: 'cover', flexShrink: 0 }} 
                                                            />
                                                        ) : (
                                                            <div 
                                                                style={{ 
                                                                    background: avatarBg, 
                                                                    width: 36, 
                                                                    height: 36, 
                                                                    borderRadius: '50%', 
                                                                    display: 'flex', 
                                                                    alignItems: 'center', 
                                                                    justifyContent: 'center', 
                                                                    color: '#ffffff', 
                                                                    fontWeight: 600, 
                                                                    fontSize: 13, 
                                                                    flexShrink: 0, 
                                                                }}
                                                            >
                                                                {initials}
                                                            </div>
                                                        )}
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {reviewerName}
                                                            </div>
                                                            <div style={{ fontSize: 10, color: '#64748b' }}>Giáo viên hướng dẫn</div>
                                                        </div>
                                                        <span style={{ fontSize: 10, color: '#94a3b8' }}>
                                                            {subtaskReview.createdDate ? dayjs(subtaskReview.createdDate).format('DD/MM/YYYY') : ''}
                                                        </span>
                                                    </div>

                                                    <div style={{ 
                                                        fontSize: 13, 
                                                        color: '#334155', 
                                                        lineHeight: 1.6, 
                                                        backgroundColor: '#f8fafc',
                                                        padding: 12,
                                                        borderRadius: 8,
                                                        marginBottom: 12,
                                                        whiteSpace: 'pre-wrap',
                                                    }}>
                                                        {subtaskReview.content}
                                                    </div>

                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
                                                        <Button
                                                            type="text"
                                                            icon={<EditOutlined />}
                                                            onClick={() => setIsEditingReview(true)}
                                                            size="small"
                                                            style={{ color: '#fa8c16', fontWeight: 600, fontSize: 12 }}
                                                        >
                                                            Sửa
                                                        </Button>
                                                        <Button
                                                            type="text"
                                                            icon={<DeleteOutlined />}
                                                            onClick={handleDeleteReview}
                                                            loading={loadingDeleteReview}
                                                            size="small"
                                                            danger
                                                            style={{ fontWeight: 600, fontSize: 12 }}
                                                        >
                                                            Xóa
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })() : (
                                            <Card
                                                title={
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <span>{subtaskReview ? 'Sửa nhận xét bài làm' : 'Nhận xét & Đánh giá'}</span>
                                                        {!subtaskReview && <Tag color="orange">Chưa nhận xét</Tag>}
                                                    </div>
                                                }
                                                bordered={false}
                                                className="tfo-review-editor-card"
                                            >
                                                <Input.TextArea
                                                    rows={6}
                                                    placeholder="Nhập nội dung nhận xét, phản hồi hoặc hướng dẫn cho học viên..."
                                                    value={reviewContentInput}
                                                    onChange={(e) => setReviewContentInput(e.target.value)}
                                                />

                                                {/* Quick Review templates */}
                                                <div className="tfo-quick-templates">
                                                    <span className="tfo-quick-templates-lbl">Mẫu nhận xét nhanh:</span>
                                                    <div className="tfo-quick-templates-list">
                                                        {quickReviewTemplates.map((tpl, idx) => (
                                                            <button 
                                                                key={idx}
                                                                type="button"
                                                                className="tfo-quick-template-badge"
                                                                onClick={() => setReviewContentInput(tpl)}
                                                                title={tpl}
                                                            >
                                                                {tpl.length > 25 ? tpl.substring(0, 25) + '...' : tpl}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <Space style={{ marginTop: 16 }}>
                                                    <Button
                                                        type="primary"
                                                        icon={<SaveOutlined />}
                                                        onClick={handleSaveReview}
                                                        loading={loadingCreateReview || loadingUpdateReview}
                                                        className="tfo-save-review-btn"
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
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </Spin>
        </PageWrapper>
    );
};

export default StudentReviewDetailPage;
