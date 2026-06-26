import React, { useState } from 'react';
import { Card, Button, Input, Space, Checkbox, Tag, Divider, Empty, Tooltip, Popconfirm } from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    QuestionCircleOutlined,
    CheckCircleOutlined,
    DragOutlined,
} from '@ant-design/icons';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const { TextArea } = Input;

// -------------------------------------------------------------
// Sortable Question Item Component
// -------------------------------------------------------------
const SortableQuestionItem = ({
    question,
    index,
    updateQuestion,
    removeQuestion,
    addOption,
    updateOption,
    removeOption,
    handleCorrectChange,
    disabled,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: question.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        marginBottom: 16,
        background: '#fff',
        borderRadius: 8,
        border: '1px solid #e8e8e8',
        boxShadow: isDragging ? '0 10px 20px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.05)',
        zIndex: isDragging ? 999 : 'auto',
        position: 'relative',
    };

    return (
        <div ref={setNodeRef} style={style}>
            <div
                style={{
                    padding: '12px 16px',
                    background: '#fafafa',
                    borderBottom: '1px solid #e8e8e8',
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                        {...attributes}
                        {...listeners}
                        style={{
                            cursor: disabled ? 'not-allowed' : 'grab',
                            color: '#bfbfbf',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <DragOutlined style={{ fontSize: 16 }} />
                    </span>
                    <span style={{ fontWeight: 600, color: '#262626', fontSize: 15 }}>
                        Câu hỏi {index + 1}
                    </span>
                </div>
                {!disabled && (
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa câu hỏi này?"
                        onConfirm={() => removeQuestion(question.id)}
                        okText="Xóa"
                        cancelText="Hủy"
                    >
                        <Button type="text" danger icon={<DeleteOutlined />} size="small">
                            Xóa câu hỏi
                        </Button>
                    </Popconfirm>
                )}
            </div>

            <div style={{ padding: '16px' }}>
                <TextArea
                    placeholder="Nhập nội dung câu hỏi..."
                    value={question.question}
                    onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                    rows={2}
                    disabled={disabled}
                    style={{ marginBottom: 16, fontSize: 15 }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {question.options.map((option, optIndex) => {
                        const isCorrect = option.answer;
                        return (
                            <div
                                key={option.id || optIndex}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 12,
                                    padding: '12px',
                                    borderRadius: 6,
                                    border: isCorrect ? '2px solid #52c41a' : '1px solid #d9d9d9',
                                    background: isCorrect ? '#f6ffed' : '#fff',
                                    transition: 'all 0.3s',
                                }}
                            >
                                <div style={{ paddingTop: 6 }}>
                                    <Tooltip title="Đánh dấu là đáp án đúng">
                                        <Checkbox
                                            checked={isCorrect}
                                            onChange={(e) =>
                                                handleCorrectChange(question.id, option.id, e.target.checked)
                                            }
                                            disabled={disabled}
                                        />
                                    </Tooltip>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <Tag color={isCorrect ? 'success' : 'default'} style={{ margin: 0 }}>
                                            Đáp án {String.fromCharCode(65 + optIndex)}
                                        </Tag>
                                        {isCorrect && (
                                            <span style={{ color: '#52c41a', fontSize: 13, fontWeight: 500 }}>
                                                <CheckCircleOutlined style={{ marginRight: 4 }} />
                                                Đúng
                                            </span>
                                        )}
                                    </div>
                                    <TextArea
                                        placeholder={`Nội dung đáp án ${String.fromCharCode(65 + optIndex)}...`}
                                        value={option.option}
                                        onChange={(e) =>
                                            updateOption(question.id, option.id, 'option', e.target.value)
                                        }
                                        rows={1}
                                        autoSize={{ minRows: 1, maxRows: 3 }}
                                        disabled={disabled}
                                    />
                                </div>
                                {!disabled && question.options.length > 2 && (
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => removeOption(question.id, option.id)}
                                        style={{ marginTop: 28 }}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {!disabled && (
                    <Button
                        type="dashed"
                        onClick={() => addOption(question.id)}
                        icon={<PlusOutlined />}
                        style={{ marginTop: 16 }}
                        block
                    >
                        Thêm đáp án
                    </Button>
                )}
            </div>
        </div>
    );
};


// -------------------------------------------------------------
// Main TaskQuestionManager Component
// -------------------------------------------------------------
const TaskQuestionManager = ({ value = [], onChange, disabled = false }) => {
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    );

    const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Ensure options always have unique IDs for React keys and updating
    const normalizeQuestions = (qs) => {
        return (qs || []).map(q => ({
            ...q,
            id: q.id || generateId(),
            options: (q.options || []).map(o => ({
                ...o,
                id: o.id || generateId(),
            })),
        }));
    };

    const questions = normalizeQuestions(value);

    const triggerChange = (newQuestions) => {
        if (onChange) {
            onChange(newQuestions);
        }
    };

    const addQuestion = () => {
        const newQuestion = {
            id: generateId(),
            question: '',
            options: [
                { id: generateId(), option: '', answer: true },
                { id: generateId(), option: '', answer: false },
            ],
        };
        triggerChange([...questions, newQuestion]);
    };

    const updateQuestion = (qId, field, val) => {
        const newQs = questions.map(q => q.id === qId ? { ...q, [field]: val } : q);
        triggerChange(newQs);
    };

    const removeQuestion = (qId) => {
        const newQs = questions.filter(q => q.id !== qId);
        triggerChange(newQs);
    };

    const addOption = (qId) => {
        const newQs = questions.map(q => {
            if (q.id === qId) {
                return {
                    ...q,
                    options: [...q.options, { id: generateId(), option: '', answer: false }],
                };
            }
            return q;
        });
        triggerChange(newQs);
    };

    const updateOption = (qId, optId, field, val) => {
        const newQs = questions.map(q => {
            if (q.id === qId) {
                return {
                    ...q,
                    options: q.options.map(o => o.id === optId ? { ...o, [field]: val } : o),
                };
            }
            return q;
        });
        triggerChange(newQs);
    };

    const removeOption = (qId, optId) => {
        const newQs = questions.map(q => {
            if (q.id === qId && q.options.length > 2) {
                return {
                    ...q,
                    options: q.options.filter(o => o.id !== optId),
                };
            }
            return q;
        });
        triggerChange(newQs);
    };

    const handleCorrectChange = (qId, optId, checked) => {
        // Enforce single correct answer per question
        const newQs = questions.map(q => {
            if (q.id === qId) {
                return {
                    ...q,
                    options: q.options.map(o => ({
                        ...o,
                        answer: o.id === optId ? checked : false,
                    })),
                };
            }
            return q;
        });
        triggerChange(newQs);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            const oldIndex = questions.findIndex(q => q.id === active.id);
            const newIndex = questions.findIndex(q => q.id === over.id);
            triggerChange(arrayMove(questions, oldIndex, newIndex));
        }
    };

    return (
        <div style={{ marginTop: 8 }}>
            {questions.length === 0 ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        <span style={{ color: '#8c8c8c' }}>
                            Chưa có câu hỏi nào. Hãy nhấn &quot;Thêm câu hỏi&quot; để bắt đầu.
                        </span>
                    }
                >
                    {!disabled && (
                        <Button type="primary" onClick={addQuestion} icon={<PlusOutlined />}>
                            Thêm câu hỏi
                        </Button>
                    )}
                </Empty>
            ) : (
                <>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={questions.map(q => q.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {questions.map((q, index) => (
                                <SortableQuestionItem
                                    key={q.id}
                                    question={q}
                                    index={index}
                                    updateQuestion={updateQuestion}
                                    removeQuestion={removeQuestion}
                                    addOption={addOption}
                                    updateOption={updateOption}
                                    removeOption={removeOption}
                                    handleCorrectChange={handleCorrectChange}
                                    disabled={disabled}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                    
                    {!disabled && (
                        <Button
                            type="dashed"
                            size="large"
                            onClick={addQuestion}
                            icon={<PlusOutlined />}
                            block
                            style={{ height: 48, marginTop: 8 }}
                        >
                            Thêm câu hỏi mới
                        </Button>
                    )}
                </>
            )}
        </div>
    );
};

export default TaskQuestionManager;
