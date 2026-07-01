import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import useFetch from '@hooks/useFetch';
import useNotification from '@hooks/useNotification';
import apiConfig from '@constants/apiConfig';
import { UserTypes, storageKeys } from '@constants';
import { getData } from '@utils/localStorage';
import { FileTextOutlined } from '@ant-design/icons';
import PageWrapper from '@components/common/layout/PageWrapper';
import TaskContentLayout from '@components/simulation/TaskContentLayout';

import './SimulationPreviewPage.scss';

const SimulationPreviewPage = ({ pageOptions }) => {
    const { id } = useParams();
    const notificationApi = useNotification();

    const userType = getData(storageKeys.USER_TYPE);
    const isEducator = userType === UserTypes.EDUCATOR;
    const [previewTasks, setPreviewTasks] = useState([]);
    const [selectedPreviewParentTaskId, setSelectedPreviewParentTaskId] = useState(null);
    const [selectedPreviewSubtaskId, setSelectedPreviewSubtaskId] = useState(null);
    const [previewQuizQuestions, setPreviewQuizQuestions] = useState([]);

    // Giống StudentReviewDetailPage: dùng immediate fetch để lấy simulation detail
    const { data: simulationDetail, loading: loadingSimulation } = useFetch(
        isEducator ? apiConfig.simulation.getSimulationForEducator : apiConfig.simulation.getById,
        {
            immediate: true,
            pathParams: { id },
            mappingData: (res) => res.data,
        },
    );

    const { execute: fetchPreviewTasks, loading: loadingPreviewTasks } = useFetch(
        isEducator ? apiConfig.task.listByEducator : apiConfig.task.getList,
        { immediate: false },
    );

    const {
        data: previewSubtaskDetail,
        loading: loadingPreviewSubtask,
        execute: fetchPreviewSubtaskDetail,
    } = useFetch(isEducator ? apiConfig.task.getByEducator : apiConfig.task.getById, {
        immediate: false,
        mappingData: (res) => res.data,
    });

    const { execute: fetchPreviewQuizQuestions } = useFetch(apiConfig.taskQuestion.educatorList, { immediate: false });

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
                            .filter(
                                (t) => t.kind === 2 && (t.parent?.id === firstParentId || t.parentId === firstParentId),
                            )
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

    const activePreviewSubtaskIndex = previewSubtasks.findIndex((st) => st.id === selectedPreviewSubtaskId);
    const activePreviewParentTaskIndex = previewParentTasks.findIndex((t) => t.id === selectedPreviewParentTaskId);

    const getPreviewSubtasksForParent = (parentId) => {
        return (
            previewTasks
                ?.filter((t) => t.kind === 2 && (t.parent?.id === parentId || t.parentId === parentId))
                .sort((a, b) => (a.orderInParent || 0) - (b.orderInParent || 0)) || []
        );
    };

    const handleBackPreviewSubtask = () => {
        if (activePreviewSubtaskIndex > 0) {
            setSelectedPreviewSubtaskId(previewSubtasks[activePreviewSubtaskIndex - 1].id);
        } else if (activePreviewParentTaskIndex > 0) {
            const prevParent = previewParentTasks[activePreviewParentTaskIndex - 1];
            const prevSubs = getPreviewSubtasksForParent(prevParent.id);
            setSelectedPreviewParentTaskId(prevParent.id);
            if (prevSubs.length > 0) {
                setSelectedPreviewSubtaskId(prevSubs[prevSubs.length - 1].id);
            }
        }
    };

    const handleNextPreviewSubtask = () => {
        if (activePreviewSubtaskIndex >= 0 && activePreviewSubtaskIndex < previewSubtasks.length - 1) {
            setSelectedPreviewSubtaskId(previewSubtasks[activePreviewSubtaskIndex + 1].id);
        } else if (activePreviewParentTaskIndex < previewParentTasks.length - 1) {
            const nextParent = previewParentTasks[activePreviewParentTaskIndex + 1];
            const nextSubs = getPreviewSubtasksForParent(nextParent.id);
            setSelectedPreviewParentTaskId(nextParent.id);
            if (nextSubs.length > 0) {
                setSelectedPreviewSubtaskId(nextSubs[0].id);
            }
        }
    };

    const isPreviewAtGlobalStart = activePreviewParentTaskIndex <= 0 && activePreviewSubtaskIndex <= 0;
    const isPreviewAtGlobalEnd =
        activePreviewParentTaskIndex >= previewParentTasks.length - 1 &&
        activePreviewSubtaskIndex >= previewSubtasks.length - 1;

    if (!selectedPreviewSubtaskId && !loadingPreviewTasks) {
        return (
            <PageWrapper
                routes={pageOptions?.renderBreadcrumbs?.(
                    null,
                    { formatMessage: (msg) => msg.defaultMessage },
                    simulationDetail?.title,
                    { simulationId: id },
                )}
            >
                <div className="empty-body-placeholder">
                    <FileTextOutlined className="empty-body-icon" />
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper
            routes={pageOptions?.renderBreadcrumbs?.(
                null,
                { formatMessage: (msg) => msg.defaultMessage },
                simulationDetail?.title,
                { simulationId: id },
            )}
        >
            <div className="simulation-preview-root">
                <TaskContentLayout
                    parentTasks={previewParentTasks}
                    selectedParentTaskId={selectedPreviewParentTaskId}
                    onSelectParentTask={handleSelectPreviewParent}
                    subtasks={previewSubtasks}
                    selectedSubtaskId={selectedPreviewSubtaskId}
                    onSelectSubtask={setSelectedPreviewSubtaskId}
                    pageTitle={simulationDetail?.title || 'Đang xem trước'}
                    taskHeading={previewSubtaskDetail?.title || 'Đang tải...'}
                    taskDescriptionContent={previewSubtaskDetail?.description || ''}
                    content={previewSubtaskDetail?.content || ''}
                    mediaPath={previewSubtaskDetail?.imagePath || previewSubtaskDetail?.videoPath}
                    urlBase={''}
                    loading={loadingPreviewTasks || loadingPreviewSubtask || loadingSimulation}
                    canGoBack={!isPreviewAtGlobalStart}
                    canGoNext={!isPreviewAtGlobalEnd}
                    isLastSubtask={isPreviewAtGlobalEnd}
                    onBack={handleBackPreviewSubtask}
                    onNext={handleNextPreviewSubtask}
                    quizSubmissionMap={{}}
                    questionMap={{}}
                    requiresFileUpload={previewSubtaskDetail?.submissionType === 1 || previewSubtaskDetail?.submissionType === 3}
                    requiresTextResponse={previewSubtaskDetail?.submissionType === 2 || previewSubtaskDetail?.submissionType === 3}
                    previousFile={null}
                    previousText={''}
                    hasCompleted={false}
                />
            </div>
        </PageWrapper>
    );
};

export default SimulationPreviewPage;
