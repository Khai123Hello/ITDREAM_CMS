import React, { useEffect, useState, useMemo } from 'react';
import { Card, Col, Row, Button, Space, Modal, Divider, Input } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { BaseForm } from '@components/common/form/BaseForm';
import CropImageField from '@components/common/form/CropImageField';
import SelectField from '@components/common/form/SelectField';
import TextField from '@components/common/form/TextField';
import useBasicForm from '@hooks/useBasicForm';
import useFetch from '@hooks/useFetch';
import useTranslate from '@hooks/useTranslate';
import { AppConstants } from '@constants';
import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';
import { UserTypes } from '@constants';
import { getData } from '@utils/localStorage';
import { storageKeys } from '@constants';
import SimulationPreview from '@components/simulation/SimulationPreview.js';

const SimulationForm = (props) => {
    const {
        formId,
        actions,
        dataDetail,
        onSubmit,
        setIsChangedFormValues,
        specializations,
        levels,
        isEditing,
    } = props;

    const userType = getData(storageKeys.USER_TYPE);
    const canEdit = userType === UserTypes.EDUCATOR;

    const translate = useTranslate();
    const [imagePath, setImagePath] = useState(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [previewVisible, setPreviewVisible] = useState(false);

    // Description fields
    const [descriptionTitle, setDescriptionTitle] = useState('');
    const [descriptionContent, setDescriptionContent] = useState('');

    // Overview fields
    const [overviewTitle, setOverviewTitle] = useState('');
    const [overviewContent, setOverviewContent] = useState('');

    const { execute: executeUpFile } = useFetch(apiConfig.file.upload, { immediate: false });
    const { form, mixinFuncs, onValuesChange } = useBasicForm({ onSubmit, setIsChangedFormValues });

    const quillModules = useMemo(() => ({
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            ['link'],
            ['clean'],
        ],
    }), []);

    const quillFormats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'list', 'bullet',
        'color', 'background',
        'link',
    ];

    const uploadFile = (file, onSuccess, onError, type) => {
        executeUpFile({
            data: { file, type },
            onCompleted: (response) => {
                if (response.result === true) {
                    onSuccess();
                    if (type === 'IMAGE') {
                        setImagePath(response.data.filePath);
                        form.setFieldsValue({ imagePath: response.data.filePath });
                    } 
                    setIsChangedFormValues(true);
                }
            },
            onError,
        });
    };

    const isJsonString = (str) => {
        if (!str || typeof str !== 'string') return false;
        const trimmed = str.trim();
        if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return false;
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    };

    const parseJsonData = (jsonData) => {
        if (!jsonData) return { title: '', content: '' };
        
        if (!isJsonString(jsonData)) {
            if (typeof jsonData === 'string' && jsonData.includes('<')) {
                const h2Match = jsonData.match(/<h2>(.*?)<\/h2>/);
                const title = h2Match ? h2Match[1] : '';
                const content = jsonData.replace(/<h2>.*?<\/h2>/, '').trim();
                return { title, content };
            }
            return { title: '', content: jsonData };
        }

        try {
            const parsed = JSON.parse(jsonData);
            
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return {
                    title: parsed.title || '',
                    content: parsed.content || '',
                };
            }
            
            if (Array.isArray(parsed) && parsed.length > 0) {
                if (parsed.length === 1) {
                    return {
                        title: parsed[0].title || '',
                        content: parsed[0].content || '',
                    };
                } else {
                    let html = '';
                    parsed.forEach((section, index) => {
                        if (section.title && index > 0) {
                            html += `<h3>${section.title}</h3>`;
                        }
                        if (section.content) {
                            if (section.content.includes('<')) {
                                html += section.content;
                            } else {
                                html += `<p>${section.content.replace(/\n/g, '<br>')}</p>`;
                            }
                        }
                    });
                    return {
                        title: parsed[0].title || '',
                        content: html,
                    };
                }
            }
            
            return { title: '', content: '' };
        } catch (e) {
            console.error('Error parsing JSON:', e);
            return { title: '', content: jsonData };
        }
    };

    const convertContentToHtml = (content) => {
        if (!content) return '';
        
        if (content.includes('<')) {
            return content;
        }
        
        const lines = content.split('\n').filter(line => line.trim());
        let html = '';
        let inList = false;
        
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
                if (!inList) {
                    html += '<ul>';
                    inList = true;
                }
                const text = trimmed.replace(/^[•\-*]\s*/, '');
                html += `<li>${text}</li>`;
            } else if (trimmed) {
                if (inList) {
                    html += '</ul>';
                    inList = false;
                }
                html += `<p>${trimmed}</p>`;
            }
        });
        
        if (inList) {
            html += '</ul>';
        }
        
        return html || '<p><br></p>';
    };

    const cleanQuillHtml = (html) => {
        if (!html || html === '<p><br></p>') return '';
        let cleaned = html.trim();
        cleaned = cleaned.replace(/(<p><br><\/p>|<p><\/p>)+$/g, '');
        return cleaned;
    };

    useEffect(() => {
        if (dataDetail && Object.keys(dataDetail).length > 0) {
            form.setFieldsValue({
                ...dataDetail,
                specializationId: dataDetail.specialization?.id,
            });
            setImagePath(dataDetail.imagePath);
            setVideoUrl(dataDetail.videoPath || '');

            if (dataDetail.description) {
                const descData = parseJsonData(dataDetail.description);
                setDescriptionTitle(descData.title);
                setDescriptionContent(convertContentToHtml(descData.content));
            }

            if (dataDetail.overview) {
                const overviewData = parseJsonData(dataDetail.overview);
                setOverviewTitle(overviewData.title);
                setOverviewContent(convertContentToHtml(overviewData.content));
            }
        }
    }, [dataDetail]);

    const handleSubmit = (values) => {
        const cleanedDescriptionContent = cleanQuillHtml(descriptionContent);
        const cleanedOverviewContent = cleanQuillHtml(overviewContent);

        const descriptionJson = JSON.stringify({
            title: descriptionTitle || '',
            content: cleanedDescriptionContent || '',
        });

        const overviewJson = JSON.stringify([{
            title: overviewTitle || '',
            content: cleanedOverviewContent || '',
        }]);

        mixinFuncs.handleSubmit({
            ...values,
            imagePath: imagePath || null,
            videoPath: videoUrl || null,
            description: descriptionJson,
            overview: overviewJson,
        });
    };

    const getPreviewData = () => {
        const formValues = form.getFieldsValue();
        return {
            ...formValues,
            imagePath,
            videoPath: videoUrl,
            descriptionTitle,
            descriptionContent,
            overviewTitle,
            overviewContent,
            specialization: specializations?.find(s => s.value === formValues.specializationId),
            level: levels?.find(l => l.value === formValues.level),
        };
    };

    return (
        <>
            <BaseForm id={formId} onFinish={handleSubmit} form={form} onValuesChange={onValuesChange}>
                <Card className="card-form" bordered={false}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <TextField
                                label={translate.formatMessage(commonMessage.title)}
                                name="title"
                                required
                                disabled={!canEdit}
                            />
                        </Col>
                        <Col span={12}>
                            <SelectField
                                label={translate.formatMessage(commonMessage.specialization)}
                                name="specializationId"
                                options={specializations}
                                valuePropName="id"
                                labelPropName="name"
                                required
                                disabled={!canEdit}
                            />
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <SelectField
                                label={translate.formatMessage(commonMessage.level)}
                                name="level"
                                options={levels}
                                required
                                disabled={!canEdit}
                            />
                        </Col>
                        <Col span={12}>
                            <TextField
                                label={translate.formatMessage(commonMessage.totalEstimatedTime)}
                                name="totalEstimatedTime"
                                placeholder="VD: 1 - 2 giờ"
                                required
                                disabled={!canEdit}
                            />
                        </Col>
                    </Row>

                    <Divider orientation="left">Mô tả khóa học</Divider>

                    <Row gutter={16}>
                        <Col span={24}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                                    Tiêu đề mô tả <span style={{ color: 'red' }}>*</span>
                                </label>
                                <Input
                                    value={descriptionTitle}
                                    onChange={(e) => {
                                        setDescriptionTitle(e.target.value);
                                        setIsChangedFormValues(true);
                                    }}
                                    placeholder="VD: Tại sao phải hoàn thành Mô phỏng công việc này"
                                    size="large"
                                    disabled={!canEdit}
                                />
                            </div>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={24}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                                    Nội dung mô tả <span style={{ color: 'red' }}>*</span>
                                </label>
                                <ReactQuill
                                    theme="snow"
                                    value={descriptionContent}
                                    onChange={(value) => {
                                        setDescriptionContent(value);
                                        setIsChangedFormValues(true);
                                    }}
                                    modules={quillModules}
                                    formats={quillFormats}
                                    placeholder="Nhập nội dung mô tả chi tiết về khóa học..."
                                    readOnly={!canEdit}
                                    style={{ 
                                        background: 'white',
                                        borderRadius: '4px',
                                        minHeight: '200px',
                                    }}
                                />
                                <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
                                    💡 Tip: Sử dụng thanh công cụ để định dạng text, tạo heading, bullet list, và nhiều hơn nữa.
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <Divider orientation="left">Tổng quan khóa học</Divider>

                    <Row gutter={16}>
                        <Col span={24}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                                    Tiêu đề tổng quan <span style={{ color: 'red' }}>*</span>
                                </label>
                                <Input
                                    value={overviewTitle}
                                    onChange={(e) => {
                                        setOverviewTitle(e.target.value);
                                        setIsChangedFormValues(true);
                                    }}
                                    placeholder="VD: Nó hoạt động như thế nào"
                                    size="large"
                                    disabled={!canEdit}
                                />
                            </div>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={24}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                                    Nội dung tổng quan <span style={{ color: 'red' }}>*</span>
                                </label>
                                <ReactQuill
                                    theme="snow"
                                    value={overviewContent}
                                    onChange={(value) => {
                                        setOverviewContent(value);
                                        setIsChangedFormValues(true);
                                    }}
                                    modules={quillModules}
                                    formats={quillFormats}
                                    placeholder="Nhập nội dung tổng quan về khóa học..."
                                    readOnly={!canEdit}
                                    style={{ 
                                        background: 'white',
                                        borderRadius: '4px',
                                        minHeight: '200px',
                                    }}
                                />
                                <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
                                    💡 Tip: Sử dụng thanh công cụ để định dạng text, tạo bullet list, numbered list, và nhiều hơn nữa.
                                </div>
                            </div>
                        </Col>
                    </Row>

                    <Divider orientation="left">Media</Divider>

                    <Row gutter={16}>
                        <Col span={12}>
                            <CropImageField
                                label={translate.formatMessage(commonMessage.image)}
                                name="imagePath"
                                imageUrl={imagePath && `${AppConstants.contentRootUrl}${imagePath}`}
                                aspect={16 / 9}
                                uploadFile={(file, onSuccess, onError) =>
                                    uploadFile(file, onSuccess, onError, 'IMAGE')
                                }
                                disabled={!canEdit}
                            />
                        </Col>
                        <Col span={12}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ fontWeight: 600, marginBottom: 8, display: 'block' }}>
                                    Video URL 
                                </label>
                                <Input
                                    value={videoUrl}
                                    onChange={(e) => {
                                        setVideoUrl(e.target.value);
                                        setIsChangedFormValues(true);
                                    }}
                                    placeholder="Nhập URL hoặc mã embed video (YouTube, Vimeo, etc.)"
                                    size="large"
                                    disabled={!canEdit}
                                />
                                {videoUrl && (
                                    <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
                                        📹 Video: {videoUrl}
                                    </div>
                                )}
                            </div>
                        </Col>
                    </Row>

                    <div className="footer-card-form">
                        <Space>
                            <Button
                                icon={<EyeOutlined />}
                                onClick={() => setPreviewVisible(true)}
                                type="default"
                                size="large"
                            >
                                Xem trước
                            </Button>
                            {canEdit && actions}
                        </Space>
                    </div>
                </Card>
            </BaseForm>

            {/* Preview Modal with Full-Screen Content */}
            <Modal
                title="Xem trước Simulation"
                open={previewVisible}
                onCancel={() => setPreviewVisible(false)}
                width="100%"
                style={{ top: 0, paddingBottom: 0 }}
                bodyStyle={{ 
                    height: 'calc(100vh - 110px)',
                    padding: 0,
                    overflow: 'auto',
                }}
                footer={null}
            >
                <SimulationPreview data={getPreviewData()} />
            </Modal>
        </>
    );
};

export default SimulationForm;