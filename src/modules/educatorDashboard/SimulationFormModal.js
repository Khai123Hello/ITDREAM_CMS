import React, { useEffect } from 'react';
import { Modal, Form, Input } from 'antd';

const SimulationFormModal = ({ open, onCancel, onSubmit, initialValues, loading, title }) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (open) {
            form.resetFields();
            if (initialValues) {
                form.setFieldsValue(initialValues);
            }
        }
    }, [open, initialValues, form]);

    const handleOk = () => {
        form.validateFields().then((values) => {
            onSubmit(values);
        });
    };

    return (
        <Modal open={open} title={title} onCancel={onCancel} onOk={handleOk} confirmLoading={loading} destroyOnClose>
            <Form form={form} layout="vertical" initialValues={initialValues}>
                <Form.Item
                    name="name"
                    label="Simulation Name"
                    rules={[{ required: true, message: 'Please input the simulation name' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="description"
                    label="Description"
                    rules={[{ required: true, message: 'Please input the description' }]}
                >
                    <Input.TextArea rows={3} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default SimulationFormModal;
