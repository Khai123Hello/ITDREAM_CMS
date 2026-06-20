import React, { useEffect, useRef, useState } from 'react';
import { Card, Col, Row, Button, Input, Space, Modal, Divider, Tag, Alert, message, Tabs, Upload } from 'antd';
import { DownloadOutlined, BookOutlined, AppstoreOutlined, FileOutlined, UploadOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';

import { BaseForm } from '@components/common/form/BaseForm';
import CropImageField from '@components/common/form/CropImageField';
import TextField from '@components/common/form/TextField';
import SelectField from '@components/common/form/SelectField';
import CheckboxField from '@components/common/form/CheckboxField';
import BlockEditor from '@components/common/editor/BlockEditor';

import useBasicForm from '@hooks/useBasicForm';
import useFetch from '@hooks/useFetch';
import useTranslate from '@hooks/useTranslate';
import { useTaskSymbol } from './useTaskSymbol';

import { AppConstants, TaskTypes, UserTypes, storageKeys, UploadFileTypes } from '@constants';
import { getData } from '@utils/localStorage';
import apiConfig from '@constants/apiConfig';
import { taskKindOptions, taskTypeOptions } from '@constants/masterData';
import { commonMessage } from '@locales/intl';

// ─────────────────────────────────────────────
// Shared styles
// ─────────────────────────────────────────────

const labelStyle = {
    fontWeight: 600,
    marginBottom: 8,
    display: 'block',
};

// ─────────────────────────────────────────────
// RenderPreviewBlocks
// ─────────────────────────────────────────────

const RenderPreviewBlocks = ({ content }) => {
    if (!content) return null;
    try {
        const blocks = JSON.parse(content);
        if (!Array.isArray(blocks)) {
            return <div dangerouslySetInnerHTML={{ __html: content }} />;
        }

        const elements = [];
        let currentList = null;

        const pushCurrentList = () => {
            if (currentList) {
                if (currentList.type === 'bullet') {
                    elements.push(
                        <ul key={`list-${elements.length}`} className="out-ul">
                            {currentList.items.map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>,
                    );
                } else {
                    elements.push(
                        <ol key={`list-${elements.length}`} className="out-ol">
                            {currentList.items.map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ol>,
                    );
                }
                currentList = null;
            }
        };

        blocks.forEach((b, idx) => {
            if (b.type === 'bullet') {
                if (!currentList || currentList.type !== 'bullet') {
                    pushCurrentList();
                    currentList = { type: 'bullet', items: [] };
                }
                currentList.items.push(b.content);
                return;
            }
            if (b.type === 'numbered') {
                if (!currentList || currentList.type !== 'numbered') {
                    pushCurrentList();
                    currentList = { type: 'numbered', items: [] };
                }
                currentList.items.push(b.content);
                return;
            }

            pushCurrentList();

            switch (b.type) {
                            case 'text':
                                elements.push(
                                    <div key={idx} className="out-text">
                                        {b.content}
                                    </div>,
                                );
                                break;
                            case 'h1':
                                elements.push(
                                    <div key={idx} className="out-h1">
                                        {b.content}
                                    </div>,
                                );
                                break;
                            case 'h2':
                                elements.push(
                                    <div key={idx} className="out-h2">
                                        {b.content}
                                    </div>,
                                );
                                break;
                            case 'h3':
                                elements.push(
                                    <div key={idx} className="out-h3">
                                        {b.content}
                                    </div>,
                                );
                                break;
                            case 'divider':
                                elements.push(<hr key={idx} className="out-divider" />);
                                break;
                            case 'callout':
                                elements.push(
                                    <div key={idx} className="out-callout">
                                        <span className="out-callout-icon-preview">{b.icon}</span>
                                        <div style={{ flex: 1 }}>{b.content}</div>
                                    </div>,
                                );
                                break;
                            case 'meta':
                                elements.push(
                                    <div key={idx} className="out-meta">
                                        <span>{b.duration}</span>
                                        <span className="out-meta-sep">·</span>
                                        <span>{b.level}</span>
                                    </div>,
                                );
                                break;
                            case 'section':
                                elements.push(
                                    <div key={idx} className="out-section">
                                        <div className="out-sec-hdr">
                                            <span className="out-sec-icon">{b.icon}</span>
                                            {b.title}
                                        </div>
                                        <ul className="out-sec-bullets">
                                            {b.bullets
                                                ?.filter((x) => x)
                                                .map((bullet, bi) => (
                                                    <li key={bi}>{bullet}</li>
                                                ))}
                                        </ul>
                                    </div>,
                                );
                                break;
                            case 'step': {
                                const renderStepBody = (text) => {
                                    if (!text) return '';
                                    const parts = text.split(/(`[^`]+`)/g);
                                    return parts.map((part, pi) => {
                                        if (part.startsWith('`') && part.endsWith('`')) {
                                            return <code key={pi}>{part.slice(1, -1)}</code>;
                                        }
                                        return part;
                                    });
                                };
                                elements.push(
                                    <div key={idx} className="out-step">
                                        <div className="out-step-badge">{idx + 1}</div>
                                        <div className="out-step-content">
                                            <span className="out-step-label">{b.label}</span>
                                            <span className="out-step-body">{renderStepBody(b.body)}</span>
                                        </div>
                                    </div>,
                                );
                                break;
                            }
                            case 'quiz':
                                elements.push(
                                    <div
                                        key={idx}
                                        className="out-quiz-wrap"
                                        style={{
                                            border: '1.5px solid #d9d9d9',
                                            borderRadius: 10,
                                            padding: '16px 18px',
                                            background: '#fff',
                                            margin: '12px 0',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                            <span style={{ fontSize: 20 }}>❓</span>
                                            <div style={{ fontWeight: 600, fontSize: 15 }}>{b.question}</div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 30 }}>
                                            {b.options?.map((opt, oi) => (
                                                <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{ fontWeight: 600 }}>{String.fromCharCode(65 + oi)}.</span>
                                                    <span>{opt.option}</span>
                                                    {opt.answer && (
                                                        <Tag color="success" style={{ marginLeft: 8 }}>
                                                ✓ Đáp án đúng
                                                        </Tag>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>,
                                );
                                break;
                            default:
                                break;
            }
        });

        pushCurrentList();

        return <div className="block-editor-preview-container">{elements}</div>;
    } catch (e) {
        return <div dangerouslySetInnerHTML={{ __html: content }} />;
    }
};

// ─────────────────────────────────────────────
// TaskForm
// ─────────────────────────────────────────────

const TaskForm = (props) => {
    const translate = useTranslate();
    const kindValues = translate.formatKeys(taskKindOptions, ['label']);
    const location = useLocation();

    const userType = getData(storageKeys.USER_TYPE);
    const isEducator = userType === UserTypes.EDUCATOR;

    const parentTaskFromState = props.parentTask || location.state?.parentTask;

    const {
        formId,
        actions,
        dataDetail,
        onSubmit,
        setIsChangedFormValues,
        isEditing,
        simulationId,
        onQuestionsChange,
    } = props;

    const { execute: executeUpFile } = useFetch(apiConfig.file.upload, { immediate: false });

    // ── local state ──────────────────────────
    const [imagePath, setImagePath] = useState(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [filePath, setFilePath] = useState(null);
    const [parentTaskInfo, setParentTaskInfo] = useState(() => {
        if (!isEditing) {
            return parentTaskFromState || null;
        }
        if (dataDetail) {
            if (Number(dataDetail.kind) === TaskTypes.SUBTASK || dataDetail.parentId) {
                return dataDetail.parent || parentTaskFromState || { id: dataDetail.parentId, name: '' };
            }
        }
        return null;
    });

    const [taskKind, setTaskKind] = useState(() => {
        if (!isEditing) {
            return parentTaskFromState ? TaskTypes.SUBTASK : TaskTypes.TASK;
        }
        if (dataDetail) {
            if (Number(dataDetail.kind) === TaskTypes.SUBTASK || dataDetail.parentId) {
                return TaskTypes.SUBTASK;
            }
            return TaskTypes.TASK;
        }
        return null;
    });

    const [content, setContent] = useState('');
    // contentRef — luôn giữ giá trị mới nhất từ BlockEditor, kể cả khi debounce chưa fire
    const contentRef = useRef('');
    const [submitError, setSubmitError] = useState(null);

    // Template snapshot — lưu nội dung của template người dùng đã chọn
    const [templateSnapshot, setTemplateSnapshot] = useState(null);
    // Modal xác nhận khi chưa sửa so với template
    const [templateConfirmVisible, setTemplateConfirmVisible] = useState(false);
    // Lưu tạm dữ liệu submit khi đang chờ xác nhận
    const [pendingSubmitData, setPendingSubmitData] = useState(null);

    // Draft recovery states
    const [draftData, setDraftData] = useState(null);
    const [isDirty, setIsDirty] = useState(false);
    const [changeTrigger, setChangeTrigger] = useState(0);

    const FilePreview = ({ url }) => {
        if (!url) return null;
        let extension = 'FILE';
        let fileName = 'Tài liệu';
        try {
            const parts = url.split('/');
            const rawFileName = parts[parts.length - 1];
            fileName = rawFileName.split('?')[0]; // Remove query string if any
            const dotParts = fileName.split('.');
            if (dotParts.length > 1) {
                extension = dotParts[dotParts.length - 1].toUpperCase();
            }
        } catch (e) {
            console.error(e);
        }

        return (
            <a href={url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                <div
                    style={{
                        border: '1px solid #f0f0f0',
                        borderRadius: 8,
                        padding: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        background: '#fff',
                        marginTop: 16,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        transition: 'box-shadow 0.3s',
                        width: '100%',
                        maxWidth: '400px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)')}
                >
                    <div
                        style={{
                            background: '#00a884',
                            color: 'white',
                            padding: '12px 8px',
                            borderRadius: '4px 12px 4px 4px',
                            fontWeight: 'bold',
                            fontSize: 16,
                            marginBottom: 16,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: 50,
                            minHeight: 60,
                        }}
                    >
                        {extension}
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: 18, color: '#000', marginBottom: 16 }}>
                        {fileName.length > 30 ? fileName.substring(0, 30) + '...' : fileName}
                    </div>
                    <div
                        style={{
                            color: '#00a884',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: 16,
                        }}
                    >
                        Nhấn vào để tải về <span style={{ marginLeft: 8 }}>→</span>
                    </div>
                </div>
            </a>
        );
    };

    const getMediaUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        const normalizedPath = path.replace(/\\/g, '/');
        const separator = AppConstants.contentRootUrl.endsWith('/') || normalizedPath.startsWith('/') ? '' : '/';
        return `${AppConstants.contentRootUrl}${separator}${normalizedPath}`;
    };

    // Question load states for BlockEditor remount key
    const [questionsLoaded, setQuestionsLoaded] = useState(!isEditing);

    // ── Local state for questions ────────────────
    const [questions, setQuestions] = useState([]);

    const { form, mixinFuncs, onValuesChange } = useBasicForm({ onSubmit, setIsChangedFormValues });

    const parentOrderFromState = location.state?.parentOrder;
    const taskOrderFromState = location.state?.taskOrder;

    let parentOrder = parentOrderFromState || 1;
    let taskOrder = taskOrderFromState || 1;

    if (!parentOrderFromState || !taskOrderFromState) {
        if (dataDetail?.name) {
            const currentKind = isEditing ? Number(dataDetail.kind) : Number(taskKind);
            if (currentKind === TaskTypes.TASK) {
                const match = dataDetail.name.match(/^TASK_T(\d+)$/);
                if (match) {
                    taskOrder = parseInt(match[1]);
                }
            } else {
                const match = dataDetail.name.match(/^SUB_T(\d+)_S(\d+)(_.*)?$/);
                if (match) {
                    parentOrder = parseInt(match[1]);
                    taskOrder = parseInt(match[2]);
                }
            }
        }
    }

    const { symbol, requiresFileUpload, setRequiresFileUpload, requiresTextResponse, setRequiresTextResponse } =
        useTaskSymbol({
            taskKind: isEditing ? Number(dataDetail?.kind) : Number(taskKind),
            parentOrder,
            taskOrder,
            initialValue: dataDetail?.name || '',
        });

    useEffect(() => {
        if (symbol) {
            const currentName = form.getFieldValue('name');
            if (currentName !== symbol) {
                form.setFieldsValue({ name: symbol });
                setIsChangedFormValues(true);
            }
        }
    }, [symbol, form, setIsChangedFormValues]);

    const handleValuesChange = (changedValues, allValues) => {
        onValuesChange(changedValues, allValues);
        setIsDirty(true);
        setChangeTrigger((prev) => prev + 1);
    };

    // Check and load draft on mount/detail changes
    useEffect(() => {
        const draftKey = `task_draft_${simulationId}_${isEditing && dataDetail?.id ? dataDetail.id : 'new'}`;
        const saved = localStorage.getItem(draftKey);
        if (saved) {
            try {
                setDraftData(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse draft:', e);
            }
        } else {
            setDraftData(null);
        }
        setIsDirty(false);
    }, [isEditing, dataDetail?.id, simulationId]);

    // Debounced draft auto-save
    useEffect(() => {
        if (!isDirty) return;

        const timer = setTimeout(() => {
            const draftKey = `task_draft_${simulationId}_${isEditing && dataDetail?.id ? dataDetail.id : 'new'}`;
            const formValues = form.getFieldsValue();
            const draftPayload = {
                name: formValues.name,
                title: formValues.title,
                description: formValues.description,
                type: formValues.type,
                content,
                imagePath,
                videoPath: videoUrl,
                filePath,
            };
            localStorage.setItem(draftKey, JSON.stringify(draftPayload));
        }, 1000);

        return () => clearTimeout(timer);
    }, [isDirty, content, imagePath, videoUrl, filePath, changeTrigger, form, isEditing, dataDetail?.id, simulationId]);

    const handleRestoreDraft = () => {
        if (!draftData) return;
        form.setFieldsValue({
            name: draftData.name || '',
            title: draftData.title || '',
            description: draftData.description || '',
            type: draftData.type,
        });
        setContent(draftData.content || '');
        setImagePath(draftData.imagePath || null);
        setVideoUrl(draftData.videoPath || '');
        setFilePath(draftData.filePath || null);

        if (draftData.name) {
            const match = draftData.name.match(/^SUB_T(\d+)_S(\d+)(_.*)?$/);
            if (match) {
                const suffix = match[3] || '';
                if (suffix === '_FILE_TEXT') {
                    setRequiresFileUpload(true);
                    setRequiresTextResponse(true);
                } else if (suffix === '_FILE') {
                    setRequiresFileUpload(true);
                    setRequiresTextResponse(false);
                } else if (suffix === '_TEXT') {
                    setRequiresFileUpload(false);
                    setRequiresTextResponse(true);
                } else {
                    setRequiresFileUpload(false);
                    setRequiresTextResponse(false);
                }
            }
        }

        setIsChangedFormValues(true);
        setDraftData(null);
        message.success('Khôi phục bản nháp thành công!');
    };

    const handleDeleteDraft = () => {
        const draftKey = `task_draft_${simulationId}_${isEditing && dataDetail?.id ? dataDetail.id : 'new'}`;
        localStorage.removeItem(draftKey);
        setDraftData(null);
        message.success('Đã xóa bản nháp.');
    };

    // ── fetch questions API ────────────────
    const { execute: fetchQuestions } = useFetch(
        isEducator ? apiConfig.taskQuestion.educatorList : apiConfig.taskQuestion.getList,
        {
            immediate: false,
            onCompleted: (response) => {
                const resData = response?.data || (response?.result === undefined ? response : null);
                if (resData) {
                    const fetchedQuestions = resData.content || [];
                    setQuestions(fetchedQuestions);

                    // Migration / matching logic
                    try {
                        const currentContent = content || dataDetail?.content || dataDetail?.introduction || '';
                        let blocks = [];
                        if (currentContent) {
                            blocks = JSON.parse(currentContent);
                        }
                        if (Array.isArray(blocks)) {
                            const quizBlocks = blocks.filter((b) => b.type === 'quiz');
                            if (quizBlocks.length > 0) {
                                let qIndex = 0;
                                const newBlocks = blocks.map((b) => {
                                    if (b.type === 'quiz') {
                                        const dbQuestion = fetchedQuestions[qIndex];
                                        qIndex++;
                                        if (dbQuestion) {
                                            return {
                                                ...b,
                                                questionDbId: dbQuestion.id,
                                            };
                                        }
                                    }
                                    return b;
                                });
                                setContent(JSON.stringify(newBlocks));
                            } else if (fetchedQuestions.length > 0) {
                                const newBlocks = [...blocks];
                                fetchedQuestions.forEach((q) => {
                                    let parsedOpts = [];
                                    try {
                                        parsedOpts =
                                            typeof q.options === 'string' ? JSON.parse(q.options) : q.options || [];
                                    } catch (e) {
                                        /* ignore */
                                    }
                                    const newOpts = parsedOpts.map((opt) => ({
                                        option: opt.option || opt.content || opt.text || '',
                                        answer: opt.answer === true || opt.isCorrect === true,
                                    }));
                                    newBlocks.push({
                                        id: `db_${q.id}`,
                                        questionDbId: q.id,
                                        type: 'quiz',
                                        question: q.question || '',
                                        options: newOpts,
                                    });
                                });
                                setContent(JSON.stringify(newBlocks));
                            }
                        }
                    } catch (e) {
                        console.error('Matching questions error:', e);
                    }
                }
                setQuestionsLoaded(true);
            },
            onError: () => {
                setQuestionsLoaded(true);
            },
        },
    );

    const loadQuestions = () => {
        if (isEditing && dataDetail?.id) {
            fetchQuestions({
                params: { taskId: dataDetail.id, page: 0, size: 100 },
            });
        } else if (!isEditing) {
            setQuestions([]);
        }
    };

    useEffect(() => {
        loadQuestions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing, dataDetail?.id]);

    // Helper: extract quiz questions from content JSON string
    const extractQuizQuestions = (contentStr) => {
        if (!contentStr) return [];
        try {
            const blocks = JSON.parse(contentStr);
            if (!Array.isArray(blocks)) return [];
            const quizBlocks = blocks.filter((b) => b.type === 'quiz');
            return quizBlocks.map((b) => ({
                id: b.questionDbId,
                question: b.question || '',
                options: JSON.stringify(
                    (b.options || []).map((o) => ({
                        option: o.option || '',
                        answer: o.answer || false,
                    })),
                ),
            }));
        } catch (e) {
            return [];
        }
    };

    // ── kind label ────────────────────────────
    const getCurrentKindLabel = () => {
        const currentKind = isEditing ? Number(dataDetail?.kind) : Number(taskKind);
        return kindValues.find((k) => Number(k.value) === currentKind)?.label || 'Task';
    };

    const tabItems = [
        {
            key: '1',
            label: 'Nội dung bài học',
            children: (
                <>
                    {/* Draft Recovery Alert */}
                    {draftData && (
                        <Alert
                            message="Phát hiện bản nháp chưa lưu cho nhiệm vụ này."
                            type="warning"
                            showIcon
                            action={
                                <Space>
                                    <Button size="small" type="primary" onClick={handleRestoreDraft}>
                                        Khôi phục bản nháp
                                    </Button>
                                    <Button size="small" danger onClick={handleDeleteDraft}>
                                        Xóa
                                    </Button>
                                </Space>
                            }
                            style={{ marginBottom: 16 }}
                        />
                    )}

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
                                        <Tag color={Number(taskKind) === TaskTypes.TASK ? 'blue' : 'purple'}>
                                            {getCurrentKindLabel()}
                                        </Tag>
                                        {parentTaskInfo && taskKind === TaskTypes.SUBTASK && (
                                            <>
                                                <span>•</span>
                                                <span>
                                                    Thuộc Task: <strong>{parentTaskInfo.title || 'N/A'}</strong>
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

                    {/* Register title and description in Ant form store */}
                    <div style={{ display: 'none' }}>
                        <TextField name="title" />
                        <TextField name="description" />
                    </div>

                    {/* Name & Thể loại nội dung */}
                    <Row gutter={16}>
                        {/* Hidden TextField for name so Form still registers it and validation works */}
                        <div style={{ display: 'none' }}>
                            <TextField
                                label={translate.formatMessage(commonMessage.name)}
                                name="name"
                                placeholder="Nhập tên nhiệm vụ"
                                disabled={!isEducator}
                            />
                        </div>

                        {Number(taskKind) === TaskTypes.SUBTASK ? (
                            <Col span={24}>
                                <div style={{ marginBottom: 24 }}>
                                    <label style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>
                                        Yêu cầu nộp bài của học viên
                                    </label>
                                    <CheckboxField
                                        optionLabel="Học viên cần tải file bài làm lên (.zip, .pdf, .docx, v.v.)"
                                        disabled={!isEducator}
                                        onChange={(e) => setRequiresFileUpload(e.target.checked)}
                                        fieldProps={{
                                            checked: requiresFileUpload,
                                        }}
                                        formItemProps={{ style: { marginBottom: 8 } }}
                                    />
                                    <CheckboxField
                                        optionLabel="Học viên cần nhập câu trả lời dạng văn bản (text)"
                                        disabled={!isEducator}
                                        onChange={(e) => setRequiresTextResponse(e.target.checked)}
                                        fieldProps={{
                                            checked: requiresTextResponse,
                                        }}
                                        formItemProps={{ style: { marginBottom: 0 } }}
                                    />
                                </div>
                            </Col>
                        ) : null}
                    </Row>

                    {/* BlockEditor for Title, Description & Content */}
                    <Row gutter={16} style={{ marginBottom: 16 }}>
                        <Col span={24}>
                            <label
                                style={{
                                    fontWeight: 600,
                                    display: 'block',
                                    marginBottom: 8,
                                }}
                            >
                                Chi tiết nhiệm vụ (Tiêu đề, Mô tả & Nội dung)
                            </label>
                            {!isEditing || (isEditing && dataDetail && Object.keys(dataDetail).length > 0) ? (
                                isEducator ? (
                                    <BlockEditor
                                        key={`${dataDetail?.id || 'new'}_${questionsLoaded ? 'loaded' : 'loading'}`}
                                        initialTitle={dataDetail?.title || ''}
                                        initialDescription={dataDetail?.description || ''}
                                        initialContent={
                                            content || dataDetail?.content || dataDetail?.introduction || ''
                                        }
                                        autoLoadTemplate={Number(taskKind) === TaskTypes.TASK && !isEditing}
                                        defaultTemplate={
                                            isEditing && Number(dataDetail?.type) === 2
                                                ? 'quiz'
                                                : Number(taskKind) === TaskTypes.TASK
                                                    ? 'task'
                                                    : 'guide'
                                        }
                                        onTemplateLoad={(snapshot) => setTemplateSnapshot(snapshot)}
                                        // Lightweight: title/desc update form fields only — no setContent, no re-render
                                        onTitleChange={(val) => {
                                            form.setFieldsValue({ title: val });
                                            setIsChangedFormValues(true);
                                        }}
                                        onDescriptionChange={(val) => {
                                            form.setFieldsValue({ description: val });
                                            setIsChangedFormValues(true);
                                        }}
                                        // onChange only fires for content (blocks) — debounced in BlockEditor
                                        onChange={({ title: newTitle, description: newDesc, content: newContent }) => {
                                            // Also sync title/desc here for template load (loadTemplate calls syncWithParentImmediate directly)
                                            form.setFieldsValue({ title: newTitle, description: newDesc });
                                            // Update ref immediately (trước khi setState debounce)
                                            contentRef.current = newContent;
                                            setContent(newContent);
                                            setIsChangedFormValues(true);
                                            // Sync quiz questions ngay lập tức (không đợi debounce)
                                            if (onQuestionsChange) {
                                                onQuestionsChange(extractQuizQuestions(newContent));
                                            }
                                        }}
                                    />
                                ) : (
                                    <div
                                        className="read-only-preview-wrap"
                                        style={{
                                            background: '#fff',
                                            padding: '20px',
                                            borderRadius: '8px',
                                            border: '1px solid #d9d9d9',
                                        }}
                                    >
                                        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                                            {dataDetail?.title || ''}
                                        </h2>
                                        <p style={{ color: '#666', marginBottom: '16px', fontStyle: 'italic' }}>
                                            {dataDetail?.description || ''}
                                        </p>
                                        <Divider style={{ margin: '12px 0' }} />
                                        <RenderPreviewBlocks
                                            content={dataDetail?.content || dataDetail?.introduction || ''}
                                        />
                                    </div>
                                )
                            ) : null}
                        </Col>
                    </Row>

                    {/* ── Media & Files ────────────────────────── */}
                    <Divider orientation="left">Media & Files</Divider>

                    <Row gutter={[16, 24]}>
                        <Col span={24}>
                            <label style={labelStyle}>Ảnh</label>
                            <Tabs
                                items={[
                                    {
                                        key: 'upload',
                                        label: 'Tải lên',
                                        children: (
                                            <>
                                                <style>{`
                                                    .large-image-preview .ant-upload {
                                                        width: 100% !important;
                                                        height: auto !important;
                                                        min-height: 200px !important;
                                                        background-color: #fafafa !important;
                                                        border: 1px dashed #d9d9d9 !important;
                                                    }
                                                    .large-image-preview .img-uploaded {
                                                        width: 100% !important;
                                                        height: auto !important;
                                                        max-height: 500px !important;
                                                        object-fit: contain !important;
                                                    }
                                                `}</style>
                                                <div className="large-image-preview">
                                                    <CropImageField
                                                        label=""
                                                        name="imagePath"
                                                        imageUrl={getMediaUrl(imagePath)}
                                                        aspect={16 / 9}
                                                        uploadFile={(file, onSuccess, onError) =>
                                                            uploadFile(file, onSuccess, onError, UploadFileTypes.IMAGE)
                                                        }
                                                        disabled={!isEducator}
                                                    />
                                                </div>
                                            </>
                                        ),
                                    },
                                    {
                                        key: 'url',
                                        label: 'Đường dẫn (URL)',
                                        children: (
                                            <div style={{ marginBottom: 16 }}>
                                                <Input
                                                    value={imagePath}
                                                    onChange={(e) => {
                                                        setImagePath(e.target.value);
                                                        setIsChangedFormValues(true);
                                                    }}
                                                    placeholder="https://..."
                                                    size="large"
                                                    disabled={!isEducator}
                                                />
                                                {imagePath && (
                                                    <div style={{ marginTop: 8 }}>
                                                        <img
                                                            src={getMediaUrl(imagePath)}
                                                            alt="Preview"
                                                            style={{
                                                                maxWidth: '100%',
                                                                maxHeight: 400,
                                                                borderRadius: 8,
                                                                border: '1px solid #d9d9d9',
                                                                objectFit: 'contain',
                                                            }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ),
                                    },
                                ]}
                            />
                        </Col>

                        <Col span={24}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={labelStyle}>Video URL</label>
                                <Input
                                    value={videoUrl}
                                    onChange={(e) => {
                                        setVideoUrl(e.target.value);
                                        setIsChangedFormValues(true);
                                    }}
                                    placeholder="https://...mp4"
                                    size="large"
                                    disabled={!isEducator}
                                />
                                {videoUrl &&
                                (videoUrl.startsWith('http') || videoUrl.startsWith('https')) &&
                                videoUrl.endsWith('.mp4') ? (
                                        <div
                                            style={{
                                                marginTop: 8,
                                                borderRadius: 8,
                                                overflow: 'hidden',
                                                border: '1px solid #d9d9d9',
                                            }}
                                        >
                                            <video
                                                controls
                                                style={{
                                                    width: '100%',
                                                    maxHeight: 400,
                                                    objectFit: 'contain',
                                                    background: '#000',
                                                }}
                                                src={videoUrl}
                                            />
                                        </div>
                                    ) : videoUrl ? (
                                        <div style={{ marginTop: 6, color: '#ff4d4f', fontSize: 12 }}>
                                        Đường dẫn không hợp lệ. Vui lòng nhập link http/https kết thúc bằng .mp4
                                        </div>
                                    ) : null}
                            </div>
                        </Col>

                        <Col span={24}>
                            <label style={labelStyle}>File Tài Liệu</label>
                            <Tabs
                                items={[
                                    {
                                        key: 'upload',
                                        label: 'Tải lên',
                                        children: (
                                            <Upload.Dragger
                                                accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
                                                customRequest={({ file, onSuccess, onError }) =>
                                                    uploadFile(file, onSuccess, onError, UploadFileTypes.DOCUMENT)
                                                }
                                                showUploadList={false}
                                                disabled={!isEducator}
                                            >
                                                <p className="ant-upload-drag-icon">
                                                    <UploadOutlined />
                                                </p>
                                                <p className="ant-upload-text">Kéo thả hoặc click để tải lên</p>
                                            </Upload.Dragger>
                                        ),
                                    },
                                    {
                                        key: 'url',
                                        label: 'Đường dẫn (URL)',
                                        children: (
                                            <Input
                                                value={filePath}
                                                onChange={(e) => {
                                                    setFilePath(e.target.value);
                                                    setIsChangedFormValues(true);
                                                }}
                                                placeholder="https://..."
                                                size="large"
                                                disabled={!isEducator}
                                            />
                                        ),
                                    },
                                ]}
                            />
                            {filePath && <FilePreview url={getMediaUrl(filePath)} />}
                        </Col>
                    </Row>
                </>
            ),
        },
    ];

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
                setTimeout(() => form.setFieldsValue({ type: 0 }), 100);
            }
        } else {
            if (Number(dataDetail?.kind) === TaskTypes.SUBTASK || dataDetail?.parentId) {
                setTaskKind(TaskTypes.SUBTASK);
                setParentTaskInfo(dataDetail.parent || parentTaskFromState || { id: dataDetail.parentId, name: '' });
            } else {
                setTaskKind(TaskTypes.TASK);
                setParentTaskInfo(null);
            }
        }
    }, [parentTaskFromState, isEditing, dataDetail]);

    // ── load dataDetail khi edit hoặc reset khi tạo mới ──────────────
    useEffect(() => {
        if (!dataDetail || Object.keys(dataDetail).length === 0) {
            form.resetFields();
            setImagePath(null);
            setVideoUrl('');
            setFilePath(null);
            setContent('');
            return;
        }

        try {
            form.setFieldsValue({
                name: dataDetail.name || '',
                title: dataDetail.title || '',
                description: dataDetail.description || '',
            });

            setImagePath(dataDetail.imagePath || '');
            setVideoUrl(dataDetail.videoPath || '');
            setFilePath(dataDetail.filePath || '');
            setContent(dataDetail.content || dataDetail.introduction || '');
        } catch (error) {
            console.error('Error loading task detail:', error);
            message.error('Không thể tải dữ liệu Task. Vui lòng tải lại trang.');
        }
    }, [dataDetail]);

    // ── upload media ──────────────────────────
    const uploadFile = (file, onSuccess, onError, type) => {
        executeUpFile({
            data: { file, type },
            onCompleted: (response) => {
                if (response.result === true) {
                    onSuccess();
                    if (type === UploadFileTypes.IMAGE || type === 'IMAGE') {
                        setImagePath(response.data.filePath);
                        form.setFieldsValue({ imagePath: response.data.filePath });
                    } else if (type === UploadFileTypes.DOCUMENT || type === 'DOCUMENT') {
                        setFilePath(response.data.filePath);
                        form.setFieldsValue({ filePath: response.data.filePath });
                    }
                    setIsChangedFormValues(true);
                } else {
                    onError(new Error(response.message || 'Upload thất bại'));
                }
            },
            onError: (err) => onError(err),
        });
    };

    // ── so sánh nội dung với template ─────────────────────
    const normalizeContent = (contentStr) => {
        if (!contentStr) return '';
        try {
            const parsed = JSON.parse(contentStr);
            if (!Array.isArray(parsed)) return contentStr;
            return JSON.stringify(
                parsed.map((block) => {
                    const copy = { ...block };
                    delete copy.id;
                    return copy;
                }),
            );
        } catch {
            return contentStr || '';
        }
    };

    const isUnchangedFromTemplate = (submitData, snapshot) => {
        if (!snapshot) return false;
        const titleSame = (submitData.title?.trim() || '') === (snapshot.title?.trim() || '');
        const contentSame = normalizeContent(submitData.content) === normalizeContent(snapshot.content);
        const snapshotHasDesc = !!snapshot.description?.trim();
        const descSame =
            !snapshotHasDesc || (submitData.description?.trim() || '') === (snapshot.description?.trim() || '');
        return titleSame && contentSame && descSame;
    };

    // ── thực sự gọi API lưu ───
    const doSave = async (submitData) => {
        try {
            const result = await mixinFuncs.handleSubmit(submitData);
            if (result?.result === false) {
                const msg = result.message || 'Không thể lưu Task. Vui lòng thử lại.';
                setSubmitError(msg);
                message.error(msg);
                return false;
            }
            const draftKey = `task_draft_${simulationId}_${isEditing && dataDetail?.id ? dataDetail.id : 'new'}`;
            localStorage.removeItem(draftKey);
            setIsDirty(false);
            setDraftData(null);
            return result;
        } catch (error) {
            const msg = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi lưu Task.';
            setSubmitError(msg);
            message.error(msg);
            return false;
        }
    };

    // ── submit ────────────────────────────────
    const handleSubmit = async (values) => {
        try {
            setSubmitError(null);

            const formValues = form.getFieldsValue(true);
            const titleVal = formValues.title || values?.title || '';
            const descVal = formValues.description || values?.description;
            const nameVal = formValues.name || values?.name;

            const submitData = {
                name: symbol || nameVal?.trim() || '',
                title: titleVal?.trim() || '',
                description: descVal?.trim() || '',
                kind: isEditing ? dataDetail.kind : taskKind,
                simulationId: simulationId || 0,
                // Dùng contentRef.current để lấy nội dung mới nhất dù debounce chưa fire
                content: contentRef.current || content,
                imagePath: imagePath || null,
                videoPath: videoUrl || null,
                filePath: filePath || null,
            };

            if (submitData.kind === TaskTypes.SUBTASK) {
                submitData.parentId = parseInt(parentTaskInfo?.id || dataDetail?.parent?.id);
            } else {
                submitData.parentId = null;
            }

            // Kiểm tra nội dung có bị thay đổi so với template không
            if (templateSnapshot && isUnchangedFromTemplate(submitData, templateSnapshot)) {
                setPendingSubmitData(submitData);
                setTemplateConfirmVisible(true);
                return;
            }

            return await doSave(submitData);
        } catch (error) {
            const msg = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi lưu Task.';
            setSubmitError(msg);
            message.error(msg);
            return false;
        }
    };

    // Suppress unused variable warning for questions (used via setQuestions in fetch)
    void questions;

    // ─────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────

    return (
        <>
            <BaseForm id={formId} onFinish={handleSubmit} form={form} onValuesChange={handleValuesChange}>
                <Card className="card-form" bordered={false}>
                    {tabItems[0]?.children}

                    {/* Footer actions */}
                    <div className="footer-card-form" style={{ marginTop: 24 }}>
                        <Space>{actions}</Space>
                    </div>
                </Card>
            </BaseForm>

            {/* Modal xác nhận lưu nội dung từ template chưa chỉnh sửa */}
            <Modal
                title="Xác nhận lưu nội dung Template"
                open={templateConfirmVisible}
                onCancel={() => {
                    setTemplateConfirmVisible(false);
                    setPendingSubmitData(null);
                }}
                footer={[
                    <Button
                        key="cancel"
                        onClick={() => {
                            setTemplateConfirmVisible(false);
                            setPendingSubmitData(null);
                        }}
                    >
                        Hủy — Tiếp tục chỉnh sửa
                    </Button>,
                    <Button
                        key="confirm"
                        type="primary"
                        onClick={async () => {
                            setTemplateConfirmVisible(false);
                            if (pendingSubmitData) {
                                await doSave(pendingSubmitData);
                                setPendingSubmitData(null);
                            }
                        }}
                    >
                        Đồng ý — Lưu nội dung Template
                    </Button>,
                ]}
                width={480}
            >
                <div style={{ padding: '8px 0' }}>
                    <p style={{ marginBottom: 12 }}>
                        ⚠️ Bạn <strong>chưa chỉnh sửa nội dung</strong> so với mẫu template đã chọn.
                    </p>
                    <p style={{ color: '#666', fontSize: 13 }}>Hệ thống phát hiện các trường sau chưa được thay đổi:</p>
                    <ul style={{ color: '#666', fontSize: 13, paddingLeft: 20, marginBottom: 12 }}>
                        <li>
                            <strong>Tiêu đề</strong> — vẫn giống nội dung mẫu
                        </li>
                        <li>
                            <strong>Nội dung</strong> — vẫn giống nội dung mẫu
                        </li>
                        {templateSnapshot?.description?.trim() && (
                            <li>
                                <strong>Mô tả</strong> — vẫn giống nội dung mẫu
                            </li>
                        )}
                    </ul>
                    <p>Bạn có muốn lưu với nội dung hiện tại từ template không?</p>
                </div>
            </Modal>
        </>
    );
};

export default TaskForm;
