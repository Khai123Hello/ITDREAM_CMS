import { Card, Col, Row, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';

import { confirmPasswordValidator, emailValidator, passwordValidator, phoneValidator } from '@utils/formValidator';

import useBasicForm from '@hooks/useBasicForm';
import TextField from '@components/common/form/TextField';
import CropImageField from '@components/common/form/CropImageField';
import DatePickerField from '@components/common/form/DatePickerField';
import { AppConstants, DEFAULT_FORMAT, groupRolesOptions } from '@constants';
import { statusOptions } from '@constants/masterData';
import useFetch from '@hooks/useFetch';
import apiConfig from '@constants/apiConfig';
import useTranslate from '@hooks/useTranslate';
import { commonMessage } from '@locales/intl';
import { BaseForm } from '@components/common/form/BaseForm';
import SelectField from '@components/common/form/SelectField';
import { showErrorMessage } from '@services/notifyService';

const AdminForm = (props) => {
    const translate = useTranslate();
    const groupPermissionValues = translate.formatKeys(statusOptions, ['label']);
    const groupRolesValues = translate.formatKeys(groupRolesOptions, ['label']);

    const { formId, actions, dataDetail, onSubmit, setIsChangedFormValues, groups, branchs, isEditing } = props;
    const { execute: executeUpFile } = useFetch(apiConfig.file.upload);
    const [imageUrl, setImageUrl] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { form, mixinFuncs, onValuesChange } = useBasicForm({
        onSubmit,
        setIsChangedFormValues,
    });

    const uploadFile = (file, onSuccess, onError) => {
        executeUpFile({
            data: {
                type: 'AVATAR',
                file: file,
            },
            onCompleted: (response) => {
                if (response.result === true) {
                    onSuccess();
                    setImageUrl(response.data.filePath);
                    setIsChangedFormValues(true);
                }
            },
            onError: (error) => {
                onError();
            },
        });
    };

    const { data: admins, loading: adminsLoading } = useFetch(apiConfig.account.getList, {
        immediate: true,
        mappingData: (res) => {
            console.log('🔍 Raw API Response:', res);
            // Xử lý nhiều cấu trúc data khác nhau
            const result = res?.data?.content || res?.data || res?.content || [];
            console.log('📊 Mapped Admins:', result);
            return Array.isArray(result) ? result : [];
        },
    });

    const handleSubmit = async (values) => {
        console.log('🚀 === FORM SUBMIT STARTED ===');
        console.log('📝 Form Values:', values);
        console.log('✏️ Is Editing:', isEditing);
        console.log('🖼️ Image URL:', imageUrl);
        console.log('👥 Admins Data:', admins);
        console.log('👥 Admins Type:', typeof admins, Array.isArray(admins));
        console.log('⏳ Admins Loading:', adminsLoading);

        // Kiểm tra nếu đang loading danh sách admins
        if (adminsLoading) {
            console.warn('⚠️ Admins still loading, preventing submit');
            showErrorMessage('Đang tải dữ liệu, vui lòng đợi một chút!', translate);
            return;
        }

        // Kiểm tra nếu đang submit
        if (isSubmitting) {
            console.warn('⚠️ Already submitting, preventing duplicate');
            return;
        }

        setIsSubmitting(true);

        try {
            let hasError = false;

            // Đảm bảo admins là array trước khi validate
            const adminsList = Array.isArray(admins) ? admins : [];
            console.log('✅ Admins List for validation:', adminsList);

            // Validate username chỉ khi tạo mới
            if (!isEditing && adminsList.length > 0) {
                const userByUsername = adminsList.find((item) => item.username === values.username);
                if (userByUsername) {
                    console.error('❌ Username already exists:', values.username);
                    form.setFields([
                        {
                            name: 'username',
                            errors: [translate.formatMessage(commonMessage.usernameExisted)],
                        },
                    ]);
                    hasError = true;
                } else {
                    form.setFields([{ name: 'username', errors: [] }]);
                }
            }

            // Validate email
            if (adminsList.length > 0) {
                const emailConflict = adminsList.find((item) => item.email === values.email && item.id !== dataDetail?.id);
                if (emailConflict) {
                    console.error('❌ Email already exists:', values.email);
                    form.setFields([
                        {
                            name: 'email',
                            errors: [translate.formatMessage(commonMessage.emailExisted)],
                        },
                    ]);
                    hasError = true;
                } else {
                    form.setFields([{ name: 'email', errors: [] }]);
                }
            }

            // Validate phone (nếu có nhập)
            if (values.phone && adminsList.length > 0) {
                const phoneConflict = adminsList.find((item) => item.phone === values.phone && item.id !== dataDetail?.id);
                if (phoneConflict) {
                    console.error('❌ Phone already exists:', values.phone);
                    form.setFields([
                        {
                            name: 'phone',
                            errors: [translate.formatMessage(commonMessage.phoneExisted)],
                        },
                    ]);
                    hasError = true;
                } else {
                    form.setFields([{ name: 'phone', errors: [] }]);
                }
            }

            // Nếu có lỗi validation, dừng submit
            if (hasError) {
                console.error('❌ Validation failed, stopping submit');
                showErrorMessage('Thông tin đã tồn tại!', translate);
                setIsSubmitting(false);
                return;
            }

            // Format birthday
            const formattedBirthday = values.birthday 
                ? dayjs(values.birthday).format(DEFAULT_FORMAT)
                : null;

            // Chuẩn bị data để submit
            const submitData = {
                ...values,
                avatar: imageUrl,
                birthday: formattedBirthday,
                groupId: values.groupId || 15, // Đảm bảo luôn có groupId, mặc định là 15
            };

            console.log('✅ Validation passed, submitting data:', submitData);

            // Gọi API submit
            const result = await mixinFuncs.handleSubmit(submitData);
            
            console.log('✅ Submit completed:', result);
            
            return result;

        } catch (error) {
            console.error('❌ Submit error:', error);
            showErrorMessage('Có lỗi xảy ra, vui lòng thử lại!', translate);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        console.log('📊 Data Detail Changed:', dataDetail);
        
        // Chuyển chuỗi ngày tháng từ dataDetail thành đối tượng dayjs
        const initialBirthday = dataDetail?.birthday 
            ? dayjs(dataDetail.birthday, DEFAULT_FORMAT) 
            : null;

        form.setFieldsValue({
            username: dataDetail?.username || '',
            fullName: dataDetail?.fullName || '',
            email: dataDetail?.email || '',
            phone: dataDetail?.phone || '',
            // Nếu đang edit thì lấy groupId từ dataDetail, nếu tạo mới thì mặc định là 15
            groupId: dataDetail?.group?.id || (!isEditing ? 15 : undefined),
            password: dataDetail?.password || '',
            birthday: initialBirthday,
            status: dataDetail?.status !== undefined ? dataDetail.status : undefined,
        });
        
        setImageUrl(dataDetail?.avatar || null);
    }, [dataDetail, form, isEditing]);

    // Hiển thị loading khi đang tải danh sách admins
    if (adminsLoading) {
        return (
            <Card className="card-form" bordered={false}>
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Spin size="large" />
                    <p style={{ marginTop: '16px' }}>Đang tải dữ liệu...</p>
                </div>
            </Card>
        );
    }

    return (
        <BaseForm id={formId} onFinish={handleSubmit} form={form} onValuesChange={onValuesChange}>
            <Card className="card-form" bordered={false}>
                <Row gutter={16}>
                    <Col span={12}>
                        <CropImageField
                            label={translate.formatMessage(commonMessage.avatar)}
                            name="avatar"
                            imageUrl={imageUrl && `${AppConstants.contentRootUrl}${imageUrl}`}
                            aspect={1 / 1}
                            uploadFile={uploadFile}
                        />
                    </Col>
                </Row>
                
                <Row gutter={16}>
                    <Col span={12}>
                        <TextField
                            required
                            requiredMsg={translate.formatMessage(commonMessage.required)}
                            disabled={isEditing}
                            label={translate.formatMessage(commonMessage.username)}
                            name="username"
                        />
                    </Col>
                    <Col span={12}>
                        <TextField
                            requiredMsg={translate.formatMessage(commonMessage.required)}
                            label={translate.formatMessage(commonMessage.fullName)}
                            required
                            name="fullName"
                        />
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <TextField
                            requiredMsg={translate.formatMessage(commonMessage.required)}
                            label={translate.formatMessage(commonMessage.email)}
                            name="email"
                            type="email"
                            required
                            rules={[
                                {
                                    validator: (_, value) => emailValidator(_, value, translate),
                                },
                            ]}
                        />
                    </Col>
                    <Col span={12}>
                        <TextField
                            label={translate.formatMessage(commonMessage.phone)}
                            name="phone"
                            type="phone"
                            requiredMsg={translate.formatMessage(commonMessage.required)}
                            minLength="10"
                            maxLength="10"
                            rules={[
                                {
                                    validator: (_, value) => phoneValidator(_, value, translate),
                                },
                            ]}
                        />
                    </Col>
                </Row>
                
                <Row gutter={16}>
                    <Col span={12}>
                        <DatePickerField
                            name="birthday"
                            label="Ngày sinh"
                            format="DD/MM/YYYY"
                            showTime={false}
                            style={{ width: '100%' }}
                        />
                    </Col>
                    <Col span={12}>
                        <SelectField
                            required
                            name="status"
                            label={translate.formatMessage(commonMessage.status)}
                            allowClear={false}
                            options={groupPermissionValues}
                            requiredMsg={translate.formatMessage(commonMessage.required)}
                        />
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <TextField
                            label={translate.formatMessage(commonMessage.password)}
                            name="password"
                            type="password"
                            required={!isEditing}
                            requiredMsg={translate.formatMessage(commonMessage.required)}
                            rules={[
                                {
                                    validator: () => passwordValidator(form, translate),
                                },
                            ]}
                        />
                    </Col>
                    <Col span={12}>
                        <TextField
                            label={translate.formatMessage(commonMessage.confirmPassword)}
                            required={!isEditing}
                            name="confirmPassword"
                            requiredMsg={translate.formatMessage(commonMessage.required)}
                            type="password"
                            rules={[
                                {
                                    validator: () => confirmPasswordValidator(form, translate),
                                },
                            ]}
                        />
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <SelectField
                            required
                            name="groupId"
                            label={translate.formatMessage(commonMessage.groupPermission)}
                            allowClear={false}
                            options={groups}
                            disabled={isEditing}
                            requiredMsg={translate.formatMessage(commonMessage.required)}
                        />
                    </Col>
                </Row>
                
                <div className="footer-card-form">
                    {actions}
                </div>
            </Card>
        </BaseForm>
    );
};

export default AdminForm;