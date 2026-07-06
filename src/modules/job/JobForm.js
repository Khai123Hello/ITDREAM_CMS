import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Divider, Input, Select, Form, Checkbox } from 'antd';
import dayjs from 'dayjs';

import { BaseForm } from '@components/common/form/BaseForm';
import TextField from '@components/common/form/TextField';
import SelectField from '@components/common/form/SelectField';
import CropImageField from '@components/common/form/CropImageField';
import DatePickerField from '@components/common/form/DatePickerField';
import TipTapEditor from '@components/common/editor/TipTapEditor';

import useBasicForm from '@hooks/useBasicForm';
import useFetch from '@hooks/useFetch';
import apiConfig from '@constants/apiConfig';
import { AppConstants, UploadFileTypes, UserTypes, storageKeys } from '@constants';
import { getData } from '@utils/localStorage';

const { TextArea } = Input;

const opportunityTypeOptions = [
    { value: 1, label: 'Sự kiện (Event)' },
    { value: 2, label: 'Tuyển dụng (Job)' },
    { value: 3, label: 'Mạng lưới tài năng (Talent Network)' },
];

const roleTypeOptions = [
    { value: 1, label: 'Thực tập sinh (Internship)' },
    { value: 2, label: 'Bán thời gian (Part-time)' },
    { value: 3, label: 'Toàn thời gian (Full-time)' },
    { value: 4, label: 'Thực tập & Bán thời gian' },
    { value: 5, label: 'Thực tập & Toàn thời gian' },
    { value: 6, label: 'Bán thời gian & Toàn thời gian' },
    { value: 7, label: 'Tất cả' },
];

const labelStyle = { fontWeight: 600, marginBottom: 8, display: 'block' };

const JobForm = (props) => {
    const { formId, actions, dataDetail, onSubmit, setIsChangedFormValues } = props;

    const userType = getData(storageKeys.USER_TYPE);
    const isEducator = userType === UserTypes.EDUCATOR;

    const { execute: executeUpFile } = useFetch(apiConfig.file.upload);
    const simApi = isEducator ? apiConfig.simulation.getListForEducator : apiConfig.simulation.getList;
    const { execute: fetchSimulations } = useFetch(simApi, { immediate: false });
    const { execute: fetchProvinces } = useFetch(apiConfig.nation.client_list, { immediate: false });
    const { execute: fetchWards } = useFetch(apiConfig.nation.client_list, { immediate: false });

    const [image, setImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [simulationOptions, setSimulationOptions] = useState([]);
    const [provinceOptions, setProvinceOptions] = useState([]);
    const [wardOptions, setWardOptions] = useState([]);
    const [selectedProvinceId, setSelectedProvinceId] = useState(null);
    const [currentType, setCurrentType] = useState(null);
    const [isOnline, setIsOnline] = useState(false);

    const { form, mixinFuncs, onValuesChange } = useBasicForm({
        onSubmit,
        setIsChangedFormValues,
    });

    // Load simulations
    useEffect(() => {
        fetchSimulations({
            params: { page: 0, size: 200, status: 1 },
            onCompleted: (res) => {
                const sims = res?.data?.content || [];
                setSimulationOptions(
                    sims.map((s) => ({
                        value: s.id,
                        label: s.title,
                    })),
                );
            },
        });

        // Load provinces
        fetchProvinces({
            params: { kind: 1, page: 0, size: 200 },
            onCompleted: (res) => {
                const list = res?.data?.content || [];
                setProvinceOptions(
                    list.map((p) => ({
                        value: p.id,
                        label: p.name,
                    })),
                );
            },
        });
    }, []);

    // Load wards when province changes
    useEffect(() => {
        if (selectedProvinceId) {
            fetchWards({
                params: { kind: 2, parentId: selectedProvinceId, page: 0, size: 200 },
                onCompleted: (res) => {
                    const list = res?.data?.content || [];
                    setWardOptions(
                        list.map((w) => ({
                            value: w.id,
                            label: w.name,
                        })),
                    );
                },
            });
        } else {
            setWardOptions([]);
        }
    }, [selectedProvinceId]);

    const handleSubmit = (values) => {
        let rawImage = image || (typeof values?.image === 'string' ? values.image : null);
        let finalImage = null;
        if (rawImage) {
            if (typeof rawImage === 'string' && rawImage.indexOf(AppConstants.contentRootUrl) === 0) {
                finalImage = rawImage.replace(AppConstants.contentRootUrl, '');
            } else {
                finalImage = rawImage;
            }
        }

        const payload = {
            ...values,
            image: finalImage,
            address: isOnline ? 'online' : values.address,
            provinceId: isOnline ? null : values.provinceId,
            wardId: isOnline ? null : values.wardId,
        };

        return mixinFuncs.handleSubmit(payload);
    };

    const uploadFile = (file, onSuccess, onError) => {
        executeUpFile({
            data: { type: UploadFileTypes.IMAGE, file },
            onCompleted: (response) => {
                if (response.result === true) {
                    onSuccess();
                    setImage(response.data.filePath);
                    const url = response.data.filePath.startsWith('http')
                        ? response.data.filePath
                        : `${AppConstants.contentRootUrl}${response.data.filePath}`;
                    setPreviewUrl(url);
                    form.setFieldsValue({ image: response.data.filePath });
                    setIsChangedFormValues(true);
                } else {
                    onError(new Error(response.message || 'Upload thất bại'));
                }
            },
            onError,
        });
    };

    useEffect(() => {
        if (dataDetail && Object.keys(dataDetail).length > 0) {
            const isJobOnline = dataDetail.address?.toLowerCase() === 'online';
            setIsOnline(isJobOnline);

            form.setFieldsValue({
                title: dataDetail.title || '',
                content: dataDetail.content || '',
                type: dataDetail.type || null,
                roleType: dataDetail.roleType || null,
                jobUrl: dataDetail.jobUrl || '',
                address: dataDetail.address || '',
                provinceId: dataDetail.provinceId || null,
                wardId: dataDetail.wardId || null,
                date: dataDetail.date ? dayjs(dataDetail.date) : null,
                endDate: dataDetail.endDate ? dayjs(dataDetail.endDate) : null,
                simulationIds: dataDetail.simulationIds || [],
                status: dataDetail.status ?? 1,
                notice: dataDetail.notice || '',
                isOnline: isJobOnline,
            });

            setCurrentType(dataDetail.type || null);
            setImage(dataDetail.image || null);

            if (dataDetail.image) {
                setPreviewUrl(
                    dataDetail.image.startsWith('http')
                        ? dataDetail.image
                        : `${AppConstants.contentRootUrl}${dataDetail.image}`,
                );
            }

            if (dataDetail.provinceId) {
                setSelectedProvinceId(dataDetail.provinceId);
            }
        }
    }, [dataDetail, form]);

    return (
        <BaseForm id={formId} onFinish={handleSubmit} form={form} onValuesChange={onValuesChange}>
            <Card className="card-form" bordered={false}>
                <Divider orientation="left" style={{ fontWeight: 600 }}>
                    Thông tin cơ bản
                </Divider>

                <Row gutter={16}>
                    <Col xs={24} md={8}>
                        <CropImageField
                            disabled={!isEducator}
                            label="Ảnh bìa cơ hội"
                            name="image"
                            imageUrl={previewUrl}
                            aspect={16 / 9}
                            uploadFile={uploadFile}
                            required={isEducator}
                            requiredMsg="Vui lòng tải lên ảnh bìa"
                        />
                        {isEducator && (
                            <TextField
                                label="Hoặc nhập URL ảnh bìa"
                                name="imagePath"
                                placeholder="https://..."
                                onChange={(e) => {
                                    const v = e?.target?.value || e;
                                    setImage(v);
                                    form.setFieldsValue({ image: v });
                                    if (v) {
                                        setPreviewUrl(v.startsWith('http') ? v : `${AppConstants.contentRootUrl}${v}`);
                                    } else {
                                        setPreviewUrl(null);
                                    }
                                }}
                            />
                        )}
                    </Col>
                    <Col xs={24} md={16}>
                        <Row gutter={16}>
                            <Col span={24}>
                                <TextField
                                    required={isEducator}
                                    disabled={!isEducator}
                                    requiredMsg="Vui lòng nhập tiêu đề"
                                    label="Tiêu đề"
                                    name="title"
                                    placeholder="VD: Thực tập sinh Fullstack Developer"
                                />
                            </Col>
                        </Row>
                        <Row gutter={16} style={{ marginTop: 16 }}>
                            <Col span={24}>
                                <TextField
                                    required={isEducator}
                                    disabled={!isEducator}
                                    requiredMsg="Vui lòng nhập đường dẫn liên kết"
                                    label="Đường dẫn trang tuyển dụng liên kết"
                                    name="jobUrl"
                                    placeholder="VD: https://company.com/careers/job-1"
                                />
                            </Col>
                        </Row>
                    </Col>
                </Row>

                <Row gutter={16} style={{ marginTop: 16 }}>
                    <Col span={12}>
                        <SelectField
                            required={isEducator}
                            disabled={!isEducator}
                            label="Loại cơ hội"
                            name="type"
                            placeholder="Chọn loại cơ hội"
                            options={opportunityTypeOptions}
                            onChange={(val) => setCurrentType(val)}
                        />
                    </Col>
                    <Col span={12}>
                        <SelectField
                            required={isEducator}
                            disabled={!isEducator}
                            label="Vai trò"
                            name="roleType"
                            placeholder="Chọn vai trò"
                            options={roleTypeOptions}
                        />
                    </Col>
                </Row>

                <Row gutter={16} style={{ marginTop: 16 }}>
                    {currentType === 1 && (
                        <>
                            <Col span={6}>
                                <DatePickerField
                                    required={isEducator}
                                    disabled={!isEducator}
                                    label="Bắt đầu sự kiện"
                                    name="date"
                                    placeholder="Chọn ngày bắt đầu"
                                    format="DD/MM/YYYY"
                                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                                    onChange={() => {
                                        const dateVal = form.getFieldValue('date');
                                        const endDateVal = form.getFieldValue('endDate');
                                        if (dateVal && endDateVal && endDateVal.isBefore(dateVal, 'day')) {
                                            form.setFieldsValue({ endDate: null });
                                        }
                                    }}
                                />
                            </Col>
                            <Col span={6}>
                                <DatePickerField
                                    required={isEducator}
                                    disabled={!isEducator}
                                    label="Kết thúc sự kiện"
                                    name="endDate"
                                    placeholder="Chọn ngày kết thúc"
                                    format="DD/MM/YYYY"
                                    disabledDate={(current) => {
                                        const startDate = form.getFieldValue('date');
                                        if (startDate) {
                                            return (
                                                current &&
                                                (current < dayjs().startOf('day') ||
                                                    current < dayjs(startDate).startOf('day'))
                                            );
                                        }
                                        return current && current < dayjs().startOf('day');
                                    }}
                                />
                            </Col>
                        </>
                    )}
                    {currentType === 2 && (
                        <Col span={12}>
                            <DatePickerField
                                required={isEducator}
                                disabled={!isEducator}
                                label="Hạn chót ứng tuyển"
                                name="endDate"
                                placeholder="Chọn ngày kết thúc"
                                format="DD/MM/YYYY"
                                disabledDate={(current) => current && current < dayjs().startOf('day')}
                            />
                        </Col>
                    )}
                    <Col span={currentType === 1 || currentType === 2 ? 12 : 24}>
                        <SelectField
                            required={isEducator}
                            disabled={!isEducator}
                            label="Liên kết bài mô phỏng"
                            name="simulationIds"
                            placeholder="Chọn các bài mô phỏng liên quan"
                            options={simulationOptions}
                            mode="multiple"
                            allowClear
                        />
                    </Col>
                </Row>

                <Row gutter={16} style={{ marginTop: 16 }}>
                    <Col span={24}>
                        <Form.Item
                            name="content"
                            label={<span style={{ fontWeight: 600 }}>Nội dung chi tiết</span>}
                            rules={isEducator ? [{ required: true, message: 'Vui lòng nhập nội dung chi tiết' }] : []}
                        >
                            <TipTapEditor
                                disabled={!isEducator}
                                placeholder="Nhập nội dung chi tiết tin tuyển dụng..."
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Divider orientation="left" style={{ fontWeight: 600 }}>
                    Địa điểm
                </Divider>

                <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={24}>
                        <Form.Item name="isOnline" valuePropName="checked" style={{ marginBottom: 0 }}>
                            <Checkbox
                                disabled={!isEducator}
                                onChange={(e) => {
                                    setIsOnline(e.target.checked);
                                    if (e.target.checked) {
                                        form.setFieldsValue({
                                            provinceId: null,
                                            wardId: null,
                                            address: 'online',
                                        });
                                    } else {
                                        form.setFieldsValue({
                                            address: '',
                                        });
                                    }
                                    setIsChangedFormValues(true);
                                }}
                            >
                                <span style={{ fontWeight: 600 }}>Làm việc Online</span>
                            </Checkbox>
                        </Form.Item>
                    </Col>
                </Row>

                {!isOnline && (
                    <>
                        <Row gutter={16}>
                            <Col span={12}>
                                <SelectField
                                    disabled={!isEducator}
                                    label="Tỉnh / Thành phố"
                                    name="provinceId"
                                    placeholder="Chọn Tỉnh / Thành phố"
                                    options={provinceOptions}
                                    onChange={(value) => {
                                        setSelectedProvinceId(value);
                                        form.setFieldsValue({ wardId: null });
                                    }}
                                    allowClear
                                />
                            </Col>
                            <Col span={12}>
                                <SelectField
                                    disabled={!isEducator || !selectedProvinceId}
                                    label="Quận / Huyện / Xã / Phường"
                                    name="wardId"
                                    placeholder="Chọn địa chỉ phụ thuộc"
                                    options={wardOptions}
                                    allowClear
                                />
                            </Col>
                        </Row>

                        <Row gutter={16} style={{ marginTop: 16 }}>
                            <Col span={24}>
                                <TextField
                                    disabled={!isEducator}
                                    label="Địa chỉ chi tiết"
                                    name="address"
                                    placeholder="VD: Số 123, Đường Nguyễn Huệ"
                                />
                            </Col>
                        </Row>
                    </>
                )}

                <div className="footer-card-form" style={{ marginTop: 24 }}>
                    {actions}
                </div>
            </Card>
        </BaseForm>
    );
};

export default JobForm;
