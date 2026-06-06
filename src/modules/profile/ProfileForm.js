import TextField from '@components/common/form/TextField';
import DatePickerField from '@components/common/form/DatePickerField';
import React, { useEffect } from 'react';
import dayjs from 'dayjs';
import useBasicForm from '@hooks/useBasicForm';
import { defineMessages } from 'react-intl';
import useTranslate from '@hooks/useTranslate';
import { Card, Form } from 'antd';
import usePasswordValidation from '@hooks/usePasswordValidation'; 
import { DEFAULT_FORMAT, UserTypes, storageKeys } from '@constants';
import { getData } from '@utils/localStorage';

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

    const { form, mixinFuncs, onValuesChange } = useBasicForm({
        onSubmit,
        setIsChangedFormValues,
    });

    const { passwordRules, confirmPasswordRules } = usePasswordValidation(6);

    useEffect(() => {
        if (dataDetail) {
            form.setFieldsValue({
                ...dataDetail,
                // Ưu tiên lấy fullName từ dataDetail để hiển thị lên ô input có name="fullName"
                fullName: dataDetail.fullName,
                avatar: dataDetail.avatar || dataDetail.avatarPath,
                birthday: dataDetail.birthday ? dayjs(dataDetail.birthday) : null,
            });
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
            payload.oldPassword = values.oldPassword;
            payload.password = values.newPassword; // Map newPassword vào key password của Admin API
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
                onValuesChange={onValuesChange}
            >
                <TextField required readOnly label={format(messages.username)} name="username" />

                <TextField required label={format(messages.email)} name="email" />

                <TextField required label={format(messages.fullName)} name="fullName" />

                <TextField 
                    required
                    label={format(messages.phoneNumber)} 
                    name="phone"
                />

                <DatePickerField
                    name="birthday"
                    label="Ngày sinh"
                    format="DD/MM/YYYY"
                    showTime={false}
                />

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
                            rules={passwordRules}  
                        />

                        <TextField
                            type="password"
                            label={format(messages.confirmPassword)}
                            name="confirmPassword"
                            dependencies={['newPassword']}
                            rules={confirmPasswordRules(form.getFieldValue)}  
                        />
                    </>
                )}

                <div className="footer-card-form">{actions}</div>
            </Form>
        </Card>
    );
};

export default ProfileForm;