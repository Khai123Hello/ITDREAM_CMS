import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Button, Space, Checkbox, Input, Form, Modal, Radio, Divider, Tag } from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    EyeOutlined,
    QuestionCircleOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
} from '@ant-design/icons';

import { BaseForm } from '@components/common/form/BaseForm';
import TextField from '@components/common/form/TextField';

import useBasicForm from '@hooks/useBasicForm';
import useTranslate from '@hooks/useTranslate';

import { commonMessage } from '@locales/intl';

const { TextArea } = Input;

const TaskQuestionForm = (props) => {
    const translate = useTranslate();

    const { formId, actions, dataDetail, onSubmit, setIsChangedFormValues, taskId } = props;

    const [options, setOptions] = useState([
        { id: 1, option: '', answer: false },
        { id: 2, option: '', answer: false },
    ]);

    const [previewVisible, setPreviewVisible] = useState(false);

    const { form, mixinFuncs, onValuesChange } = useBasicForm({
        onSubmit,
        setIsChangedFormValues,
    });

    const addOption = () => {
        const newId = Math.max(...options.map((o) => o.id), 0) + 1;
        setOptions([...options, { id: newId, option: '', answer: false }]);
        setIsChangedFormValues(true);
    };

    const removeOption = (id) => {
        if (options.length > 2) {
            setOptions(options.filter((opt) => opt.id !== id));
            setIsChangedFormValues(true);
        }
    };

    const updateOption = (id, field, value) => {
        setOptions(options.map((opt) => (opt.id === id ? { ...opt, [field]: value } : opt)));
        setIsChangedFormValues(true);
    };

    const handleCorrectChange = (id, checked) => {
        // Chỉ cho phép 1 đáp án đúng cho trắc nghiệm
        setOptions(
            options.map((opt) => ({
                ...opt,
                answer: opt.id === id ? checked : false,
            })),
        );
        setIsChangedFormValues(true);
    };

    const handleSubmit = (values) => {
        // Validate có ít nhất 1 đáp án đúng
        const hasCorrect = options.some((opt) => opt.answer);
        if (!hasCorrect) {
            form.setFields([
                {
                    name: 'options',
                    errors: ['Vui lòng chọn ít nhất 1 đáp án đúng'],
                },
            ]);
            return;
        }

        // Validate tất cả options phải có content
        const emptyOption = options.find((opt) => !opt.option.trim());
        if (emptyOption) {
            form.setFields([
                {
                    name: 'options',
                    errors: ['Vui lòng nhập nội dung cho tất cả các đáp án'],
                },
            ]);
            return;
        }

        return mixinFuncs.handleSubmit({
            question: values.question?.trim() || '',
            taskId: taskId,
            options: JSON.stringify(options.map(({ option, answer }) => ({ option, answer }))),
        });
    };

    // Get preview data
    const getPreviewData = () => {
        const formValues = form.getFieldsValue();
        return {
            ...formValues,
            options: options,
            questionTypeLabel: 'Trắc nghiệm',
        };
    };

    useEffect(() => {
        if (dataDetail) {
            form.setFieldsValue({
                question: dataDetail?.question,
            });

            // Parse options từ JSON string
            if (dataDetail?.options) {
                try {
                    const parsedOptions = JSON.parse(dataDetail.options);
                    if (Array.isArray(parsedOptions)) {
                        setOptions(
                            parsedOptions.map((opt, idx) => ({
                                id: idx + 1,
                                option: opt.option || '',
                                answer: opt.answer || false,
                            })),
                        );
                    }
                } catch (e) {
                    console.error('Failed to parse options:', e);
                }
            }
        }
    }, [dataDetail]);

    return (
        <>
            <BaseForm id={formId} onFinish={handleSubmit} form={form} onValuesChange={onValuesChange}>
                <Card className="card-form" bordered={false}>
                    <Row gutter={16}>
                        <Col span={24}>
                            <TextField
                                label={translate.formatMessage(commonMessage.question)}
                                required
                                name="question"
                                requiredMsg={translate.formatMessage(commonMessage.required)}
                                type="textarea"
                                rows={4}
                                placeholder="Nhập câu hỏi của bạn..."
                            />
                        </Col>
                    </Row>

                    <Divider orientation="left">Các đáp án</Divider>

                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item label="Danh sách đáp án (Chọn checkbox để đánh dấu đáp án đúng)" name="options">
                                <div
                                    style={{
                                        padding: '16px',
                                        background: '#fafafa',
                                        borderRadius: '8px',
                                    }}
                                >
                                    {options.map((option, index) => (
                                        <div
                                            key={option.id}
                                            style={{
                                                marginBottom: 12,
                                                padding: '12px',
                                                background: 'white',
                                                borderRadius: '8px',
                                                border: option.answer ? '2px solid #52c41a' : '1px solid #d9d9d9',
                                            }}
                                        >
                                            <Space style={{ display: 'flex', width: '100%' }} align="start">
                                                <Checkbox
                                                    checked={option.answer}
                                                    onChange={(e) => handleCorrectChange(option.id, e.target.checked)}
                                                    style={{ marginTop: '8px' }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '8px',
                                                            marginBottom: '8px',
                                                        }}
                                                    >
                                                        <Tag color="blue">Đáp án {String.fromCharCode(65 + index)}</Tag>
                                                        {option.answer && (
                                                            <Tag color="success" icon={<CheckCircleOutlined />}>
                                                                Đúng
                                                            </Tag>
                                                        )}
                                                    </div>
                                                    <TextArea
                                                        placeholder={`Nhập nội dung đáp án ${String.fromCharCode(65 + index)}`}
                                                        value={option.option}
                                                        onChange={(e) =>
                                                            updateOption(option.id, 'option', e.target.value)
                                                        }
                                                        rows={2}
                                                    />
                                                </div>
                                                {options.length > 2 && (
                                                    <Button
                                                        type="text"
                                                        danger
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => removeOption(option.id)}
                                                        style={{ marginTop: '4px' }}
                                                    />
                                                )}
                                            </Space>
                                        </div>
                                    ))}
                                    <Button
                                        type="dashed"
                                        onClick={addOption}
                                        icon={<PlusOutlined />}
                                        block
                                        style={{ marginTop: 8 }}
                                    >
                                        Thêm đáp án
                                    </Button>
                                </div>
                            </Form.Item>
                        </Col>
                    </Row>

                    <div className="footer-card-form">
                        <Space>
                            <Button icon={<EyeOutlined />} onClick={() => setPreviewVisible(true)}>
                                Xem trước
                            </Button>
                            {actions}
                        </Space>
                    </div>
                </Card>
            </BaseForm>

            {/* Preview Modal - Giống trang làm bài của học viên */}
            <QuestionPreviewModal
                visible={previewVisible}
                onClose={() => setPreviewVisible(false)}
                data={getPreviewData()}
            />
        </>
    );
};

// Component Preview Modal - Giống trang làm bài trắc nghiệm thật
const QuestionPreviewModal = ({ visible, onClose, data }) => {
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showResult, setShowResult] = useState(false);

    const handleSubmitDemo = () => {
        setShowResult(true);
    };

    const handleReset = () => {
        setSelectedAnswer(null);
        setShowResult(false);
    };

    const correctAnswer = data.options?.find((opt) => opt.answer);

    return (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <QuestionCircleOutlined style={{ color: '#1890ff' }} />
                    <span>Xem trước - Giao diện làm bài của học viên</span>
                </div>
            }
            open={visible}
            onCancel={onClose}
            width={800}
            footer={[
                <Button key="close" onClick={onClose}>
                    Đóng
                </Button>,
            ]}
            style={{ top: 20 }}
        >
            <div
                style={{
                    padding: '24px',
                    background: '#f5f5f5',
                    minHeight: '400px',
                    borderRadius: '8px',
                }}
            >
                {/* Question Card */}
                <Card
                    style={{
                        marginBottom: '24px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                >
                    <div style={{ marginBottom: '16px' }}>
                        <Tag color="blue">{data.questionTypeLabel}</Tag>
                    </div>

                    <h3
                        style={{
                            fontSize: '18px',
                            lineHeight: '1.6',
                            marginBottom: '24px',
                            color: '#262626',
                        }}
                    >
                        {data.question || 'Chưa có câu hỏi'}
                    </h3>

                    {data.options && data.options.length > 0 ? (
                        <div>
                            <Radio.Group
                                style={{ width: '100%' }}
                                value={selectedAnswer}
                                onChange={(e) => setSelectedAnswer(e.target.value)}
                                disabled={showResult}
                            >
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    {data.options.map((option, index) => {
                                        const isCorrect = option.answer;
                                        const isSelected = selectedAnswer === option.id;

                                        let backgroundColor = 'white';
                                        let borderColor = '#d9d9d9';

                                        if (showResult) {
                                            if (isCorrect) {
                                                backgroundColor = '#f6ffed';
                                                borderColor = '#52c41a';
                                            } else if (isSelected && !isCorrect) {
                                                backgroundColor = '#fff2e8';
                                                borderColor = '#ff4d4f';
                                            }
                                        }

                                        return (
                                            <div
                                                key={option.id}
                                                style={{
                                                    padding: '16px',
                                                    background: backgroundColor,
                                                    border: `2px solid ${borderColor}`,
                                                    borderRadius: '8px',
                                                    transition: 'all 0.3s',
                                                    cursor: showResult ? 'default' : 'pointer',
                                                }}
                                            >
                                                <Radio value={option.id} style={{ width: '100%' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <Tag color="blue">{String.fromCharCode(65 + index)}</Tag>
                                                        <span style={{ flex: 1 }}>{option.option}</span>
                                                        {showResult && isCorrect && (
                                                            <CheckCircleOutlined
                                                                style={{ color: '#52c41a', fontSize: '18px' }}
                                                            />
                                                        )}
                                                        {showResult && isSelected && !isCorrect && (
                                                            <CloseCircleOutlined
                                                                style={{ color: '#ff4d4f', fontSize: '18px' }}
                                                            />
                                                        )}
                                                    </div>
                                                </Radio>
                                            </div>
                                        );
                                    })}
                                </Space>
                            </Radio.Group>

                            {/* Action Buttons */}
                            <div style={{ marginTop: '24px', textAlign: 'center' }}>
                                {!showResult ? (
                                    <Button
                                        type="primary"
                                        size="large"
                                        onClick={handleSubmitDemo}
                                        disabled={!selectedAnswer}
                                    >
                                        Nộp bài
                                    </Button>
                                ) : (
                                    <Space>
                                        <Button size="large" onClick={handleReset}>
                                            Làm lại
                                        </Button>
                                        <Button type="primary" size="large">
                                            Câu tiếp theo
                                        </Button>
                                    </Space>
                                )}
                            </div>

                            {/* Result */}
                            {showResult && (
                                <div
                                    style={{
                                        marginTop: '24px',
                                        padding: '16px',
                                        background: selectedAnswer === correctAnswer?.id ? '#f6ffed' : '#fff2e8',
                                        border: `2px solid ${selectedAnswer === correctAnswer?.id ? '#52c41a' : '#ff4d4f'}`,
                                        borderRadius: '8px',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginBottom: '8px',
                                        }}
                                    >
                                        {selectedAnswer === correctAnswer?.id ? (
                                            <>
                                                <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '24px' }} />
                                                <strong style={{ color: '#52c41a' }}>Chính xác!</strong>
                                            </>
                                        ) : (
                                            <>
                                                <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '24px' }} />
                                                <strong style={{ color: '#ff4d4f' }}>Chưa chính xác</strong>
                                            </>
                                        )}
                                    </div>
                                    <p style={{ margin: 0, color: '#595959' }}>
                                        Đáp án đúng là: <strong>{correctAnswer?.option}</strong>
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div
                            style={{
                                padding: '40px',
                                textAlign: 'center',
                                color: '#999',
                            }}
                        >
                            Chưa cấu hình câu trả lời trắc nghiệm
                        </div>
                    )}
                </Card>

                {/* Info box */}
                <div
                    style={{
                        padding: '12px 16px',
                        background: '#e6f7ff',
                        border: '1px solid #91d5ff',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#666',
                    }}
                >
                    💡 Đây là giao diện mà học viên sẽ thấy khi làm bài. Bạn có thể thử chọn đáp án và nộp bài để xem
                    kết quả.
                </div>
            </div>
        </Modal>
    );
};

export default TaskQuestionForm;
