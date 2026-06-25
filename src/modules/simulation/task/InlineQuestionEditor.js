import React, { useState } from 'react';
import { Button, Input, Checkbox, Tag, Empty, message } from 'antd';
import { PlusOutlined, DeleteOutlined, QuestionCircleOutlined } from '@ant-design/icons';

const { TextArea } = Input;

const emptyQuestion = () => ({
    id: Date.now() + Math.random(),
    question: '',
    options: [
        { id: Date.now() + 1, option: '', answer: false },
        { id: Date.now() + 2, option: '', answer: false },
    ],
});

const InlineQuestionEditor = ({ questions = [], onChange }) => {
    const [items, setItems] = useState(() => {
        if (questions && questions.length > 0) {
            return questions.map((q) => ({
                id: q.id || Date.now() + Math.random(),
                question: q.question || '',
                options: (() => {
                    try {
                        const parsed = typeof q.options === 'string' ? JSON.parse(q.options) : q.options || [];
                        return parsed.map((opt, idx) => ({
                            id: Date.now() + idx + Math.random(),
                            option: opt.option || opt.text || '',
                            answer: opt.answer || false,
                        }));
                    } catch {
                        return [
                            { id: Date.now() + 1, option: '', answer: false },
                            { id: Date.now() + 2, option: '', answer: false },
                        ];
                    }
                })(),
            }));
        }
        return [];
    });

    const syncToParent = (updatedItems) => {
        const mapped = updatedItems.map((item) => ({
            id: typeof item.id === 'number' && item.id > 100000 ? undefined : item.id,
            question: item.question,
            options: JSON.stringify(item.options.map((o) => ({ option: o.option, answer: o.answer }))),
        }));
        onChange?.(mapped);
    };

    const addQuestion = () => {
        const updated = [...items, emptyQuestion()];
        setItems(updated);
        syncToParent(updated);
    };

    const removeQuestion = (id) => {
        if (items.length <= 1) {
            message.warning('Cần có ít nhất 1 câu hỏi');
            return;
        }
        const updated = items.filter((q) => q.id !== id);
        setItems(updated);
        syncToParent(updated);
    };

    const updateQuestion = (id, field, value) => {
        const updated = items.map((q) => (q.id === id ? { ...q, [field]: value } : q));
        setItems(updated);
        syncToParent(updated);
    };

    const addOption = (qId) => {
        const updated = items.map((q) => {
            if (q.id !== qId) return q;
            const newId = Math.max(...q.options.map((o) => o.id), 0) + 1;
            return { ...q, options: [...q.options, { id: newId, option: '', answer: false }] };
        });
        setItems(updated);
        syncToParent(updated);
    };

    const removeOption = (qId, optId) => {
        const updated = items.map((q) => {
            if (q.id !== qId) return q;
            if (q.options.length <= 2) {
                message.warning('Cần có ít nhất 2 đáp án');
                return q;
            }
            return { ...q, options: q.options.filter((o) => o.id !== optId) };
        });
        setItems(updated);
        syncToParent(updated);
    };

    const updateOption = (qId, optId, field, value) => {
        const updated = items.map((q) => {
            if (q.id !== qId) return q;
            return {
                ...q,
                options: q.options.map((o) => (o.id === optId ? { ...o, [field]: value } : o)),
            };
        });
        setItems(updated);
        syncToParent(updated);
    };

    const setCorrectAnswer = (qId, optId) => {
        const updated = items.map((q) => {
            if (q.id !== qId) return q;
            return {
                ...q,
                options: q.options.map((o) => ({ ...o, answer: o.id === optId })),
            };
        });
        setItems(updated);
        syncToParent(updated);
    };

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <QuestionCircleOutlined style={{ color: '#1890ff' }} />
                <span style={{ fontWeight: 600 }}>Câu hỏi trắc nghiệm ({items.length})</span>
            </div>

            {items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', background: '#fafafa', borderRadius: 8, border: '1px dashed #d9d9d9' }}>
                    <Empty description="Chưa có câu hỏi nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </div>
            ) : (
                items.map((q, qIdx) => (
                    <div
                        key={q.id}
                        style={{
                            marginBottom: 16,
                            padding: 16,
                            background: '#fff',
                            borderRadius: 8,
                            border: '1px solid #e8e8e8',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Tag color="blue" style={{ fontSize: 13, padding: '2px 12px' }}>
                Câu hỏi {qIdx + 1}
                            </Tag>
                            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeQuestion(q.id)} size="small" />
                        </div>

                        <TextArea
                            placeholder="Nhập câu hỏi..."
                            value={q.question}
                            onChange={(e) => updateQuestion(q.id, 'question', e.target.value)}
                            rows={2}
                            style={{ marginBottom: 12 }}
                        />

                        <div style={{ padding: 12, background: '#fafafa', borderRadius: 6 }}>
                            <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>Đáp án (chọn checkbox để đánh dấu đúng):</div>
                            {q.options.map((opt, optIdx) => (
                                <div
                                    key={opt.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        marginBottom: 8,
                                        padding: '8px 12px',
                                        background: '#fff',
                                        borderRadius: 6,
                                        border: opt.answer ? '2px solid #52c41a' : '1px solid #e8e8e8',
                                    }}
                                >
                                    <Checkbox
                                        checked={opt.answer}
                                        onChange={() => setCorrectAnswer(q.id, opt.id)}
                                    />
                                    <Tag color="default" style={{ minWidth: 24, textAlign: 'center' }}>
                                        {String.fromCharCode(65 + optIdx)}
                                    </Tag>
                                    <Input
                                        placeholder={`Đáp án ${String.fromCharCode(65 + optIdx)}`}
                                        value={opt.option}
                                        onChange={(e) => updateOption(q.id, opt.id, 'option', e.target.value)}
                                        size="small"
                                        style={{ flex: 1 }}
                                        bordered={false}
                                    />
                                    {q.options.length > 2 && (
                                        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeOption(q.id, opt.id)} size="small" />
                                    )}
                                </div>
                            ))}
                            <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={() => addOption(q.id)} block>
                Thêm đáp án
                            </Button>
                        </div>
                    </div>
                ))
            )}

            <Button type="dashed" icon={<PlusOutlined />} onClick={addQuestion} block>
        Thêm câu hỏi
            </Button>
        </div>
    );
};

export default InlineQuestionEditor;
