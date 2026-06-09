import React, { useEffect, useState } from 'react';
import {
    Card,
    Col,
    Row,
    Button,
    Input,
    Space,
    Modal,
    Divider,
    Tag,
    Alert,
    message,
    Tabs,
    Table,
    Popconfirm,
    Tooltip,
} from 'antd';
import { EyeOutlined, BookOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useLocation } from 'react-router-dom';

import { BaseForm } from '@components/common/form/BaseForm';
import CropImageField from '@components/common/form/CropImageField';
import TextField from '@components/common/form/TextField';
import SelectField from '@components/common/form/SelectField';
import BlockEditor from '@components/common/editor/BlockEditor';
// import TiptapEditor from '@components/common/editor/TiptapEditor';
import TaskQuestionForm from '@modules/simulation/taskQuestion/TaskQuestionForm';

import useBasicForm from '@hooks/useBasicForm';
import useFetch from '@hooks/useFetch';
import useTranslate from '@hooks/useTranslate';

import { AppConstants, TaskTypes, UserTypes, storageKeys } from '@constants';
import { getData } from '@utils/localStorage';
import apiConfig from '@constants/apiConfig';
import { taskKindOptions, taskTypeOptions, questionTypeOptions } from '@constants/masterData';
import { commonMessage } from '@locales/intl';

// ─────────────────────────────────────────────
// parseBulkQuestions
// ─────────────────────────────────────────────
const parseBulkQuestions = (text) => {
    const lines = text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    const questions = [];
    let currentQuestion = null;

    lines.forEach((line) => {
        const questionMatch = line.match(/^(?:Câu\s+\d+[:.]|\d+[./])\s*(.*)$/i);
        if (questionMatch) {
            if (currentQuestion) {
                questions.push(currentQuestion);
            }
            currentQuestion = {
                question: questionMatch[1].trim(),
                questionType: 2,
                options: [],
            };
            return;
        }

        const optionMatch = line.match(/^(\*?)([A-Z])[./]\s*(.*)$/i);
        if (optionMatch && currentQuestion) {
            currentQuestion.questionType = 3;
            currentQuestion.options.push({
                option: optionMatch[3].trim(),
                answer: optionMatch[1] === '*',
            });
            return;
        }

        if (currentQuestion) {
            if (currentQuestion.options.length === 0) {
                currentQuestion.question = (currentQuestion.question + '\n' + line).trim();
            } else {
                const lastOpt = currentQuestion.options[currentQuestion.options.length - 1];
                lastOpt.option = (lastOpt.option + ' ' + line).trim();
            }
        }
    });

    if (currentQuestion) {
        questions.push(currentQuestion);
    }

    return questions.map((q) => {
        if (q.questionType === 3) {
            return {
                question: q.question,
                questionType: 3,
                options: JSON.stringify(q.options),
            };
        } else {
            return {
                question: q.question,
                questionType: 2,
                options: null,
            };
        }
    });
};

// ─────────────────────────────────────────────
// TaskForm
// ─────────────────────────────────────────────

const TaskForm = (props) => {
    const translate = useTranslate();
    const kindValues = translate.formatKeys(taskKindOptions, ['label']);
    const typeValues = translate.formatKeys(taskTypeOptions, ['label']);
    const location = useLocation();

    const userType = getData(storageKeys.USER_TYPE);
    const isEducator = userType === UserTypes.EDUCATOR;

    const parentTaskFromState = props.parentTask || location.state?.parentTask;

    const { formId, actions, dataDetail, onSubmit, setIsChangedFormValues, isEditing, simulationId } = props;

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
            if (dataDetail.kind === TaskTypes.SUBTASK || dataDetail.parentId) {
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
            if (dataDetail.kind === TaskTypes.SUBTASK || dataDetail.parentId) {
                return TaskTypes.SUBTASK;
            }
            return TaskTypes.TASK;
        }
        return null;
    });

    const [previewVisible, setPreviewVisible] = useState(false);
    const [content, setContent] = useState('');
    const [submitError, setSubmitError] = useState(null);

    // Draft recovery states
    const [draftData, setDraftData] = useState(null);
    const [isDirty, setIsDirty] = useState(false);
    const [changeTrigger, setChangeTrigger] = useState(0);

    // Bulk question import states
    const [bulkModalVisible, setBulkModalVisible] = useState(false);
    const [bulkText, setBulkText] = useState('');
    const [bulkLoading, setBulkLoading] = useState(false);

    const { form, mixinFuncs, onValuesChange } = useBasicForm({ onSubmit, setIsChangedFormValues });

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
        setIsChangedFormValues(true);
        setDraftData(null);
        message.success('Khôi phục bản nháp thành công!');
    };

    const handleDeleteDraft = () => {
        const draftKey = `task_draft_${simulationId}_${isEditing && dataDetail?.id ? dataDetail.id : 'new'}`;
        localStorage.removeItem(draftKey);
        setDraftData(null);
        setIsDirty(false);
        message.success('Xóa bản nháp thành công!');
    };

    const handleImportBulkQuestions = async (text) => {
        if (!text || !text.trim()) {
            message.warning('Vui lòng nhập nội dung câu hỏi.');
            return;
        }

        setBulkLoading(true);
        try {
            const parsed = parseBulkQuestions(text);
            if (parsed.length === 0) {
                message.error('Không tìm thấy câu hỏi hợp lệ trong văn bản.');
                return;
            }

            for (const q of parsed) {
                const res = await createQuestion({
                    data: {
                        question: q.question,
                        questionType: q.questionType,
                        options: q.options,
                        taskId: dataDetail.id,
                    },
                });
                if (!res || res.result !== true) {
                    message.error(`Lỗi khi tạo câu hỏi: "${q.question.substring(0, 30)}..."`);
                }
            }

            message.success(`Nhập thành công ${parsed.length} câu hỏi!`);
            setBulkModalVisible(false);
            setBulkText('');
            loadQuestions();
        } catch (error) {
            console.error('Error importing bulk questions:', error);
            message.error('Có lỗi xảy ra khi nhập câu hỏi.');
        } finally {
            setBulkLoading(false);
        }
    };

    // ── Local state for questions ────────────────
    const [questions, setQuestions] = useState([]);
    const [questionsLoading, setQuestionsLoading] = useState(false);
    const [questionModalVisible, setQuestionModalVisible] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [activeTab, setActiveTab] = useState('1');

    const formattedQuestionTypeOptions = translate.formatKeys(questionTypeOptions, ['label']);
    const questionTypeMap = Object.fromEntries(formattedQuestionTypeOptions.map((item) => [item.value, item]));

    // ── fetch, create, update, delete APIs ────────
    const { execute: fetchQuestions } = useFetch(
        isEducator ? apiConfig.taskQuestion.educatorList : apiConfig.taskQuestion.getList,
        {
            immediate: false,
            onCompleted: (response) => {
                const resData = response?.data || (response?.result === undefined ? response : null);
                if (resData) {
                    setQuestions(resData.content || []);
                }
                setQuestionsLoading(false);
            },
            onError: () => {
                setQuestionsLoading(false);
            },
        },
    );

    const { execute: createQuestion } = useFetch(apiConfig.taskQuestion.create, {
        immediate: false,
    });

    const { execute: updateQuestion } = useFetch(apiConfig.taskQuestion.update, {
        immediate: false,
    });

    const { execute: deleteQuestion } = useFetch(apiConfig.taskQuestion.delete, {
        immediate: false,
    });

    const loadQuestions = () => {
        if (isEditing && dataDetail?.id) {
            setQuestionsLoading(true);
            fetchQuestions({
                params: { taskId: dataDetail.id, page: 0, size: 100 },
            });
        }
    };

    useEffect(() => {
        loadQuestions();
    }, [isEditing, dataDetail?.id]);

    const handleSaveQuestion = async (values) => {
        try {
            let result;
            if (editingQuestion?.id) {
                result = await updateQuestion({
                    data: {
                        ...values,
                        id: editingQuestion.id,
                        taskId: dataDetail.id,
                        options: values.options,
                    },
                });
            } else {
                result = await createQuestion({
                    data: {
                        ...values,
                        taskId: dataDetail.id,
                        options: values.options,
                    },
                });
            }

            if (result?.result === true) {
                message.success(editingQuestion?.id ? 'Cập nhật câu hỏi thành công!' : 'Tạo mới câu hỏi thành công!');
                setQuestionModalVisible(false);
                setEditingQuestion(null);
                loadQuestions();
            } else {
                message.error(result?.message || 'Có lỗi xảy ra khi lưu câu hỏi');
            }
        } catch (error) {
            message.error('Có lỗi xảy ra khi lưu câu hỏi');
        }
    };

    const handleDeleteQuestion = async (id) => {
        try {
            const result = await deleteQuestion({
                pathParams: { id },
            });

            if (result?.result === true) {
                message.success('Xóa câu hỏi thành công!');
                loadQuestions();
            } else {
                message.error(result?.message || 'Không thể xóa câu hỏi');
            }
        } catch (error) {
            message.error('Có lỗi xảy ra khi xóa câu hỏi');
        }
    };

    const parseOptions = (optionsStr) => {
        if (!optionsStr || optionsStr === 'null' || optionsStr === 'undefined') {
            return <span style={{ color: '#999' }}>-</span>;
        }

        try {
            let options = typeof optionsStr === 'string' ? JSON.parse(optionsStr) : optionsStr;

            if (Array.isArray(options) && options.length > 0) {
                return (
                    <div>
                        {options.map((opt, idx) => {
                            let content = '';
                            let isCorrect = false;

                            if (typeof opt === 'object' && opt !== null) {
                                content = opt.option || opt.content || opt.text || '';
                                isCorrect = opt.answer === true || opt.isCorrect === true;
                            } else {
                                content = String(opt);
                            }

                            if (!content) return null;

                            return (
                                <div key={idx} style={{ marginBottom: 4 }}>
                                    <Tag
                                        color={isCorrect ? 'success' : 'default'}
                                        style={{
                                            padding: '2px 8px',
                                            fontSize: '13px',
                                            borderRadius: '4px',
                                        }}
                                    >
                                        {isCorrect && <span style={{ marginRight: 4 }}>✓</span>}
                                        {content}
                                    </Tag>
                                </div>
                            );
                        })}
                    </div>
                );
            }
            return <span style={{ color: '#999' }}>-</span>;
        } catch (error) {
            return <span style={{ color: '#999' }}>-</span>;
        }
    };

    const questionColumns = [
        {
            title: '#',
            width: '60px',
            align: 'center',
            render: (_, __, index) => index + 1,
        },
        {
            title: 'Câu hỏi',
            dataIndex: 'question',
            ellipsis: true,
            render: (text) => (
                <Tooltip title={text}>
                    <span>{text}</span>
                </Tooltip>
            ),
        },
        {
            title: 'Đáp án',
            dataIndex: 'options',
            width: '300px',
            render: (options) => <div style={{ maxHeight: 100, overflow: 'auto' }}>{parseOptions(options)}</div>,
        },
        {
            title: 'Loại câu hỏi',
            dataIndex: 'questionType',
            align: 'center',
            width: '180px',
            render: (type) => {
                const item = questionTypeMap[type] || {};
                return (
                    <Tag color={item.color || 'blue'}>
                        <div style={{ padding: '0 4px', fontSize: 13 }}>{item.label || 'N/A'}</div>
                    </Tag>
                );
            },
        },
        {
            title: 'Hành động',
            align: 'center',
            width: '120px',
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => {
                            setEditingQuestion(record);
                            setQuestionModalVisible(true);
                        }}
                    />
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa câu hỏi này?"
                        onConfirm={() => handleDeleteQuestion(record.id)}
                        okText="Có"
                        cancelText="Không"
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    // ── kind label ────────────────────────────
    const getCurrentKindLabel = () => {
        const currentKind = isEditing ? dataDetail?.kind : taskKind;
        return kindValues.find((k) => k.value === currentKind)?.label || 'Task';
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

                    {/* Register title and description in Ant form store */}
                    <div style={{ display: 'none' }}>
                        <TextField name="title" />
                        <TextField name="description" />
                    </div>

                    {/* Name & Thể loại nội dung */}
                    <Row gutter={16}>
                        <Col span={12}>
                            <TextField
                                label={translate.formatMessage(commonMessage.name)}
                                required
                                name="name"
                                requiredMsg={translate.formatMessage(commonMessage.required)}
                                placeholder="Nhập tên nhiệm vụ"
                                disabled={!isEducator}
                            />
                        </Col>
                        <Col span={12}>
                            <SelectField
                                label="Thể loại nội dung"
                                required
                                name="type"
                                requiredMsg="Vui lòng chọn thể loại nội dung"
                                options={typeValues}
                                disabled={!isEducator || taskKind === TaskTypes.TASK}
                            />
                        </Col>
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
                                        key={dataDetail?.id || 'new'}
                                        initialTitle={dataDetail?.title || ''}
                                        initialDescription={dataDetail?.description || ''}
                                        initialContent={dataDetail?.content || dataDetail?.introduction || ''}
                                        autoLoadTemplate={taskKind === TaskTypes.TASK && !isEditing}
                                        defaultTemplate="task"
                                        onChange={({ title: newTitle, description: newDesc, content: newContent }) => {
                                            form.setFieldsValue({
                                                title: newTitle,
                                                description: newDesc,
                                            });
                                            setContent(newContent);
                                            setIsChangedFormValues(true);
                                        }}
                                    />
                                ) : (
                                    <div className="read-only-preview-wrap" style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
                                        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>{dataDetail?.title || ''}</h2>
                                        <p style={{ color: '#666', marginBottom: '16px', fontStyle: 'italic' }}>{dataDetail?.description || ''}</p>
                                        <Divider style={{ margin: '12px 0' }} />
                                        <RenderPreviewBlocks content={dataDetail?.content || dataDetail?.introduction || ''} />
                                    </div>
                                )
                            ) : null}
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
                                disabled={!isEducator}
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
                                    disabled={!isEducator}
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
                                    disabled={!isEducator}
                                />
                                {filePath && (
                                    <div style={{ marginTop: 6, color: '#888', fontSize: 12 }}>📄 {filePath}</div>
                                )}
                            </div>
                        </Col>
                    </Row>
                </>
            ),
        },
        // Chỉ hiển thị Tab Câu hỏi khi đang edit
        ...(isEditing
            ? [
                {
                    key: '2',
                    label: `Câu hỏi kiểm tra (${questions.length})`,
                    children: (
                        <div style={{ padding: '8px 0' }}>
                            {isEducator && (
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 16 }}>
                                    <Button
                                        icon={<PlusOutlined />}
                                        onClick={() => {
                                            setBulkText('');
                                            setBulkModalVisible(true);
                                        }}
                                    >
                                          Nhập hàng loạt
                                    </Button>
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={() => {
                                            setEditingQuestion(null);
                                            setQuestionModalVisible(true);
                                        }}
                                    >
                                          Thêm câu hỏi
                                    </Button>
                                </div>
                            )}
                            <Table
                                columns={isEducator ? questionColumns : questionColumns.filter((col) => col.title !== 'Hành động')}
                                dataSource={questions}
                                loading={questionsLoading}
                                rowKey={(record) => record.id}
                                pagination={{ pageSize: 10 }}
                            />
                        </div>
                    ),
                },
            ]
            : []),
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
            if (dataDetail?.kind === TaskTypes.SUBTASK || dataDetail?.parentId) {
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
                type:
                    dataDetail.type !== undefined
                        ? dataDetail.type
                        : dataDetail.kind === TaskTypes.TASK
                            ? 0
                            : undefined,
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

            if (!values.title?.trim()) {
                message.error('Vui lòng nhập tiêu đề nhiệm vụ.');
                return false;
            }
            if (!values.description?.trim()) {
                message.error('Vui lòng nhập mô tả nhiệm vụ.');
                return false;
            }
            if (values.type === undefined || values.type === null) {
                message.error('Vui lòng chọn thể loại nội dung.');
                return false;
            }

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
                type: values.type,
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

    // ─────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────
    return (
        <>
            <BaseForm id={formId} onFinish={handleSubmit} form={form} onValuesChange={handleValuesChange}>
                <Card className="card-form" bordered={false}>
                    <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

                    {/* Footer actions */}
                    <div className="footer-card-form" style={{ marginTop: 24 }}>
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

            {/* Modal for editing/creating question inline */}
            <Modal
                title={editingQuestion?.id ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi mới'}
                open={questionModalVisible}
                onCancel={() => {
                    setQuestionModalVisible(false);
                    setEditingQuestion(null);
                }}
                footer={null}
                width={850}
                destroyOnClose
            >
                <div style={{ padding: '12px 0' }}>
                    <TaskQuestionForm
                        dataDetail={editingQuestion || {}}
                        formId="task-question-modal-form"
                        isEditing={!!editingQuestion?.id}
                        onSubmit={handleSaveQuestion}
                        taskId={dataDetail?.id}
                        actions={
                            <Space style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                                <Button
                                    onClick={() => {
                                        setQuestionModalVisible(false);
                                        setEditingQuestion(null);
                                    }}
                                >
                                    Hủy
                                </Button>
                                <Button type="primary" htmlType="submit">
                                    Lưu
                                </Button>
                            </Space>
                        }
                    />
                </div>
            </Modal>

            {/* Modal for bulk question import */}
            <Modal
                title="Nhập câu hỏi hàng loạt"
                open={bulkModalVisible}
                onCancel={() => {
                    if (!bulkLoading) {
                        setBulkModalVisible(false);
                    }
                }}
                footer={[
                    <Button key="cancel" onClick={() => setBulkModalVisible(false)} disabled={bulkLoading}>
                        Hủy
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={bulkLoading}
                        onClick={() => handleImportBulkQuestions(bulkText)}
                    >
                        Nhập câu hỏi
                    </Button>,
                ]}
                width={700}
                destroyOnClose
            >
                <div style={{ padding: '12px 0' }}>
                    <div style={{ marginBottom: 12, color: '#666', fontSize: 13 }}>
                        💡 Định dạng mẫu:
                        <pre style={{ background: '#fafafa', padding: 8, borderRadius: 4, marginTop: 4 }}>
                            {`1. Thủ đô của Việt Nam là gì?
A. TP. Hồ Chí Minh
*B. Hà Nội
C. Đà Nẵng

2. Trái Đất quay quanh Mặt Trời mất bao lâu?
A. 24 giờ
*B. 365 ngày`}
                        </pre>
                    </div>
                    <Input.TextArea
                        rows={12}
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        placeholder="Dán câu hỏi của bạn tại đây..."
                        disabled={bulkLoading}
                    />
                </div>
            </Modal>
        </>
    );
};

// ─────────────────────────────────────────────
// TaskPreviewModal
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
                                        <div className="out-step-row">
                                            <span className="out-step-label">{b.label}: </span>
                                            <span className="out-step-body">{renderStepBody(b.body)}</span>
                                        </div>
                                    </div>,
                                );
                                break;
                            }
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
                <RenderPreviewBlocks content={data.content || ''} />
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
