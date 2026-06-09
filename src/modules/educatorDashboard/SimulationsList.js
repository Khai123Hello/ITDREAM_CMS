import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message, Modal } from 'antd';
import apiConfig from '@constants/apiConfig';
import useFetch from '@hooks/useFetch';
import useFetchAction from '@hooks/useFetchAction';
import SimulationFormModal from './SimulationFormModal';

const SimulationsList = ({ onSelectSimulation, selectedSimulation }) => {
    const [deletingId, setDeletingId] = useState(null);
    const { execute: doDelete } = useFetchAction(apiConfig.simulation.educatorDelete);

    const { data, loading, error, execute } = useFetch(
        { ...apiConfig.simulation.getListForEducator },
        { immediate: true },
    );
    const [simulations, setSimulations] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState('create'); // or 'edit'
    const [editingItem, setEditingItem] = useState(null);
    const [submitLoading, setSubmitLoading] = useState(false);

    const { execute: doCreate } = useFetchAction(apiConfig.simulation.create);
    const { execute: doUpdate } = useFetchAction(apiConfig.simulation.update);

    useEffect(() => {
        if (data?.data?.list) {
            setSimulations(data.data.list);
        }
        if (error) {
            message.error('Failed to load simulations');
        }
    }, [data, error]);

    const openCreateModal = () => {
        setModalType('create');
        setEditingItem(null);
        setModalOpen(true);
    };

    const openEditModal = (simulation) => {
        setModalType('edit');
        setEditingItem(simulation);
        setModalOpen(true);
    };

    const handleCancel = () => {
        setModalOpen(false);
        setEditingItem(null);
    };

    const handleSubmit = (values) => {
        setSubmitLoading(true);
        const action = modalType === 'create' ? doCreate : doUpdate;
        const payload = modalType === 'edit' ? { ...editingItem, ...values } : values;
        action({
            params: payload,
            onCompleted: (response) => {
                setSubmitLoading(false);
                setModalOpen(false);
                if (response.result) {
                    message.success(`${modalType === 'create' ? 'Created' : 'Updated'} simulation successfully`);
                    execute(); // Refresh list
                } else {
                    message.error(response?.message || 'Operation failed');
                }
            },
            onError: () => {
                setSubmitLoading(false);
                message.error('Request failed');
            },
        });
    };

    const handleDelete = (record) => {
        setDeletingId(record.id);
        doDelete({
            params: { id: record.id },
            onCompleted: (response) => {
                setDeletingId(null);
                if (response.result) {
                    message.success('Deleted simulation');
                    execute(); // Refresh list
                } else {
                    message.error(response?.message || 'Failed to delete simulation');
                }
            },
            onError: () => {
                setDeletingId(null);
                message.error('Delete failed');
            },
        });
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Description',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button type="link" onClick={() => openEditModal(record)}>
                        Edit
                    </Button>
                    <Button
                        type="link"
                        danger
                        loading={deletingId === record.id}
                        onClick={() => {
                            Modal.confirm({
                                title: 'Delete Simulation',
                                content: `Are you sure you want to delete "${record.name}"?`,
                                okText: 'Delete',
                                okButtonProps: { danger: true },
                                onOk: () => handleDelete(record),
                            });
                        }}
                    >
                        Delete
                    </Button>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Button type="primary" onClick={openCreateModal}>
                    Create Simulation
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={simulations}
                rowKey="id"
                loading={loading}
                locale={{ emptyText: 'No Simulations found' }}
                pagination={{ pageSize: 10 }}
            />
            <SimulationFormModal
                open={modalOpen}
                onCancel={handleCancel}
                onSubmit={handleSubmit}
                initialValues={editingItem}
                loading={submitLoading}
                title={modalType === 'create' ? 'Create Simulation' : 'Edit Simulation'}
            />
        </div>
    );
};

export default SimulationsList;
