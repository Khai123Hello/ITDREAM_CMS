import React, { useEffect, useState } from 'react';
import { Card, Col, Row } from 'antd';

import { BaseForm } from '@components/common/form/BaseForm';
import CropImageField from '@components/common/form/CropImageField';
import TextField from '@components/common/form/TextField';

import useBasicForm from '@hooks/useBasicForm';
import useFetch from '@hooks/useFetch';
import useTranslate from '@hooks/useTranslate';

import {
    confirmPasswordValidator,
    emailValidator,
    passwordValidator,
    phoneValidator,
} from '@utils/formValidator';

import apiConfig from '@constants/apiConfig';
import { AppConstants } from '@constants';
import { commonMessage } from '@locales/intl';
import { showErrorMessage } from '@services/notifyService';
import dayjs from "dayjs";
import DatePickerField from "@components/common/form/DatePickerField";

const StudentForm = (props) => {
    const translate = useTranslate();
    const { formId, actions, dataDetail, onSubmit, setIsChangedFormValues, isEditing } = props;

    const { execute: executeUpFile } = useFetch(apiConfig.file.upload);
    const [imageUrl, setImageUrl] = useState(null);

    const { form, mixinFuncs, onValuesChange } = useBasicForm({
        onSubmit,
        setIsChangedFormValues,
    });

    const { data: students } = useFetch(apiConfig.student.getList, {
        immediate: true,
        mappingData: (res) => res.data?.content || [],
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

            const emailConflict = students.find(
                (item) => item.email === values.email && item.id !== dataDetail?.id,
            );
            if (emailConflict) {
                form.setFields([
                    {
                        name: 'email',
                        errors: [translate.formatMessage(commonMessage.emailExisted)],
                    },
                ]);
                hasError = true;
            }

            const phoneConflict = students.find(
                (item) => item.phone === values.phone && item.id !== dataDetail?.id,
            );
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

        return mixinFuncs.handleSubmit({ ...values, avatarPath: imageUrl, birthday: values.birthday?.format('DD/MM/YYYY HH:mm:ss') || null });
    };

    useEffect(() => {
        form.setFieldsValue({
            email: dataDetail?.email,
            fullName: dataDetail?.fullName,
            phone: dataDetail?.phone,
            username: dataDetail?.username,
            birthday: dataDetail?.birthday ? dayjs(dataDetail.birthday) : null, // 👈 Thêm dòng này
        });
        setImageUrl(dataDetail?.avatarPath);
    }, [dataDetail]);


    return (
        <BaseForm id={formId} onFinish={handleSubmit} form={form} onValuesChange={onValuesChange}>
            <Card className="card-form" bordered={false}>
                <Row gutter={16}>
                    <Col span={12}>
                        <CropImageField
                            label={translate.formatMessage(commonMessage.avatar)}
                            name="avatarPath"
                            imageUrl={imageUrl && `${AppConstants.contentRootUrl}${imageUrl}`}
                            aspect={1 / 1}
                            uploadFile={uploadFile}
                        />
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
                        />
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <TextField
                            label={translate.formatMessage(commonMessage.password)}
                            name="password"
                            type="password"
                            required
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
                            required
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
