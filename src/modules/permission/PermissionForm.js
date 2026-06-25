import React, { useEffect } from 'react';
import { Card, Col, Row, AutoComplete, Form } from 'antd';

import { BaseForm } from '@components/common/form/BaseForm';
import TextField from '@components/common/form/TextField';

import useBasicForm from '@hooks/useBasicForm';
import useTranslate from '@hooks/useTranslate';
import { commonMessage } from '@locales/intl';

const PermissionForm = (props) => {
    const translate = useTranslate();
    const { formId, actions, dataDetail, onSubmit, setIsChangedFormValues, isEditing, existingGroups = [] } = props;

    const { form, mixinFuncs, onValuesChange } = useBasicForm({
        onSubmit,
        setIsChangedFormValues,
    });

    const handleSubmit = (values) => {
        return mixinFuncs.handleSubmit(values);
    };

    const validateEndpoint = (_, value) => {
        if (!value) {
            return Promise.reject(new Error('Vui lòng nhập action endpoint'));
        }
        const trimmed = value.trim();
        if (!trimmed.startsWith('/v1/')) {
            return Promise.reject(new Error('Endpoint phải bắt đầu bằng "/v1/" (ví dụ: /v1/permission...)'));
        }
        if (/\s/.test(trimmed)) {
            return Promise.reject(new Error('Endpoint không được chứa khoảng trắng'));
        }
        return Promise.resolve();
    };

    useEffect(() => {
        if (dataDetail) {
            form.setFieldsValue({
                ...dataDetail,
                permissionCode: dataDetail.pcode || dataDetail.permissionCode,
            });
        }
    }, [dataDetail]);

    return (
        <BaseForm
            id={formId}
            onFinish={handleSubmit}
            form={form}
            onValuesChange={onValuesChange}
            initialValues={{ showMenu: false }}
        >
            <Card className="card-form" bordered={false}>
                <Row gutter={16}>
                    <Col span={12}>
                        <TextField
                            label={translate.formatMessage(commonMessage.name)}
                            name="name"
                            required
                            placeholder="Nhập tên quyền"
                        />
                    </Col>
                    <Col span={12}>
                        <TextField
                            label="Mã quyền"
                            name="permissionCode"
                            required
                            disabled={isEditing}
                            placeholder="Nhập mã quyền"
                        />
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="Nhóm quyền"
                            name="nameGroup"
                            rules={[{ required: true, message: 'Vui lòng nhập hoặc chọn nhóm quyền' }]}
                        >
                            <AutoComplete
                                options={existingGroups.map((group) => ({ value: group }))}
                                placeholder="Nhập hoặc chọn nhóm quyền"
                                filterOption={(inputValue, option) =>
                                    option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                                }
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <TextField
                            label="Action"
                            name="action"
                            required
                            rules={[
                                {
                                    validator: validateEndpoint,
                                },
                            ]}
                            placeholder="Nhập action endpoint (ví dụ: /v1/permission...)"
                        />
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={24}>
                        <TextField
                            label={translate.formatMessage(commonMessage.description)}
                            type="textarea"
                            name="description"
                            placeholder="Nhập mô tả chi tiết"
                            required
                        />
                    </Col>
                </Row>

                <div className="footer-card-form">{actions}</div>
            </Card>
        </BaseForm>
    );
};

export default PermissionForm;
