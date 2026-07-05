import React, { useEffect, useState } from 'react';
import { Card, Col, Input, Row, Typography } from 'antd';

import { BaseForm } from '@components/common/form/BaseForm';
import TextField from '@components/common/form/TextField';
import SelectField from '@components/common/form/SelectField';
import CropImageField from '@components/common/form/CropImageField';
import BlogDesigner from '@components/common/editor/BlogDesigner';

import useBasicForm from '@hooks/useBasicForm';
import useFetch from '@hooks/useFetch';

import apiConfig from '@constants/apiConfig';
import { AppConstants, UploadFileTypes } from '@constants';

// Kiểm tra xem chuỗi có phải là URL ngoài (http/https) hay không
function isExternalUrl(url) {
    if (!url) return false;
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:');
}

// Lấy URL hiển thị ảnh đúng cả 2 loại: upload path & external link
function getDisplayImageUrl(imageValue) {
    if (!imageValue) return null;
    if (isExternalUrl(imageValue)) return imageValue;
    return `${AppConstants.contentRootUrl}${imageValue}`;
}

const BlogForm = (props) => {
    const { formId, actions, dataDetail, onSubmit, setIsChangedFormValues, categories } = props;

    const [imageUrl, setImageUrl] = useState(null);
    const [imageUrlInput, setImageUrlInput] = useState('');

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
        // Ưu tiên URL ngoài nếu được nhập, sau đó dùng imageUrl từ upload
        const finalImage = imageUrlInput.trim() ? imageUrlInput.trim() : imageUrl;
        return mixinFuncs.handleSubmit({
            ...values,
            subject: null,
            image: finalImage,
        });
    };

    // Khi nhập URL ngoài: cập nhật state và sync vào form field
    const handleImageUrlInputChange = (e) => {
        const val = e.target.value.trim();
        setImageUrlInput(val);
        if (val) {
            setImageUrl(val);
            form.setFieldsValue({ image: val });
            setIsChangedFormValues(true);
        }
    };

    useEffect(() => {
        if (dataDetail && Object.keys(dataDetail).length > 0) {
            form.setFieldsValue({
                ...dataDetail,
                categoryId: dataDetail.category?.id || dataDetail.categoryId,
            });
            const img = dataDetail.image || '';
            setImageUrl(img);
            if (isExternalUrl(img)) {
                setImageUrlInput(img);
            }
        }
    }, [dataDetail, form]);

    // Blog meta for preview modal
    const blogMeta = {
        name: form.getFieldValue('name') || 'Tiêu đề bài viết',
        subject: form.getFieldValue('subject') || '',
        image: imageUrl,
        category: categories?.find((c) => c.value === form.getFieldValue('categoryId'))?.label || '',
        authorName: dataDetail?.educator?.account?.fullName || dataDetail?.educator?.profileAccountDto?.fullName || 'Tác giả',
    };

    return (
        <BaseForm id={formId} onFinish={handleSubmit} form={form} onValuesChange={handleValuesChange}>
            <Card className="card-form" bordered={false}>
                {/* ── Meta fields ── */}
                <Row gutter={16}>
                    <Col span={12}>
                        <TextField label="Tiêu đề" name="name" required placeholder="Nhập tiêu đề bài viết" />
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
                        <CropImageField
                            label="Ảnh bìa"
                            name="image"
                            imageUrl={imageUrl ? getDisplayImageUrl(imageUrl) : null}
                            uploadFile={uploadFile}
                            aspect={16 / 9}
                            required={!imageUrlInput.trim()}
                        />
                        {/* Nhập URL ảnh ngoài */}
                        <div style={{ marginTop: 8 }}>
                            <Typography.Text
                                type="secondary"
                                style={{ fontSize: 12, display: 'block', marginBottom: 4 }}
                            >
                                Hoặc dán đường link ảnh bìa (URL ngoài)
                            </Typography.Text>
                            <Input
                                value={imageUrlInput}
                                onChange={handleImageUrlInputChange}
                                placeholder="https://example.com/image.jpg"
                                allowClear
                                onClear={() => {
                                    setImageUrlInput('');
                                    if (!isExternalUrl(imageUrl)) return;
                                    setImageUrl(null);
                                    form.setFieldsValue({ image: null });
                                }}
                                style={{ borderRadius: 6 }}
                            />
                            {imageUrlInput && (
                                <div
                                    style={{
                                        marginTop: 8,
                                        borderRadius: 8,
                                        overflow: 'hidden',
                                        border: '1px solid #e2e8f0',
                                        aspectRatio: '16/9',
                                        background: '#f8fafc',
                                    }}
                                >
                                    <img
                                        src={imageUrlInput}
                                        alt="preview"
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </Col>
                </Row>

                {/* ── BlogDesigner ── */}
                <Row gutter={16}>
                    <Col span={24}>
                        {/* Hidden field for form validation */}
                        <div style={{ display: 'none' }}>
                            <TextField name="content" />
                        </div>

                        <label style={{ fontWeight: 600, display: 'block', marginBottom: 12, marginTop: 16, fontSize: 14 }}>
                            Nội dung bài viết
                        </label>

                        <BlogDesigner
                            key={dataDetail?.id || 'new'}
                            initialContent={form.getFieldValue('content') || ''}
                            blogMeta={blogMeta}
                            onChange={({ content: newContent }) => {
                                form.setFieldsValue({ content: newContent });
                                setIsChangedFormValues(true);
                            }}
                        />
                    </Col>
                </Row>

                <div className="footer-card-form" style={{ marginTop: '24px' }}>{actions}</div>
            </Card>
        </BaseForm>
    );
};

export default BlogForm;
