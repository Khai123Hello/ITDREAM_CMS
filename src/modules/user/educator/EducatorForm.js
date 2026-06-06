import React, { useEffect, useState } from 'react';
import { Card, Col, Row } from 'antd';

import { BaseForm } from '@components/common/form/BaseForm';
import CropImageField from '@components/common/form/CropImageField';
import SelectField from '@components/common/form/SelectField';
import TextField from '@components/common/form/TextField';
import AutoCompleteField from '@components/common/form/AutoCompleteField';

import useBasicForm from '@hooks/useBasicForm';
import useFetch from '@hooks/useFetch';
import useTranslate from '@hooks/useTranslate';

import {
    confirmPasswordValidator,
    emailValidator,
    oldPasswordValidator,
    passwordValidator,
    passwordValidatorWithOldPassword,
    phoneValidator,
} from '@utils/formValidator';

import { AppConstants, GROUP_KIND_EDUCATOR } from '@constants';
import apiConfig from '@constants/apiConfig';
import { educatorStatusOptions, genderOptions } from '@constants/masterData';
import { commonMessage } from '@locales/intl';
import { showErrorMessage } from '@services/notifyService';

const EducatorForm = (props) => {
    const translate = useTranslate();
    const genderValues = translate.formatKeys(genderOptions, ['label']);
    const statusValues = translate.formatKeys(educatorStatusOptions, ['label']);
    const [group, setGroup] = useState(null);

    const {
        formId,
        actions,
        dataDetail,
        onSubmit,
        setIsChangedFormValues,
        groups,
        branchs,
        isEditing,
    } = props;

    const { execute: executeGetGroupId } = useFetch(apiConfig.groupPermission.getList, {
        immediate: false,
    });

    const { execute: executeUpFile } = useFetch(apiConfig.file.upload);
    const [imageUrl, setImageUrl] = useState(null);

    const { form, mixinFuncs, onValuesChange } = useBasicForm({
        onSubmit,
        setIsChangedFormValues,
    });

    const uploadFile = (file, onSuccess, onError) => {
        executeUpFile({
            data: { type: 'AVATAR', file },
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

    useEffect(() => {
        executeGetGroupId({
            params: { kind: GROUP_KIND_EDUCATOR },
            onCompleted: (response) => setGroup(response?.data?.content),
        });
    }, []);

    const { data: educators } = useFetch(apiConfig.educator.getList, {
        immediate: true,
        mappingData: (res) => res.data?.content || [],
    });

    const handleSubmit = (values) => {
        if (values.oldPassword && values.password && !values.confirmPassword) {
            return form.setFields([
                {
                    name: 'confirmPassword',
                    errors: [translate.formatMessage(commonMessage.required)],
                },
            ]);
        }

        let hasError = false;

        if (!isEditing) {
            const existingUsername = educators.find((item) => item.account.username === values.username);
            if (existingUsername) {
                form.setFields([{ name: 'username', errors: [translate.formatMessage(commonMessage.usernameExisted)] }]);
                hasError = true;
            }
        }

        const emailConflict = educators.find(
            (item) => item.account.email === values.email && item.id !== dataDetail?.id,
        );
        if (emailConflict) {
            form.setFields([{ name: 'email', errors: [translate.formatMessage(commonMessage.emailExisted)] }]);
            hasError = true;
        }

        const phoneConflict = educators.find(
            (item) => item.account.phone === values.phone && item.id !== dataDetail?.id,
        );
        if (phoneConflict) {
            form.setFields([{ name: 'phone', errors: [translate.formatMessage(commonMessage.phoneExisted)] }]);
            hasError = true;
        }

        if (hasError) {
            showErrorMessage('Thông tin đã tồn tại!', translate);
            return;
        }

        return mixinFuncs.handleSubmit({ ...values, avatarPath: imageUrl });
    };

    useEffect(() => {
        form.setFieldsValue({
            email: dataDetail?.account?.email,
            fullName: dataDetail?.account?.fullName,
            gender: dataDetail?.gender,
            phone: dataDetail?.account?.phone,
            username: dataDetail?.account?.username,
            groupId: dataDetail?.account?.group?.id,
            status: dataDetail?.account?.status,
            departmentId: dataDetail?.department?.id,
        });
        setImageUrl(dataDetail?.account?.avatar);
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
                            rules={[{ validator: (_, value) => emailValidator(_, value, translate) }]}
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
                        <SelectField
                            label={translate.formatMessage(commonMessage.gender)}
                            required
                            name="gender"
                            requiredMsg={translate.formatMessage(commonMessage.required)}
                            allowClear={false}
                            options={genderValues}
                        />
                    </Col>
                    <Col span={12}>
                        <TextField
                            label={translate.formatMessage(commonMessage.phone)}
                            name="phone"
                            required
                            requiredMsg={translate.formatMessage(commonMessage.required)}
                            minLength="10"
                            maxLength="10"
                            rules={[{ validator: (_, value) => phoneValidator(_, value, translate) }]}
                        />
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <TextField
                            label={translate.formatMessage(commonMessage.username)}
                            name="username"
                            required
                            requiredMsg={translate.formatMessage(commonMessage.required)}
                            disabled={isEditing}
                        />
                    </Col>
                    <Col span={12}>
                        <TextField
                            label={translate.formatMessage(commonMessage.oldPassword)}
                            name="oldPassword"
                            required={!isEditing}
                            requiredMsg={translate.formatMessage(commonMessage.required)}
                            type="password"
                            rules={[{ validator: (_, value) => oldPasswordValidator(_, value, form, translate) }]}
                        />
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <TextField
                            label={translate.formatMessage(commonMessage.password)}
                            name="password"
                            type="password"
                            required={!isEditing}
                            requiredMsg={translate.formatMessage(commonMessage.required)}
                            rules={[{
                                validator: (_, value) =>
                                    isEditing
                                        ? passwordValidatorWithOldPassword(_, value, form, translate)
                                        : passwordValidator(form, translate),
                            }]}
                        />
                    </Col>
                    <Col span={12}>
                        <TextField
                            label={translate.formatMessage(commonMessage.confirmPassword)}
                            name="confirmPassword"
                            type="password"
                            required={!isEditing}
                            requiredMsg={translate.formatMessage(commonMessage.required)}
                            rules={[{ validator: () => confirmPasswordValidator(form, translate) }]}
                        />
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <SelectField
                            options={statusValues}
                            name="status"
                            required
                            requiredMsg={translate.formatMessage(commonMessage.required)}
                            label={translate.formatMessage(commonMessage.status)}
                            allowClear={false}
                        />
                    </Col>
                </Row>

                <div className="footer-card-form">{actions}</div>
            </Card>
        </BaseForm>
    );
};

export default EducatorForm;
