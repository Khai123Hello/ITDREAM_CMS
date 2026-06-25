import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Divider, Tag, Button, Input, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

import { BaseForm } from '@components/common/form/BaseForm';
import TextField from '@components/common/form/TextField';
import SelectField from '@components/common/form/SelectField';
import CropImageField from '@components/common/form/CropImageField';
import CheckboxField from '@components/common/form/CheckboxField';

import useBasicForm from '@hooks/useBasicForm';
import useFetch from '@hooks/useFetch';
import apiConfig from '@constants/apiConfig';
import { AppConstants, UploadFileTypes } from '@constants';

const { TextArea } = Input;

const opportunityTypeOptions = [
    { value: 1, label: 'Sự kiện (Event)', color: 'blue' },
    { value: 2, label: 'Công việc (Job)', color: 'green' },
];

const roleTypeOptions = [
    { value: 1, label: 'Thực tập sinh (Intern)', color: 'orange' },
    { value: 2, label: 'Chính thức (Full-time)', color: 'purple' },
];

const labelStyle = { fontWeight: 600, marginBottom: 8, display: 'block' };

const JobForm = (props) => {
    const { formId, actions, dataDetail, onSubmit, setIsChangedFormValues } = props;

    const { execute: executeUpFile } = useFetch(apiConfig.file.upload);
    const { execute: fetchSimulations } = useFetch(apiConfig.simulation.getList, { immediate: false });

    const [logoUrl, setLogoUrl] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [achievements, setAchievements] = useState([]);
    const [simulationOptions, setSimulationOptions] = useState([]);

    const { form, mixinFuncs, onValuesChange } = useBasicForm({
        onSubmit,
        setIsChangedFormValues,
    });

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
    }, []);

    const handleSubmit = (values) => {
        let rawLogo = values?.logoUrl || logoUrl || null;
        let finalLogo = null;
        if (rawLogo) {
            if (typeof rawLogo === 'string' && rawLogo.indexOf(AppConstants.contentRootUrl) === 0) {
                finalLogo = rawLogo.replace(AppConstants.contentRootUrl, '');
            } else {
                finalLogo = rawLogo;
            }
        }

        return mixinFuncs.handleSubmit({
            companyName: values?.companyName || '',
            title: values?.title || '',
            detailTitle: values?.detailTitle || '',
            shortDescription: values?.shortDescription || '',
            detailDescription: values?.detailDescription || '',
            opportunityType: values?.opportunityType ?? 2,
            roleType: values?.roleType ?? 1,
            field: values?.field || '',
            location: values?.location || '',
            country: values?.country || '',
            dateDisplay: values?.dateDisplay || '',
            bannerGradient: values?.bannerGradient || '',
            logoUrl: finalLogo,
            simulationId: values?.simulationId || null,
            isRecommended: values?.isRecommended ? 1 : 0,
            achievements: achievements.filter((a) => a.trim()),
        });
    };

    const uploadFile = (file, onSuccess, onError) => {
        executeUpFile({
            data: { type: UploadFileTypes.IMAGE, file },
            onCompleted: (response) => {
                if (response.result === true) {
                    onSuccess();
                    setLogoUrl(response.data.filePath);
                    const url = response.data.filePath.startsWith('http')
                        ? response.data.filePath
                        : `${AppConstants.contentRootUrl}${response.data.filePath}`;
                    setPreviewUrl(url);
                    form.setFieldsValue({ logoUrl: response.data.filePath });
                    setIsChangedFormValues(true);
                } else {
                    onError(new Error(response.message || 'Upload thất bại'));
                }
            },
            onError,
        });
    };

    const addAchievement = () => setAchievements([...achievements, '']);
    const removeAchievement = (index) => setAchievements(achievements.filter((_, i) => i !== index));
    const updateAchievement = (index, value) => {
        const updated = [...achievements];
        updated[index] = value;
        setAchievements(updated);
        setIsChangedFormValues(true);
    };

    useEffect(() => {
        if (dataDetail && Object.keys(dataDetail).length > 0) {
            form.setFieldsValue({
                companyName: dataDetail.companyName || '',
                title: dataDetail.title || '',
                detailTitle: dataDetail.detailTitle || '',
                shortDescription: dataDetail.shortDescription || '',
                detailDescription: dataDetail.detailDescription || '',
                opportunityType: dataDetail.opportunityType ?? 2,
                roleType: dataDetail.roleType ?? 1,
                field: dataDetail.field || '',
                location: dataDetail.location || '',
                country: dataDetail.country || '',
                dateDisplay: dataDetail.dateDisplay || '',
                bannerGradient: dataDetail.bannerGradient || '',
                simulationId: dataDetail.simulationId || dataDetail.simulation?.id || null,
                isRecommended: dataDetail.isRecommended === 1,
            });

            setLogoUrl(dataDetail.logoUrl || null);

            if (dataDetail.logoUrl) {
                setPreviewUrl(
                    dataDetail.logoUrl.startsWith('http')
                        ? dataDetail.logoUrl
                        : `${AppConstants.contentRootUrl}${dataDetail.logoUrl}`,
                );
            }

            const rawAchievements = dataDetail.achievements;
            if (Array.isArray(rawAchievements)) {
                setAchievements(rawAchievements);
            } else if (typeof rawAchievements === 'string') {
                try {
                    setAchievements(JSON.parse(rawAchievements));
                } catch {
                    setAchievements([]);
                }
            }
        }
    }, [dataDetail, form]);

    return (
        <BaseForm id={formId} onFinish={handleSubmit} form={form} onValuesChange={onValuesChange}>
            <Card className="card-form" bordered={false}>
                <Divider orientation="left" style={{ fontWeight: 600 }}>Thông tin cơ bản</Divider>

                <Row gutter={16}>
                    <Col xs={24} md={8}>
                        <CropImageField
                            label="Logo công ty"
                            name="logoUrl"
                            imageUrl={previewUrl}
                            aspect={1 / 1}
                            uploadFile={uploadFile}
                        />
                        <TextField
                            label="Hoặc nhập URL logo"
                            name="logoPath"
                            placeholder="https://..."
                            onChange={(e) => {
                                const v = e?.target?.value || e;
                                if (v) {
                                    setLogoUrl(null);
                                    form.setFieldsValue({ logoUrl: null });
                                    setPreviewUrl(v.startsWith('http') ? v : `${AppConstants.contentRootUrl}${v}`);
                                }
                            }}
                        />
                    </Col>
                    <Col xs={24} md={16}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <TextField
                                    required
                                    requiredMsg="Vui lòng nhập tên công ty"
                                    label="Tên công ty"
                                    name="companyName"
                                    placeholder="VD: Baker McKenzie, KPMG..."
                                />
                            </Col>
                            <Col span={12}>
                                <TextField
                                    required
                                    requiredMsg="Vui lòng nhập tiêu đề"
                                    label="Tiêu đề"
                                    name="title"
                                    placeholder="VD: Bakers' Dozen 2"
                                />
                            </Col>
                        </Row>
                        <Row gutter={16} style={{ marginTop: 16 }}>
                            <Col span={12}>
                                <TextField
                                    label="Tiêu đề chi tiết"
                                    name="detailTitle"
                                    placeholder="Tiêu đề hiển thị ở trang chi tiết"
                                />
                            </Col>
                            <Col span={12}>
                                <TextField
                                    label="Màu Gradient Banner"
                                    name="bannerGradient"
                                    placeholder="linear-gradient(135deg, #0f2042, #1b3564)"
                                />
                            </Col>
                        </Row>
                    </Col>
                </Row>

                <Row gutter={16} style={{ marginTop: 16 }}>
                    <Col span={12}>
                        <SelectField
                            label="Loại cơ hội"
                            name="opportunityType"
                            placeholder="Chọn loại"
                            options={opportunityTypeOptions}
                        />
                    </Col>
                    <Col span={12}>
                        <SelectField
                            label="Vai trò"
                            name="roleType"
                            placeholder="Chọn vai trò"
                            options={roleTypeOptions}
                        />
                    </Col>
                </Row>

                <Row gutter={16} style={{ marginTop: 16 }}>
                    <Col span={24}>
                        <label style={labelStyle}>Mô tả ngắn</label>
                        <TextArea
                            name="shortDescription"
                            rows={3}
                            placeholder="Mô tả ngắn hiển thị ở danh sách..."
                            onChange={(e) => {
                                form.setFieldsValue({ shortDescription: e.target.value });
                                setIsChangedFormValues(true);
                            }}
                            defaultValue={dataDetail?.shortDescription || ''}
                        />
                    </Col>
                </Row>

                <Row gutter={16} style={{ marginTop: 16 }}>
                    <Col span={24}>
                        <label style={labelStyle}>Mô tả chi tiết</label>
                        <TextArea
                            name="detailDescription"
                            rows={5}
                            placeholder="Mô tả chi tiết (hỗ trợ xuống dòng)..."
                            onChange={(e) => {
                                form.setFieldsValue({ detailDescription: e.target.value });
                                setIsChangedFormValues(true);
                            }}
                            defaultValue={dataDetail?.detailDescription || ''}
                        />
                    </Col>
                </Row>

                <Divider orientation="left" style={{ fontWeight: 600 }}>Thông tin bổ sung</Divider>

                <Row gutter={16}>
                    <Col xs={24} md={12}>
                        <TextField label="Lĩnh vực" name="field" placeholder="Pháp luật, Tư vấn, CNTT..." />
                    </Col>
                    <Col xs={24} md={12}>
                        <TextField label="Địa điểm" name="location" placeholder="Ảo, Sydney, London..." />
                    </Col>
                </Row>

                <Row gutter={16} style={{ marginTop: 16 }}>
                    <Col xs={24} md={12}>
                        <TextField label="Quốc gia" name="country" placeholder="Toàn cầu, Anh Quốc, Úc..." />
                    </Col>
                    <Col xs={24} md={12}>
                        <TextField
                            label="Chuỗi hiển thị ngày"
                            name="dateDisplay"
                            placeholder='VD: "Hạn chót là ngày 13 tháng 7 năm 2026"'
                        />
                    </Col>
                </Row>

                <Row gutter={16} style={{ marginTop: 16 }}>
                    <Col xs={24} md={12}>
                        <SelectField
                            label="Liên kết bài mô phỏng"
                            name="simulationId"
                            placeholder="Chọn bài mô phỏng (nếu có)"
                            options={simulationOptions}
                            allowClear
                        />
                    </Col>
                    <Col xs={24} md={12}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 30 }}>
                            <CheckboxField
                                optionLabel="Đánh dấu là đề xuất (Recommended)"
                                name="isRecommended"
                                fieldProps={{ checked: dataDetail?.isRecommended === 1 }}
                            />
                        </div>
                    </Col>
                </Row>

                <Divider orientation="left" style={{ fontWeight: 600 }}>Thành tích đạt được</Divider>

                <Row gutter={16}>
                    <Col span={24}>
                        {achievements.map((item, index) => (
                            <Space key={index} style={{ display: 'flex', marginBottom: 8 }} align="start">
                                <Tag color="blue">{index + 1}</Tag>
                                <Input
                                    value={item}
                                    onChange={(e) => updateAchievement(index, e.target.value)}
                                    placeholder="VD: Giấy chứng nhận, Kỹ năng..."
                                    style={{ width: 350 }}
                                />
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => removeAchievement(index)}
                                />
                            </Space>
                        ))}
                        <Button type="dashed" icon={<PlusOutlined />} onClick={addAchievement}>
                            Thêm thành tích
                        </Button>
                    </Col>
                </Row>

                <div className="footer-card-form" style={{ marginTop: 24 }}>
                    {actions}
                </div>
            </Card>
        </BaseForm>
    );
};

export default JobForm;
