import React, { useEffect, useState } from 'react';
import { Card, Col, Row } from 'antd';

import { BaseForm } from '@components/common/form/BaseForm';
import TextField from '@components/common/form/TextField';
import SelectField from '@components/common/form/SelectField';
import CropImageField from '@components/common/form/CropImageField';
import RichTextField from '@components/common/form/RichTextField';

import useBasicForm from '@hooks/useBasicForm';
import useFetch from '@hooks/useFetch';
import useTranslate from '@hooks/useTranslate';

import apiConfig from '@constants/apiConfig';
import { AppConstants, UploadFileTypes } from '@constants';

const BlogForm = (props) => {
    const translate = useTranslate();

    const { formId, actions, dataDetail, onSubmit, setIsChangedFormValues, categories, isEditing } = props;

    const [imageUrl, setImageUrl] = useState(null);

    const { execute: executeUpFile } = useFetch(apiConfig.file.upload, { immediate: false });

    const uploadFile = (file, onSuccess, onError) => {
        executeUpFile({
            data: { file, type: UploadFileTypes.IMAGE },
            onCompleted: (response) => {
                if (response.result === true) {
                    onSuccess();
                    form.setFieldsValue({ image: response.data.filePath });
                    setImageUrl(response.data.filePath);
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
        if ('image' in changedValues) {
            setImageUrl(changedValues.image);
        }
    };

    const handleSubmit = (values) => {
        return mixinFuncs.handleSubmit({
            ...values,
            image: imageUrl,
        });
    };

    useEffect(() => {
        if (dataDetail && Object.keys(dataDetail).length > 0) {
            form.setFieldsValue({
                ...dataDetail,
                categoryId: dataDetail.category?.id || dataDetail.categoryId,
            });
            setImageUrl(dataDetail.image);
        }
    }, [dataDetail, form]);

    return (
        <BaseForm id={formId} onFinish={handleSubmit} form={form} onValuesChange={handleValuesChange}>
            <Card className="card-form" bordered={false}>
                <Row gutter={16}>
                    <Col span={12}>
                        <TextField
                            label="Tiêu đề"
                            name="name"
                            required
                            placeholder="Nhập tiêu đề bài viết"
                        />
                    </Col>
                    <Col span={12}>
                        <SelectField
                            label="Danh mục"
                            name="categoryId"
                            required
                            options={categories}
                            placeholder="Chọn danh mục"
                        />
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={24}>
                        <TextField
                            label="Chủ đề (Mô tả ngắn)"
                            name="subject"
                            required
                            placeholder="Nhập chủ đề hoặc mô tả ngắn"
                        />
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={24}>
                        <CropImageField
                            label="Ảnh bìa"
                            name="image"
                            imageUrl={imageUrl ? `${AppConstants.contentRootUrl}${imageUrl}` : null}
                            uploadFile={uploadFile}
                            aspect={16 / 9}
                            required
                        />
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={24}>
                        <RichTextField
                            label="Nội dung"
                            name="content"
                            required
                            style={{ height: '300px', marginBottom: '50px' }}
                        />
                    </Col>
                </Row>

                <div className="footer-card-form">{actions}</div>
            </Card>
        </BaseForm>
    );
};

export default BlogForm;
