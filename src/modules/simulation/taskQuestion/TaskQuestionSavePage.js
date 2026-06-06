import React from 'react';
import { useParams } from 'react-router-dom';

import PageWrapper from '@components/common/layout/PageWrapper';
import apiConfig from '@constants/apiConfig';
import useSaveBase from '@hooks/useSaveBase';
import useTranslate from '@hooks/useTranslate';
import { commonMessage } from '@locales/intl';
import TaskQuestionForm from '@modules/simulation/taskQuestion/TaskQuestionForm';

const TaskQuestionSavePage = ({ pageOptions }) => {
    const translate = useTranslate();
    const { id, simulationId, taskId } = useParams();
    const isCreating = id === 'create';

    const { detail, mixinFuncs, loading, onSave, setIsChangedFormValues, isEditing, title } = useSaveBase({
        apiConfig: {
            getById: apiConfig.taskQuestion.getById,
            create: apiConfig.taskQuestion.create,
            update: apiConfig.taskQuestion.update,
        },
        options: {
            getListUrl: `/simulation/${simulationId}/task/${taskId}/question`,
            objectName: translate.formatMessage(pageOptions.objectName)?.toLowerCase(),
        },
        override: (funcs) => {
            funcs.prepareUpdateData = (data) => ({
                ...data,
                id: id,
                taskId: taskId,
            });

            funcs.prepareCreateData = (data) => ({
                ...data,
                taskId: taskId,
            });

            funcs.mappingData = (data) => ({
                ...data.data,
            });
        },
    });

    return (
        <PageWrapper
            loading={loading}
            routes={pageOptions.renderBreadcrumbs(commonMessage, translate, title, { simulationId, taskId })}
        >
            <TaskQuestionForm
                setIsChangedFormValues={setIsChangedFormValues}
                dataDetail={isCreating ? {} : detail || {}}
                formId={mixinFuncs.getFormId()}
                isEditing={isEditing}
                actions={mixinFuncs.renderActions()}
                onSubmit={onSave}
                taskId={taskId}
            />
        </PageWrapper>
    );
};

export default TaskQuestionSavePage;
