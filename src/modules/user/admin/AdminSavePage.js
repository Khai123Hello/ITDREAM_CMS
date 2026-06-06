import React from 'react';
import { useParams } from 'react-router-dom';

import PageWrapper from '@components/common/layout/PageWrapper';
import { ERROR_ACCOUNT_EXIST, GROUP_KIND_ADMIN, STATUS_ACTIVE, UserTypes } from '@constants';
import apiConfig from '@constants/apiConfig';
import useSaveBase from '@hooks/useSaveBase';
import useTranslate from '@hooks/useTranslate';
import { commonMessage } from '@locales/intl';
import AdminForm from './AdminForm';
import useFetch from '@hooks/useFetch';

const AdminSavePage = ({ pageOptions }) => {
    const translate = useTranslate();
    const { id } = useParams();

    const { data } = useFetch(apiConfig.groupPermission.getGroupList, {
        immediate: true,
        mappingData: (res) => res.data?.content?.map((item) => ({ value: item.id, label: item.name })),
        params: {
            kind: GROUP_KIND_ADMIN,
        },
    });

    const { detail, mixinFuncs, loading, onSave, setIsChangedFormValues, isEditing, title } = useSaveBase({
        apiConfig: {
            getById: apiConfig.account.getById,
            create: apiConfig.account.createAdmin,
            update: apiConfig.account.updateAdmin,
        },
        options: {
            getListUrl: pageOptions.listPageUrl,
            objectName: translate.formatMessage(pageOptions.objectName)?.toLowerCase(),
        },
        override: (funcs) => {
            funcs.prepareUpdateData = (data) => {
                return {
                    ...data,
                    kind: UserTypes.ADMIN,
                    status: STATUS_ACTIVE,
                    avatarPath: data.avatar,
                    id,
                };
            };
            funcs.prepareCreateData = (data) => {
                return {
                    ...data,
                    kind: UserTypes.ADMIN,
                    avatarPath: data.avatar,
                    status: STATUS_ACTIVE,
                };
            };

            funcs.mappingData = (data) => {
                return {
                    ...data.data,
                };
            };

            funcs.handleShowErrorMessage = (err, showErrorMessage) => {
                if (err && err?.code == ERROR_ACCOUNT_EXIST)
                    showErrorMessage(translate.formatMessage(commonMessage.usernameExisted) || err.message, translate);
                else showErrorMessage(`${mixinFuncs.getActionName()} failed. Please try again!`, translate);
            };
        },
    });

    return (
        <PageWrapper loading={loading} routes={pageOptions.renderBreadcrumbs(commonMessage, translate, title)}>
            <AdminForm
                setIsChangedFormValues={setIsChangedFormValues}
                dataDetail={detail ? detail : {}}
                formId={mixinFuncs.getFormId()}
                isEditing={isEditing}
                actions={mixinFuncs.renderActions()}
                onSubmit={onSave}
                groups={data || []}
            />
        </PageWrapper>
    );
};

export default AdminSavePage;
