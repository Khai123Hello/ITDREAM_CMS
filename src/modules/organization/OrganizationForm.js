import React, { useEffect, useState } from 'react';
import { Card, Col, Row } from 'antd';

import { BaseForm } from '@components/common/form/BaseForm';
import TextField from '@components/common/form/TextField';
import CropImageField from '@components/common/form/CropImageField';

import useBasicForm from '@hooks/useBasicForm';
import useFetch from '@hooks/useFetch';
import useTranslate from '@hooks/useTranslate';

import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';
import { AppConstants } from '@constants';

const OrganizationForm = (props) => {
    const translate = useTranslate();
    const { formId, actions, dataDetail, onSubmit, setIsChangedFormValues, isEditing } = props;

    const { execute: executeUpFile } = useFetch(apiConfig.file.upload);
    const [logoUrl, setLogoUrl] = useState(null);

    const { form, mixinFuncs, onValuesChange } = useBasicForm({
        onSubmit,
        setIsChangedFormValues,
    });

    const uploadFile = (file, onSuccess, onError) => {
        executeUpFile({
            data: {
                type: 'AVATAR', // Sử dụng AVATAR làm kiểu upload file ảnh chung
                file: file,
            },
            onCompleted: (response) => {
                if (response.result === true) {
                    onSuccess();
                    setLogoUrl(response.data.filePath);
                    setIsChangedFormValues(true);
                }
            },
            onError: (error) => {
                onError();
            },
        });
    };

    const handleSubmit = (values) => {
        return mixinFuncs.handleSubmit({
            ...values,
            logoUrl: logoUrl,
        });
    };

    useEffect(() => {
        form.setFieldsValue({
            name: dataDetail?.name || '',
            shortName: dataDetail?.shortName || '',
            description: dataDetail?.description || '',
        });
        setLogoUrl(dataDetail?.logoUrl || null);
    }, [dataDetail, form]);

    return (
        <BaseForm id={formId} onFinish={handleSubmit} form={form} onValuesChange={onValuesChange}>
            <Card className="card-form" bordered={false}>
                <Row gutter={16}>
                    <Col span={24}>
                        <CropImageField
                            label="Logo tổ chức"
                            name="logoUrl"
                            imageUrl={logoUrl && `${AppConstants.contentRootUrl}${logoUrl}`}
                            aspect={1 / 1}
                            uploadFile={uploadFile}
                        />
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <TextField
                            required
                            requiredMsg={translate.formatMessage(commonMessage.required)}
                            label={translate.formatMessage(commonMessage.name)}
                            name="name"
                            placeholder="Nhập tên tổ chức"
                        />
                    </Col>
                    <Col span={12}>
                        <TextField
                            required
                            requiredMsg={translate.formatMessage(commonMessage.required)}
                            label="Tên viết tắt"
                            name="shortName"
                            placeholder="Nhập tên viết tắt (viết liền, ví dụ: HUST, VNU)"
                        />
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={24}>
                        <TextField
                            label={translate.formatMessage(commonMessage.description)}
                            name="description"
                            type="textarea"
                            placeholder="Mô tả thông tin tổ chức"
                        />
                    </Col>
                </Row>
                <div className="footer-card-form">{actions}</div>
            </Card>
        </BaseForm>
    );
};

export default OrganizationForm;
