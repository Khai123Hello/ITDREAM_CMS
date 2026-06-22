import React, { useEffect, useState, useMemo } from 'react';
import { Empty, Tag, Button, Card, Row, Col, Avatar, Spin, Input, Radio, Progress, Statistic, Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
    UserOutlined, 
    SearchOutlined,
    RightOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';

import useTranslate from '@hooks/useTranslate';
import useFetch from '@hooks/useFetch';
import useQueryParams from '@hooks/useQueryParams';

import { AppConstants } from '@constants';
import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';

import PageWrapper from '@components/common/layout/PageWrapper';

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
    const [selectedSimulationId, setSelectedSimulationId] = useState(queryParams.simulationId || null);
    
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
                
                if (!selectedSimulationId && fetchedSims.length > 0) {
                    const firstId = fetchedSims[0].id;
                    setSelectedSimulationId(firstId);
                    setQueryParams({ simulationId: firstId });
                }
            },
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selectedSimulationId) {
            fetchStudents({
                params: { simulationId: selectedSimulationId, size: 1000 },
            });
            setQueryParams({ simulationId: selectedSimulationId });
            setSearchQuery('');
            setFilterStatus('ALL');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedSimulationId]);

    const activeSimulation = simulations.find((s) => String(s.id) === String(selectedSimulationId));

    const stats = useMemo(() => {
        if (!students || students.length === 0) return { total: 0, graded: 0, percent: 0 };
        const total = students.length;
        const graded = students.filter((s) => s.isReviewed).length;
        const percent = Math.round((graded / total) * 100);
        return { total, graded, percent };
    }, [students]);

    const filteredStudents = useMemo(() => {
        if (!students) return [];
        return students.filter((item) => {
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
    }, [students, searchQuery, filterStatus]);

    const breadcrumbs = pageOptions.renderBreadcrumbs(commonMessage, translate);

    const renderStudentCard = (item) => {
        const profileAccountDto = item.student?.profileAccountDto || {};
        const { isReviewed } = item;
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
            <Col xs={24} md={12} lg={8} xl={6} key={item.simulationEnrollmentId || profileAccountDto.username}>
                <div 
                    className="tfo-student-card" 
                    onClick={() => {
                        navigate(
                            `/student-review-detail/${selectedSimulationId}/${profileAccountDto.username}`,
                            { state: { simulationEnrollmentId: item.simulationEnrollmentId } },
                        );
                    }}
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
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                    }}
                >
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                            {avatarUrl ? (
                                <img 
                                    src={avatarUrl} 
                                    alt={fullName} 
                                    style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid #e2e8f0', objectFit: 'cover', flexShrink: 0 }} 
                                />
                            ) : (
                                <div 
                                    style={{ 
                                        background: avatarBg, 
                                        width: 44, 
                                        height: 44, 
                                        borderRadius: '50%', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        color: '#ffffff', 
                                        fontWeight: 600, 
                                        fontSize: 16, 
                                        flexShrink: 0, 
                                    }}
                                >
                                    {initials}
                                </div>
                            )}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {fullName}
                                </div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>{username || 'Học viên'}</div>
                            </div>
                        </div>

                        <div style={{ 
                            fontSize: 12, 
                            color: '#334155', 
                            lineHeight: 1.6, 
                            backgroundColor: '#f8fafc',
                            padding: 12,
                            borderRadius: 8,
                            marginBottom: 12,
                        }}>
                            <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginBottom: 4 }}>
                                <span style={{ color: '#94a3b8', marginRight: 4 }}>Email:</span> 
                                <strong>{profileAccountDto.email || '-'}</strong>
                            </div>
                            <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                <span style={{ color: '#94a3b8', marginRight: 4 }}>SĐT:</span> 
                                <strong>{profileAccountDto.phone || '-'}</strong>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
                        <Tag color={isReviewed ? 'success' : 'warning'} style={{ borderRadius: 4, fontSize: 11, fontWeight: 600, margin: 0 }}>
                            {isReviewed ? 'Đã chấm' : 'Chưa chấm'}
                        </Tag>
                        <Button 
                            type="link" 
                            size="small" 
                            icon={<RightOutlined />} 
                            style={{ padding: 0, fontSize: 13, fontWeight: 600 }}
                        >
                            Chấm điểm
                        </Button>
                    </div>
                </div>
            </Col>
        );
    };

    return (
        <PageWrapper routes={breadcrumbs}>
            {/* Top Dropdown Filter */}
            <div style={{ background: '#ffffff', padding: '16px 24px', borderRadius: 12, marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                <Row align="middle" gutter={16}>
                    <Col>
                        <span style={{ fontWeight: 600, color: '#475569', fontSize: 14 }}>Chọn bài mô phỏng:</span>
                    </Col>
                    <Col flex="auto" style={{ maxWidth: 400 }}>
                        <Select
                            style={{ width: '100%' }}
                            value={selectedSimulationId}
                            onChange={(val) => setSelectedSimulationId(val)}
                            options={simulations.map((s) => ({ label: s.name || s.title, value: s.id }))}
                            placeholder="Chọn bài mô phỏng"
                            showSearch
                            optionFilterProp="label"
                        />
                    </Col>
                </Row>
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

                {/* Grid */}
                <Spin spinning={loadingStudents}>
                    {filteredStudents && filteredStudents.length > 0 ? (
                        <Row gutter={[16, 16]}>
                            {filteredStudents.map(renderStudentCard)}
                        </Row>
                    ) : (
                        <Empty description="Không tìm thấy học viên hoàn thành phù hợp" />
                    )}
                </Spin>
            </div>
            
        </PageWrapper>
    );
};

export default SimulationReviewListPage;
