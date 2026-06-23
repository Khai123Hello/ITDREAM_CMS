import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import useFetch from '@hooks/useFetch';
import useNotification from '@hooks/useNotification';
import apiConfig from '@constants/apiConfig';
import { UserTypes, storageKeys } from '@constants';
import { getData } from '@utils/localStorage';
import PageWrapper from '@components/common/layout/PageWrapper';
import StudentSubmissionViewer from '@components/simulation/StudentSubmissionViewer';

import './SimulationPreviewPage.scss';

const SimulationPreviewPage = ({ pageOptions }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const notificationApi = useNotification();
    
    // Title truyền từ trang danh sách (nếu có)
    const simulationTitle = location.state?.title || 'Xem trước Mô phỏng';

    // Xác định quyền User Type
    const userType = getData(storageKeys.USER_TYPE);
    const isEducator = userType === UserTypes.EDUCATOR;

    // Các state liên quan đến Viewer
    const [previewTasks, setPreviewTasks] = useState([]);
    const [selectedPreviewParentTaskId, setSelectedPreviewParentTaskId] = useState(null);
    const [selectedPreviewSubtaskId, setSelectedPreviewSubtaskId] = useState(null);
    const [previewQuizQuestions, setPreviewQuizQuestions] = useState([]);

    // API fetching
    const { execute: fetchPreviewTasks, loading: loadingPreviewTasks } = useFetch(
        isEducator ? apiConfig.task.listByEducator : apiConfig.task.getList,
        { immediate: false },
    );

    const { data: previewSubtaskDetail, loading: loadingPreviewSubtask, execute: fetchPreviewSubtaskDetail } = useFetch(
        isEducator ? apiConfig.task.getByEducator : apiConfig.task.getById,
        { immediate: false, mappingData: (res) => res.data },
    );

    const { execute: fetchPreviewQuizQuestions } = useFetch(
        apiConfig.taskQuestion.educatorList,
        { immediate: false },
    );

    // Initial Fetch (Tải danh sách task dựa trên simulation id)
    useEffect(() => {
        if (id) {
            fetchPreviewTasks({
                params: { simulationId: id, size: 1000 },
                onCompleted: (res) => {
                    const tasksList = res.data?.content || [];
                    setPreviewTasks(tasksList);
                    
                    const parents = tasksList.filter((t) => t.kind === 1);
                    if (parents.length > 0) {
                        const firstParentId = parents[0].id;
                        setSelectedPreviewParentTaskId(firstParentId);
                        
                        const subList = tasksList
                            .filter((t) => t.kind === 2 && (t.parent?.id === firstParentId || t.parentId === firstParentId))
                            .sort((a, b) => (a.orderInParent || 0) - (b.orderInParent || 0));
                        
                        if (subList.length > 0) {
                            setSelectedPreviewSubtaskId(subList[0].id);
                        }
                    }
                },
                onError: () => {
                    notificationApi({
                        type: 'error',
                        message: 'Không thể tải danh sách nhiệm vụ xem trước!',
                    });
                },
            });
        }
    }, [id]);

    // Data Processing
    const previewParentTasks = useMemo(() => previewTasks?.filter((t) => t.kind === 1) || [], [previewTasks]);

    const previewSubtasks = useMemo(() => {
        if (!selectedPreviewParentTaskId) return [];
        return (
            previewTasks
                ?.filter(
                    (t) =>
                        t.kind === 2 &&
                        (t.parent?.id === selectedPreviewParentTaskId || t.parentId === selectedPreviewParentTaskId),
                )
                .sort((a, b) => (a.orderInParent || 0) - (b.orderInParent || 0)) || []
        );
    }, [previewTasks, selectedPreviewParentTaskId]);

    // Fetch Details when Subtask changes
    useEffect(() => {
        if (selectedPreviewSubtaskId) {
            fetchPreviewSubtaskDetail({
                pathParams: { id: selectedPreviewSubtaskId },
            });
            fetchPreviewQuizQuestions({
                params: { taskId: selectedPreviewSubtaskId, size: 1000 },
                onCompleted: (res) => {
                    setPreviewQuizQuestions(res.data?.content || []);
                },
                onError: () => {
                    setPreviewQuizQuestions([]);
                },
            });
        }
    }, [selectedPreviewSubtaskId]);

    // Handlers
    const handleSelectPreviewParent = (parentId) => {
        setSelectedPreviewParentTaskId(parentId);
        const subList = previewTasks
            .filter((t) => t.kind === 2 && (t.parent?.id === parentId || t.parentId === parentId))
            .sort((a, b) => (a.orderInParent || 0) - (b.orderInParent || 0));
        
        if (subList.length > 0) {
            setSelectedPreviewSubtaskId(subList[0].id);
        } else {
            setSelectedPreviewSubtaskId(null);
        }
    };

    return (
        <PageWrapper
            routes={pageOptions?.renderBreadcrumbs?.(null, { formatMessage: (msg) => msg.defaultMessage }, simulationTitle, { simulationId: id })}
        >
            <div className="simulation-preview-page">
                <div className="preview-header">
                    <Button 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => navigate('/simulation')}
                    >
                        Quay lại
                    </Button>
                    <h2>Xem trước: {simulationTitle}</h2>
                </div>

                <div className="srd-workspace-area" style={{ minHeight: 'calc(100vh - 200px)' }}>
                    <div className="srd-workspace-content" style={{ padding: 0, minHeight: '100%' }}>
                        {loadingPreviewTasks ? (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}>
                                <Spin size="large" />
                            </div>
                        ) : (
                            <div style={{ display: 'flex', minHeight: '100%' }}>
                                {/* Left Sidebar: Timeline of Parent Tasks */}
                                <aside className="tfo-sidebar" style={{ borderRight: '1px solid #f1f5f9' }}>
                                    <div className="tfo-sidebar-header">
                                        <span className="tfo-sidebar-label">Danh sách nhiệm vụ</span>
                                    </div>
                                    <div className="tfo-task-list">
                                        {previewParentTasks.map((task, idx) => {
                                            const isActive = selectedPreviewParentTaskId === task.id;
                                            const isLast = idx === previewParentTasks.length - 1;

                                            return (
                                                <div key={task.id || idx} className="tfo-task-list-row">
                                                    <div className="tfo-task-timeline">
                                                        <button
                                                            className={`tfo-task-circle${isActive ? ' active' : ''}`}
                                                            onClick={() => handleSelectPreviewParent(task.id)}
                                                        >
                                                            {idx + 1}
                                                        </button>
                                                        {!isLast && <div className="tfo-task-connector" />}
                                                    </div>

                                                    <button
                                                        className="tfo-task-content-btn"
                                                        onClick={() => handleSelectPreviewParent(task.id)}
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

                                {/* Middle Pane: Submission reader */}
                                <div className="tfo-pane-middle" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <div className="tfo-pane-topbar">
                                        <div className="tfo-pane-title">
                                            {simulationTitle}
                                        </div>
                                        {previewSubtasks.length > 0 && (
                                            <div className="tfo-step-pagination">
                                                {previewSubtasks.map((st, index) => {
                                                    const isActiveSub = st.id === selectedPreviewSubtaskId;
                                                    let btnCls = 'tfo-step-btn';
                                                    if (isActiveSub) btnCls += ' active';

                                                    return (
                                                        <button
                                                            key={st.id}
                                                            className={btnCls}
                                                            onClick={() => setSelectedPreviewSubtaskId(st.id)}
                                                        >
                                                            {index + 1}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="tfo-separator" />

                                    {selectedPreviewSubtaskId ? (
                                        <StudentSubmissionViewer
                                            subtaskDetail={previewSubtaskDetail}
                                            submissions={[]}
                                            apiQuizQuestions={previewQuizQuestions}
                                            loading={loadingPreviewSubtask || loadingPreviewTasks}
                                        />
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontStyle: 'italic', padding: 20 }}>
                                            Không có nhiệm vụ nào trong bài mô phỏng này
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

export default SimulationPreviewPage;
