import TextField from '@components/common/form/TextField';
import DatePickerField from '@components/common/form/DatePickerField';
import CropImageField from '@components/common/form/CropImageField';
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import useBasicForm from '@hooks/useBasicForm';
import { defineMessages } from 'react-intl';
import useTranslate from '@hooks/useTranslate';
import { Card, Form, Radio, Space } from 'antd';
import { DEFAULT_FORMAT, AppConstants, UploadFileTypes } from '@constants';
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
    phoneNumber: 'Phone Number',
    birthday: 'Birthday',
    avatar: 'Avatar',
});

// Chế độ nhập avatar: upload file hoặc nhập URL
const AVATAR_MODE_UPLOAD = 'upload';
const AVATAR_MODE_URL = 'url';

const ProfileForm = (props) => {
    const { formId, dataDetail, onSubmit, setIsChangedFormValues, actions } = props;
    const translate = useTranslate();

    const [avatarUrl, setAvatarUrl] = useState(null);
    const [avatarMode, setAvatarMode] = useState(AVATAR_MODE_UPLOAD);

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

    useEffect(() => {
        if (dataDetail) {
            form.setFieldsValue({
                username: dataDetail.username,
                fullName: dataDetail.fullName || dataDetail.fullname,
                phone: dataDetail.phone,
                birthday: parseDateString(dataDetail.birthday),
                avatar: dataDetail.avatar || dataDetail.avatarPath,
            });
            setAvatarUrl(dataDetail.avatar || dataDetail.avatarPath);
        }
    }, [dataDetail, form]);

    const handleFinish = (values) => {
        const payload = {
            id: dataDetail?.id,
            username: values.username,
            fullname: values.fullName,
            phone: values.phone,
            birthday: values.birthday ? values.birthday.format(DEFAULT_FORMAT) : null,
            avatarPath: values.avatar || null,
        };

        mixinFuncs.handleSubmit(payload);
    };

    const format = (msg) => (translate?.formatMessage ? translate.formatMessage(msg) : '');

    const resolvedAvatarUrl = avatarUrl
        ? avatarUrl.startsWith('http')
            ? avatarUrl
            : `${AppConstants.contentRootUrl}${avatarUrl.replace(/\\/g, '/').replace(/^\/?/, '/')}`
        : null;

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
                {/* Username: chỉ hiển thị, không cho sửa */}
                <TextField readOnly label={format(messages.username)} name="username" />

                {/* Full Name */}
                <TextField required label={format(messages.fullName)} name="fullName" />

                {/* Phone */}
                <TextField required label={format(messages.phoneNumber)} name="phone" />

                {/* Birthday */}
                <DatePickerField name="birthday" label="Ngày sinh" format="DD/MM/YYYY" showTime={false} />

                {/* Avatar: chọn chế độ upload hoặc nhập URL */}
                <Form.Item label={format(messages.avatar)}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Radio.Group
                            value={avatarMode}
                            onChange={(e) => {
                                setAvatarMode(e.target.value);
                                // Reset avatar field khi đổi chế độ
                                form.setFieldsValue({ avatar: null });
                                setAvatarUrl(null);
                                setIsChangedFormValues(true);
                            }}
                        >
                            <Radio value={AVATAR_MODE_UPLOAD}>Upload ảnh</Radio>
                            <Radio value={AVATAR_MODE_URL}>Nhập đường dẫn URL</Radio>
                        </Radio.Group>

                        {avatarMode === AVATAR_MODE_UPLOAD ? (
                            <CropImageField
                                label={null}
                                name="avatar"
                                imageUrl={resolvedAvatarUrl}
                                aspect={1}
                                uploadFile={uploadFile}
                            />
                        ) : (
                            <TextField
                                label={null}
                                name="avatar"
                                placeholder="Nhập đường dẫn hình ảnh (URL)..."
                            />
                        )}
                    </Space>
                </Form.Item>

                <div className="footer-card-form">{actions}</div>
            </Form>
        </Card>
    );
};

export default ProfileForm;
