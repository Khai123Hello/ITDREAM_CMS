import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Tooltip, Badge } from 'antd';
import TaskContentLayout from '@components/simulation/TaskContentLayout';
import CommentPanel from '@components/simulation/CommentPanel';
import {
    ArrowLeftOutlined,
    CommentOutlined,
    PicRightOutlined,
    VerticalAlignBottomOutlined,
} from '@ant-design/icons';

import PageWrapper from '@components/common/layout/PageWrapper';
import useFetch from '@hooks/useFetch';
import useTranslate from '@hooks/useTranslate';
import useAuth from '@hooks/useAuth';
import useValidatePermission from '@hooks/useValidatePermission';

import apiConfig from '@constants/apiConfig';
import { UserTypes, storageKeys } from '@constants';
import { getData } from '@utils/localStorage';
import { commonMessage } from '@locales/intl';

import './StudentReviewDetailPage.scss';

const SimulationDiscussionDetailPage = ({ pageOptions }) => {
    const translate = useTranslate();
    const navigate = useNavigate();
    const { simulationId } = useParams();
    const { profile } = useAuth();

    const userType = getData(storageKeys.USER_TYPE);
    const isEducator = userType === UserTypes.EDUCATOR || userType === UserTypes.ADMIN;

    const [selectedParentTaskId, setSelectedParentTaskId] = useState(null);
    const [selectedSubtaskId, setSelectedSubtaskId] = useState(null);

    const [layoutMode, setLayoutMode] = useState(() => {
        try {
            return localStorage.getItem('discussion_layout_mode') || 'split';
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

    const parentTasks = useMemo(() => tasks?.filter((t) => t.kind === 1) || [], [tasks]);

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

    // 3. Fetch selected subtask details
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
            loadCommentThread(selectedSubtaskId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSubtaskId]);

    // 4. Comments logic
    const {
        data: commentsData,
        execute: executeFetchComments,
        loading: commentsLoading,
    } = useFetch(apiConfig.comment.list, {
        immediate: false,
        mappingData: (res) => res.data || {},
    });

    const loadCommentThread = (taskId) => {
        if (taskId) {
            executeFetchComments({
                params: { taskId, size: 1000 },
            });
        }
    };

    const { execute: executeCreateComment } = useFetch(apiConfig.comment.create, { immediate: false });
    const { execute: executeUpdateComment } = useFetch(apiConfig.comment.update, { immediate: false });
    const { execute: executeDeleteComment } = useFetch(apiConfig.comment.delete, { immediate: false });

    const handleSendComment = (content, parentId = null) => {
        if (!selectedSubtaskId) return;
        executeCreateComment({
            data: {
                content,
                parentId,
                taskId: selectedSubtaskId,
            },
            onCompleted: () => loadCommentThread(selectedSubtaskId),
        });
    };

    const handleUpdateComment = (id, content) => {
        executeUpdateComment({
            data: { id, content },
            onCompleted: () => loadCommentThread(selectedSubtaskId),
        });
    };

    const handleDeleteComment = (id) => {
        executeDeleteComment({
            pathParams: { id },
            onCompleted: () => loadCommentThread(selectedSubtaskId),
        });
    };

    const getSubtasksForParent = (parentId) => {
        return tasks
            ?.filter((t) => t.kind === 2 && (t.parent?.id === parentId || t.parentId === parentId))
            .sort((a, b) => (a.orderInParent || 0) - (b.orderInParent || 0)) || [];
    };

    const activeParentTaskIndex = parentTasks.findIndex((p) => p.id === selectedParentTaskId);
    const activeSubtaskIndex = subtasks.findIndex((s) => s.id === selectedSubtaskId);

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

    const loadingGeneral = loadingTasks || loadingSimulation;

    const renderCommentPane = () => {
        return (
            <div className="tfo-review-tab-pane" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '16px', background: '#ffffff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div className="tfo-review-section-header" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
                    <span className="tfo-review-section-title" style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CommentOutlined style={{ color: '#1890ff' }} /> Thảo luận bài học
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
                    />
                </div>
            </div>
        );
    };

    return (
        <PageWrapper
            loading={loadingGeneral}
            routes={pageOptions ? pageOptions.renderBreadcrumbs(commonMessage, translate, simulationId) : []}
        >
            <div className="tfo-topbar-actions">
                <Button
                    type="link"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/simulation-discussion')}
                    className="tfo-back-link-btn"
                >
                    Danh sách bài mô phỏng
                </Button>

                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
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
                pageTitle={simulationDetail?.title || 'Thảo luận'}
                taskHeading={subtaskDetail?.title || 'Đang tải...'}
                taskDescriptionContent={subtaskDetail?.description || ''}
                content={subtaskDetail?.content || ''}
                mediaPath={subtaskDetail?.imagePath || subtaskDetail?.videoPath}
                loading={loadingGeneral || loadingSubtask}
                canGoBack={!isAtGlobalStart}
                canGoNext={!isAtGlobalEnd}
                isLastSubtask={isAtGlobalEnd}
                onBack={handleBackSubtask}
                onNext={handleNextSubtask}
                quizSubmissionMap={{}}
                questionMap={{}}
                requiresFileUpload={false}
                requiresTextResponse={false}
                previousFile={null}
                previousText={''}
                hasCompleted={false}
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
            />
        </PageWrapper>
    );
};

export default SimulationDiscussionDetailPage;
