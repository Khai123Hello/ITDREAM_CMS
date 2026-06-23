import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Tag, Button, Modal, Spin, Avatar, Input, message, Tooltip, Badge } from 'antd';
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
    UndoOutlined,
    ClockCircleOutlined,
    PicRightOutlined,
    VerticalAlignBottomOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
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

const hasAssignmentContent = (task) => {
    const name = task?.name || '';
    const match = name.match(/^SUB_T(\d+)_S(\d+)(_.*)?$/);
    if (!match) return false;
    const suffix = match[3] || '';
    return suffix === '_FILE' || suffix === '_TEXT' || suffix === '_FILE_TEXT';
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
    const [workspaceMode, setWorkspaceMode] = useState('review'); // preview, review, comments

    const [layoutMode, setLayoutMode] = useState(() => {
        try {
            const saved = localStorage.getItem('review_layout_mode');
            return saved || 'split';
        } catch (e) {
            return 'split';
        }
    });

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const handleLayoutModeChange = (mode) => {
        setLayoutMode(mode);
        try {
            localStorage.setItem('review_layout_mode', mode);
        } catch (e) {
            console.error(e);
        }
    };
    const validatePermission = useValidatePermission();
    const canWriteReview = validatePermission([apiConfig.reviewSubmission.create.permissionCode]);
    const canWriteComment = validatePermission([apiConfig.comment.create.permissionCode]);

    const [draftReviews, setDraftReviews] = useState({});
    const [lastSubtaskId, setLastSubtaskId] = useState(null);

    // Educator review editing states (per subtask)
    const [reviewContentInput, setReviewContentInput] = useState('');
    const [isEditingReview, setIsEditingReview] = useState(false);



    // Simulation Enrollment ID resolution
    const [simulationEnrollmentId, setSimulationEnrollmentId] = useState(
        () => location.state?.simulationEnrollmentId || null,
    );
    const [enrollment, setEnrollment] = useState(null);

    useEffect(() => {
        if (simulationEnrollmentId) {
            try {
                const saved = localStorage.getItem(`review_drafts_${simulationEnrollmentId}`);
                if (saved) {
                    setDraftReviews(JSON.parse(saved));
                }
            } catch (e) {
                console.error(e);
            }
        }
    }, [simulationEnrollmentId]);

    useEffect(() => {
        if (simulationEnrollmentId) {
            try {
                localStorage.setItem(`review_drafts_${simulationEnrollmentId}`, JSON.stringify(draftReviews));
            } catch (e) {
                console.error(e);
            }
        }
    }, [draftReviews, simulationEnrollmentId]);

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
                params: { simulationId },
                onCompleted: (res) => {
                    const list = res.data?.content || [];
                    const found = list.find((item) => item.student?.profileAccountDto?.username === username);
                    if (found) {
                        setSimulationEnrollmentId(found.id);
                        setEnrollment(found);
                        // Ưu tiên reviewStatus từ DB (1 = đã nhận xét), fallback về isReviewed (boolean)
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

    // 5. Load educator reviews for the simulation enrollment to map them
    const { data: educatorReviews, execute: refetchReviews } = useFetch(
        isEducator ? apiConfig.reviewSubmission.educatorList : apiConfig.reviewSubmission.studentList,
        {
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

    // Filter reviews strictly belonging to the active student's enrollment
    const filteredEducatorReviews = useMemo(() => {
        if (!educatorReviews || !simulationEnrollmentId) return [];
        return educatorReviews.filter(
            (r) => {
                const rEnrollId = r.simulationEnrollmentId || r.studentSubmission?.studentTaskProgress?.simulationEnrollment?.id;
                return String(rEnrollId) === String(simulationEnrollmentId);
            }
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
        return progressList.find((p) => String(p.task?.id) === String(selectedSubtaskId));
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
                (r) => {
                    const rProgressId = r.studentTaskProgressId || r.studentSubmission?.studentTaskProgress?.id;
                    return String(rProgressId) === String(activeSubtaskProgress.id);
                }
            );
            if (foundByProgress) return foundByProgress;
        }

        const subId = fileSub?.id || textSub?.id;
        if (subId) {
            const foundBySub = filteredEducatorReviews.find((r) => String(r.studentSubmission?.id) === String(subId));
            if (foundBySub) return foundBySub;
        }

        return null;
    }, [filteredEducatorReviews, activeSubtaskProgress, fileSub, textSub]);

    useEffect(() => {
        if (selectedSubtaskId !== lastSubtaskId) {
            setLastSubtaskId(selectedSubtaskId);
            const draft = draftReviews[selectedSubtaskId];
            if (draft !== undefined) {
                setReviewContentInput(draft.content || '');
            } else {
                setReviewContentInput(subtaskReview?.content || '');
            }
            setIsEditingReview(false);
        } else {
            const draft = draftReviews[selectedSubtaskId];
            if (draft === undefined && subtaskReview) {
                setReviewContentInput(subtaskReview.content || '');
            }
        }
    }, [selectedSubtaskId, subtaskReview, draftReviews, lastSubtaskId]);

    const handleTextareaChange = (val) => {
        setReviewContentInput(val);
        if (selectedSubtaskId) {
            const activeSubtaskProgressId = activeSubtaskProgress?.id || null;
            let activeSubmissionId = fileSub?.id || textSub?.id || (submissions.length > 0 ? submissions[0].id : null);

            // Fallback: If activeSubmissionId is null but activeSubtaskProgress is available, try to resolve it from there
            if (!activeSubmissionId && activeSubtaskProgress) {
                const subs = getSubmissions(activeSubtaskProgress);
                const fSub = subs.find(
                    (s) => !s.taskQuestion && (getSubmissionAnswer(s).includes('/') || getSubmissionAnswer(s).includes('.')),
                );
                const tSub = subs.find(
                    (s) => !s.taskQuestion && !(getSubmissionAnswer(s).includes('/') || getSubmissionAnswer(s).includes('.')),
                );
                activeSubmissionId = fSub?.id || tSub?.id || (subs.length > 0 ? subs[0].id : null);
            }

            setDraftReviews((prev) => ({
                ...prev,
                [selectedSubtaskId]: {
                    content: val,
                    studentSubmissionId: activeSubmissionId,
                    studentTaskProgressId: activeSubtaskProgressId,
                },
            }));
        }
    };

    const handleResetDraft = () => {
        if (!selectedSubtaskId) return;
        setDraftReviews((prev) => {
            const next = { ...prev };
            delete next[selectedSubtaskId];
            return next;
        });
        setReviewContentInput(subtaskReview?.content || '');
        message.info('Đã khôi phục về nhận xét gốc');
    };

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

    const hasUnsavedDrafts = useMemo(() => {
        const draftKeys = Object.keys(draftReviews);
        if (draftKeys.length === 0) return false;

        return draftKeys.some((subId) => {
            const draft = draftReviews[subId];
            if (!draft || !draft.content?.trim()) return false;

            const progress = progressList?.find((p) => String(p.task?.id) === String(subId));
            const dbReview = progress
                ? filteredEducatorReviews?.find(
                    (r) => String(r.studentTaskProgressId || r.studentSubmission?.studentTaskProgress?.id) === String(progress.id),
                )
                : null;
            const dbContent = dbReview?.content || '';

            return draft.content.trim() !== dbContent.trim();
        });
    }, [draftReviews, progressList, filteredEducatorReviews]);

    const hasUnsavedDraftForActiveSubtask = useMemo(() => {
        const draft = draftReviews[selectedSubtaskId];
        if (!draft || !draft.content?.trim()) return false;

        const progress = progressList?.find(
            (p) => String(p.task?.id) === String(selectedSubtaskId),
        );
        const dbReview = progress
            ? filteredEducatorReviews?.find(
                (r) => String(r.studentTaskProgressId || r.studentSubmission?.studentTaskProgress?.id) === String(progress.id),
            )
            : null;
        const dbContent = dbReview?.content || '';

        return draft.content.trim() !== dbContent.trim();
    }, [draftReviews, selectedSubtaskId, progressList, filteredEducatorReviews]);

    const isCompleteBtnDisabled = isCompleted && !hasUnsavedDrafts;

    const handleCompleteReview = () => {
        // Collect all drafts that are unsaved across the entire simulation
        const unsavedDrafts = [];
        const allSubtasks = tasks?.filter((t) => t.kind === 2) || [];
        allSubtasks.forEach((st) => {
            const subId = st.id;
            const draft = draftReviews[subId];
            if (!draft || !draft.content) return;

            const progress = progressList?.find((p) => String(p.task?.id) === String(subId));
            const dbReview = filteredEducatorReviews?.find(
                (r) => String(r.studentTaskProgressId || r.studentSubmission?.studentTaskProgress?.id) === String(progress?.id),
            );
            const dbContent = dbReview?.content || '';

            if (draft.content.trim() !== dbContent.trim()) {
                unsavedDrafts.push({
                    subtaskId: subId,
                    dbReviewId: dbReview?.id,
                    content: draft.content.trim(),
                    studentSubmissionId: draft.studentSubmissionId,
                    studentTaskProgressId: draft.studentTaskProgressId,
                });
            }
        });

        const performComplete = () => {
            executeCompleteReview({
                data: {
                    simulationId: parseInt(simulationId, 10),
                    studentUsername: username,
                },
                onCompleted: () => {
                    setIsCompleted(true);
                    setDraftReviews({});
                    try {
                        localStorage.removeItem(`review_drafts_${simulationEnrollmentId}`);
                    } catch (e) {
                        console.error(e);
                    }
                    notify({
                        type: 'success',
                        message: 'Đã hoàn tất nhận xét! Học viên đã được thông báo.',
                    });
                    navigate('/simulation-review');
                },
                onError: (err) => {
                    notify({
                        type: 'error',
                        message: err?.message || 'Lỗi khi gửi thông báo hoàn tất!',
                    });
                },
            });
        };

        Modal.confirm({
            title: 'Hoàn tất nhận xét bài làm',
            content: (
                <div>
                    <p>
                        Bạn có chắc chắn muốn hoàn tất nhận xét và gửi thông báo cho học viên{' '}
                        <strong>{username}</strong> không?
                    </p>
                    {unsavedDrafts.length > 0 && (
                        <p style={{ color: '#fa8c16', fontWeight: 600 }}>
                            Có {unsavedDrafts.length} nhận xét đang soạn nháp sẽ được đồng bộ lên hệ thống.
                        </p>
                    )}
                    <p style={{ color: '#8c8c8c', fontSize: 13, marginTop: 8 }}>
                        Học viên sẽ nhận được thông báo và có thể xem toàn bộ nhận xét của bạn.
                    </p>
                </div>
            ),
            okText: 'Hoàn tất & Gửi thông báo',
            cancelText: 'Hủy',
            okButtonProps: { type: 'primary', icon: <SendOutlined /> },
            onOk: async () => {
                if (unsavedDrafts.length > 0) {
                    // Try resolving fallbacks
                    const finalUnsavedDrafts = unsavedDrafts.map((d) => {
                        const progress = progressList?.find((p) => String(p.task?.id) === String(d.subtaskId));
                        const subs = getSubmissions(progress);
                        const fSub = subs.find(
                            (s) => !s.taskQuestion && (getSubmissionAnswer(s).includes('/') || getSubmissionAnswer(s).includes('.')),
                        );
                        const tSub = subs.find(
                            (s) => !s.taskQuestion && !(getSubmissionAnswer(s).includes('/') || getSubmissionAnswer(s).includes('.')),
                        );
                        const fallbackSubmissionId = fSub?.id || tSub?.id || (subs.length > 0 ? subs[0].id : null);
                        const fallbackProgressId = progress?.id || null;

                        return {
                            ...d,
                            studentSubmissionId: d.studentSubmissionId || fallbackSubmissionId,
                            studentTaskProgressId: d.studentTaskProgressId || fallbackProgressId,
                        };
                    });



                    const validSyncDrafts = finalUnsavedDrafts.filter(d => d.dbReviewId || d.studentSubmissionId);

                    try {
                        const syncPromises = validSyncDrafts.map((draft) => {
                            if (draft.dbReviewId) {
                                return executeUpdateReview({
                                    data: {
                                        id: draft.dbReviewId,
                                        content: draft.content,
                                    },
                                });
                            } else {
                                return executeCreateReview({
                                    data: {
                                        content: draft.content,
                                        studentSubmissionId: draft.studentSubmissionId,
                                        studentTaskProgressId: draft.studentTaskProgressId,
                                    },
                                });
                            }
                        });

                        const results = await Promise.all(syncPromises);
                        const hasError = results.some(res => !res || res.result === false || (res.statusCode !== undefined && res.statusCode !== 200) || res instanceof Error || res.response);
                        if (hasError) {
                            notify({
                                type: 'error',
                                message: 'Đồng bộ một số nhận xét nháp thất bại. Vui lòng thử lại.',
                            });
                            return;
                        }
                        performComplete();
                    } catch (syncErr) {
                        notify({
                            type: 'error',
                            message: 'Lỗi khi đồng bộ nhận xét nháp lên hệ thống!',
                        });
                    }
                } else {
                    performComplete();
                }
            },
        });
    };

    const handleSaveReview = () => {
        if (!reviewContentInput.trim()) {
            message.warning('Vui lòng nhập nội dung nhận xét!');
            return;
        }

        const activeSubtaskProgressId = activeSubtaskProgress?.id || null;
        let activeSubmissionId = fileSub?.id || textSub?.id || (submissions.length > 0 ? submissions[0].id : null);

        // Fallback: If activeSubmissionId is null but activeSubtaskProgress is available, try to resolve it from there
        if (!activeSubmissionId && activeSubtaskProgress) {
            const subs = getSubmissions(activeSubtaskProgress);
            const fSub = subs.find(
                (s) => !s.taskQuestion && (getSubmissionAnswer(s).includes('/') || getSubmissionAnswer(s).includes('.')),
            );
            const tSub = subs.find(
                (s) => !s.taskQuestion && !(getSubmissionAnswer(s).includes('/') || getSubmissionAnswer(s).includes('.')),
            );
            activeSubmissionId = fSub?.id || tSub?.id || (subs.length > 0 ? subs[0].id : null);
        }



        setDraftReviews((prev) => ({
            ...prev,
            [selectedSubtaskId]: {
                content: reviewContentInput.trim(),
                studentSubmissionId: activeSubmissionId,
                studentTaskProgressId: activeSubtaskProgressId,
            },
        }));

        setIsEditingReview(false);
        notify({ type: 'success', message: 'Đã lưu nhận xét vào bản nháp cục bộ!' });
    };

    const handleDeleteReview = () => {
        if (!subtaskReview?.id) {
            Modal.confirm({
                title: 'Xác nhận xóa bản nháp',
                content: 'Bạn có chắc chắn muốn xóa bản nháp nhận xét này không?',
                okText: 'Xóa',
                cancelText: 'Hủy',
                okButtonProps: { danger: true },
                onOk: () => {
                    setDraftReviews((prev) => {
                        const next = { ...prev };
                        delete next[selectedSubtaskId];
                        return next;
                    });
                    setReviewContentInput('');
                    setIsEditingReview(false);
                    notify({ type: 'success', message: 'Đã xóa bản nháp!' });
                },
            });
            return;
        }

        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bạn có chắc chắn muốn xóa nhận xét này không? Thao tác này sẽ xóa vĩnh viễn khỏi hệ thống.',
            okText: 'Xóa',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            onOk: () => {
                executeDeleteReview({
                    pathParams: { id: subtaskReview.id },
                    onCompleted: () => {
                        setDraftReviews((prev) => {
                            const next = { ...prev };
                            delete next[selectedSubtaskId];
                            return next;
                        });
                        setReviewContentInput('');
                        setIsEditingReview(false);
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
            const subs = tasks.filter((t) => t.kind === 2 && hasAssignmentContent(t) && (t.parent?.id === pt.id || t.parentId === pt.id));
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



    // Total review progress
    const totalSubtasks = useMemo(() => {
        return tasks?.filter((t) => t.kind === 2 && hasAssignmentContent(t))?.length || 0;
    }, [tasks]);
    const totalReviewed = useMemo(() => {
        let count = 0;
        reviewedTaskIds.forEach((id) => {
            const task = tasks?.find((t) => t.id === id);
            if (task && hasAssignmentContent(task)) {
                count++;
            }
        });
        return count;
    }, [reviewedTaskIds, tasks]);

    // Helper functions to render review elements cleanly and dynamically
    const renderReviewStatus = () => {
        const hasDbReview = !!subtaskReview;
        const draft = draftReviews[selectedSubtaskId];
        const hasDraft = draft && draft.content?.trim() !== (subtaskReview?.content || '').trim();
        
        if (hasDbReview) {
            return (
                <Tag icon={<CheckCircleFilled />} color="success" className="tfo-draft-badge">
                    Đã lưu
                </Tag>
            );
        } else if (hasDraft) {
            return (
                <Tag icon={<EditOutlined />} color="warning" className="tfo-draft-badge">
                    Bản nháp
                </Tag>
            );
        }
        return (
            <Tag 
                icon={<ClockCircleOutlined />} 
                color="default" 
                className="tfo-draft-badge"
                style={{
                    backgroundColor: '#fff7ed',
                    color: '#c2410c',
                    borderColor: '#ffedd5',
                }}
            >
                Chưa nhận xét
            </Tag>
        );
    };

    const renderReviewHeader = () => {
        return (
            <div className="tfo-review-section-header">
                <span className="tfo-review-section-title">Nhận xét & Đánh giá</span>
                {renderReviewStatus()}
            </div>
        );
    };

    const renderReviewDisplay = () => {
        const activeDraft = draftReviews[selectedSubtaskId];
        const hasUnsavedDraft = activeDraft && activeDraft.content.trim() !== (subtaskReview?.content || '').trim();
        const displayReviewContent = activeDraft ? activeDraft.content : (subtaskReview?.content || '');

        const isOwnReview = !subtaskReview || !subtaskReview.createdBy || subtaskReview.createdBy === profile?.username;
        const reviewerName = isOwnReview ? (profile?.fullName || profile?.username || 'Giáo viên') : subtaskReview.createdBy;
        const reviewerAvatar = isOwnReview && profile?.avatar ? `${AppConstants.contentRootUrl}${profile.avatar}` : null;
        const initials = getInitials(reviewerName);
        const avatarBg = getAvatarColor(reviewerName);

        const cardClass = `tfo-review-display tfo-review-fade-in ${hasUnsavedDraft ? 'draft-card' : 'saved-card'}`;

        return (
            <div className={cardClass}>
                <div className="tfo-review-display__header">
                    {reviewerAvatar ? (
                        <Avatar 
                            src={reviewerAvatar} 
                            alt={reviewerName} 
                            className="tfo-review-display__avatar" 
                        />
                    ) : (
                        <Avatar 
                            style={{ background: avatarBg }} 
                            className="tfo-review-display__avatar"
                        >
                            {initials}
                        </Avatar>
                    )}
                    <div className="tfo-review-display__meta">
                        <div className="tfo-review-display__name">
                            {reviewerName}
                            {hasUnsavedDraft && (
                                <Tag color="orange" className="tfo-draft-badge">Bản nháp</Tag>
                            )}
                        </div>
                        <div className="tfo-review-display__role">Giáo viên hướng dẫn</div>
                    </div>
                    <span className="tfo-review-display__date">
                        {subtaskReview?.createdDate ? dayjs(subtaskReview.createdDate).format('DD/MM/YYYY') : 'Chưa lưu'}
                    </span>
                </div>

                <blockquote className="tfo-review-display__quote">
                    {displayReviewContent}
                </blockquote>

                {canWriteReview && (
                    <div className="tfo-review-display__toolbar">
                        {hasUnsavedDraft && (
                            <Tooltip title="Khôi phục gốc">
                                <Button
                                    type="text"
                                    icon={<UndoOutlined />}
                                    onClick={handleResetDraft}
                                    className="tfo-toolbar-btn"
                                />
                            </Tooltip>
                        )}
                        <Tooltip title="Sửa nhận xét">
                            <Button
                                type="text"
                                icon={<EditOutlined />}
                                onClick={() => setIsEditingReview(true)}
                                className="tfo-toolbar-btn tfo-edit-btn"
                            />
                        </Tooltip>
                        <Tooltip title="Xóa nhận xét">
                            <Button
                                type="text"
                                icon={<DeleteOutlined />}
                                onClick={handleDeleteReview}
                                loading={loadingDeleteReview}
                                danger
                                className="tfo-toolbar-btn tfo-delete-btn"
                            />
                        </Tooltip>
                    </div>
                )}
            </div>
        );
    };

    const renderReviewEditor = () => {
        return (
            <div className="tfo-review-editor tfo-review-fade-in">
                <div className="tfo-review-editor__textarea-wrapper">
                    <Input.TextArea
                        rows={6}
                        placeholder="Nhập nội dung nhận xét, phản hồi hoặc hướng dẫn..."
                        value={reviewContentInput}
                        onChange={(e) => handleTextareaChange(e.target.value)}
                        maxLength={2000}
                        className="tfo-review-editor__textarea"
                    />
                    <span className="tfo-review-editor__counter">
                        {(reviewContentInput || '').length}/2000
                    </span>
                </div>

                <div className="tfo-review-editor__templates">
                    {quickReviewTemplates.map((tpl, idx) => (
                        <Tooltip key={idx} title={tpl} mouseEnterDelay={0.5}>
                            <button 
                                type="button"
                                className="tfo-quick-template-badge"
                                onClick={() => handleTextareaChange(tpl)}
                            >
                                {tpl}
                            </button>
                        </Tooltip>
                    ))}
                </div>

                <div className="tfo-review-editor__actions">
                    <Button
                        type="primary"
                        icon={<SaveOutlined />}
                        onClick={handleSaveReview}
                        loading={loadingCreateReview || loadingUpdateReview}
                        className="tfo-save-review-btn"
                    >
                        Lưu bản nháp
                    </Button>
                    {draftReviews[selectedSubtaskId] && (
                        <Button 
                            icon={<UndoOutlined />} 
                            onClick={handleResetDraft}
                            className="tfo-btn-secondary"
                        >
                            Khôi phục gốc
                        </Button>
                    )}
                    {isEditingReview && (
                        <Button 
                            onClick={() => setIsEditingReview(false)}
                            className="tfo-btn-secondary"
                        >
                            Hủy
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    const renderReviewEmpty = () => {
        return (
            <div className="tfo-review-empty tfo-review-fade-in">
                <CheckCircleFilled className="tfo-review-empty__icon" />
                <p className="tfo-review-empty__text">Chưa có nhận xét cho bước này</p>
            </div>
        );
    };

    const renderCollaborationPanel = () => {
        if (workspaceMode === 'review') {
            const hasSubmission = loadingProgressDetail || !!(fileSub?.id || textSub?.id || (submissions.length > 0 ? submissions[0].id : null));

            return (
                <div className="tfo-review-tab-pane">
                    {!canWriteReview && (
                        <div className="tfo-review-read-only-banner">
                            Bạn đang xem thông tin ở chế độ chỉ đọc.
                        </div>
                    )}

                    {renderReviewHeader()}

                    {(subtaskReview || draftReviews[selectedSubtaskId]?.content) && !isEditingReview ? (
                        renderReviewDisplay()
                    ) : (
                        !hasSubmission ? (
                            <div className="tfo-review-empty tfo-review-fade-in" style={{ padding: '24px 16px', textAlign: 'center' }}>
                                <ClockCircleOutlined className="tfo-review-empty__icon" style={{ color: '#fa8c16', fontSize: 32, marginBottom: 12 }} />
                                <p className="tfo-review-empty__text" style={{ color: '#fa8c16', fontWeight: 500 }}>
                                    Không có bài nộp của học viên để nhận xét
                                </p>
                            </div>
                        ) : (
                            canWriteReview ? renderReviewEditor() : renderReviewEmpty()
                        )
                    )}
                </div>
            );
        } else {
            return (
                <div className="tfo-comments-pane-inner">
                    <div className="tfo-review-section-header">
                        <span className="tfo-review-section-title">Thảo luận & Bình luận</span>
                        {commentsData?.content?.length > 0 && (
                            <Badge 
                                count={commentsData.content.length} 
                                size="small" 
                                style={{ backgroundColor: '#1890ff', marginLeft: 6 }} 
                            />
                        )}
                    </div>
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
            );
        }
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
                    onClick={() => navigate('/simulation-review')} 
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
                            <Tag color="blue" style={{ margin: 0 }}>{username}</Tag>
                            {/* Badge trạng thái nhận xét — hiển thị rõ đã nhận xét hay chưa */}
                            {isCompleted ? (
                                <Tag color="success" icon={<CheckCircleFilled />} style={{ margin: 0, fontWeight: 600 }}>
                                    Đã nhận xét
                                </Tag>
                            ) : (
                                <Tag color="warning" icon={<ClockCircleOutlined />} style={{ margin: 0, fontWeight: 600 }}>
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

                    {/* Mode switcher (Nhận xét & Đánh giá / Thảo luận & Bình luận) */}
                    <div className="tfo-mode-switcher">
                        <Tooltip title="Chế độ Nhận xét & Đánh giá">
                            <Button 
                                icon={<EditOutlined />} 
                                type={workspaceMode === 'review' ? 'primary' : 'text'}
                                onClick={() => setWorkspaceMode('review')}
                                size="small"
                            >
                                <span>Nhận xét & Đánh giá</span>
                                {hasUnsavedDraftForActiveSubtask && (
                                    <Badge status="warning" style={{ marginLeft: 2 }} />
                                )}
                            </Button>
                        </Tooltip>
                        <Tooltip title="Chế độ Thảo luận & Bình luận">
                            <Button 
                                icon={<CommentOutlined />} 
                                type={workspaceMode === 'comments' ? 'primary' : 'text'}
                                onClick={() => setWorkspaceMode('comments')}
                                size="small"
                            >
                                Thảo luận & Bình luận
                            </Button>
                        </Tooltip>
                    </div>


                    {/* Complete Review Button */}
                    {canWriteReview && (
                        <Tooltip
                            title={
                                hasUnsavedDrafts
                                    ? 'Đồng bộ các bản nháp và hoàn tất nhận xét'
                                    : isCompleted
                                        ? 'Đã hoàn tất nhận xét'
                                        : 'Hoàn tất nhận xét & gửi thông báo cho học viên'
                            }
                        >
                            <Button
                                type="primary"
                                icon={<CheckCircleFilled />}
                                onClick={handleCompleteReview}
                                disabled={isCompleteBtnDisabled}
                                loading={loadingCompleteReview}
                                className={`tfo-complete-btn ${isCompleted ? 'completed' : ''}`}
                            >
                                {isCompleted ? 'Đã hoàn tất nhận xét' : 'Hoàn tất nhận xét'}
                            </Button>
                        </Tooltip>
                    )}
                </div>
            </div>

            <Spin spinning={loadingGeneral}>
                <div className="tfo-review-container">
                    {/* Left Sidebar: Timeline of Parent Tasks */}
                    <aside className={`tfo-sidebar${sidebarCollapsed ? ' collapsed' : ''}`}>
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

                                // Check if this parent task has any subtasks with drafts
                                const parentSubtasks = tasks?.filter((t) => t.kind === 2 && (t.parent?.id === task.id || t.parentId === task.id)) || [];
                                const hasParentDrafts = parentSubtasks.some(st => {
                                    const draft = draftReviews[st.id];
                                    if (!draft || !draft.content?.trim()) return false;
                                    const subProgress = progressList?.find((p) => String(p.task?.id) === String(st.id));
                                    const dbReview = subProgress
                                        ? filteredEducatorReviews?.find(
                                            (r) => r.studentSubmission?.studentTaskProgress?.id === subProgress.id,
                                        )
                                        : null;
                                    return draft.content.trim() !== (dbReview?.content || '').trim();
                                });

                                return (
                                    <div key={task.id || idx} className="tfo-task-list-row">
                                        <button
                                            className={`tfo-task-item${isActive ? ' active' : ''}${allReviewed ? ' reviewed' : ''}${hasParentDrafts ? ' has-draft' : ''}`}
                                            onClick={() => {
                                                setSelectedParentTaskId(task.id);
                                                setSelectedSubtaskId(null);
                                            }}
                                        >
                                            <div className="tfo-task-item-number">
                                                {allReviewed && !hasParentDrafts ? <CheckOutlined /> : idx + 1}
                                            </div>
                                            <div className="tfo-task-item-content">
                                                <div className="tfo-task-item-title">
                                                    {task.title || task.name}
                                                </div>



                                                {hasParentDrafts && (
                                                    <div className="tfo-task-item-draft">
                                                        Có bản nháp
                                                    </div>
                                                )}
                                            </div>
                                            {hasParentDrafts && (
                                                <div className="tfo-task-item-dot" />
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </aside>

                    {/* Split Workspace Layout */}
                    <div className={`tfo-workspace-grid${workspaceMode === 'preview' || layoutMode === 'bottom' ? ' preview-mode' : ''}`}>
                        
                        {/* Middle Pane: Submission reader */}
                        <div className="tfo-pane-middle">
                            <div className="tfo-pane-topbar">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <Tooltip title={sidebarCollapsed ? "Mở rộng danh sách" : "Thu gọn danh sách"}>
                                        <Button 
                                            icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} 
                                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                                            type="text"
                                            style={{ 
                                                fontSize: 16, 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                background: '#f1f5f9',
                                                borderRadius: 8,
                                                width: 32,
                                                height: 32,
                                            }}
                                        />
                                    </Tooltip>
                                    <div className="tfo-pane-title">
                                        {simulationDetail?.title || 'Đang xem bài làm'}
                                    </div>
                                </div>
                                {subtasks.length > 0 && (
                                    <div className="tfo-step-pagination">
                                        {subtasks.map((st, index) => {
                                            const subProgress = progressList?.find((p) => String(p.task?.id) === String(st.id));
                                            const isSubReviewed = subProgress
                                                ? filteredEducatorReviews?.some(
                                                    (r) => String(r.studentTaskProgressId || r.studentSubmission?.studentTaskProgress?.id) === String(subProgress.id),
                                                )
                                                : reviewedTaskIds.has(st.id);
                                            const isActiveSub = st.id === selectedSubtaskId;

                                            let btnCls = 'tfo-step-btn';
                                            if (isActiveSub) btnCls += ' active';
                                            if (isSubReviewed && !isActiveSub) btnCls += ' reviewed';

                                            const dbReviewForSub = subProgress
                                                ? filteredEducatorReviews?.find(
                                                    (r) => String(r.studentTaskProgressId || r.studentSubmission?.studentTaskProgress?.id) === String(subProgress.id),
                                                )
                                                : null;
                                            const draftForSub = draftReviews[st.id];
                                            const hasDraftForSub = draftForSub && draftForSub.content?.trim() !== (dbReviewForSub?.content || '').trim();

                                            return (
                                                <Tooltip
                                                    key={st.id}
                                                    title={`${st.title || st.name || 'Bước ' + (index + 1)}${isSubReviewed ? ' ✓ Đã nhận xét' : ''}`}
                                                >
                                                    <button
                                                        className={btnCls}
                                                        onClick={() => setSelectedSubtaskId(st.id)}
                                                        style={{ position: 'relative' }}
                                                    >
                                                        {hasDraftForSub && (
                                                            <span style={{
                                                                position: 'absolute',
                                                                top: 2,
                                                                right: 2,
                                                                width: 6,
                                                                height: 6,
                                                                borderRadius: '50%',
                                                                backgroundColor: '#fa8c16',
                                                            }} />
                                                        )}
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

                            {/* Bottom Collaboration Panel */}
                            {workspaceMode !== 'preview' && layoutMode === 'bottom' && (
                                <div className="tfo-bottom-collaboration-container">
                                    {renderCollaborationPanel()}
                                </div>
                            )}
                        </div>

                        {/* Right Pane: Collaboration Workspace */}
                        {workspaceMode !== 'preview' && layoutMode !== 'bottom' && (
                            <div className="tfo-pane-right">
                                {renderCollaborationPanel()}
                            </div>
                        )}

                    </div>
                </div>
            </Spin>
        </PageWrapper>
    );
};

export default StudentReviewDetailPage;
