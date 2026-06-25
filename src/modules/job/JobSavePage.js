import React from 'react';
import { useParams } from 'react-router-dom';

import PageWrapper from '@components/common/layout/PageWrapper';
import apiConfig from '@constants/apiConfig';
import useSaveBase from '@hooks/useSaveBase';
import useTranslate from '@hooks/useTranslate';
import { commonMessage } from '@locales/intl';
import JobForm from '@modules/job/JobForm';

const JobSavePage = ({ pageOptions = {} }) => {
    const translate = useTranslate();
    const { id } = useParams();
    const isCreating = id === 'create';

    const { detail, mixinFuncs, loading, onSave, setIsChangedFormValues, isEditing } = useSaveBase({
        apiConfig: {
            getById: apiConfig.job.getById,
            create: apiConfig.job.create,
            update: apiConfig.job.update,
        },
        options: {
            getListUrl: '/job',
            objectName: 'cơ hội việc làm',
        },
        override: (funcs) => {
            funcs.prepareUpdateData = (data) => ({
                ...data,
                id: parseInt(id),
            });

            funcs.prepareCreateData = (data) => ({
                ...data,
            });

            funcs.mappingData = (data) => {
                if (!data || !data.data) return {};
                const detail = { ...data.data };
                if (detail.achievements && typeof detail.achievements === 'string') {
                    try {
                        detail.achievements = JSON.parse(detail.achievements);
                    } catch {
                        detail.achievements = [];
                    }
                }
                if (detail.simulation) {
                    detail.simulationId = detail.simulation.id;
                }
                return detail;
            };
        },
    });

    const title = isCreating
        ? 'Tạo cơ hội việc làm'
        : (detail?.title || 'Chi tiết cơ hội việc làm');

    return (
        <PageWrapper loading={loading} routes={[
            { breadcrumbName: 'Cơ hội việc làm', path: '/job' },
            { breadcrumbName: title },
        ]}>
            <JobForm
                setIsChangedFormValues={setIsChangedFormValues}
                dataDetail={isCreating ? {} : detail || {}}
                formId={mixinFuncs.getFormId()}
                isEditing={isEditing}
                actions={mixinFuncs.renderActions()}
                onSubmit={onSave}
            />
        </PageWrapper>
    );
};

export default JobSavePage;
