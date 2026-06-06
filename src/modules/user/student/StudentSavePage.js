import React from 'react';
import { useParams } from 'react-router-dom';

import PageWrapper from '@components/common/layout/PageWrapper';

import { ERROR_USERNAME_EXISTED, GROUP_KIND_EDUCATOR, STATUS_ACTIVE } from '@constants';
import apiConfig from '@constants/apiConfig';

import useFetch from '@hooks/useFetch';
import useSaveBase from '@hooks/useSaveBase';
import useTranslate from '@hooks/useTranslate';

import { commonMessage } from '@locales/intl';
import StudentForm from "@modules/user/student/StudentForm";

const StudentSavePage = ({ pageOptions }) => {
    const translate = useTranslate();
    const { id } = useParams();

    const { data: group } = useFetch(apiConfig.groupPermission.getGroupList, {
        immediate: true,
        mappingData: (res) => res.data?.content?.map((item) => ({ value: item.id, label: item.name })),
        params: {
            kind: GROUP_KIND_EDUCATOR, // Nếu học sinh không có phân quyền, bạn có thể bỏ dòng này
        },
    });

    const {
        detail,
        mixinFuncs,
        loading,
        onSave,
        setIsChangedFormValues,
        isEditing,
        title,
    } = useSaveBase({
        apiConfig: {
            getById: apiConfig.student.getById,
            create: apiConfig.student.create,
            update: apiConfig.student.update,
        },
        options: {
            getListUrl: pageOptions.listPageUrl,
            objectName: translate.formatMessage(pageOptions.objectName)?.toLowerCase(),
        },
        override: (funcs) => {
            funcs.prepareUpdateData = (data) => ({
                ...data,
                id,
            });

            funcs.prepareCreateData = (data) => ({
                ...data,
                status: STATUS_ACTIVE,
            });

            funcs.mappingData = (res) => {
                const student = res?.data || {};
                const account = student.account || {};
                return {
                    ...account,
                    avatarPath: account.avatarPath || '',
                    id: student.id,
                    birthday: student.birthday,
                    groupId: account.group?.id,
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
            <StudentForm
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

export default StudentSavePage;
