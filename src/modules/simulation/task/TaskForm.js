import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Button, Input, Space, Modal, Divider, Tag, Alert, message } from 'antd';
import { EyeOutlined, BookOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';

import { BaseForm } from '@components/common/form/BaseForm';
import CropImageField from '@components/common/form/CropImageField';
import TextField from '@components/common/form/TextField';
// import TiptapEditor from '@components/common/editor/TiptapEditor';

import useBasicForm from '@hooks/useBasicForm';
import useFetch from '@hooks/useFetch';
import useTranslate from '@hooks/useTranslate';

import { AppConstants, TaskTypes } from '@constants';
import apiConfig from '@constants/apiConfig';
import { taskKindOptions } from '@constants/masterData';
import { commonMessage } from '@locales/intl';

// Helper functions removed as introduction sections are replaced by TiptapEditor.

// ─────────────────────────────────────────────
// TaskForm
// ─────────────────────────────────────────────

const TaskForm = (props) => {
    const translate = useTranslate();
    const kindValues = translate.formatKeys(taskKindOptions, ['label']);
    const location = useLocation();

    const parentTaskFromState = location.state?.parentTask;

    const { formId, actions, dataDetail, onSubmit, setIsChangedFormValues, isEditing, simulationId } = props;

    const { execute: executeUpFile } = useFetch(apiConfig.file.upload, { immediate: false });

    // ── local state ──────────────────────────
    const [imagePath, setImagePath] = useState(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [filePath, setFilePath] = useState(null);
    const [taskKind, setTaskKind] = useState(null);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [parentTaskInfo, setParentTaskInfo] = useState(null);
    const [content, setContent] = useState('');
    const [submitError, setSubmitError] = useState(null);

    const { form, mixinFuncs, onValuesChange } = useBasicForm({ onSubmit, setIsChangedFormValues });

    // ── xác định loại task khi mount / khi dataDetail thay đổi ──
    useEffect(() => {
        if (!isEditing) {
            if (parentTaskFromState) {
                setTaskKind(TaskTypes.SUBTASK);
                setParentTaskInfo(parentTaskFromState);
                setTimeout(() => form.setFieldsValue({ name: parentTaskFromState.name }), 100);
            } else {
                setTaskKind(TaskTypes.TASK);
                setParentTaskInfo(null);
            }
        } else {
            if (dataDetail?.kind === TaskTypes.SUBTASK && dataDetail?.parent) {
                setTaskKind(TaskTypes.SUBTASK);
                setParentTaskInfo(dataDetail.parent);
            } else {
                setTaskKind(TaskTypes.TASK);
                setParentTaskInfo(null);
            }
        }
    }, [parentTaskFromState, isEditing, dataDetail]);

    // ── load dataDetail khi edit ──────────────
    useEffect(() => {
        if (!dataDetail || Object.keys(dataDetail).length === 0) return;

        try {
            form.setFieldsValue({
                name: dataDetail.name || '',
                title: dataDetail.title || '',
                description: dataDetail.description || '',
            });

            setImagePath(dataDetail.imagePath || '');
            setVideoUrl(dataDetail.videoPath || '');
            setFilePath(dataDetail.filePath || '');
            setContent(dataDetail.content || '');
        } catch (error) {
            console.error('Error loading task detail:', error);
            message.error('Không thể tải dữ liệu Task. Vui lòng tải lại trang.');
        }
    }, [dataDetail]);

    // ── upload image ──────────────────────────
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

    // Introduction section and bullet handlers removed.

    // ── submit ────────────────────────────────
    const handleSubmit = async (values) => {
        try {
            setSubmitError(null);

            const submitData = {
                name: values.name?.trim() || '',
                title: values.title?.trim() || '',
                description: values.description?.trim() || ' ',
                kind: isEditing ? dataDetail.kind : taskKind,
                simulationId: simulationId || 0,
                content: content,
                imagePath: imagePath || null,
                videoPath: videoUrl || null,
                filePath: filePath || null,
            };

            if (submitData.kind === TaskTypes.SUBTASK) {
                submitData.parentId = parseInt(parentTaskInfo?.id || dataDetail?.parent?.id);
            } else {
                submitData.parentId = null;
            }

            const result = await mixinFuncs.handleSubmit(submitData);

            if (result?.result === false) {
                const msg = result.message || 'Không thể lưu Task. Vui lòng thử lại.';
                setSubmitError(msg);
                message.error(msg);
                return false;
            }

            return result;
        } catch (error) {
            const msg = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi lưu Task.';
            setSubmitError(msg);
            message.error(msg);
            return false;
        }
    };

    // ── preview data ──────────────────────────
    const getPreviewData = () => {
        const currentKind = isEditing ? dataDetail.kind : taskKind;
        return {
            ...form.getFieldsValue(),
            imagePath,
            videoPath: videoUrl,
            filePath,
            content,
            kind: kindValues.find((k) => k.value === currentKind),
            parentTask:
                taskKind === TaskTypes.SUBTASK || dataDetail?.kind === TaskTypes.SUBTASK ? parentTaskInfo : null,
        };
    };

    // ── kind label ────────────────────────────
    const getCurrentKindLabel = () => {
        const currentKind = isEditing ? dataDetail?.kind : taskKind;
        return kindValues.find((k) => k.value === currentKind)?.label || 'Task';
    };

    // ─────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────
    return (
        <>
            <BaseForm id={formId} onFinish={handleSubmit} form={form} onValuesChange={onValuesChange}>
                <Card className="card-form" bordered={false}>
                    {/* Lỗi submit */}
                    {submitError && (
                        <Alert
                            message="Lỗi khi lưu Task"
                            description={submitError}
                            type="error"
                            showIcon
                            closable
                            onClose={() => setSubmitError(null)}
                            style={{ marginBottom: 16 }}
                        />
                    )}

                    {/* Badge loại task */}
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                        <Col span={24}>
                            <Alert
                                message={
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <strong>Loại:</strong>
                                        <Tag color={taskKind === TaskTypes.TASK ? 'blue' : 'purple'}>
                                            {getCurrentKindLabel()}
                                        </Tag>
                                        {parentTaskInfo && taskKind === TaskTypes.SUBTASK && (
                                            <>
                                                <span>•</span>
                                                <span>
                                                    Thuộc Task: <strong>{parentTaskInfo.name}</strong>
                                                </span>
                                            </>
                                        )}
                                    </div>
                                }
                                type="info"
                                showIcon
                                icon={<BookOutlined />}
                            />
                        </Col>
                    </Row>

                    {/* Name + Title */}
                    <Row gutter={16}>
                        <Col span={12}>
                            <TextField
                                label={translate.formatMessage(commonMessage.name)}
                                required
                                name="name"
                                requiredMsg={translate.formatMessage(commonMessage.required)}
                                placeholder="Nhập tên nhiệm vụ"
                                disabled={taskKind === TaskTypes.SUBTASK}
                            />
                        </Col>
                        <Col span={12}>
                            <TextField
                                label={translate.formatMessage(commonMessage.title)}
                                required
                                name="title"
                                requiredMsg={translate.formatMessage(commonMessage.required)}
                                placeholder="Tiêu đề nhiệm vụ"
                            />
                        </Col>
                    </Row>

                    {/* Description */}
                    <Row gutter={16}>
                        <Col span={24}>
                            <TextField
                                label="Mô tả"
                                required
                                name="description"
                                type="textarea"
                                rows={3}
                                placeholder="Mô tả ngắn gọn về nhiệm vụ"
                            />
                        </Col>
                    </Row>

                    {/* TiptapEditor for Content */}
                    <Row gutter={16} style={{ marginBottom: 12 }}>
                        <Col span={24}>
                            <Button
                                style={{ marginBottom: 12 }}
                                onClick={() => {
                                    setContent(`
                                        <h2>Bạn sẽ học được gì?</h2>
                                        <ul>
                                            <li></li>
                                            <li></li>
                                            <li></li>
                                        </ul>

                                        <h2>Bạn sẽ làm gì?</h2>
                                        <ul>
                                            <li></li>
                                            <li></li>
                                            <li></li>
                                        </ul>
                                    `);
                                }}
                            >
                                Chèn mẫu Skyscanner
                            </Button>
                        </Col>
                    </Row>

                    <Row gutter={16} style={{ marginBottom: 16 }}>
                        <Col span={24}>
                            <label
                                style={{
                                    fontWeight: 600,
                                    display: 'block',
                                    marginBottom: 8,
                                }}
                            >
                                Nội dung
                            </label>

                            {/* <TiptapEditor value={content} onChange={setContent} /> */}
                        </Col>
                    </Row>

                    {/* ── Media & Files ────────────────────────── */}
                    <Divider orientation="left">Media & Files</Divider>

                    <Row gutter={16}>
                        <Col span={8}>
                            <CropImageField
                                label={translate.formatMessage(commonMessage.image)}
                                name="imagePath"
                                imageUrl={imagePath && `${AppConstants.contentRootUrl}${imagePath}`}
                                aspect={16 / 9}
                                uploadFile={(file, onSuccess, onError) => uploadFile(file, onSuccess, onError, 'IMAGE')}
                            />
                        </Col>

                        <Col span={8}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={labelStyle}>Video URL</label>
                                <Input
                                    value={videoUrl}
                                    onChange={(e) => {
                                        setVideoUrl(e.target.value);
                                        setIsChangedFormValues(true);
                                    }}
                                    placeholder="Nhập URL YouTube, Vimeo, v.v."
                                    size="large"
                                />
                                {videoUrl && (
                                    <div style={{ marginTop: 6, color: '#888', fontSize: 12 }}>📹 {videoUrl}</div>
                                )}
                            </div>
                        </Col>

                        <Col span={8}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={labelStyle}>File URL</label>
                                <Input
                                    value={filePath}
                                    onChange={(e) => {
                                        setFilePath(e.target.value);
                                        setIsChangedFormValues(true);
                                    }}
                                    placeholder="Nhập URL file tài liệu"
                                    size="large"
                                />
                                {filePath && (
                                    <div style={{ marginTop: 6, color: '#888', fontSize: 12 }}>📄 {filePath}</div>
                                )}
                            </div>
                        </Col>
                    </Row>

                    {/* Footer actions */}
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
                            {actions}
                        </Space>
                    </div>
                </Card>
            </BaseForm>

            <TaskPreviewModal
                visible={previewVisible}
                onClose={() => setPreviewVisible(false)}
                data={getPreviewData()}
            />
        </>
    );
};

// ─────────────────────────────────────────────
// TaskPreviewModal
// ─────────────────────────────────────────────

const TaskPreviewModal = ({ visible, onClose, data }) => (
    <Modal
        title={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOutlined style={{ color: '#1890ff' }} />
                <span>Xem trước – Giao diện học viên</span>
            </div>
        }
        open={visible}
        onCancel={onClose}
        width={900}
        footer={[
            <Button key="close" type="primary" onClick={onClose}>
                Đóng
            </Button>,
        ]}
        style={{ top: 20 }}
    >
        <div
            style={{
                maxHeight: '75vh',
                overflowY: 'auto',
                padding: '24px',
                background: '#f5f5f5',
            }}
        >
            {/* Header card */}
            <div style={previewCardStyle}>
                {data.parentTask && (
                    <div style={parentBadgeStyle}>
                        <small style={{ color: '#666' }}>Thuộc:</small> <strong>{data.parentTask.name}</strong>
                    </div>
                )}

                <h2 style={{ margin: '0 0 8px' }}>{data.title || 'Chưa có tiêu đề'}</h2>

                <Space style={{ marginBottom: 12 }}>
                    {data.kind && <Tag color={data.kind.value === 1 ? 'blue' : 'purple'}>{data.kind.label}</Tag>}
                </Space>

                {data.imagePath && (
                    <img
                        src={`${AppConstants.contentRootUrl}${data.imagePath}`}
                        alt="Task"
                        style={{
                            width: '100%',
                            borderRadius: 8,
                            marginBottom: 16,
                            maxHeight: 300,
                            objectFit: 'cover',
                        }}
                    />
                )}

                {data.description && (
                    <div style={descriptionBoxStyle}>
                        <p style={{ margin: 0, lineHeight: 1.8 }}>{data.description}</p>
                    </div>
                )}
            </div>

            {/* Content HTML Preview */}
            <div style={previewCardStyle}>
                <div
                    dangerouslySetInnerHTML={{
                        __html: data.content || '',
                    }}
                />
            </div>

            {/* Media links */}
            {(data.videoPath || data.filePath) && (
                <div style={previewCardStyle}>
                    <h4 style={{ marginBottom: 12 }}>Tài liệu tham khảo</h4>
                    <Space direction="vertical">
                        {data.videoPath && (
                            <a href={data.videoPath} target="_blank" rel="noopener noreferrer">
                                🎥 Video hướng dẫn
                            </a>
                        )}
                        {data.filePath && (
                            <a href={data.filePath} target="_blank" rel="noopener noreferrer">
                                📄 Tài liệu đính kèm
                            </a>
                        )}
                    </Space>
                </div>
            )}

            {/* CTA */}
            <div style={{ ...previewCardStyle, textAlign: 'center', marginTop: 24 }}>
                <Button type="primary" size="large" style={{ minWidth: 200 }}>
                    Bắt đầu làm bài
                </Button>
            </div>
        </div>
    </Modal>
);

// ─────────────────────────────────────────────
// Shared styles
// ─────────────────────────────────────────────

const labelStyle = {
    fontWeight: 600,
    marginBottom: 8,
    display: 'block',
};

const previewCardStyle = {
    background: 'white',
    padding: '20px 24px',
    borderRadius: 8,
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

const parentBadgeStyle = {
    marginBottom: 16,
    padding: '8px 12px',
    background: '#e6f7ff',
    borderRadius: 4,
    borderLeft: '3px solid #1890ff',
};

const descriptionBoxStyle = {
    padding: 16,
    background: '#fafafa',
    borderRadius: 8,
    borderLeft: '4px solid #52c41a',
};

export default TaskForm;
