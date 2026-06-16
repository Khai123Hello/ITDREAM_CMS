import React from 'react';
import { useParams } from 'react-router-dom';

import PageWrapper from '@components/common/layout/PageWrapper';
import apiConfig from '@constants/apiConfig';
import useSaveBase from '@hooks/useSaveBase';
import useTranslate from '@hooks/useTranslate';
import { commonMessage } from '@locales/intl';
import OrganizationForm from './OrganizationForm';

const OrganizationSavePage = ({ pageOptions = {} }) => {
    const translate = useTranslate();
    const { id } = useParams();
    const isCreating = id === 'create';

    const { detail, mixinFuncs, loading, onSave, setIsChangedFormValues, isEditing } = useSaveBase({
        apiConfig: {
            getById: apiConfig.organization.get,
            create: apiConfig.organization.create,
            update: apiConfig.organization.update,
        },
        options: {
            getListUrl: '/organization',
            objectName: 'tổ chức',
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

    const title = isCreating
        ? translate.formatMessage(commonMessage.create)
        : detail?.name || translate.formatMessage(commonMessage.update);

    const breadcrumbs = [
        { breadcrumbName: translate.formatMessage(commonMessage.home) },
        {
            breadcrumbName: 'Tổ chức',
            path: '/organization',
        },
        { breadcrumbName: title },
    ];

    return (
        <PageWrapper loading={loading} routes={breadcrumbs}>
            <OrganizationForm
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

export default OrganizationSavePage;
