import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Tabs } from 'antd';

import { BaseForm } from '@components/common/form/BaseForm';
import TextField from '@components/common/form/TextField';
import SelectField from '@components/common/form/SelectField';
import CropImageField from '@components/common/form/CropImageField';
import BlockEditor from '@components/common/editor/BlockEditor';
import TipTapJsonRenderer from '@components/common/editor/TipTapJsonRenderer';
import TableOfContents from '@components/common/editor/TableOfContents';

import useBasicForm from '@hooks/useBasicForm';
import useFetch from '@hooks/useFetch';
import useTranslate from '@hooks/useTranslate';

import apiConfig from '@constants/apiConfig';
import { AppConstants, UploadFileTypes } from '@constants';

const BlogForm = (props) => {
    const translate = useTranslate();

    const { formId, actions, dataDetail, onSubmit, setIsChangedFormValues, categories, isEditing } = props;

    const [imageUrl, setImageUrl] = useState(null);
    const [activeTab, setActiveTab] = useState('edit');
    const [previewData, setPreviewData] = useState(null);

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

    const handleTabChange = (key) => {
        if (key === 'preview') {
            const currentValues = form.getFieldsValue();
            const categoryObj = categories.find((c) => c.value === currentValues.categoryId);
            setPreviewData({
                name: currentValues.name || 'Tiêu đề bài viết',
                subject: currentValues.subject || 'Chủ đề bài viết',
                categoryName: categoryObj ? categoryObj.label : '',
                image: currentValues.image || imageUrl,
                content: currentValues.content || '',
            });
        }
        setActiveTab(key);
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

    const tabItems = [
        {
            key: 'edit',
            label: 'Soạn thảo',
            children: (
                <div style={{ padding: '16px 0' }}>
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
                            <div style={{ display: 'none' }}>
                                <TextField name="content" required />
                            </div>
                            <label style={{ fontWeight: 600, display: 'block', marginBottom: 8, marginTop: 12 }}>
                                Chi tiết nội dung Blog
                            </label>
                            <BlockEditor
                                key={dataDetail?.id || 'new'}
                                initialTitle={form.getFieldValue('name') || ''}
                                initialDescription={form.getFieldValue('subject') || ''}
                                initialContent={form.getFieldValue('content') || ''}
                                defaultTemplate="guide"
                                onChange={({ content: newContent }) => {
                                    form.setFieldsValue({ content: newContent });
                                    setIsChangedFormValues(true);
                                }}
                                onTitleChange={(newTitle) => {
                                    form.setFieldsValue({ name: newTitle });
                                    setIsChangedFormValues(true);
                                }}
                                onDescriptionChange={(newDesc) => {
                                    form.setFieldsValue({ subject: newDesc });
                                    setIsChangedFormValues(true);
                                }}
                            />
                        </Col>
                    </Row>
                </div>
            ),
        },
        {
            key: 'preview',
            label: 'Xem trước bài viết',
            children: previewData ? (
                <div
                    className="blog-preview-wrapper"
                    style={{
                        padding: '24px 0',
                        background: '#f8fafc',
                        borderRadius: '12px',
                        minHeight: '500px',
                    }}
                >
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '240px 1fr 300px',
                            gap: '32px',
                            maxWidth: '1200px',
                            margin: '0 auto',
                            padding: '0 24px',
                            alignItems: 'start',
                        }}
                    >
                        {/* Cột trái: Mục lục */}
                        <div style={{ position: 'sticky', top: '24px' }}>
                            <TableOfContents content={previewData.content} />
                        </div>

                        {/* Cột giữa: Nội dung chi tiết */}
                        <article
                            style={{
                                background: '#ffffff',
                                borderRadius: '16px',
                                padding: '32px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                                border: '1px solid #e2e8f0',
                            }}
                        >
                            <header style={{ marginBottom: '24px' }}>
                                {previewData.categoryName && (
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            background: '#e8f4f3',
                                            color: '#168E85',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            padding: '4px 12px',
                                            borderRadius: '6px',
                                            marginBottom: '12px',
                                        }}
                                    >
                                        {previewData.categoryName}
                                    </span>
                                )}
                                <h1
                                    style={{
                                        fontSize: '32px',
                                        fontWeight: 800,
                                        color: '#0d2b5e',
                                        margin: '0 0 12px',
                                        lineHeight: 1.3,
                                    }}
                                >
                                    {previewData.name}
                                </h1>
                                <p style={{ fontSize: '16px', color: '#5c6f84', margin: 0, lineHeight: 1.5 }}>
                                    {previewData.subject}
                                </p>
                            </header>

                            {previewData.image && (
                                <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '24px' }}>
                                    <img
                                        src={`${AppConstants.contentRootUrl}${previewData.image}`}
                                        alt="Preview Cover"
                                        style={{
                                            width: '100%',
                                            height: 'auto',
                                            display: 'block',
                                            aspectRatio: '16/9',
                                            objectFit: 'cover',
                                        }}
                                    />
                                </div>
                            )}

                            <section className="article-body-editor">
                                <TipTapJsonRenderer content={previewData.content} />
                            </section>
                        </article>

                        {/* Cột phải: Sidebar Tác giả */}
                        <aside style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div
                                style={{
                                    background: '#ffffff',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    border: '1px solid #e2e8f0',
                                }}
                            >
                                <h4 style={{ margin: '0 0 12px', fontSize: '14px', fontWeight: 700, color: '#5c6f84' }}>
                                    TÁC GIẢ BÀI VIẾT
                                </h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '50%',
                                            background: '#168E85',
                                            color: '#ffffff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold',
                                            fontSize: '18px',
                                        }}
                                    >
                                        {dataDetail?.educator?.profileAccountDto?.fullName?.charAt(0) || 'A'}
                                    </div>
                                    <div>
                                        <h5 style={{ margin: '0 0 4px', fontWeight: 'bold' }}>
                                            {dataDetail?.educator?.profileAccountDto?.fullName || 'Tác giả'}
                                        </h5>
                                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                                            Giảng viên chuyên môn
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    Không có nội dung để xem trước
                </div>
            ),
        },
    ];

    return (
        <BaseForm id={formId} onFinish={handleSubmit} form={form} onValuesChange={handleValuesChange}>
            <Card className="card-form" bordered={false}>
                <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} />
                <div className="footer-card-form" style={{ marginTop: '24px' }}>{actions}</div>
            </Card>
        </BaseForm>
    );
};

export default BlogForm;

