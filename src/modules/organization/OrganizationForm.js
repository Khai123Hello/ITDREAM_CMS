import React, { useEffect, useState } from 'react';
import { Card, Col, Row } from 'antd';

import { BaseForm } from '@components/common/form/BaseForm';
import TextField from '@components/common/form/TextField';
import SelectField from '@components/common/form/SelectField';
import CropImageField from '@components/common/form/CropImageField';

import useBasicForm from '@hooks/useBasicForm';
import useFetch from '@hooks/useFetch';
import useTranslate from '@hooks/useTranslate';

import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';
import { AppConstants, ORGANIZATION_TYPE_UNIVERSITY, ORGANIZATION_TYPE_OPTIONS } from '@constants';

const OrganizationForm = (props) => {
    const translate = useTranslate();
    const { formId, actions, dataDetail, onSubmit, setIsChangedFormValues, isEditing } = props;

    const { execute: executeUpFile } = useFetch(apiConfig.file.upload);
    const [logoUrl, setLogoUrl] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

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
                    // update preview from uploaded file
                    if (response.data.filePath.indexOf('http') === 0) setPreviewUrl(response.data.filePath);
                    else setPreviewUrl(`${AppConstants.contentRootUrl}${response.data.filePath}`);
                    // clear any pasted path when a file is uploaded
                    form.setFieldsValue({ logoPath: '' });
                    form.setFieldsValue({ logoUrl: response.data.filePath });
                    setIsChangedFormValues(true);
                }
            },
            onError: (error) => {
                onError();
            },
        });
    };

    const handleSubmit = (values) => {
        let raw = values?.logoPath || values?.logoUrl || logoUrl || null;
        let finalLogo = null;
        if (raw) {
            // If user pasted a full contentRootUrl, strip it to send relative path
            if (raw.indexOf(AppConstants.contentRootUrl) === 0) {
                finalLogo = raw.replace(AppConstants.contentRootUrl, '');
            } else {
                finalLogo = raw;
            }
        }

        return mixinFuncs.handleSubmit({
            hotline: values?.hotline || '',
            logoUrl: finalLogo,
            name: values?.name || '',
            shortName: values?.shortName || '',
            type: values?.type || ORGANIZATION_TYPE_UNIVERSITY,
        });
    };

    useEffect(() => {
        form.setFieldsValue({
            hotline: dataDetail?.hotline || '',
            name: dataDetail?.name || '',
            shortName: dataDetail?.shortName || '',
            type: dataDetail?.type ?? ORGANIZATION_TYPE_UNIVERSITY,
            logoUrl: dataDetail?.logoUrl || null,
            // If parent passes logoPath explicitly, show that text; otherwise show raw logoUrl (path)
            logoPath: dataDetail?.logoPath ?? (dataDetail?.logoUrl ? dataDetail.logoUrl : ''),
        });
        setLogoUrl(dataDetail?.logoUrl || null);
        // set preview based on passed-in data
        if (dataDetail?.logoPath) {
            if (dataDetail.logoPath.indexOf('http') === 0) setPreviewUrl(dataDetail.logoPath);
            else setPreviewUrl(`${AppConstants.contentRootUrl}${dataDetail.logoPath}`);
        } else if (dataDetail?.logoUrl) {
            if (dataDetail.logoUrl.indexOf('http') === 0) setPreviewUrl(dataDetail.logoUrl);
            else setPreviewUrl(`${AppConstants.contentRootUrl}${dataDetail.logoUrl}`);
        } else {
            setPreviewUrl(null);
        }
    }, [dataDetail, form]);

    const handleFormValuesChange = (changedValues, allValues) => {
        // If user sets logoPath, clear uploaded logoUrl
        if (Object.prototype.hasOwnProperty.call(changedValues, 'logoPath')) {
            const v = changedValues.logoPath;
            if (v) {
                setLogoUrl(null);
                form.setFieldsValue({ logoUrl: null });
                // update preview to reflect pasted path
                if (v.indexOf('http') === 0) setPreviewUrl(v);
                else setPreviewUrl(`${AppConstants.contentRootUrl}${v}`);
            }
        }
        // If uploaded logoUrl is set (from CropImageField), clear logoPath
        if (Object.prototype.hasOwnProperty.call(changedValues, 'logoUrl')) {
            const v = changedValues.logoUrl;
            if (v) {
                form.setFieldsValue({ logoPath: '' });
                // update preview from uploaded value
                if (v.indexOf('http') === 0) setPreviewUrl(v);
                else setPreviewUrl(`${AppConstants.contentRootUrl}${v}`);
            }
        }
        if (onValuesChange) onValuesChange(changedValues, allValues);
    };

    const formLogoPath = form?.getFieldValue ? form.getFieldValue('logoPath') : null;
    const displayedImageUrl = previewUrl;

    return (
        <BaseForm id={formId} onFinish={handleSubmit} form={form} onValuesChange={handleFormValuesChange}>
            <Card className="card-form" bordered={false}>
                <Row gutter={16}>
                    <Col span={24}>
                        <CropImageField
                            label="Logo tổ chức"
                            name="logoUrl"
                            imageUrl={displayedImageUrl}
                            aspect={1 / 1}
                            uploadFile={uploadFile}
                        />
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={24}>
                        <TextField
                            label="Đường dẫn logo (URL hoặc đường dẫn)"
                            name="logoPath"
                            placeholder="Nhập đường dẫn avatar, ví dụ: https://... hoặc /uploads/.."
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
                    <Col span={12}>
                        <TextField
                            label="Hotline"
                            name="hotline"
                            placeholder="Nhập hotline"
                        />
                    </Col>
                    <Col span={12}>
                        <SelectField
                            label="Loại tổ chức"
                            name="type"
                            placeholder="Chọn loại tổ chức"
                            options={ORGANIZATION_TYPE_OPTIONS.map((opt) => ({
                                label: translate.formatMessage(commonMessage[opt.labelKey]),
                                value: opt.value,
                            }))}
                        />
                    </Col>
                </Row>
                {/* Description field removed as requested */}
                <div className="footer-card-form">{actions}</div>
            </Card>
        </BaseForm>
    );
};

export default OrganizationForm;
