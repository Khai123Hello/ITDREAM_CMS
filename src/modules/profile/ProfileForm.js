import TextField from '@components/common/form/TextField';
import DatePickerField from '@components/common/form/DatePickerField';
import CropImageField from '@components/common/form/CropImageField';
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import useBasicForm from '@hooks/useBasicForm';
import { defineMessages } from 'react-intl';
import useTranslate from '@hooks/useTranslate';
import { Card, Form } from 'antd';
import usePasswordValidation from '@hooks/usePasswordValidation';
import { DEFAULT_FORMAT, UserTypes, storageKeys, AppConstants, UploadFileTypes } from '@constants';
import { getData } from '@utils/localStorage';
import useFetch from '@hooks/useFetch';
import apiConfig from '@constants/apiConfig';

const parseDateString = (dateStr) => {
    if (!dateStr) return null;
    if (typeof dateStr === 'string' && dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
            const day = parts[0];
            const month = parts[1];
            const yearTime = parts[2].split(' ');
            const year = yearTime[0];
            const time = yearTime[1] || '00:00:00';
            return dayjs(`${year}-${month}-${day}T${time}`);
        }
    }
    return dayjs(dateStr);
};

const messages = defineMessages({
    username: 'Username',
    fullName: 'Full Name',
    email: 'Email',
    phoneNumber: 'Phone Number',
    birthday: 'Birthday',
    avatar: 'Avatar',
    currentPassword: 'Current password',
    newPassword: 'New password',
    confirmPassword: 'Confirm password',
});

const ProfileForm = (props) => {
    const { formId, dataDetail, onSubmit, setIsChangedFormValues, actions } = props;
    const translate = useTranslate();

    const userType = getData(storageKeys.USER_TYPE);
    const isAdmin = userType === UserTypes.ADMIN;
    const isEducator = userType === UserTypes.EDUCATOR;

    const [avatarUrl, setAvatarUrl] = useState(null);

    const { execute: executeUpFile } = useFetch(apiConfig.file.upload, { immediate: false });

    const uploadFile = (file, onSuccess, onError) => {
        executeUpFile({
            data: { file, type: UploadFileTypes.AVATAR },
            onCompleted: (response) => {
                if (response.result === true) {
                    onSuccess();
                    form.setFieldsValue({ avatar: response.data.filePath });
                    setAvatarUrl(response.data.filePath);
                    setIsChangedFormValues(true);
                }
            },
            onError,
        });
    };

    const { form, mixinFuncs, onValuesChange } = useBasicForm({
        onSubmit,
        setIsChangedFormValues,
    });

    const handleValuesChange = (changedValues, allValues) => {
        onValuesChange(changedValues, allValues);
        if ('avatar' in changedValues) {
            setAvatarUrl(changedValues.avatar);
        }
    };

    const { passwordRules, confirmPasswordRules } = usePasswordValidation(6);

    useEffect(() => {
        if (dataDetail) {
            form.setFieldsValue({
                ...dataDetail,
                // Ưu tiên lấy fullName từ dataDetail để hiển thị lên ô input có name="fullName"
                fullName: dataDetail.fullName,
                avatar: dataDetail.avatar || dataDetail.avatarPath,
                birthday: parseDateString(dataDetail.birthday),
            });
            setAvatarUrl(dataDetail.avatar || dataDetail.avatarPath);
        }
    }, [dataDetail, form]);

    const handleFinish = (values) => {
        // Khởi tạo payload cơ bản
        const payload = {
            ...values,
            id: dataDetail?.id,
            avatarPath: values.avatar,
            birthday: values.birthday ? values.birthday.format(DEFAULT_FORMAT) : null,
        };

        if (isAdmin) {
            // 1. Nếu là ADMIN: API yêu cầu key "fullName"
            // Vì TextField đang có name="fullName" nên values.fullName đã tồn tại trong ...values
            payload.fullName = values.fullName;
            if (values.oldPassword) {
                payload.oldPassword = values.oldPassword;
            }
            if (values.newPassword) {
                payload.password = values.newPassword; // Map newPassword vào key password của Admin API
            }
        } else {
            // 2. Nếu là STUDENT/EDUCATOR: API yêu cầu key "fullname" (viết thường)
            payload.fullname = values.fullName;
            // Xóa fullName (CamelCase) để tránh gửi thừa 2 field lên server
            delete payload.fullName;
        }

        // Dọn dẹp các field rác của UI trước khi gửi đi
        delete payload.avatar;
        delete payload.newPassword;
        delete payload.confirmPassword;

        mixinFuncs.handleSubmit(payload);
    };

    const format = (msg) => (translate?.formatMessage ? translate.formatMessage(msg) : '');

    return (
        <Card className="card-form" bordered={false} style={{ minHeight: 'calc(100vh - 190px)' }}>
            <Form
                style={{ width: '80%' }}
                labelCol={{ span: 8 }}
                id={formId}
                onFinish={handleFinish}
                form={form}
                layout="horizontal"
                onValuesChange={handleValuesChange}
            >
                <TextField required readOnly label={format(messages.username)} name="username" />

                <TextField required label={format(messages.email)} name="email" />

                <TextField required label={format(messages.fullName)} name="fullName" />

                <TextField required label={format(messages.phoneNumber)} name="phone" />

                <DatePickerField name="birthday" label="Ngày sinh" format="DD/MM/YYYY" showTime={false} />

                {(isAdmin || isEducator) && (
                    <>
                        <CropImageField
                            label={format(messages.avatar)}
                            name="avatar"
                            imageUrl={
                                avatarUrl
                                    ? avatarUrl.startsWith('http')
                                        ? avatarUrl
                                        : `${AppConstants.contentRootUrl}${avatarUrl.replace(/\\/g, '/').replace(/^\/?/, '/')}`
                                    : null
                            }
                            aspect={1}
                            uploadFile={uploadFile}
                        />
                        <TextField
                            label="Avatar URL"
                            name="avatar"
                            placeholder="Hoặc nhập đường dẫn hình ảnh (URL)..."
                        />
                    </>
                )}

                {isAdmin && (
                    <>
                        <TextField
                            type="password"
                            required
                            label={format(messages.currentPassword)}
                            name="oldPassword"
                        />

                        <TextField
                            type="password"
                            label={format(messages.newPassword)}
                            name="newPassword"
                            rules={passwordRules.filter((r) => !r.required)}
                        />

                        <TextField
                            type="password"
                            label={format(messages.confirmPassword)}
                            name="confirmPassword"
                            dependencies={['newPassword']}
                            rules={[
                                {
                                    validator(_, value) {
                                        const newPassword = form.getFieldValue('newPassword');
                                        if (newPassword && !value) {
                                            return Promise.reject(new Error('Vui lòng xác nhận mật khẩu!'));
                                        }
                                        if (!newPassword || newPassword === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Mật khẩu không trùng khớp!'));
                                    },
                                },
                            ]}
                        />
                    </>
                )}

                <div className="footer-card-form">{actions}</div>
            </Form>
        </Card>
    );
};

export default ProfileForm;
