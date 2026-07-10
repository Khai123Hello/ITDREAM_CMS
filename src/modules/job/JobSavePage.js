import React from 'react';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';

import PageWrapper from '@components/common/layout/PageWrapper';
import apiConfig from '@constants/apiConfig';
import useSaveBase from '@hooks/useSaveBase';
import JobForm from '@modules/job/JobForm';
import { UserTypes, storageKeys } from '@constants';
import { getData } from '@utils/localStorage';

const JobSavePage = () => {
    const { id } = useParams();
    const isCreating = id === 'create';
    const userType = getData(storageKeys.USER_TYPE);
    const isEducator = userType === UserTypes.EDUCATOR;

    const { detail, mixinFuncs, loading, onSave, setIsChangedFormValues, isEditing } = useSaveBase({
        apiConfig: isEducator
            ? {
                getById: apiConfig.job.educatorGetById,
                create: apiConfig.job.create,
                update: apiConfig.job.update,
            }
            : {
                getById: apiConfig.job.getById,
                update: apiConfig.job.updateStatus,
            },
        options: {
            getListUrl: '/job',
            objectName: 'tin tuyển dụng',
        },
        override: (funcs) => {
            funcs.prepareUpdateData = (data) => {
                if (isEducator) {
                    return {
                        title: data.title,
                        content: data.content,
                        image: data.image,
                        type: data.type,
                        roleType: data.roleType,
                        jobUrl: data.jobUrl,
                        address: data.address,
                        provinceId: data.provinceId,
                        wardId: data.wardId,
                        date: data.date ? dayjs(data.date).format('DD/MM/YYYY HH:mm:ss') : null,
                        endDate: data.endDate ? dayjs(data.endDate).format('DD/MM/YYYY HH:mm:ss') : null,
                        simulationIds: data.simulationIds || [],
                        status: data.status,
                        id: parseInt(id),
                    };
                } else {
                    return {
                        id: parseInt(id),
                        status: data.status,
                        notice: data.notice,
                    };
                }
            };

            funcs.prepareCreateData = (data) => ({
                title: data.title,
                content: data.content,
                image: data.image,
                type: data.type,
                roleType: data.roleType,
                jobUrl: data.jobUrl,
                address: data.address,
                provinceId: data.provinceId,
                wardId: data.wardId,
                date: data.date ? dayjs(data.date).format('DD/MM/YYYY HH:mm:ss') : null,
                endDate: data.endDate ? dayjs(data.endDate).format('DD/MM/YYYY HH:mm:ss') : null,
                simulationIds: data.simulationIds || [],
            });

            funcs.mappingData = (data) => {
                if (!data || !data.data) return {};
                const detail = { ...data.data };
                if (detail.simulations) {
                    detail.simulationIds = detail.simulations.map((s) => s.id);
                }
                if (detail.province) {
                    detail.provinceId = detail.province.id;
                }
                if (detail.ward) {
                    detail.wardId = detail.ward.id;
                }
                return detail;
            };
        },
    });

    const title = isCreating ? 'Tạo tin tuyển dụng' : detail?.title || 'Chi tiết tin tuyển dụng';

    return (
        <PageWrapper
            loading={loading}
            routes={[{ breadcrumbName: 'Tin tuyển dụng', path: '/job' }, { breadcrumbName: title }]}
        >
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
