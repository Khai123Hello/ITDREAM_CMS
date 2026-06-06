import React, { useState } from 'react';
import { Button, Form, Input, Modal, Table } from 'antd';
import useListBase from '@hooks/useListBase';
import apiConfig from '@constants/apiConfig';
import useTranslate from '@hooks/useTranslate';

const SpecializationListPage = () => {
    const t = useTranslate();
    const [editItem, setEditItem] = useState(null);
    const [form] = Form.useForm();

    const {
        data,
        loading,
        pagination,
        fetchData,
        searchParams,
        setSearchParams,
    } = useListBase({
        apiConfig: apiConfig.specialization,
        options: {
            pageSize: 10,
            objectName: t('specialization'),
        },
    });

    const columns = [
        {
            title: t('ID'),
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: t('Name'),
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: t('Actions'),
            key: 'actions',
            render: (record) => (
                <Button type="link" onClick={() => handleEdit(record)}>
                    {t('Edit')}
                </Button>
            ),
        },
    ];

    const handleEdit = (record) => {
        setEditItem(record);
        form.setFieldsValue(record);
    };

    const handleUpdate = async () => {
        const values = await form.validateFields();
        // Call API update
        await apiConfig.specialization.update.call({ id: editItem.id, ...values });
        setEditItem(null);
        fetchData();
    };

    return (
        <>
            <div style={{ marginBottom: 16 }}>
                <Input.Search
                    placeholder={t('Search by name')}
                    onSearch={(value) =>
                        setSearchParams({ ...searchParams, keyword: value })
                    }
                    style={{ width: 300 }}
                />
            </div>

            <Table
                rowKey="id"
                columns={columns}
                dataSource={data?.content || []}
                loading={loading}
                pagination={pagination}
            />

            <Modal
                title={t('Edit specialization')}
                open={!!editItem}
                onCancel={() => setEditItem(null)}
                onOk={handleUpdate}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        label={t('Name')}
                        name="name"
                        rules={[{ required: true, message: t('Please enter name') }]}
                    >
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default SpecializationListPage;
