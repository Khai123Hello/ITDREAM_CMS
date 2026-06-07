import React from 'react';
import { useParams, useLocation } from 'react-router-dom';

import PageWrapper from '@components/common/layout/PageWrapper';
import apiConfig from '@constants/apiConfig';
import useSaveBase from '@hooks/useSaveBase';
import useTranslate from '@hooks/useTranslate';
import { commonMessage } from '@locales/intl';
import CategoryForm from './CategoryForm';

const CategorySavePage = ({ pageOptions = {} }) => {
    const translate = useTranslate();
    const { id } = useParams();
    const location = useLocation();
    const isCreating = id === 'create';

    // Lấy detail từ navigate state (được truyền từ ListPage)
    const detailFromState = location.state?.detail;

    const { mixinFuncs, loading, onSave, setIsChangedFormValues, isEditing } = useSaveBase({
        apiConfig: {
            getById: null, // Không có API getById
            create: apiConfig.category.create,
            update: apiConfig.category.update,
        },
        options: {
            getListUrl: '/category',
            objectName: pageOptions.objectName
                ? translate.formatMessage(pageOptions.objectName)?.toLowerCase()
                : 'category',
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
                breadcrumbName: translate.formatMessage(commonMessage.category),
                path: '/category',
            },
            { breadcrumbName: title },
        ];

    return (
        <PageWrapper
            loading={loading}
            routes={breadcrumbs}
        >
            <CategoryForm
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

export default CategorySavePage;