import React, { useEffect, useState, useRef } from 'react';
import { Card, Col, Row } from 'antd';

import { BaseForm } from '@components/common/form/BaseForm';
import TextField from '@components/common/form/TextField';
import SelectField from '@components/common/form/SelectField';

import useBasicForm from '@hooks/useBasicForm';
import useFetch from '@hooks/useFetch';
import useTranslate from '@hooks/useTranslate';

import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';

const NationForm = (props) => {
    const translate = useTranslate();
    const { formId, actions, dataDetail, onSubmit, setIsChangedFormValues, isEditing, kind, parentId, parentName } = props;

    const { form, mixinFuncs, onValuesChange } = useBasicForm({
        onSubmit,
        setIsChangedFormValues,
    });

    const { execute: checkDuplicate } = useFetch(apiConfig.nation.getList);
    const { execute: fetchProvinces } = useFetch(apiConfig.nation.getList);

    const [provinces, setProvinces] = useState([]);
    const provincesFetchedRef = useRef(false);
    const originalNameRef = useRef('');

    // When parentName becomes available (async from NationSavePage) and the full
    // province list hasn't loaded yet, seed with this single option so the
    // disabled Select shows the name instead of the raw ID.
    useEffect(() => {
        if (parentId && parentName && !provincesFetchedRef.current) {
            setProvinces([{ value: parseInt(parentId), label: parentName }]);
        }
    }, [parentName, parentId]);

    useEffect(() => {
        if (kind === 2) {
            fetchProvinces({
                params: { kind: 1, page: 0, size: 100 },
                onCompleted: (res) => {
                    if (res.result) {
                        const provinceOptions = res.data?.content?.map((item) => ({
                            value: item.id,
                            label: item.name,
                        })) || [];
                        provincesFetchedRef.current = true;
                        setProvinces(provinceOptions);
                    }
                },
            });
        }
    }, [kind]);

    useEffect(() => {
        form.setFieldsValue({
            name: dataDetail?.name,
            parentId: dataDetail?.parent?.id || (parentId ? parseInt(parentId) : undefined),
        });
        if (dataDetail?.name) {
            originalNameRef.current = dataDetail.name;
        }
    }, [dataDetail, parentId]);

    const validateNameChanged = async (_, value) => {
        if (!value || !value.trim()) {
            return Promise.resolve();
        }

        const trimmedValue = value.trim();
        const originalNameVal = originalNameRef.current || dataDetail?.name || '';

        // If editing and name has not changed, it is valid
        if (isEditing && originalNameVal && trimmedValue.toLowerCase() === originalNameVal.trim().toLowerCase()) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const currentParentId = form.getFieldValue('parentId') || parentId;
            const params = {
                name: trimmedValue,
            };
            if (kind === 1) {
                params.kind = 1;
            } else {
                params.parentId = currentParentId ? parseInt(currentParentId) : undefined;
            }

            checkDuplicate({
                params,
                onCompleted: (response) => {
                    if (response.result === true) {
                        const { content } = response.data || {};
                        if (content && content.length > 0) {
                            const duplicateItem = content.find(
                                (item) => item.name.toLowerCase() === trimmedValue.toLowerCase(),
                            );
                            if (duplicateItem && duplicateItem.id !== dataDetail?.id) {
                                reject(new Error('Tên địa chỉ này đã tồn tại trong cấp bậc này!'));
                            } else {
                                resolve();
                            }
                        } else {
                            resolve();
                        }
                    } else {
                        resolve();
                    }
                },
                onError: () => {
                    resolve();
                },
            });
        });
    };

    const handleSubmit = (values) => {
        return mixinFuncs.handleSubmit(values);
    };

    return (
        <BaseForm id={formId} onFinish={handleSubmit} form={form} onValuesChange={onValuesChange}>
            <Card className="card-form" bordered={false}>
                <Row gutter={16}>
                    <Col span={kind === 2 ? 16 : 24}>
                        <TextField
                            label={translate.formatMessage(commonMessage.name)}
                            name="name"
                            rules={[
                                {
                                    validator: validateNameChanged,
                                },
                            ]}
                            placeholder="Nhập tên địa chỉ"
                            validateTrigger={['onBlur', 'onChange']}
                            required
                        />
                    </Col>
                    {kind === 2 && (
                        <Col span={8}>
                            <SelectField
                                label="Tỉnh / Thành phố"
                                name="parentId"
                                options={provinces}
                                placeholder="Chọn Tỉnh / Thành phố"
                                required
                                disabled={!!parentId}
                            />
                        </Col>
                    )}
                </Row>

                <div className="footer-card-form">{actions}</div>
            </Card>
        </BaseForm>
    );
};

export default NationForm;
