import React, { useEffect, useState } from 'react';
import { Empty, Avatar, Rate, Card, Row, Col, Progress, Statistic, Spin, Pagination, Button } from 'antd';
import { DeleteOutlined, StarFilled, MessageOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const getInitials = (fullName) => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const getAvatarColor = (name) => {
    const colors = [
        'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
        'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
        'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    ];
    let hash = 0;
    const cleanName = name || '';
    for (let i = 0; i < cleanName.length; i++) {
        hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

import useListBase from '@hooks/useListBase';
import useTranslate from '@hooks/useTranslate';
import useFetch from '@hooks/useFetch';
import useQueryParams from '@hooks/useQueryParams';

import { DEFAULT_TABLE_ITEM_SIZE, AppConstants, UserTypes, storageKeys } from '@constants';
import { FieldTypes } from '@constants/formConfig';
import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';
import { getData } from '@utils/localStorage';

import ListPage from '@components/common/layout/ListPage';
import PageWrapper from '@components/common/layout/PageWrapper';

const FeedbackListPage = () => {
    const translate = useTranslate();
    const { params: queryParams, deserializeParams } = useQueryParams();
    const [simulations, setSimulations] = useState([]);

    const labels = {
        student: 'Học viên',
        simulation: 'Bài mô phỏng',
        star: 'Đánh giá',
        content: 'Nhận xét',
        createdDate: 'Ngày đánh giá',
        action: translate.formatMessage(commonMessage.action),
        feedback: 'Đánh giá',
        noData: translate.formatMessage(commonMessage.noData),
    };

    const userType = getData(storageKeys.USER_TYPE);
    const isEducator = userType === UserTypes.EDUCATOR;

    const { execute: executeGetSimulations } = useFetch(
        isEducator ? apiConfig.simulation.getListForEducator : apiConfig.simulation.getList,
    );

    const { data, mixinFuncs, loading, pagination, queryFilter, setData, setPagination, setLoading } = useListBase({
        apiConfig: {
            getList: apiConfig.feedback.list,
            delete: apiConfig.feedback.delete,
        },
        options: {
            objectName: labels.feedback,
            pageSize: DEFAULT_TABLE_ITEM_SIZE,
        },
        override: (funcs) => {
            funcs.getCreateLink = () => null;
            funcs.getItemDetailLink = () => null;

            funcs.handleFetchList = (params) => {
                if (!params.simulationId) {
                    setData([]);
                    setPagination((p) => ({ ...p, total: 0 }));
                    return;
                }
                setLoading(true);
                funcs.executeGetList({
                    params,
                    onCompleted: (response) => {
                        funcs.onCompletedGetList(response);
                        setLoading(false);
                    },
                    onError: (error) => {
                        funcs.handleGetListError(error);
                        setLoading(false);
                    },
                });
            };
        },
    });

    useEffect(() => {
        executeGetSimulations({
            params: { page: 0, size: 100 },
            onCompleted: (res) => {
                const fetchedSims = res.data?.content || [];
                setSimulations(fetchedSims);
                const currentFilter = deserializeParams(queryParams);
                if (!currentFilter.simulationId && fetchedSims.length > 0) {
                    mixinFuncs.changeFilter({ ...currentFilter, simulationId: fetchedSims[0].id });
                }
            },
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Calculate correct global stats based on BE DTO fields
    const activeSimulationId = queryFilter.simulationId;
    const activeSimulation = simulations.find(s => String(s.id) === String(activeSimulationId));
    
    // avgStar and totalParticipant are resolved from backend selected simulation dto
    const avgRating = activeSimulation?.avgStar != null ? activeSimulation.avgStar.toFixed(1) : '0.0';
    const totalCount = pagination.total || 0;
    const currentListCount = data?.length || 0;

    const starCounts = [0, 0, 0, 0, 0];
    data?.forEach((item) => {
        if (item.star >= 1 && item.star <= 5) {
            starCounts[item.star - 1]++;
        }
    });

    const searchFields = [
        {
            key: 'simulationId',
            type: FieldTypes.SELECT,
            options: simulations.map((s) => ({ label: s.name || s.title, value: s.id })),
            placeholder: 'Chọn bài mô phỏng',
            submitOnChanged: true,
            colSpan: 8,
        },
    ];

    const breadcrumbs = [
        { breadcrumbName: translate.formatMessage(commonMessage.home) },
        { breadcrumbName: labels.feedback },
    ];

    const renderFeedbackCard = (record) => {
        const studentProfile = record.student || {};
        const account = studentProfile.profileAccountDto || {};
        const fullName = account.fullName || '-';
        const username = account.username ? `@${account.username}` : '';
        const avatar = account.avatar;
        const avatarUrl = avatar
            ? avatar.startsWith('http')
                ? avatar
                : `${AppConstants.contentRootUrl}${avatar}`
            : null;
        const initials = getInitials(fullName);
        const avatarBg = getAvatarColor(fullName);

        return (
            <Col xs={24} md={12} key={record.id}>
                <div 
                    className="tfo-feedback-card" 
                    style={{ 
                        padding: 16, 
                        borderRadius: 12, 
                        border: '1px solid #f1f5f9', 
                        background: '#ffffff', 
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                    }}
                >
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            {avatarUrl ? (
                                <img 
                                    src={avatarUrl} 
                                    alt={fullName} 
                                    style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #e2e8f0', objectFit: 'cover', flexShrink: 0 }} 
                                />
                            ) : (
                                <div 
                                    style={{ 
                                        background: avatarBg, 
                                        width: 36, 
                                        height: 36, 
                                        borderRadius: '50%', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        color: '#ffffff', 
                                        fontWeight: 600, 
                                        fontSize: 13, 
                                        flexShrink: 0, 
                                    }}
                                >
                                    {initials}
                                </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {fullName}
                                </div>
                                <div style={{ fontSize: 10, color: '#64748b' }}>{username || 'Học viên'}</div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                <Rate disabled defaultValue={record.star} style={{ fontSize: 11 }} />
                                <span style={{ fontSize: 10, color: '#94a3b8' }}>
                                    {record.createdDate ? dayjs(record.createdDate).format('DD/MM/YYYY') : ''}
                                </span>
                            </div>
                        </div>

                        <div style={{ 
                            fontSize: 13, 
                            color: '#334155', 
                            lineHeight: 1.6, 
                            backgroundColor: '#f8fafc',
                            padding: 12,
                            borderRadius: 8,
                            marginBottom: 12,
                            whiteSpace: 'pre-wrap',
                            fontStyle: record.content ? 'normal' : 'italic',
                        }}>
                            {record.content ? record.content : 'Học viên không để lại nhận xét bằng lời.'}
                        </div>
                    </div>

                    {mixinFuncs.hasPermission([apiConfig.feedback.delete.permissionCode]) && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
                            <Button 
                                type="text" 
                                danger 
                                icon={<DeleteOutlined />} 
                                size="small"
                                onClick={() => mixinFuncs.showDeleteConfirm(record.id)}
                                style={{ fontSize: 12, fontWeight: 500 }}
                            >
                                Xóa đánh giá
                            </Button>
                        </div>
                    )}
                </div>
            </Col>
        );
    };

    return (
        <PageWrapper routes={breadcrumbs}>
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} md={8}>
                    <Card style={{ height: '100%', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }} bodyStyle={{ padding: '24px' }}>
                        <Statistic
                            title="Điểm Đánh Giá Trung Bình"
                            value={avgRating}
                            precision={1}
                            suffix="/ 5.0"
                            valueStyle={{ color: '#fa8c16', fontSize: '32px', fontWeight: 'bold' }}
                        />
                        <Rate
                            disabled
                            allowHalf
                            value={parseFloat(avgRating)}
                            style={{ marginTop: '8px', fontSize: '18px' }}
                        />
                        <div style={{ marginTop: '8px', color: '#94a3b8', fontSize: '12px', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <StarFilled style={{ color: '#fa8c16' }} /> Điểm tích lũy trên toàn bộ mô phỏng
                        </div>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card style={{ height: '100%', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }} bodyStyle={{ padding: '24px' }}>
                        <Statistic
                            title="Tổng Số Đánh Giá"
                            value={totalCount}
                            valueStyle={{ fontSize: '32px', fontWeight: 'bold', color: '#1e293b' }}
                        />
                        <div style={{ marginTop: '16px', color: '#10b981', fontWeight: '600', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <MessageOutlined /> Bài mô phỏng đang chọn
                        </div>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card style={{ height: '100%', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }} bodyStyle={{ padding: '16px 24px' }}>
                        <h4 style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '13px', fontWeight: '600' }}>
                            Phân Bổ Đánh Giá (Trang này)
                        </h4>
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = starCounts[star - 1] || 0;
                            const percent = currentListCount > 0 ? Math.round((count / currentListCount) * 100) : 0;
                            return (
                                <Row key={star} align="middle" gutter={8} style={{ marginBottom: '4px' }}>
                                    <Col span={4} style={{ fontSize: '12px', fontWeight: '500', color: '#475569' }}>
                                        {star} ★
                                    </Col>
                                    <Col span={16}>
                                        <Progress
                                            percent={percent}
                                            showInfo={false}
                                            strokeColor="#fa8c16"
                                            size="small"
                                        />
                                    </Col>
                                    <Col span={4} style={{ fontSize: '11px', textAlign: 'right', color: '#94a3b8', fontWeight: '500' }}>
                                        {count}
                                    </Col>
                                </Row>
                            );
                        })}
                    </Card>
                </Col>
            </Row>

            <ListPage
                searchForm={mixinFuncs.renderSearchForm({
                    fields: searchFields,
                    initialValues: queryFilter,
                })}
                actionBar={null}
                baseTable={
                    <Spin spinning={loading}>
                        {data && data.length > 0 ? (
                            <div>
                                <Row gutter={[16, 16]} className="tfo-feedback-grid">
                                    {data.map(renderFeedbackCard)}
                                </Row>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                                    <Pagination
                                        current={pagination.current}
                                        pageSize={pagination.pageSize}
                                        total={pagination.total}
                                        onChange={(page, pageSize) => {
                                            mixinFuncs.changePagination(page, pageSize);
                                        }}
                                        showSizeChanger
                                    />
                                </div>
                            </div>
                        ) : (
                            <Empty description={labels.noData} />
                        )}
                    </Spin>
                }
            />
        </PageWrapper>
    );
};

export default FeedbackListPage;
