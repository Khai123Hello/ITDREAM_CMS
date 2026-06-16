import React, { useEffect, useRef, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import useFetch from '@hooks/useFetch';
import { message, Alert } from 'antd';

import PageWrapper from '@components/common/layout/PageWrapper';
import apiConfig from '@constants/apiConfig';
import useSaveBase from '@hooks/useSaveBase';
import useTranslate from '@hooks/useTranslate';
import { commonMessage } from '@locales/intl';
import TaskForm from '@modules/simulation/task/TaskForm';

import { UserTypes } from '@constants';
import { getData } from '@utils/localStorage';
import { storageKeys } from '@constants';

const TaskSavePage = ({ pageOptions }) => {
    const userType = getData(storageKeys.USER_TYPE);
    const isEducator = userType === UserTypes.EDUCATOR;

    const translate = useTranslate();
    const { id, simulationId } = useParams();
    const [localQuestions, setLocalQuestions] = useState([]);
    // useRef để tránh stale closure trong saveQuestionsForTask
    // (override callback chỉ chạy 1 lần, nên closure phải đọc ref thay vì state)
    const localQuestionsRef = useRef([]);
    useEffect(() => {
        localQuestionsRef.current = localQuestions;
    }, [localQuestions]);

    const { execute: createQuestion } = useFetch(apiConfig.taskQuestion.create, { immediate: false });
    const { execute: updateQuestion } = useFetch(apiConfig.taskQuestion.update, { immediate: false });
    const { execute: deleteQuestion } = useFetch(apiConfig.taskQuestion.delete, { immediate: false });
    const { execute: getExistingQuestions } = useFetch(
        isEducator ? apiConfig.taskQuestion.educatorList : apiConfig.taskQuestion.getList,
        { immediate: false },
    );
    const location = useLocation();
    const isCreating = id === 'create';

    const parentTaskFromState = location.state?.parentTask;

    const apiConfiguration = isEducator
        ? {
            getById: apiConfig.task.getByEducator,
            create: apiConfig.task.create,
            update: apiConfig.task.update,
        }
        : {
            getById: apiConfig.task.getById,
        };

    const { detail, mixinFuncs, loading, onSave, setIsChangedFormValues, isEditing, title } = useSaveBase({
        apiConfig: apiConfiguration,
        options: {
            getListUrl: `/simulation/${simulationId}/task`,
            objectName: translate.formatMessage(pageOptions.objectName)?.toLowerCase(),
        },
        override: (funcs) => {
            funcs.prepareUpdateData = (data) => ({
                ...data,
                id: id,
                simulationId: simulationId,
            });

            funcs.prepareCreateData = (data) => ({
                ...data,
                simulationId: simulationId,
            });

            funcs.mappingData = (data) => {
                // Kiểm tra data có hợp lệ không
                if (!data || !data.data) {
                    console.error('❌ Invalid data structure:', data);
                    message.error('Không thể tải dữ liệu Task. Dữ liệu không hợp lệ.');
                    return {};
                }

                const detail = { ...data.data };
                if (!detail.content && detail.introduction) {
                    detail.content = detail.introduction;
                }

                return detail;
            };

            // Thêm error handler cho getById
            const originalGetDetail = funcs.getDetail;
            funcs.getDetail = async (id) => {
                try {
                    return await originalGetDetail(id);
                } catch (error) {
                    console.error('❌ Error fetching task detail:', error);
                    const errorMsg =
                        error?.response?.data?.message ||
                        error?.message ||
                        'Không thể tải thông tin Task. Vui lòng thử lại.';
                    message.error(errorMsg);
                    throw error;
                }
            };

            const saveQuestionsForTask = async (taskId) => {
                try {
                    // Đọc từ ref để luôn lấy giá trị mới nhất (tránh stale closure)
                    const currentQuestions = localQuestionsRef.current;

                    // 1. Fetch existing questions
                    const response = await getExistingQuestions({
                        params: { taskId, page: 0, size: 100 },
                    });
                    const resData = response?.data || (response?.result === undefined ? response : null);
                    const existingQuestions = resData?.content || [];
                    const existingIds = existingQuestions.map((q) => q.id);

                    // 2. Identify which questions to delete
                    const localIds = currentQuestions.map((q) => q.id).filter(Boolean);
                    const idsToDelete = existingIds.filter((dbId) => !localIds.includes(dbId));

                    // Delete removed questions
                    for (const idToDelete of idsToDelete) {
                        await deleteQuestion({
                            pathParams: { id: idToDelete },
                        });
                    }

                    // 3. Save questions in order (Create or Update)
                    for (const q of currentQuestions) {
                        if (q.id && existingIds.includes(q.id)) {
                            // Update existing question
                            await updateQuestion({
                                data: {
                                    id: q.id,
                                    question: q.question,
                                    options: q.options,
                                    taskId: taskId,
                                },
                            });
                        } else {
                            // Create new question
                            await createQuestion({
                                data: {
                                    question: q.question,
                                    options: q.options,
                                    taskId: taskId,
                                },
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error saving task questions:', error);
                    message.error('Có lỗi xảy ra khi lưu câu hỏi trắc nghiệm.');
                }
            };

            const originalOnInsertCompleted = funcs.onInsertCompleted;
            funcs.onInsertCompleted = async (responseData) => {
                if (responseData.result === true) {
                    const newTaskId = responseData.data?.id;
                    if (newTaskId) {
                        await saveQuestionsForTask(newTaskId);
                    }
                    originalOnInsertCompleted(responseData);
                }
            };

            const originalOnUpdateCompleted = funcs.onUpdateCompleted;
            funcs.onUpdateCompleted = async (responseData) => {
                if (responseData.result === true) {
                    const existingTaskId = id;
                    if (existingTaskId) {
                        await saveQuestionsForTask(existingTaskId);
                    }
                    originalOnUpdateCompleted(responseData);
                }
            };
        },
    });

    // Kiểm tra detail khi load trang edit
    useEffect(() => {
        if (!isCreating && !loading && !detail) {
            console.warn('⚠️ No task detail loaded for editing');
            message.warning('Không tìm thấy thông tin Task. Vui lòng kiểm tra lại.');
        }
    }, [detail, loading, isCreating]);

    // Kiểm tra simulationId có hợp lệ không
    useEffect(() => {
        if (!simulationId || simulationId === 'undefined') {
            console.error('❌ Invalid simulationId:', simulationId);
            message.error('Không xác định được Simulation ID. Vui lòng quay lại trang trước.');
        }
    }, [simulationId]);

    const getPageTitle = () => {
        if (isCreating) {
            return parentTaskFromState ? 'Tạo SubTask' : 'Tạo Task';
        }
        return title || 'Chi tiết Task';
    };

    return (
        <PageWrapper
            loading={loading}
            routes={pageOptions.renderBreadcrumbs(commonMessage, translate, getPageTitle(), { simulationId })}
        >
            {!loading && (isCreating || detail) ? (
                <TaskForm
                    setIsChangedFormValues={setIsChangedFormValues}
                    dataDetail={isCreating ? {} : detail || {}}
                    formId={mixinFuncs.getFormId()}
                    isEditing={isEditing}
                    actions={mixinFuncs.renderActions()}
                    onSubmit={onSave}
                    simulationId={simulationId}
                    onQuestionsChange={setLocalQuestions}
                />
            ) : !loading ? (
                <div style={{ padding: '24px', textAlign: 'center' }}>
                    <Alert
                        message="Không thể tải dữ liệu"
                        description="Task không tồn tại hoặc bạn không có quyền truy cập. Vui lòng quay lại trang trước."
                        type="error"
                        showIcon
                    />
                </div>
            ) : null}
        </PageWrapper>
    );
};

export default TaskSavePage;
