import React, { useEffect, useState, useMemo } from 'react';
import { Empty, Tag, Button, Card, Row, Col, Spin, Input, Radio, Progress, Statistic, Table } from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
    UserOutlined, 
    SearchOutlined,
    RightOutlined,
    CheckCircleOutlined,
    ArrowLeftOutlined,
} from '@ant-design/icons';

import useTranslate from '@hooks/useTranslate';
import useFetch from '@hooks/useFetch';
import useQueryParams from '@hooks/useQueryParams';

import { AppConstants } from '@constants';
import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';

import PageWrapper from '@components/common/layout/PageWrapper';
import SimulationListForReview from './SimulationListForReview';

// Helpers to match feedback/index.js visual style
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

const SimulationReviewListPage = ({ pageOptions }) => {
    const translate = useTranslate();
    const navigate = useNavigate();
    const { params: queryParams, setQueryParams } = useQueryParams();
    
    const [simulations, setSimulations] = useState([]);
    const [selectedSimulationId, setSelectedSimulationId] = useState(queryParams.get('simulationId') || null);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, PENDING, GRADED

    const { execute: executeGetSimulations } = useFetch(apiConfig.simulation.getListForEducator);

    const {
        data: students,
        loading: loadingStudents,
        execute: fetchStudents,
    } = useFetch(apiConfig.simulation.studentComplete, {
        immediate: false,
        mappingData: (res) => res.data?.content || [],
    });

    useEffect(() => {
        executeGetSimulations({
            params: { page: 0, size: 100 },
            onCompleted: (res) => {
                const fetchedSims = res.data?.content || [];
                setSimulations(fetchedSims);
            },
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const simId = queryParams.get('simulationId');
        setSelectedSimulationId(simId || null);
        if (simId) {
            fetchStudents({
                params: { simulationId: simId, size: 1000 },
            });
            setSearchQuery('');
            setFilterStatus('ALL');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryParams.get('simulationId')]);

    const activeSimulation = simulations.find((s) => String(s.id) === String(selectedSimulationId));

    // Đọc reviewStatus trực tiếp từ API response (có fallback về isReviewed nếu BE cũ)
    const studentsWithReviewStatus = useMemo(() => {
        return (students || []).map((item) => ({
            ...item,
            // reviewStatus: 1 = đã nhận xét, 0 = chưa nhận xét
            // Ưu tiên field reviewStatus từ BE, fallback về isReviewed (boolean) nếu chưa có
            isReviewed: item.reviewStatus === 1 || item.isReviewed === true,
        }));
    }, [students]);
    const stats = useMemo(() => {
        if (!studentsWithReviewStatus || studentsWithReviewStatus.length === 0) return { total: 0, graded: 0, percent: 0 };
        const total = studentsWithReviewStatus.length;
        const graded = studentsWithReviewStatus.filter((s) => s.isReviewed).length;
        const percent = Math.round((graded / total) * 100);
        return { total, graded, percent };
    }, [studentsWithReviewStatus]);

    const filteredStudents = useMemo(() => {
        if (!studentsWithReviewStatus) return [];
        return studentsWithReviewStatus.filter((item) => {
            const profileAccountDto = item.student?.profileAccountDto || {};
            const fullName = (profileAccountDto.fullName || '').toLowerCase();
            const username = (profileAccountDto.username || '').toLowerCase();
            const email = (profileAccountDto.email || '').toLowerCase();
            const matchesSearch =
                fullName.includes(searchQuery.toLowerCase()) ||
                username.includes(searchQuery.toLowerCase()) ||
                email.includes(searchQuery.toLowerCase());

            if (filterStatus === 'PENDING') {
                return matchesSearch && !item.isReviewed;
            }
            if (filterStatus === 'GRADED') {
                return matchesSearch && item.isReviewed;
            }
            return matchesSearch;
        });
    }, [studentsWithReviewStatus, searchQuery, filterStatus]);

    const breadcrumbs = pageOptions.renderBreadcrumbs(commonMessage, translate);

    if (!queryParams.get('simulationId')) {
        return (
            <PageWrapper routes={breadcrumbs}>
                <SimulationListForReview />
            </PageWrapper>
        );
    }

    const columns = [
        {
            title: 'Học viên',
            dataIndex: 'studentInfo',
            key: 'studentInfo',
            render: (_, item) => {
                const profileAccountDto = item.student?.profileAccountDto || {};
                const fullName = profileAccountDto.fullName || '-';
                const username = profileAccountDto.username ? `@${profileAccountDto.username}` : '';
                const avatar = profileAccountDto.avatar;
                const avatarUrl = avatar
                    ? avatar.startsWith('http')
                        ? avatar
                        : `${AppConstants.contentRootUrl}${avatar}`
                    : null;
                
                const initials = getInitials(fullName);
                const avatarBg = getAvatarColor(fullName);

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {avatarUrl ? (
                            <img 
                                src={avatarUrl} 
                                alt={fullName} 
                                style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid #e2e8f0', objectFit: 'cover', flexShrink: 0 }} 
                            />
                        ) : (
                            <div 
                                style={{ 
                                    background: avatarBg, 
                                    width: 40, 
                                    height: 40, 
                                    borderRadius: '50%', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    color: '#ffffff', 
                                    fontWeight: 600, 
                                    fontSize: 14, 
                                    flexShrink: 0, 
                                }}
                            >
                                {initials}
                            </div>
                        )}
                        <div>
                            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>
                                {fullName}
                            </div>
                            <div style={{ fontSize: 12, color: '#64748b' }}>{username || 'Học viên'}</div>
                        </div>
                    </div>
                );
            },
        },
        {
            title: 'Liên hệ',
            dataIndex: 'contact',
            key: 'contact',
            render: (_, item) => {
                const profileAccountDto = item.student?.profileAccountDto || {};
                return (
                    <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                        <div><span style={{ color: '#94a3b8', marginRight: 4 }}>Email:</span> <strong>{profileAccountDto.email || '-'}</strong></div>
                        <div><span style={{ color: '#94a3b8', marginRight: 4 }}>SĐT:</span> <strong>{profileAccountDto.phone || '-'}</strong></div>
                    </div>
                );
            },
        },
        {
            title: 'Trạng thái',
            dataIndex: 'isReviewed',
            key: 'status',
            render: (isReviewed) => (
                <Tag color={isReviewed ? 'success' : 'warning'} style={{ borderRadius: 4, fontWeight: 600 }}>
                    {isReviewed ? 'Đã chấm' : 'Chưa chấm'}
                </Tag>
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            align: 'right',
            render: (_, item) => {
                const profileAccountDto = item.student?.profileAccountDto || {};
                return (
                    <Button 
                        type="primary" 
                        icon={<RightOutlined />} 
                        style={{ borderRadius: 6, fontWeight: 600 }}
                        onClick={() => {
                            navigate(
                                `/student-review-detail/${selectedSimulationId}/${profileAccountDto.username}`,
                                { state: { simulationEnrollmentId: item.id } },
                            );
                        }}
                    >
                        Chấm điểm
                    </Button>
                );
            },
        },
    ];

    return (
        <PageWrapper routes={breadcrumbs}>
            {/* Back Button and Title */}
            <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                <Button 
                    icon={<ArrowLeftOutlined />} 
                    onClick={() => {
                        setQueryParams({ simulationId: null });
                        navigate('/simulation-review');
                    }}
                    style={{ borderRadius: 8, fontWeight: 500 }}
                >
                    Danh sách bài mô phỏng
                </Button>
                <div style={{ fontWeight: 600, fontSize: 18, color: '#1e293b' }}>
                    {activeSimulation?.title || activeSimulation?.name || 'Chi tiết bài mô phỏng'}
                </div>
            </div>

            {/* Dashboard Stats Row */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} md={8}>
                    <Card style={{ height: '100%', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }} bodyStyle={{ padding: '24px' }}>
                        <Statistic
                            title="Số lượng học viên hoàn thành"
                            value={stats.total}
                            valueStyle={{ color: '#1e293b', fontSize: '32px', fontWeight: 'bold' }}
                        />
                        <div style={{ marginTop: '16px', color: '#10b981', fontWeight: '600', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <CheckCircleOutlined /> Đã hoàn thành mô phỏng
                        </div>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card style={{ height: '100%', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }} bodyStyle={{ padding: '24px' }}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Statistic
                                    title="Đã chấm"
                                    value={stats.graded}
                                    valueStyle={{ fontSize: '32px', fontWeight: 'bold', color: '#52c41a' }}
                                />
                            </Col>
                            <Col span={12}>
                                <Statistic
                                    title="Chưa chấm"
                                    value={stats.total - stats.graded}
                                    valueStyle={{ fontSize: '32px', fontWeight: 'bold', color: '#fa8c16' }}
                                />
                            </Col>
                        </Row>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card style={{ height: '100%', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }} bodyStyle={{ padding: '24px' }}>
                        <h4 style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '14px', fontWeight: '600' }}>
                            Tiến độ chấm điểm
                        </h4>
                        <Progress 
                            percent={stats.percent} 
                            strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                            status="active"
                            size="default"
                        />
                    </Card>
                </Col>
            </Row>

            {/* Main Content Area */}
            <div style={{ background: '#ffffff', padding: '24px', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                {/* Search & Filter */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    gap: 16,
                    marginBottom: 24,
                    flexWrap: 'wrap',
                }}>
                    <Input
                        placeholder="Tìm học viên bằng tên, username, email..."
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        allowClear
                        style={{ maxWidth: 360, borderRadius: 6 }}
                    />

                    <Radio.Group 
                        value={filterStatus} 
                        onChange={(e) => setFilterStatus(e.target.value)}
                        buttonStyle="solid"
                    >
                        <Radio.Button value="ALL">Tất cả ({stats.total})</Radio.Button>
                        <Radio.Button value="PENDING">Chưa chấm ({stats.total - stats.graded})</Radio.Button>
                        <Radio.Button value="GRADED">Đã chấm ({stats.graded})</Radio.Button>
                    </Radio.Group>
                </div>

                {/* Table List */}
                <Table 
                    columns={columns}
                    dataSource={filteredStudents}
                    rowKey={(item) => item.id || item.student?.profileAccountDto?.username || Math.random()}
                    loading={loadingStudents}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                    locale={{ emptyText: <Empty description="Không tìm thấy học viên hoàn thành phù hợp" /> }}
                    style={{ marginTop: 8 }}
                />
            </div>
            
        </PageWrapper>
    );
};

export default SimulationReviewListPage;
