import React from 'react';
import { useParams } from 'react-router-dom';

import PageWrapper from '@components/common/layout/PageWrapper';

import apiConfig from '@constants/apiConfig';
import { levelOptions } from '@constants/masterData';

import useFetch from '@hooks/useFetch';
import useSaveBase from '@hooks/useSaveBase';
import useTranslate from '@hooks/useTranslate';

import { commonMessage } from '@locales/intl';
import SimulationForm from "@modules/simulation/simulation/SimulationForm";

import { UserTypes } from '@constants';
import { getData } from '@utils/localStorage';
import { storageKeys } from '@constants';

const EducatorSimulationSavePage = ({ pageOptions }) => {

    const userType = getData(storageKeys.USER_TYPE);
    const isEducator = userType === UserTypes.EDUCATOR;

    const translate = useTranslate();
    const { id } = useParams();

    // Fetch specializations for the dropdown select field
    const { data: specializations } = useFetch(apiConfig.specialization.getList, {
        immediate: true,
        mappingData: (res) => res.data?.content?.map((item) => ({ value: item.id, label: item.name })),
    });

    // Translate level options for the dropdown
    const levels = translate.formatKeys(levelOptions, ['label']);

    const apiConfiguration = isEducator
        ? {
            getById: apiConfig.simulation.getSimulationForEducator,
            create: apiConfig.simulation.create,
            update: apiConfig.simulation.update,
        }
        : {
            getById: apiConfig.simulation.getById,
            create: apiConfig.simulation.create,
            update: apiConfig.simulation.update,
        };

    const { detail, mixinFuncs, loading, onSave, setIsChangedFormValues, isEditing, title } = useSaveBase({
        apiConfig: apiConfiguration,
        options: {
            getListUrl: pageOptions.listPageUrl,
            objectName: translate.formatMessage(commonMessage.simulation)?.toLowerCase(),
        },
        override: (funcs) => {
            // Chuẩn bị data cho update
            funcs.prepareUpdateData = (data) => {
                const payload = { ...data, id: id };
                if (!payload.specializationId) {
                    delete payload.specializationId;
                }
                return payload;
            };

            // Chuẩn bị data cho create
            funcs.prepareCreateData = (data) => {
                return {
                    ...data,
                };
            };

            // Map response từ getById
            funcs.mappingData = (res) => {
                const data = res.data;
                return {
                    ...data,
                };
            };
        },
    });

    return (
        <PageWrapper loading={loading} routes={pageOptions.renderBreadcrumbs(commonMessage, translate, title)}>
            <SimulationForm
                setIsChangedFormValues={setIsChangedFormValues}
                dataDetail={detail || {}}
                formId={mixinFuncs.getFormId()}
                isEditing={isEditing}
                actions={mixinFuncs.renderActions()}
                onSubmit={onSave}
                specializations={specializations || []}
                levels={levels || []}
            />
        </PageWrapper>
    );
};

export default EducatorSimulationSavePage;
