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
        authorName:
            dataDetail?.educator?.account?.fullName || dataDetail?.educator?.profileAccountDto?.fullName || 'Tác giả',
    };

    return (
        <BaseForm id={formId} onFinish={handleSubmit} form={form} onValuesChange={handleValuesChange}>
            <Card className="card-form" bordered={false}>
                {/* ── SECTION 1: Thông tin bài viết ── */}
                <div style={{ marginBottom: 4 }}>
                    <Typography.Text
                        strong
                        style={{ fontSize: 15, color: '#1e293b', display: 'block', marginBottom: 16 }}
                    >
                        📋 Thông tin bài viết
                    </Typography.Text>
                </div>

                <Row gutter={16}>
                    <Col span={16}>
                        <TextField label="Tiêu đề" name="name" required placeholder="Nhập tiêu đề bài viết..." />
                    </Col>
                    <Col span={8}>
                        <SelectField
                            label="Danh mục"
                            name="categoryId"
                            required
                            options={categories}
                            placeholder="Chọn danh mục"
                        />
                    </Col>
                </Row>

                {/* ── Ảnh bìa ── */}
                <div
                    style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: 10,
                        padding: '16px 20px',
                        background: '#f8fafc',
                        marginBottom: 16,
                    }}
                >
                    <Typography.Text
                        strong
                        style={{ fontSize: 13, display: 'block', marginBottom: 12, color: '#475569' }}
                    >
                        🖼 Ảnh bìa bài viết
                    </Typography.Text>

                    <Row gutter={24} align="top">
                        <Col span={12}>
                            <CropImageField
                                label={null}
                                name="image"
                                imageUrl={imageUrl ? getDisplayImageUrl(imageUrl) : null}
                                uploadFile={uploadFile}
                                aspect={16 / 9}
                                required={!imageUrlInput.trim()}
                            />
                        </Col>
                        <Col span={12}>
                            <Typography.Text
                                type="secondary"
                                style={{ fontSize: 12, display: 'block', marginBottom: 6 }}
                            >
                                Hoặc dán đường link ảnh bìa từ URL ngoài:
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
                                        marginTop: 10,
                                        borderRadius: 8,
                                        overflow: 'hidden',
                                        border: '1px solid #e2e8f0',
                                        aspectRatio: '16/9',
                                        background: '#f1f5f9',
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
                            {!imageUrlInput && (
                                <Typography.Text
                                    type="secondary"
                                    style={{ fontSize: 11, display: 'block', marginTop: 8, fontStyle: 'italic' }}
                                >
                                    Để trống nếu đã upload ảnh từ máy tính.
                                </Typography.Text>
                            )}
                        </Col>
                    </Row>
                </div>

                {/* ── SECTION 2: Nội dung bài viết ── */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 16,
                        paddingTop: 8,
                        borderTop: '2px solid #e2e8f0',
                    }}
                >
                    <Typography.Text strong style={{ fontSize: 15, color: '#1e293b', whiteSpace: 'nowrap' }}>
                        ✍️ Nội dung bài viết
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        Sử dụng toolbar để định dạng, gõ{' '}
                        <Typography.Text code style={{ fontSize: 11 }}>
                            /
                        </Typography.Text>{' '}
                        để chèn block đặc biệt.
                    </Typography.Text>
                </div>

                <Row gutter={16}>
                    <Col span={24}>
                        {/* Hidden field for form validation */}
                        <div style={{ display: 'none' }}>
                            <TextField name="content" />
                        </div>

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

                <div className="footer-card-form" style={{ marginTop: '24px' }}>
                    {actions}
                </div>
            </Card>
        </BaseForm>
    );
};

export default BlogForm;
