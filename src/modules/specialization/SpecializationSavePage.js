import React from 'react';
import { useParams, useLocation } from 'react-router-dom';

import PageWrapper from '@components/common/layout/PageWrapper';
import apiConfig from '@constants/apiConfig';
import useSaveBase from '@hooks/useSaveBase';
import useTranslate from '@hooks/useTranslate';
import { commonMessage } from '@locales/intl';
import SpecializationForm from './SpecializationForm';

const SpecializationSavePage = ({ pageOptions = {} }) => {
    const translate = useTranslate();
    const { id } = useParams();
    const location = useLocation();
    const isCreating = id === 'create';
    
    // Lấy detail từ navigate state (được truyền từ ListPage)
    const detailFromState = location.state?.detail;

    const { mixinFuncs, loading, onSave, setIsChangedFormValues, isEditing } = useSaveBase({
        apiConfig: {
            getById: null, // Không có API getById
            create: apiConfig.specialization.create,
            update: apiConfig.specialization.update,
        },
        options: {
            getListUrl: '/specialization',
            objectName: pageOptions.objectName 
                ? translate.formatMessage(pageOptions.objectName)?.toLowerCase()
                : 'specialization',
        },
        override: (funcs) => {
            funcs.prepareUpdateData = (data) => ({
                ...data,
                id: parseInt(id),
            });

            funcs.prepareCreateData = (data) => ({
                ...data,
            });
        },
    });

    // Xác định title cho breadcrumb
    const title = isCreating 
        ? translate.formatMessage(commonMessage.create)
        : detailFromState?.name || translate.formatMessage(commonMessage.update);

    // Safe render breadcrumbs
    const breadcrumbs = pageOptions.renderBreadcrumbs 
        ? pageOptions.renderBreadcrumbs(commonMessage, translate, title)
        : [
            { breadcrumbName: translate.formatMessage(commonMessage.home) },
            { 
                breadcrumbName: translate.formatMessage(commonMessage.specialization),
                path: '/specialization',
            },
            { breadcrumbName: title },
        ];

    return (
        <PageWrapper
            loading={loading}
            routes={breadcrumbs}
        >
            <SpecializationForm
                setIsChangedFormValues={setIsChangedFormValues}
                dataDetail={isCreating ? {} : (detailFromState || {})}
                formId={mixinFuncs.getFormId()}
                isEditing={isEditing}
                actions={mixinFuncs.renderActions()}
                onSubmit={onSave}
            />
        </PageWrapper>
    );
};

export default SpecializationSavePage;