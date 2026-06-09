import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Popconfirm, message, Spin, Alert } from 'antd';
import apiConfig from '@constants/apiConfig';
import useFetch from '@hooks/useFetch';
import useFetchAction from '@hooks/useFetchAction';

const TaskQuestionsList = ({ task }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [form] = Form.useForm();

    // Data fetching: questions for this task
    const {
        loading: listLoading,
        data,
        error,
        execute: fetchQuestions,
        setData: setQuestionsData,
    } = useFetch(apiConfig.taskQuestion.educatorList, {
        immediate: !!task?.id,
        params: task?.id ? { taskId: task.id } : {},
    });

    useEffect(() => {
        if (task?.id) {
            fetchQuestions({ params: { taskId: task.id } });
        } else {
            setQuestionsData({ data: [] });
        }
        // eslint-disable-next-line
    }, [task]);

    // Placeholders for Create/Update/Delete actions (to be implemented)
    const { execute: doCreate, loading: creating } = useFetchAction(apiConfig.taskQuestion.create);
    const { execute: doUpdate, loading: updating } = useFetchAction(apiConfig.taskQuestion.update);
    const { execute: doDelete, loading: deleting } = useFetchAction(apiConfig.taskQuestion.delete);

    // Table columns
    const columns = [
        { title: 'Content', dataIndex: 'content', key: 'content' },
        { title: 'Explanation', dataIndex: 'explanation', key: 'explanation' },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <>
                    <Button size="small" style={{ marginRight: 8 }} onClick={() => openModal(record)}>
                        Edit
                    </Button>
                    <Popconfirm
                        title="Delete this question?"
                        onConfirm={() => handleDelete(record)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button danger size="small">
                            Delete
                        </Button>
                    </Popconfirm>
                </>
            ),
        },
    ];

    // Main list
    const questions = data?.data || [];

    // Modal control
    const openModal = (question = null) => {
        setEditingQuestion(question);
        setModalVisible(true);
        if (question) {
            form.setFieldsValue(question);
        } else {
            form.resetFields();
        }
    };
    const closeModal = () => {
        setModalVisible(false);
        setEditingQuestion(null);
    };

    // Handle Add/Edit submission
    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            if (editingQuestion) {
                // Update existing
                doUpdate({
                    params: { ...editingQuestion, ...values },
                    onCompleted: (res) => {
                        if (res.result) {
                            message.success('Question updated!');
                            fetchQuestions({ params: { taskId: task.id } });
                            closeModal();
                        } else {
                            message.error(res.message || 'Update failed');
                        }
                    },
                    onError: () => message.error('Failed to update question'),
                });
            } else {
                // Create new
                doCreate({
                    params: { ...values, taskId: task.id },
                    onCompleted: (res) => {
                        if (res.result) {
                            message.success('Question created!');
                            fetchQuestions({ params: { taskId: task.id } });
                            closeModal();
                        } else {
                            message.error(res.message || 'Create failed');
                        }
                    },
                    onError: () => message.error('Failed to create question'),
                });
            }
        } catch (err) {
            // Validation failed
        }
    };

    // Delete handler
    const handleDelete = (question) => {
        doDelete({
            pathParams: { id: question.id },
            onCompleted: (res) => {
                if (res.result) {
                    message.success('Question deleted!');
                    fetchQuestions({ params: { taskId: task.id } });
                } else {
                    message.error(res.message || 'Delete failed');
                }
            },
            onError: () => message.error('Failed to delete question'),
        });
    };

    if (!task?.id) {
        return <Alert showIcon message="No task selected - cannot load questions." type="warning" />;
    }

    return (
        <div style={{ marginTop: 24 }}>
            <div style={{ marginBottom: 16 }}>
                <Button type="primary" onClick={() => openModal()} disabled={listLoading}>
                    Add Question
                </Button>
            </div>
            <Spin spinning={listLoading || creating || updating || deleting}>
                <Table rowKey="id" dataSource={questions} columns={columns} pagination={false} />
            </Spin>
            <Modal
                open={modalVisible}
                title={editingQuestion ? 'Edit Question' : 'Add Question'}
                onCancel={closeModal}
                onOk={handleModalOk}
                confirmLoading={creating || updating}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="content"
                        label="Content"
                        rules={[{ required: true, message: 'Please input the question content' }]}
                    >
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item name="explanation" label="Explanation">
                        <Input.TextArea rows={2} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default TaskQuestionsList;
