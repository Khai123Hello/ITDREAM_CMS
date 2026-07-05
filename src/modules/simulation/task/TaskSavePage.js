import React, { useCallback, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import useFetch from '@hooks/useFetch';
import { message, Alert } from 'antd';
import useNotification from '@hooks/useNotification';
import useTranslate from '@hooks/useTranslate';
import { defineMessages, useIntl } from 'react-intl';

import PageWrapper from '@components/common/layout/PageWrapper';
import apiConfig from '@constants/apiConfig';
import useSaveBase from '@hooks/useSaveBase';
import { commonMessage } from '@locales/intl';
import TaskForm from '@modules/simulation/task/TaskForm';

import { UserTypes } from '@constants';
import { getData } from '@utils/localStorage';
import { storageKeys } from '@constants';

const successMessages = defineMessages({
    createSuccess: 'Create {objectName} success',
    updateSuccess: 'Update {objectName} success',
});

const TaskSavePage = ({ pageOptions }) => {
    const userType = getData(storageKeys.USER_TYPE);
    const isEducator = userType === UserTypes.EDUCATOR;

    const translate = useTranslate();
    const intl = useIntl();
    const navigate = useNavigate();
    const notification = useNotification();
    const { id, simulationId } = useParams();
    const location = useLocation();
    const isCreating = id === 'create';
    const parentTaskFromState = location.state?.parentTask;

    // ─── Câu hỏi được lưu vào ref, cập nhật mỗi khi người dùng thay đổi ──
    const localQuestionsRef = useRef([]);
    const handleQuestionsChange = useCallback((questions) => {
        localQuestionsRef.current = questions ?? [];
    }, []);

    // ─── API hooks ────────────────────────────────────────────────────────
    // Gọi task create trực tiếp để bắt được response (không qua useSaveBase)
    const { execute: executeCreate, loading: loadingCreate } = useFetch(apiConfig.task.create, { immediate: false });
    const { loading: loadingUpdate } = useFetch(apiConfig.task.update, { immediate: false });

    const { execute: createQuestion } = useFetch(apiConfig.taskQuestion.create, { immediate: false });
    const { execute: updateQuestion } = useFetch(apiConfig.taskQuestion.update, { immediate: false });
    const { execute: deleteQuestion } = useFetch(apiConfig.taskQuestion.delete, { immediate: false });
    const { execute: getExistingQuestions } = useFetch(
        isEducator ? apiConfig.taskQuestion.educatorList : apiConfig.taskQuestion.getList,
        { immediate: false },
    );

    const apiConfiguration = isEducator
        ? { getById: apiConfig.task.getByEducator, create: apiConfig.task.create, update: apiConfig.task.update }
        : { getById: apiConfig.task.getById, create: apiConfig.task.create, update: apiConfig.task.update };

    // ─── Lưu câu hỏi cho task đã có ID ──────────────────────────────────
    const saveQuestionsForTask = useCallback(
        async (taskId) => {
            const currentQuestions = localQuestionsRef.current;
            if (!taskId || !currentQuestions) return;

            try {
                // 1. Lấy câu hỏi hiện có
                const response = await getExistingQuestions({ params: { taskId, page: 0, size: 100 } });
                const resData = response?.data || response;
                const existingQuestions = resData?.content || [];
                const existingIds = existingQuestions.map((q) => String(q.id));

                // 2. Xóa câu hỏi bị remove
                const localIds = currentQuestions.map((q) => String(q.id)).filter(Boolean);
                const idsToDelete = existingIds.filter((dbId) => !localIds.includes(dbId));
                for (const idToDelete of idsToDelete) {
                    await deleteQuestion({ pathParams: { id: idToDelete } });
                }

                // 3. Tạo mới hoặc cập nhật
                for (const q of currentQuestions) {
                    const payloadOptions = JSON.stringify(
                        (q.options || []).map(({ option, answer }) => ({ option, answer })),
                    );
                    const isNewQuestion = !q.id || (typeof q.id === 'string' && q.id.startsWith('id_'));
                    if (!isNewQuestion && existingIds.includes(String(q.id))) {
                        const existingQ = existingQuestions.find((eq) => String(eq.id) === String(q.id));
                        // Compare before updating
                        let existingOptions = [];
                        try {
                            existingOptions =
                                typeof existingQ.options === 'string'
                                    ? JSON.parse(existingQ.options)
                                    : existingQ.options || [];
                        } catch (e) {
                            // eslint-disable-next-line no-empty
                        }
                        const existingOptionsString = JSON.stringify(
                            existingOptions.map(({ option, answer }) => ({ option, answer })),
                        );

                        const isChanged = existingQ.question !== q.question || existingOptionsString !== payloadOptions;

                        if (isChanged) {
                            await updateQuestion({
                                data: { id: q.id, question: q.question, options: payloadOptions, taskId },
                            });
                        }
                    } else {
                        await createQuestion({ data: { question: q.question, options: payloadOptions, taskId } });
                    }
                }
            } catch (error) {
                console.error('Error saving task questions:', error);
                message.error('Có lỗi xảy ra khi lưu câu hỏi trắc nghiệm.');
            }
        },
        [createQuestion, updateQuestion, deleteQuestion, getExistingQuestions],
    );

    // ─── useSaveBase: chỉ dùng để load detail + update ──────────────────
    const { detail, mixinFuncs, loading, setIsChangedFormValues, isEditing, title } = useSaveBase({
        apiConfig: apiConfiguration,
        options: {
            getListUrl: `/simulation/${simulationId}/task`,
            objectName: translate.formatMessage(pageOptions.objectName)?.toLowerCase(),
        },
        override: (funcs) => {
            funcs.prepareUpdateData = (data) => ({ ...data, id, simulationId });
            funcs.prepareCreateData = (data) => ({ ...data, simulationId });

            funcs.mappingData = (data) => {
                if (!data || !data.data) return {};
                const detail = { ...data.data };
                if (!detail.content && detail.introduction) detail.content = detail.introduction;
                return detail;
            };

            // Override update để lưu câu hỏi khi update xong
            const originalOnUpdateCompleted = funcs.onUpdateCompleted;
            funcs.onUpdateCompleted = async (responseData) => {
                if (responseData.result === true) {
                    if (id && id !== 'create') {
                        await saveQuestionsForTask(id);
                    }
                    originalOnUpdateCompleted(responseData);
                }
            };
        },
    });

    // ─── handleSubmit: gọi API create trực tiếp để kiểm soát hoàn toàn ──
    const handleSubmitWithQuestions = useCallback(
        async (values, callback) => {
            if (isEditing) {
                // UPDATE: dùng useSaveBase bình thường
                // onUpdateCompleted sẽ lo phần questions
                mixinFuncs.onSave(values, callback);
                return;
            }

            const hasQuestions = localQuestionsRef.current.length > 0;
            const preparedData = { ...values, simulationId };
            const response = await executeCreate({ data: preparedData });

            // Kiểm tra kết quả create
            if (!response || response.result !== true) {
                const errMsg =
                    response?.response?.data?.message ||
                    response?.data?.message ||
                    response?.message ||
                    'Tạo nhiệm vụ thất bại.';
                message.error(errMsg);
                if (callback) callback(response);
                return;
            }

            // Nếu có câu hỏi → lưu câu hỏi bằng ID của task vừa tạo
            if (hasQuestions && response.data) {
                await saveQuestionsForTask(response.data);
                message.success(`Đã lưu ${localQuestionsRef.current.length} câu hỏi thành công!`);
            }

            // Thông báo thành công và navigate về list
            notification({
                message: intl.formatMessage(successMessages.createSuccess, {
                    objectName: translate.formatMessage(pageOptions.objectName)?.toLowerCase(),
                }),
            });
            navigate(`/simulation/${simulationId}/task`);
        },
        [
            isEditing,
            mixinFuncs,
            simulationId,
            executeCreate,
            saveQuestionsForTask,
            notification,
            intl,
            translate,
            navigate,
            pageOptions,
        ],
    );

    useEffect(() => {
        if (!isCreating && !loading && !detail) {
            message.warning('Không tìm thấy thông tin nhiệm vụ. Vui lòng kiểm tra lại.');
        }
    }, [detail, loading, isCreating]);

    useEffect(() => {
        if (!simulationId || simulationId === 'undefined') {
            message.error('Không xác định được Simulation ID. Vui lòng quay lại trang trước.');
        }
    }, [simulationId]);

    const getPageTitle = () => {
        if (isCreating) return parentTaskFromState ? 'Tạo nhiệm vụ phụ' : 'Tạo nhiệm vụ chính';
        return title || 'Chi tiết nhiệm vụ';
    };

    const isSubmitting = loadingCreate || loadingUpdate;

    return (
        <PageWrapper
            loading={loading}
            routes={pageOptions.renderBreadcrumbs(commonMessage, translate, getPageTitle(), { simulationId })}
        >
            {!loading && (isCreating || detail) ? (
                <TaskForm
                    setIsChangedFormValues={setIsChangedFormValues}
                    dataDetail={isCreating ? null : detail || null}
                    formId={mixinFuncs.getFormId()}
                    isEditing={isEditing}
                    actions={mixinFuncs.renderActions(isSubmitting ? false : undefined)}
                    onSubmit={handleSubmitWithQuestions}
                    simulationId={simulationId}
                    onQuestionsChange={handleQuestionsChange}
                />
            ) : !loading ? (
                <div style={{ padding: '24px', textAlign: 'center' }}>
                    <Alert
                        message="Không thể tải dữ liệu"
                        description="Nhiệm vụ không tồn tại hoặc bạn không có quyền truy cập. Vui lòng quay lại trang trước."
                        type="error"
                        showIcon
                    />
                </div>
            ) : null}
        </PageWrapper>
    );
};

export default TaskSavePage;
