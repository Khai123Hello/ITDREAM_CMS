import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Modal } from 'antd';

import { BaseForm } from '@components/common/form/BaseForm';
import CropImageField from '@components/common/form/CropImageField';
import TextField from '@components/common/form/TextField';
import SelectField from '@components/common/form/SelectField';

import useBasicForm from '@hooks/useBasicForm';
import useFetch from '@hooks/useFetch';
import useTranslate from '@hooks/useTranslate';

import { confirmPasswordValidator, emailValidator, passwordValidator, phoneValidator } from '@utils/formValidator';

import apiConfig from '@constants/apiConfig';
import { AppConstants } from '@constants';
import { commonMessage } from '@locales/intl';
import { showErrorMessage } from '@services/notifyService';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import DatePickerField from '@components/common/form/DatePickerField';

dayjs.extend(customParseFormat);

const mapStudents = (res) => res.data?.content || [];

const StudentForm = (props) => {
    const translate = useTranslate();
    const { formId, actions, dataDetail, onSubmit, setIsChangedFormValues, isEditing } = props;

    const { execute: executeUpFile } = useFetch(apiConfig.file.upload);
    const [imageUrl, setImageUrl] = useState(null);
    const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);

    const { form, mixinFuncs, onValuesChange } = useBasicForm({
        onSubmit,
        setIsChangedFormValues,
    });

    const { data: students } = useFetch(apiConfig.student.getList, {
        immediate: true,
        mappingData: mapStudents,
    });

    const uploadFile = (file, onSuccess, onError) => {
        executeUpFile({
            data: {
                type: 'AVATAR',
                file: file,
            },
            onCompleted: (response) => {
                if (response.result === true) {
                    onSuccess();
                    setImageUrl(response.data.filePath);
                    form.setFieldValue('avatarPath', response.data.filePath);
                    setIsChangedFormValues(true);
                }
            },
            onError,
        });
    };

    const handleSubmit = (values) => {
        let hasError = false;

        if (!isEditing) {
            const userByUsername = students.find((item) => item.username === values.username);
            if (userByUsername) {
                form.setFields([
                    {
                        name: 'username',
                        errors: [translate.formatMessage(commonMessage.usernameExisted)],
                    },
                ]);
                hasError = true;
            }

            const emailConflict = students.find((item) => item.email === values.email && item.id !== dataDetail?.id);
            if (emailConflict) {
                form.setFields([
                    {
                        name: 'email',
                        errors: [translate.formatMessage(commonMessage.emailExisted)],
                    },
                ]);
                hasError = true;
            }

            const phoneConflict = students.find((item) => item.phone === values.phone && item.id !== dataDetail?.id);
            if (phoneConflict) {
                form.setFields([
                    {
                        name: 'phone',
                        errors: [translate.formatMessage(commonMessage.phoneExisted)],
                    },
                ]);
                hasError = true;
            }
        }

        if (hasError) {
            showErrorMessage('Thông tin đã tồn tại!', translate);
            return;
        }

        return mixinFuncs.handleSubmit({
            ...values,
            avatarPath: imageUrl,
            birthday: values.birthday?.format('DD/MM/YYYY HH:mm:ss') || null,
        });
    };

    useEffect(() => {
        form.setFieldsValue({
            email: dataDetail?.email,
            fullName: dataDetail?.fullName,
            phone: dataDetail?.phone,
            username: dataDetail?.username,
            birthday: dataDetail?.birthday ? dayjs(dataDetail.birthday, 'DD/MM/YYYY HH:mm:ss') : null,
            status: dataDetail?.status,
            avatarPath: dataDetail?.avatarPath,
        });
        setImageUrl(dataDetail?.avatarPath);
    }, [dataDetail]);

    return (
        <BaseForm id={formId} onFinish={handleSubmit} form={form} onValuesChange={onValuesChange}>
            <Card className="card-form" bordered={false}>
                <Row gutter={16}>
                    <Col span={24}>
                        <div style={{ marginBottom: 16 }}>
                            <div className="ant-col ant-form-item-label">
                                <label>{translate.formatMessage(commonMessage.avatar)}</label>
                            </div>
                            <div
                                style={{
                                    width: 104,
                                    height: 104,
                                    border: '1px dashed #d9d9d9',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: '#fafafa',
                                }}
                                onClick={() => setIsAvatarModalVisible(true)}
                            >
                                {imageUrl ? (
                                    <img
                                        src={
                                            imageUrl.startsWith('http')
                                                ? imageUrl
                                                : `${AppConstants.contentRootUrl}${imageUrl}`
                                        }
                                        alt="avatar"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <span style={{ color: '#999' }}>Tải lên</span>
                                )}
                            </div>
                        </div>

                        <Modal
                            title="Cập nhật ảnh đại diện"
                            open={isAvatarModalVisible}
                            onCancel={() => setIsAvatarModalVisible(false)}
                            footer={null}
                        >
                            <Row gutter={16}>
                                <Col span={24}>
                                    <CropImageField
                                        label="Tải ảnh lên"
                                        name="avatarUpload"
                                        imageUrl={
                                            imageUrl &&
                                            (imageUrl.startsWith('http')
                                                ? imageUrl
                                                : `${AppConstants.contentRootUrl}${imageUrl}`)
                                        }
                                        aspect={1 / 1}
                                        uploadFile={uploadFile}
                                    />
                                </Col>
                                <Col span={24}>
                                    <TextField
                                        label="Hoặc nhập đường dẫn ảnh (URL)"
                                        name="avatarPath"
                                        onChange={(e) => setImageUrl(e.target.value)}
                                    />
                                </Col>
                            </Row>
                        </Modal>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <TextField
                            label={translate.formatMessage(commonMessage.email)}
                            required
                            name="email"
                            requiredMsg={translate.formatMessage(commonMessage.required)}
                            rules={[
                                {
                                    validator: (_, value) => emailValidator(_, value, translate),
                                },
                            ]}
                            placeholder="example@gmail.com"
                        />
                    </Col>
                    <Col span={12}>
                        <TextField
                            label={translate.formatMessage(commonMessage.fullName)}
                            required
                            name="fullName"
                            requiredMsg={translate.formatMessage(commonMessage.required)}
                        />
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <TextField
                            label={translate.formatMessage(commonMessage.phone)}
                            name="phone"
                            required
                            requiredMsg={translate.formatMessage(commonMessage.required)}
                            minLength="10"
                            maxLength="10"
                            rules={[
                                {
                                    validator: (_, value) => phoneValidator(_, value, translate),
                                },
                            ]}
                        />
                    </Col>
                    <Col span={12}>
                        <TextField
                            label={translate.formatMessage(commonMessage.username)}
                            required
                            requiredMsg={translate.formatMessage(commonMessage.required)}
                            name="username"
                            disabled={isEditing}
                        />
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <DatePickerField
                            label={translate.formatMessage(commonMessage.birthday)}
                            name="birthday"
                            required
                            requiredMsg={translate.formatMessage(commonMessage.required)}
                            placeholder="DD/MM/YYYY"
                            format="DD/MM/YYYY"
                            style={{ width: '100%' }}
                        />
                    </Col>
                    <Col span={12}>
                        <SelectField
                            label={translate.formatMessage(commonMessage.status)}
                            name="status"
                            options={[
                                { value: 1, label: 'Hoạt động' },
                                { value: 0, label: 'Quên mật khẩu' },
                                { value: 3, label: 'Xác thực OTP' },
                                { value: -1, label: 'Khóa' },
                            ]}
                        />
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <TextField
                            label={translate.formatMessage(commonMessage.newPassword)}
                            name="password"
                            type="password"
                            required={!isEditing}
                            requiredMsg={translate.formatMessage(commonMessage.required)}
                            rules={[
                                {
                                    validator: () => passwordValidator(form, translate),
                                },
                            ]}
                        />
                    </Col>
                    <Col span={12}>
                        <TextField
                            label={translate.formatMessage(commonMessage.confirmPassword)}
                            name="confirmPassword"
                            type="password"
                            required={!isEditing}
                            requiredMsg={translate.formatMessage(commonMessage.required)}
                            rules={[
                                {
                                    validator: () => confirmPasswordValidator(form, translate),
                                },
                            ]}
                        />
                    </Col>
                </Row>

                <div className="footer-card-form">{actions}</div>
            </Card>
        </BaseForm>
    );
};

export default StudentForm;
