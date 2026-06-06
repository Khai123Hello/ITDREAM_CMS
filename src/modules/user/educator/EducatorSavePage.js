import React from 'react';
import { useParams } from 'react-router-dom';

import PageWrapper from '@components/common/layout/PageWrapper';

import { ERROR_USERNAME_EXISTED, GROUP_KIND_EDUCATOR, STATUS_ACTIVE } from '@constants';
import apiConfig from '@constants/apiConfig';

import useFetch from '@hooks/useFetch';
import useSaveBase from '@hooks/useSaveBase';
import useTranslate from '@hooks/useTranslate';

import { commonMessage } from '@locales/intl';
import EducatorForm from "@modules/user/educator/EducatorForm";

const EducatorSavePage = ({ pageOptions }) => {
    const translate = useTranslate();
    const { id } = useParams();

    const { data: group } = useFetch(apiConfig.groupPermission.getGroupList, {
        immediate: true,
        mappingData: (res) => res.data?.content?.map((item) => ({ value: item.id, label: item.name })),
        params: {
            kind: GROUP_KIND_EDUCATOR,
        },
    });

    const { detail, mixinFuncs, loading, onSave, setIsChangedFormValues, isEditing, title } = useSaveBase({
        apiConfig: {
            getById: apiConfig.educator.getById,
            create: apiConfig.educator.create,
            update: apiConfig.educator.update,
        },
        options: {
            getListUrl: pageOptions.listPageUrl,
            objectName: translate.formatMessage(pageOptions.objectName)?.toLowerCase(),
        },
        override: (funcs) => {
            funcs.prepareUpdateData = (data) => {
                return {
                    avatarPath: data.avatar,
                    ...data,
                    id: id,
                };
            };
            funcs.prepareCreateData = (data) => {
                return {
                    avatarPath: data.avatar,
                    ...data,
                    status: STATUS_ACTIVE,
                };
            };
            funcs.mappingData = (data) => {
                return {
                    ...data.data,
                };
            };
            funcs.handleShowErrorMessage = (err, showErrorMessage) => {
                if (err?.code === ERROR_USERNAME_EXISTED) {
                    showErrorMessage(
                        translate.formatMessage(commonMessage.usernameExisted) || err?.message,
                        translate,
                    );
                } else {
                    showErrorMessage(`${mixinFuncs.getActionName()} failed. Please try again!`);
                }
            };
        },
    });

    return (
        <PageWrapper loading={loading} routes={pageOptions.renderBreadcrumbs(commonMessage, translate, title)}>
            <EducatorForm
                setIsChangedFormValues={setIsChangedFormValues}
                dataDetail={detail || {}}
                formId={mixinFuncs.getFormId()}
                isEditing={isEditing}
                actions={mixinFuncs.renderActions()}
                onSubmit={onSave}
                group={group || []}
            />
        </PageWrapper>
    );
};

export default EducatorSavePage;
