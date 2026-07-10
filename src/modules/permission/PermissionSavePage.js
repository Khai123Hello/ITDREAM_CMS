import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';

import PageWrapper from '@components/common/layout/PageWrapper';
import apiConfig from '@constants/apiConfig';
import useSaveBase from '@hooks/useSaveBase';
import useFetch from '@hooks/useFetch';
import useTranslate from '@hooks/useTranslate';
import { commonMessage } from '@locales/intl';
import PermissionForm from './PermissionForm';

const PermissionSavePage = ({ pageOptions = {} }) => {
    const translate = useTranslate();
    const { id } = useParams();
    const location = useLocation();
    const isCreating = id === 'create';
    const [existingGroups, setExistingGroups] = useState([]);

    const detailFromState = location.state?.detail;

    const { execute: executeGetPermissions } = useFetch(apiConfig.permission.getList, {
        immediate: false,
    });

    useEffect(() => {
        executeGetPermissions({
            params: {},
            onCompleted: (res) => {
                if (res?.data) {
                    const groups = Array.from(new Set(res.data.map((item) => item.nameGroup).filter(Boolean)));
                    setExistingGroups(groups);
                }
            },
        });
    }, []);

    const { detail, mixinFuncs, loading, onSave, setIsChangedFormValues, isEditing } = useSaveBase({
        apiConfig: {
            getById: apiConfig.permission.getById,
            create: apiConfig.permission.create,
            update: apiConfig.permission.update,
        },
        options: {
            getListUrl: '/permission',
            objectName: pageOptions.objectName
                ? translate.formatMessage(pageOptions.objectName)?.toLowerCase()
                : 'quyền',
        },
        override: (funcs) => {
            funcs.prepareUpdateData = (data) => ({
                ...data,
                id: parseInt(id),
                showMenu: false,
            });

            funcs.prepareCreateData = (data) => ({
                ...data,
                showMenu: false,
            });

            funcs.mappingData = (response) => {
                if (response.result === true) {
                    return {
                        ...response.data,
                        permissionCode: response.data.pcode || response.data.permissionCode,
                    };
                }
            };
        },
    });

    const title = isCreating
        ? translate.formatMessage(commonMessage.create)
        : detail?.name || detailFromState?.name || translate.formatMessage(commonMessage.update);

    const breadcrumbs = pageOptions.renderBreadcrumbs
        ? pageOptions.renderBreadcrumbs(commonMessage, translate, title)
        : [
              { breadcrumbName: 'Quyền hạn', path: '/group-permission' },
              {
                  breadcrumbName: 'Quản lý Quyền',
                  path: '/permission',
              },
              { breadcrumbName: title },
          ];

    return (
        <PageWrapper loading={loading} routes={breadcrumbs}>
            <PermissionForm
                setIsChangedFormValues={setIsChangedFormValues}
                dataDetail={isCreating ? {} : detail?.name ? detail : detailFromState || {}}
                formId={mixinFuncs.getFormId()}
                isEditing={isEditing}
                actions={mixinFuncs.renderActions()}
                onSubmit={onSave}
                existingGroups={existingGroups}
            />
        </PageWrapper>
    );
};

export default PermissionSavePage;
