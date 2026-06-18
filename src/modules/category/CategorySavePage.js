import React from 'react';
import { useParams, useLocation } from 'react-router-dom';

import PageWrapper from '@components/common/layout/PageWrapper';
import apiConfig from '@constants/apiConfig';
import useSaveBase from '@hooks/useSaveBase';
import useTranslate from '@hooks/useTranslate';
import useQueryParams from '@hooks/useQueryParams';
import { CATEGORY_KIND_SPECIALIZATION } from '@constants';
import { commonMessage } from '@locales/intl';
import CategoryForm from './CategoryForm';

const CategorySavePage = ({ pageOptions = {} }) => {
    const translate = useTranslate();
    const { id } = useParams();
    const location = useLocation();
    const isCreating = id === 'create';
    const { params: queryParams } = useQueryParams();
    const kind = parseInt(queryParams.get('kind')) || CATEGORY_KIND_SPECIALIZATION;

    const detailFromState = location.state?.detail;

    const { detail, mixinFuncs, loading, onSave, setIsChangedFormValues, isEditing } = useSaveBase({
        apiConfig: {
            getById: apiConfig.category.getById,
            create: apiConfig.category.create,
            update: apiConfig.category.update,
        },
        options: {
            getListUrl: '/category',
            objectName: pageOptions.objectName
                ? translate.formatMessage(pageOptions.objectName)?.toLowerCase()
                : 'danh mục',
        },
        override: (funcs) => {
            funcs.prepareUpdateData = (data) => ({
                ...data,
                id: parseInt(id),
                kind: detail?.kind || detailFromState?.kind || kind,
            });

            funcs.prepareCreateData = (data) => ({
                ...data,
                kind: kind,
            });
        },
    });

    // Xác định title cho breadcrumb
    const title = isCreating
        ? translate.formatMessage(commonMessage.create)
        : detail?.name || detailFromState?.name || translate.formatMessage(commonMessage.update);

    // Safe render breadcrumbs
    const breadcrumbs = pageOptions.renderBreadcrumbs
        ? pageOptions.renderBreadcrumbs(commonMessage, translate, title)
        : [
              { breadcrumbName: translate.formatMessage(commonMessage.home) },
              {
                  breadcrumbName: 'Danh mục',
                  path: '/category',
              },
              { breadcrumbName: title },
          ];

    return (
        <PageWrapper loading={loading} routes={breadcrumbs}>
            <CategoryForm
                setIsChangedFormValues={setIsChangedFormValues}
                dataDetail={isCreating ? {} : detail?.name ? detail : detailFromState || {}}
                formId={mixinFuncs.getFormId()}
                isEditing={isEditing}
                actions={mixinFuncs.renderActions()}
                onSubmit={onSave}
                kind={isCreating ? kind : detail?.kind || detailFromState?.kind || kind}
            />
        </PageWrapper>
    );
};

export default CategorySavePage;
