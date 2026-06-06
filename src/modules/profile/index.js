import React, { useEffect, useState } from 'react';
import useFetch from '@hooks/useFetch';
import useFetchAction from '@hooks/useFetchAction';
import useTranslate from '@hooks/useTranslate';
import useSaveBase from '@hooks/useSaveBase';
import ProfileForm from './ProfileForm';
import { commonMessage } from '@locales/intl';
import { accountActions } from '@store/actions';
import PageWrapper from '@components/common/layout/PageWrapper';
import apiConfig from '@constants/apiConfig';

const ProfilePage = () => {
    const translate = useTranslate();
    const [detail, setDetail] = useState({});
    
    const { execute, loading } = useFetch({ ...apiConfig.account.getProfile }, { immediate: false });
    const { execute: executeGetProfile } = useFetchAction(accountActions.getProfile);

    const { mixinFuncs, onSave, setIsChangedFormValues, isEditing } = useSaveBase({
        options: {
            getListUrl: `/profile`,
            objectName: 'Profile',
        },
        apiConfig: {
            getById: apiConfig.account.getProfile,
            update: apiConfig.account.updateProfile,
        },
        override: (funcs) => {
            const onSaveCompleted = funcs.onSaveCompleted;
            funcs.onSaveCompleted = (response) => {
                onSaveCompleted(response);
                executeGetProfile();
            };
        },
    });

    useEffect(() => {
        execute({
            onCompleted: (response) => {
                if (response.result === true) {
                    const rawData = response.data;
                    const data = rawData?.profileAccountDto 
                        ? { ...rawData.profileAccountDto, id: rawData.id } 
                        : rawData;
                    setDetail(data);
                }
            },
            onError: mixinFuncs.handleGetDetailError,
        });
    }, []);

    return (
        <PageWrapper
            loading={loading}
            routes={[{ breadcrumbName: translate.formatMessage(commonMessage.profile) }]}
        >
            <ProfileForm
                setIsChangedFormValues={setIsChangedFormValues}
                dataDetail={detail}
                formId={mixinFuncs.getFormId()}
                isEditing={isEditing}
                actions={mixinFuncs.renderActions()}
                onSubmit={onSave}
            />
        </PageWrapper>
    );
};

export default ProfilePage;