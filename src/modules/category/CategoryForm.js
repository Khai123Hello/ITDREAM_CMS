import React, { useEffect } from 'react';
import { Card, Col, Row } from 'antd';

import { BaseForm } from '@components/common/form/BaseForm';
import TextField from '@components/common/form/TextField';

import useBasicForm from '@hooks/useBasicForm';
import useFetch from '@hooks/useFetch';
import useTranslate from '@hooks/useTranslate';

import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';

const CategoryForm = (props) => {
    const translate = useTranslate();

    const {
        formId,
        actions,
        dataDetail,
        onSubmit,
        setIsChangedFormValues,
        isEditing,
        kind,
    } = props;

    const { form, mixinFuncs, onValuesChange } = useBasicForm({
        onSubmit,
        setIsChangedFormValues,
    });

    // Hook để gọi API check duplicate
    const { execute: checkDuplicate, loading: checkingDuplicate } = useFetch(apiConfig.category.getList);

    // Ref để lưu tên ban đầu cố định của category khi edit
    const originalNameRef = React.useRef('');

    // Custom validator để kiểm tra tên mới
    const validateNameChanged = async (_, value) => {
        if (!value) {
            return Promise.reject(new Error(translate.formatMessage(commonMessage.required)));
        }

        const trimmedValue = value.trim();
        const originalNameVal = originalNameRef.current || dataDetail?.name || '';

        // Nếu đang edit, kiểm tra tên mới phải khác tên cũ (không phân biệt hoa thường)
        if (isEditing && originalNameVal) {
            const newNameLower = trimmedValue.toLowerCase();
            const oldNameLower = originalNameVal.trim().toLowerCase();
            
            if (newNameLower === oldNameLower) {
                return Promise.reject(
                    new Error('Tên mới phải khác với tên hiện tại'),
                );
            }
        }

        // Kiểm tra trùng lặp với database
        return new Promise((resolve, reject) => {
            checkDuplicate({
                params: { name: trimmedValue, kind: kind || dataDetail?.kind },
                onCompleted: (response) => {
                    if (response.result === true) {
                        const { content } = response.data || {};
                        
                        if (content && content.length > 0) {
                            // Tìm xem có record nào trùng tên (không phân biệt hoa thường)
                            const duplicateItem = content.find(item => 
                                item.name.toLowerCase() === trimmedValue.toLowerCase(),
                            );

                            if (duplicateItem) {
                                // Nếu đang edit và trùng với chính nó thì OK
                                if (isEditing && dataDetail?.id === duplicateItem.id) {
                                    resolve();
                                } else {
                                    // Trùng với record khác
                                    reject(new Error('Tên category này đã tồn tại trong hệ thống!'));
                                }
                            } else {
                                resolve();
                            }
                        } else {
                            resolve();
                        }
                    } else {
                        resolve(); // Nếu API lỗi, vẫn cho phép submit
                    }
                },
                onError: () => {
                    resolve(); // Nếu API lỗi, vẫn cho phép submit
                },
            });
        });
    };

    const handleSubmit = (values) => {
        return mixinFuncs.handleSubmit(values);
    };

    useEffect(() => {
        const localName = localStorage.getItem('edit_category_name');
        if (localName) {
            form.setFieldsValue({
                name: localName,
            });
            originalNameRef.current = localName; // Lưu tên cũ ban đầu từ localStorage
            localStorage.removeItem('edit_category_name');
        }
    }, []);

    useEffect(() => {
        if (dataDetail?.name) {
            form.setFieldsValue({
                name: dataDetail.name,
            });
            if (!originalNameRef.current) {
                originalNameRef.current = dataDetail.name; // Lưu tên cũ từ API nếu chưa có
            }
        }
    }, [dataDetail]);

    return (
        <BaseForm id={formId} onFinish={handleSubmit} form={form} onValuesChange={onValuesChange}>
            <Card className="card-form" bordered={false}>
                <Row gutter={16}>
                    <Col span={24}>
                        <TextField
                            label={translate.formatMessage(commonMessage.name)}
                            name="name"
                            rules={[
                                {
                                    validator: validateNameChanged,
                                },
                            ]}
                            placeholder="Nhập tên"
                            validateTrigger={['onBlur', 'onChange']}
                        />
                    </Col>
                </Row>

                {/* Hiển thị tên hiện tại khi đang edit */}
                {isEditing && originalNameRef.current && (
                    <Row gutter={16} style={{ marginTop: 8 }}>
                        <Col span={24}>
                            <div style={{
                                padding: '8px 12px',
                                background: '#f5f5f5',
                                borderRadius: '4px',
                                fontSize: '13px',
                                color: '#666',
                            }}>
                                <strong>Tên hiện tại:</strong> {originalNameRef.current}
                            </div>
                        </Col>
                    </Row>
                )}

                <div className="footer-card-form">{actions}</div>
            </Card>
        </BaseForm>
    );
};

export default CategoryForm;