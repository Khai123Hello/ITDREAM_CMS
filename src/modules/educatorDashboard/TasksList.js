import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Popconfirm, message, Spin } from 'antd';
import apiConfig from '@constants/apiConfig';
import useFetch from '@hooks/useFetch';
import useFetchAction from '@hooks/useFetchAction';

const TasksList = ({ simulation, selectedTask, onSelectTask }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [form] = Form.useForm();

    // Data fetching
    const {
        loading: listLoading,
        data,
        error,
        execute: fetchTasks,
        setData: setTasksData,
    } = useFetch(apiConfig.task.listByEducator, {
        immediate: !!simulation?.id,
        params: simulation?.id ? { simulationId: simulation.id } : {},
    });

    useEffect(() => {
        if (simulation?.id) {
            fetchTasks({ params: { simulationId: simulation.id } });
        } else {
            setTasksData({ data: [] });
        }
        // eslint-disable-next-line
    }, [simulation]);

    // Create/Update/Delete
    const { execute: doCreate, loading: creating } = useFetchAction(apiConfig.task.create);
    const { execute: doUpdate, loading: updating } = useFetchAction(apiConfig.task.update);
    const { execute: doDelete, loading: deleting } = useFetchAction(apiConfig.task.delete);

    const openModal = (task = null) => {
        setEditingTask(task);
        setModalVisible(true);
        if (task) {
            form.setFieldsValue(task);
        } else {
            form.resetFields();
        }
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingTask(null);
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            if (editingTask) {
                // Edit
                doUpdate({
                    params: { ...editingTask, ...values },
                    onCompleted: (res) => {
                        if (res.result) {
                            message.success('Task updated!');
                            fetchTasks({ params: { simulationId: simulation.id } });
                            closeModal();
                        } else {
                            message.error(res.message || 'Update failed');
                        }
                    },
                    onError: () => message.error('Failed to update task'),
                });
            } else {
                // Create
                doCreate({
                    params: { ...values, simulationId: simulation.id },
                    onCompleted: (res) => {
                        if (res.result) {
                            message.success('Task created!');
                            fetchTasks({ params: { simulationId: simulation.id } });
                            closeModal();
                        } else {
                            message.error(res.message || 'Create failed');
                        }
                    },
                    onError: () => message.error('Failed to create task'),
                });
            }
        } catch (err) {
            // Validation failed
        }
    };

    const handleDelete = (task) => {
        doDelete({
            pathParams: { id: task.id },
            onCompleted: (res) => {
                if (res.result) {
                    message.success('Task deleted!');
                    fetchTasks({ params: { simulationId: simulation.id } });
                } else {
                    message.error(res.message || 'Delete failed');
                }
            },
            onError: () => message.error('Failed to delete task'),
        });
    };

    const columns = [
        { title: 'Title', dataIndex: 'title', key: 'title' },
        { title: 'Description', dataIndex: 'description', key: 'description' },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <>
                    <Button size="small" onClick={() => openModal(record)} style={{ marginRight: 8 }}>
                        Edit
                    </Button>
                    <Popconfirm
                        title="Delete this task?"
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

    // For robust error display
    useEffect(() => {
        if (error) message.error('Failed to load tasks');
    }, [error]);

    // Main list
    const tasks = data?.data || [];

    return (
        <div style={{ marginTop: 24 }}>
            <div style={{ marginBottom: 16 }}>
                <Button type="primary" onClick={() => openModal()} disabled={!simulation?.id || listLoading}>
                    Add Task
                </Button>
            </div>
            <Spin spinning={listLoading || creating || updating || deleting}>
                <Table
                    rowKey="id"
                    dataSource={tasks}
                    columns={columns}
                    pagination={false}
                    rowClassName={(record) => (selectedTask?.id === record.id ? 'ant-table-row-selected' : '')}
                    onRow={(record) => ({
                        onClick: () => {
                            onSelectTask && onSelectTask(record);
                        },
                    })}
                />
            </Spin>
            <Modal
                open={modalVisible}
                title={editingTask ? 'Edit Task' : 'Add Task'}
                onCancel={closeModal}
                onOk={handleModalOk}
                confirmLoading={creating || updating}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="title"
                        label="Title"
                        rules={[{ required: true, message: 'Please input the task title' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Description">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default TasksList;
