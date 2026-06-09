import React, { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
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
    const location = useLocation();
    const isCreating = id === 'create';

    const parentTaskFromState = location.state?.parentTask;

    const apiConfiguration = isEducator
        ? {
            getById: apiConfig.task.educatorGet,
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
