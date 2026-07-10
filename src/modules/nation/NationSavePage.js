import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';

import PageWrapper from '@components/common/layout/PageWrapper';
import apiConfig from '@constants/apiConfig';
import useSaveBase from '@hooks/useSaveBase';
import useTranslate from '@hooks/useTranslate';
import useQueryParams from '@hooks/useQueryParams';
import useFetch from '@hooks/useFetch';
import { commonMessage } from '@locales/intl';
import NationForm from './NationForm';

const NationSavePage = ({ pageOptions = {} }) => {
    const translate = useTranslate();
    const { id } = useParams();
    const location = useLocation();
    const isCreating = id === 'create';
    const { params: queryParams } = useQueryParams();
    const kind = parseInt(queryParams.get('kind')) || 1;
    const parentId = queryParams.get('parentId');

    const detailFromState = location.state?.detail;

    const getListUrl = () => {
        const pId = parentId || detail?.parent?.id || detailFromState?.parent?.id;
        return pId ? `/nation?parentId=${pId}` : '/nation';
    };

    const { detail, mixinFuncs, loading, onSave, setIsChangedFormValues, isEditing } = useSaveBase({
        apiConfig: {
            getById: apiConfig.nation.getById,
            create: apiConfig.nation.create,
            update: apiConfig.nation.update,
        },
        options: {
            getListUrl: '/nation',
            objectName: pageOptions.objectName
                ? translate.formatMessage(pageOptions.objectName)?.toLowerCase()
                : 'địa chỉ',
        },
        override: (funcs) => {
            funcs.prepareUpdateData = (data) => ({
                ...data,
                id: parseInt(id),
                kind: detail?.kind || detailFromState?.kind || kind,
                parentId: data.parentId ? parseInt(data.parentId) : undefined,
            });

            funcs.prepareCreateData = (data) => ({
                ...data,
                kind: kind,
                parentId: parentId ? parseInt(parentId) : undefined,
            });

            funcs.onCancel = () => {
                mixinFuncs.navigate(getListUrl());
            };
        },
    });

    React.useEffect(() => {
        if (mixinFuncs) {
            mixinFuncs.getListUrl = () => getListUrl();
        }
    }, [detail, detailFromState, parentId, mixinFuncs]);

    const title = isCreating
        ? translate.formatMessage(commonMessage.create)
        : detail?.name || detailFromState?.name || translate.formatMessage(commonMessage.update);

    const currentParentId = parentId || detail?.parent?.id || detailFromState?.parent?.id;

    // Fetch parent name if creating new item with parentId but no detail yet
    const [parentDataName, setParentDataName] = useState(null);
    const { execute: fetchParent } = useFetch(apiConfig.nation.getById);

    useEffect(() => {
        if (currentParentId && !detail?.parent?.name && !detailFromState?.parent?.name) {
            fetchParent({
                pathParams: { id: currentParentId },
                onCompleted: (res) => {
                    if (res?.data?.name) setParentDataName(res.data.name);
                },
            });
        }
    }, [currentParentId]);

    const parentName = detail?.parent?.name || detailFromState?.parent?.name || parentDataName;

    const breadcrumbs = pageOptions.renderBreadcrumbs
        ? pageOptions.renderBreadcrumbs(commonMessage, translate, title, {
              parentId: currentParentId,
              parentName: parentName,
          })
        : [
              {
                  breadcrumbName: 'Tỉnh thành / Địa chỉ',
                  path: '/nation',
              },
              ...(currentParentId
                  ? [
                        {
                            breadcrumbName: parentName,
                            path: `/nation?parentId=${currentParentId}`,
                        },
                    ]
                  : []),
              { breadcrumbName: title },
          ];

    return (
        <PageWrapper loading={loading} routes={breadcrumbs}>
            <NationForm
                setIsChangedFormValues={setIsChangedFormValues}
                dataDetail={isCreating ? {} : detail?.name ? detail : detailFromState || {}}
                formId={mixinFuncs.getFormId()}
                isEditing={isEditing}
                actions={mixinFuncs.renderActions()}
                onSubmit={onSave}
                kind={isCreating ? kind : detail?.kind || detailFromState?.kind || kind}
                parentId={parentId || detail?.parent?.id || detailFromState?.parent?.id}
                parentName={parentName}
            />
        </PageWrapper>
    );
};

export default NationSavePage;
