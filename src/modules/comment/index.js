import React, { useEffect, useState, useMemo } from 'react';
import { Empty, Tag, Button, Pagination, Spin, Modal, message } from 'antd';
import { DeleteOutlined, MessageOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import useListBase from '@hooks/useListBase';
import useTranslate from '@hooks/useTranslate';
import useFetch from '@hooks/useFetch';
import useQueryParams from '@hooks/useQueryParams';
import useAuth from '@hooks/useAuth';

import { DEFAULT_TABLE_ITEM_SIZE, AppConstants, UserTypes, storageKeys } from '@constants';
import { FieldTypes } from '@constants/formConfig';
import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';
import { getData } from '@utils/localStorage';

import ListPage from '@components/common/layout/ListPage';
import PageWrapper from '@components/common/layout/PageWrapper';
import StudentSubmissionViewer from '@components/simulation/StudentSubmissionViewer';
import CommentPanel from '@components/simulation/CommentPanel';

import '../../modules/reviewSubmission/StudentReviewDetailPage.scss';

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

const CommentListPage = () => {
    const translate = useTranslate();
    const { params: queryParams, deserializeParams } = useQueryParams();
    const [tasks, setTasks] = useState([]);
    const { profile } = useAuth();

    // Active comment states
    const [activeComment, setActiveComment] = useState(null);
    const [progressDetail, setProgressDetail] = useState(null);
    const [loadingProgressDetail, setLoadingProgressDetail] = useState(false);
    const [apiQuizQuestions, setApiQuizQuestions] = useState([]);

    const labels = {
        user: 'Học viên',
        task: 'Bài học',
        content: 'Nội dung',
        createdDate: 'Thời gian',
        action: translate.formatMessage(commonMessage.action),
        comment: 'Bình luận',
        noData: translate.formatMessage(commonMessage.noData),
    };

    const userType = getData(storageKeys.USER_TYPE);
    const isEducator = userType === UserTypes.EDUCATOR;

    const { execute: executeGetTasks } = useFetch(isEducator ? apiConfig.task.listByEducator : apiConfig.task.getList);

    const { data, mixinFuncs, loading, pagination, queryFilter, setData, setPagination, setLoading } = useListBase({
        apiConfig: {
            getList: apiConfig.comment.list,
            delete: apiConfig.comment.delete,
        },
        options: {
            objectName: labels.comment,
            pageSize: DEFAULT_TABLE_ITEM_SIZE,
        },
        override: (funcs) => {
            funcs.getCreateLink = () => null;
            funcs.getItemDetailLink = () => null;

            funcs.handleFetchList = (params) => {
                if (!params.taskId) {
                    setData([]);
                    setPagination((p) => ({ ...p, total: 0 }));
                    return;
                }
                setLoading(true);
                funcs.executeGetList({
                    params,
                    onCompleted: (response) => {
                        funcs.onCompletedGetList(response);
                        setLoading(false);
                    },
                    onError: (error) => {
                        funcs.handleGetListError(error);
                        setLoading(false);
                    },
                });
            };
        },
    });

    useEffect(() => {
        executeGetTasks({
            params: { page: 0, size: 100 },
            onCompleted: (res) => {
                const fetchedTasks = res.data?.content || [];
                setTasks(fetchedTasks);
                const currentFilter = deserializeParams(queryParams);
                if (!currentFilter.taskId && fetchedTasks.length > 0) {
                    mixinFuncs.changeFilter({ ...currentFilter, taskId: fetchedTasks[0].id });
                }
            },
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─────────────────────────── Fetch APIs for Active Detail ───────────────────────────

    const {
        data: subtaskDetail,
        loading: loadingSubtask,
        execute: fetchSubtaskDetail,
    } = useFetch(isEducator ? apiConfig.task.getByEducator : apiConfig.task.getById, {
        immediate: false,
        mappingData: (res) => res.data,
    });

    const { execute: fetchProgressList } = useFetch(
        isEducator ? apiConfig.taskProgress.educatorList : apiConfig.taskProgress.list,
        {
            immediate: false,
        },
    );

    const { execute: fetchProgressDetail } = useFetch(
        isEducator ? apiConfig.taskProgress.educatorGet : apiConfig.taskProgress.get,
        {
            immediate: false,
        },
    );

    const { execute: fetchApiQuizQuestions } = useFetch(apiConfig.taskQuestion.educatorList, {
        immediate: false,
    });

    const {
        data: commentsData,
        execute: executeFetchComments,
        loading: commentsLoading,
    } = useFetch(apiConfig.comment.list, {
        immediate: false,
        mappingData: (res) => res.data || {},
    });

    const loadCommentThread = (taskId, enrollmentId) => {
        if (taskId && enrollmentId) {
            executeFetchComments({
                params: { taskId, simulationEnrollmentId: enrollmentId, size: 1000 },
            });
        }
    };

    const handleSelectComment = (comment) => {
        setActiveComment(comment);
        const taskId = comment.task?.id;
        const enrollmentId = comment.simulationEnrollmentId || comment.simulationEnrollment?.id;

        if (taskId) {
            fetchSubtaskDetail({ pathParams: { id: taskId } });
            fetchApiQuizQuestions({
                params: { taskId, size: 1000 },
                onCompleted: (res) => {
                    setApiQuizQuestions(res.data?.content || []);
                },
                onError: () => {
                    setApiQuizQuestions([]);
                },
            });
        }

        if (enrollmentId && taskId) {
            setLoadingProgressDetail(true);
            fetchProgressList({
                params: { simulationEnrollmentId: enrollmentId, size: 1000 },
                onCompleted: (res) => {
                    const list = res.data?.content || [];
                    const matchedProgress = list.find((p) => p.task?.id === taskId);
                    if (matchedProgress) {
                        fetchProgressDetail({
                            pathParams: { id: matchedProgress.id },
                            onCompleted: (detailRes) => {
                                setProgressDetail(detailRes.data);
                                setLoadingProgressDetail(false);
                            },
                            onError: () => {
                                setProgressDetail(null);
                                setLoadingProgressDetail(false);
                            },
                        });
                    } else {
                        setProgressDetail(null);
                        setLoadingProgressDetail(false);
                    }
                },
                onError: () => {
                    setProgressDetail(null);
                    setLoadingProgressDetail(false);
                },
            });
            loadCommentThread(taskId, enrollmentId);
        }
    };

    const handleBackToList = () => {
        setActiveComment(null);
        setProgressDetail(null);
        setApiQuizQuestions([]);
    };

    const submissions = useMemo(() => getSubmissions(progressDetail), [progressDetail]);

    // ─────────────────────────── Comment Thread Actions ───────────────────────────

    const { execute: executeCreateComment } = useFetch(apiConfig.comment.create, { immediate: false });
    const { execute: executeUpdateComment } = useFetch(apiConfig.comment.update, { immediate: false });
    const { execute: executeDeleteComment } = useFetch(apiConfig.comment.delete, { immediate: false });

    const handleSendComment = (content, parentId = 0) => {
        const taskId = activeComment?.task?.id;
        const enrollmentId = activeComment?.simulationEnrollmentId || activeComment?.simulationEnrollment?.id;
        if (!taskId || !enrollmentId) return;

        executeCreateComment({
            data: {
                content,
                parentId,
                taskId,
                simulationEnrollmentId: enrollmentId,
            },
            onCompleted: () => {
                loadCommentThread(taskId, enrollmentId);
            },
            onError: (err) => {
                message.error(err?.message || 'Không thể gửi bình luận!');
            },
        });
    };

    const handleUpdateComment = (id, content) => {
        executeUpdateComment({
            data: { id, content },
            onCompleted: () => {
                const taskId = activeComment?.task?.id;
                const enrollmentId = activeComment?.simulationEnrollmentId || activeComment?.simulationEnrollment?.id;
                loadCommentThread(taskId, enrollmentId);
            },
            onError: (err) => {
                message.error(err?.message || 'Không thể cập nhật bình luận!');
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
                        const taskId = activeComment?.task?.id;
                        const enrollmentId =
                            activeComment?.simulationEnrollmentId || activeComment?.simulationEnrollment?.id;
                        loadCommentThread(taskId, enrollmentId);
                    },
                    onError: (err) => {
                        message.error(err?.message || 'Không thể xóa bình luận!');
                    },
                });
            },
        });
    };

    // ─────────────────────────── Rendering ───────────────────────────

    const searchFields = [
        {
            key: 'taskId',
            type: FieldTypes.SELECT,
            options: tasks.map((t) => ({ label: t.name, value: t.id })),
            placeholder: 'Chọn bài học',
            submitOnChanged: true,
            colSpan: 6,
        },
        {
            key: 'keyWord',
            placeholder: 'Nội dung bình luận',
            colSpan: 6,
        },
    ];

    const breadcrumbs = [
        { breadcrumbName: translate.formatMessage(commonMessage.home) },
        { breadcrumbName: labels.comment },
    ];

    const renderCommentCard = (comment) => {
        const account = comment.user || {};
        const fullName = account.fullName || '-';
        const username = account.username ? `@${account.username}` : '';
        const avatar = account.avatar;
        const avatarUrl = avatar
            ? avatar.startsWith('http')
                ? avatar
                : `${AppConstants.contentRootUrl}${avatar}`
            : null;

        const taskName = comment.task?.name || comment.task?.title || 'Nhiệm vụ';
        const isReply = comment.replyToUser;
        const initials = getInitials(fullName);
        const avatarBg = getAvatarColor(fullName);

        return (
            <div
                key={comment.id}
                className="tfo-comment-feed-card"
                onClick={() => handleSelectComment(comment)}
                style={{
                    padding: 16,
                    borderRadius: 12,
                    border: '1px solid #f1f5f9',
                    background: '#ffffff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                    marginBottom: 16,
                    cursor: 'pointer',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={fullName}
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: '50%',
                                border: '1px solid #e2e8f0',
                                objectFit: 'cover',
                                flexShrink: 0,
                            }}
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
                        <div
                            style={{
                                fontWeight: 600,
                                color: '#1e293b',
                                fontSize: 13,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {fullName}
                        </div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>{username || 'Học viên'}</div>
                    </div>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>
                        {comment.createdDate ? dayjs(comment.createdDate).format('DD/MM/YYYY HH:mm') : ''}
                    </span>
                </div>

                <div
                    style={{
                        fontSize: 13,
                        color: '#334155',
                        lineHeight: 1.6,
                        backgroundColor: '#f8fafc',
                        padding: 12,
                        borderRadius: 8,
                        marginBottom: 12,
                        whiteSpace: 'pre-wrap',
                    }}
                >
                    {isReply && (
                        <span style={{ color: '#1890ff', fontWeight: 600, marginRight: 6 }}>
                            @{comment.replyToUser}
                        </span>
                    )}
                    {comment.content}
                </div>

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px solid #f1f5f9',
                        paddingTop: 8,
                    }}
                >
                    <Tag
                        color="blue"
                        style={{ fontSize: 11, borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                        <MessageOutlined /> {taskName}
                    </Tag>
                    {mixinFuncs.hasPermission([apiConfig.comment.delete.permissionCode]) && (
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                mixinFuncs.showDeleteConfirm(comment.id);
                            }}
                            style={{ fontSize: 12, fontWeight: 500 }}
                        >
                            Xóa
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    if (activeComment) {
        return (
            <PageWrapper routes={breadcrumbs}>
                <div style={{ marginBottom: 16 }}>
                    <Button icon={<ArrowLeftOutlined />} onClick={handleBackToList} size="large">
                        Quay lại danh sách
                    </Button>
                </div>
                <div className="tfo-content-area" style={{ height: 'calc(100vh - 240px)' }}>
                    <div className="tfo-workspace-grid" style={{ display: 'flex', width: '100%', height: '100%' }}>
                        {/* Left/Middle: StudentSubmissionViewer */}
                        <div
                            className="tfo-pane-middle"
                            style={{ flex: 1, overflowY: 'auto', borderRight: '1px solid #e4e4e4' }}
                        >
                            <StudentSubmissionViewer
                                subtaskDetail={subtaskDetail}
                                submissions={submissions}
                                apiQuizQuestions={apiQuizQuestions}
                                loading={loadingSubtask || loadingProgressDetail}
                            />
                        </div>
                        {/* Right: CommentPanel */}
                        <div
                            className="tfo-pane-right"
                            style={{ width: 360, flexShrink: 0, display: 'flex', flexDirection: 'column' }}
                        >
                            <CommentPanel
                                comments={commentsData?.content || []}
                                loading={commentsLoading}
                                profile={profile}
                                onSendComment={handleSendComment}
                                onUpdateComment={handleUpdateComment}
                                onDeleteComment={handleDeleteComment}
                            />
                        </div>
                    </div>
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper routes={breadcrumbs}>
            <ListPage
                searchForm={mixinFuncs.renderSearchForm({
                    fields: searchFields,
                    initialValues: queryFilter,
                })}
                actionBar={null}
                baseTable={
                    <Spin spinning={loading}>
                        {data && data.length > 0 ? (
                            <div style={{ padding: '4px 0' }}>
                                <div className="tfo-comment-feed-list">{data.map(renderCommentCard)}</div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                                    <Pagination
                                        current={pagination.current}
                                        pageSize={pagination.pageSize}
                                        total={pagination.total}
                                        onChange={(page, pageSize) => {
                                            mixinFuncs.changePagination(page, pageSize);
                                        }}
                                        showSizeChanger
                                    />
                                </div>
                            </div>
                        ) : (
                            <Empty description={labels.noData} />
                        )}
                    </Spin>
                }
            />
        </PageWrapper>
    );
};

export default CommentListPage;
