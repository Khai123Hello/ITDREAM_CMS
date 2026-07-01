import React, { useEffect, useState } from 'react';
import {
    Card,
    Row,
    Col,
    Statistic,
    Table,
    Tag,
    Button,
    Tabs,
    Space,
    Typography,
    Badge,
    List,
    Avatar,
    Spin,
    Empty,
    Tooltip,
} from 'antd';
import {
    BookOutlined,
    TeamOutlined,
    UserOutlined,
    ClockCircleOutlined,
    CheckOutlined,
    CloseOutlined,
    ReloadOutlined,
    SettingOutlined,
    SafetyOutlined,
    AppstoreOutlined,
    BankOutlined,
    StarFilled,
} from '@ant-design/icons';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ReTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';

import useFetch from '../../hooks/useFetch';
import apiConfig from '../../constants/apiConfig';
import PageWrapper from '@components/common/layout/PageWrapper';
import styles from './AdminDashboard.module.scss';

const { Text } = Typography;
const CHART_COLORS = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1'];

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        simulationsCount: 0,
        studentsCount: 0,
        educatorsCount: 0,
        pendingBlogsCount: 0,
        pendingEducatorsCount: 0,
        pendingSimulationsCount: 0,
        pendingDeletesCount: 0,
    });

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('educators');
    const [mainTab, setMainTab] = useState('operations');

    const [pendingEducators, setPendingEducators] = useState([]);
    const [pendingSimulations, setPendingSimulations] = useState([]);
    const [pendingBlogs, setPendingBlogs] = useState([]);
    const [recentFeedbacks, setRecentFeedbacks] = useState([]);

    const [categoryData, setCategoryData] = useState([]);
    const [growthData, setGrowthData] = useState([]);

    // API fetches
    const { execute: getSims } = useFetch(apiConfig.simulation.getList);
    const { execute: getStudents } = useFetch(apiConfig.student.getList);
    const { execute: getEducators } = useFetch(apiConfig.educator.getList);
    const { execute: getBlogs } = useFetch(apiConfig.blog.getList);
    const { execute: getFeedbacks } = useFetch(apiConfig.feedback.list || apiConfig.review.list);

    // Approval Actions
    const { execute: approveEducator } = useFetch(apiConfig.educator.approve);
    const { execute: rejectEducator } = useFetch(apiConfig.educator.reject);
    const { execute: approveSimulation } = useFetch(apiConfig.simulation.approve);
    const { execute: rejectSimulation } = useFetch(apiConfig.simulation.reject);
    const { execute: approveDeleteSimulation } = useFetch(apiConfig.simulation.approveDelete);
    const { execute: rejectDeleteSimulation } = useFetch(apiConfig.simulation.rejectDelete);
    const { execute: approveBlog } = useFetch(apiConfig.blog.approve);
    const { execute: rejectBlog } = useFetch(apiConfig.blog.reject);

    const loadData = async () => {
        setLoading(true);
        try {
            let sims = [];
            let studentsList = [];
            let educatorsList = [];
            let blogsList = [];

            const simsRes = await getSims({ params: { page: 0, size: 200 } });
            if (simsRes?.data) sims = simsRes.data.content || [];

            const studentsRes = await getStudents({ params: { page: 0, size: 200 } });
            if (studentsRes?.data) studentsList = studentsRes.data.content || [];

            const educatorsRes = await getEducators({ params: { page: 0, size: 200 } });
            if (educatorsRes?.data) educatorsList = educatorsRes.data.content || [];

            const blogsRes = await getBlogs({ params: { page: 0, size: 200 } });
            if (blogsRes?.data) blogsList = blogsRes.data.content || [];

            const feedbacksRes = await getFeedbacks({ params: { page: 0, size: 5 } });
            if (feedbacksRes?.data) setRecentFeedbacks(feedbacksRes.data.content || []);

            const pEducators = educatorsList.filter(e => e.account?.status === 2);
            const pSimulations = sims.filter(s => s.status === 2 || s.status === 3);
            const pBlogs = blogsList.filter(b => b.status === 0);

            setPendingEducators(pEducators);
            setPendingSimulations(pSimulations);
            setPendingBlogs(pBlogs);

            setStats({
                simulationsCount: sims.filter(s => s.status === 1).length,
                studentsCount: studentsList.length,
                educatorsCount: educatorsList.filter(e => e.account?.status === 1).length,
                pendingBlogsCount: pBlogs.length,
                pendingEducatorsCount: pEducators.length,
                pendingSimulationsCount: pSimulations.filter(s => s.status === 2).length,
                pendingDeletesCount: pSimulations.filter(s => s.status === 3).length,
            });

            // Growth chart
            const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
            const monthlyGrowth = {};
            months.forEach(m => { monthlyGrowth[m] = { Students: 0, Educators: 0 }; });

            studentsList.forEach(st => {
                const dateStr = st.account?.createdDate;
                if (dateStr) {
                    const mName = months[new Date(dateStr).getMonth()];
                    if (monthlyGrowth[mName]) monthlyGrowth[mName].Students += 1;
                }
            });
            educatorsList.forEach(ed => {
                const dateStr = ed.account?.createdDate;
                if (dateStr) {
                    const mName = months[new Date(dateStr).getMonth()];
                    if (monthlyGrowth[mName]) monthlyGrowth[mName].Educators += 1;
                }
            });

            let cumulativeSt = 0;
            let cumulativeEd = 0;
            setGrowthData(months.map(m => {
                cumulativeSt += monthlyGrowth[m].Students;
                cumulativeEd += monthlyGrowth[m].Educators;
                return { month: m, Students: cumulativeSt || 10, Educators: cumulativeEd || 2 };
            }));

            // Category donut
            const categoriesCount = {};
            sims.forEach(sim => {
                const catName = sim.category?.name || 'Khác';
                categoriesCount[catName] = (categoriesCount[catName] || 0) + 1;
            });
            const donutData = Object.keys(categoriesCount).map(key => ({ name: key, value: categoriesCount[key] }));
            setCategoryData(donutData.length > 0 ? donutData : [{ name: 'Không có dữ liệu', value: 1 }]);
        } catch (err) {
            console.error('Lỗi khi tải thông tin Dashboard', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const handleEducatorApprove = async (id, approve) => {
        const fetchAction = approve ? approveEducator : rejectEducator;
        await fetchAction({ data: { id }, onCompleted: loadData });
    };

    const handleSimulationApprove = async (id, status, approve) => {
        if (status === 2) {
            const fetchAction = approve ? approveSimulation : rejectSimulation;
            await fetchAction({
                data: { id, notice: approve ? '' : 'Không được phê duyệt do thông tin chưa đầy đủ' },
                onCompleted: loadData,
            });
        } else if (status === 3) {
            const fetchAction = approve ? approveDeleteSimulation : rejectDeleteSimulation;
            await fetchAction({ pathParams: { id }, onCompleted: loadData });
        }
    };

    const handleBlogApprove = async (id, approve) => {
        const fetchAction = approve ? approveBlog : rejectBlog;
        await fetchAction({ data: { id }, onCompleted: loadData });
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <Spin size="large" tip="Đang đồng bộ dữ liệu hệ thống..." />
            </div>
        );
    }

    const pendingTotal =
        stats.pendingEducatorsCount +
        stats.pendingSimulationsCount +
        stats.pendingDeletesCount +
        stats.pendingBlogsCount;

    // ─── Approve/Reject action buttons ───
    const ApproveRejectBtns = ({ onApprove, onReject }) => (
        <Space size={4}>
            <Tooltip title="Phê duyệt">
                <Button
                    size="small"
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={onApprove}
                    style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                />
            </Tooltip>
            <Tooltip title="Từ chối">
                <Button size="small" danger icon={<CloseOutlined />} onClick={onReject} />
            </Tooltip>
        </Space>
    );

    // ─── Table columns ───
    const educatorColumns = [
        {
            title: 'Giảng viên',
            key: 'name',
            render: (_, r) => (
                <Space>
                    <Avatar icon={<UserOutlined />} size={28} style={{ backgroundColor: '#1890ff' }} />
                    <div>
                        <div style={{ fontWeight: 600, lineHeight: 1.3 }}>{r.account?.fullName}</div>
                        <Text type="secondary" style={{ fontSize: 11 }}>{r.account?.email}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Tổ chức',
            key: 'org',
            render: (_, r) => (
                <Space size={4}>
                    <BankOutlined style={{ color: '#bfbfbf' }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>{r.organization?.name || '—'}</Text>
                </Space>
            ),
        },
        {
            title: '',
            key: 'action',
            align: 'right',
            render: (_, r) => (
                <ApproveRejectBtns
                    onApprove={() => handleEducatorApprove(r.id, true)}
                    onReject={() => handleEducatorApprove(r.id, false)}
                />
            ),
        },
    ];

    const simulationColumns = [
        {
            title: 'Mô phỏng',
            key: 'title',
            render: (_, r) => (
                <div>
                    <div style={{ fontWeight: 600, maxWidth: 260 }}>{r.title}</div>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        {r.category?.name} • Cấp {r.level}
                    </Text>
                </div>
            ),
        },
        {
            title: 'Giảng viên',
            key: 'educator',
            render: (_, r) => r.educator?.account?.fullName || '—',
        },
        {
            title: 'Yêu cầu',
            key: 'status',
            render: (_, r) =>
                r.status === 2
                    ? <Tag color="blue">Tạo mới</Tag>
                    : <Tag color="orange">Yêu cầu xóa</Tag>,
        },
        {
            title: '',
            key: 'action',
            align: 'right',
            render: (_, r) => (
                <ApproveRejectBtns
                    onApprove={() => handleSimulationApprove(r.id, r.status, true)}
                    onReject={() => handleSimulationApprove(r.id, r.status, false)}
                />
            ),
        },
    ];

    const blogColumns = [
        {
            title: 'Tiêu đề bài viết',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <Text strong style={{ fontSize: 13 }}>{text}</Text>,
        },
        {
            title: 'Tác giả',
            key: 'authorName',
            render: (_, r) => r.educator?.account?.fullName || r.educator?.profileAccountDto?.fullName || r.author || '—',
        },
        {
            title: '',
            key: 'action',
            align: 'right',
            render: (_, r) => (
                <ApproveRejectBtns
                    onApprove={() => handleBlogApprove(r.id, true)}
                    onReject={() => handleBlogApprove(r.id, false)}
                />
            ),
        },
    ];

    // ─── Queue tabs ───
    const queueTabItems = [
        {
            key: 'educators',
            label: (
                <Badge count={stats.pendingEducatorsCount} size="small" offset={[6, 0]}>
                    Giảng viên
                </Badge>
            ),
            children: (
                <Table
                    dataSource={pendingEducators}
                    columns={educatorColumns}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    locale={{ emptyText: <Empty description="Không có giảng viên chờ duyệt" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                />
            ),
        },
        {
            key: 'simulations',
            label: (
                <Badge count={stats.pendingSimulationsCount + stats.pendingDeletesCount} size="small" offset={[6, 0]}>
                    Mô phỏng
                </Badge>
            ),
            children: (
                <Table
                    dataSource={pendingSimulations}
                    columns={simulationColumns}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    locale={{ emptyText: <Empty description="Không có mô phỏng chờ duyệt" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                />
            ),
        },
        {
            key: 'blogs',
            label: (
                <Badge count={stats.pendingBlogsCount} size="small" offset={[6, 0]}>
                    Blogs
                </Badge>
            ),
            children: (
                <Table
                    dataSource={pendingBlogs}
                    columns={blogColumns}
                    rowKey="id"
                    size="small"
                    pagination={false}
                    locale={{ emptyText: <Empty description="Không có bài viết chờ duyệt" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                />
            ),
        },
    ];

    // ─── Shortcuts ───
    const shortcuts = [
        { href: '/settings', icon: <SettingOutlined style={{ color: '#1890ff' }} />, label: 'Thiết lập chung' },
        { href: '/group-permission', icon: <SafetyOutlined style={{ color: '#722ed1' }} />, label: 'Phân quyền' },
        { href: '/category', icon: <AppstoreOutlined style={{ color: '#52c41a' }} />, label: 'Danh mục' },
        { href: '/students', icon: <UserOutlined style={{ color: '#fa8c16' }} />, label: 'Học viên' },
    ];

    // ─── Main Tab items ───
    const mainTabItems = [
        {
            key: 'operations',
            label: `Tác vụ vận hành ${pendingTotal > 0 ? `(${pendingTotal})` : ''}`,
            children: (
                <Row gutter={[16, 16]}>
                    {/* Approval Queue */}
                    <Col xs={24} xl={16}>
                        <Card
                            size="small"
                            title={
                                <Space>
                                    <ClockCircleOutlined />
                                    <span>Danh sách chờ phê duyệt</span>
                                </Space>
                            }
                            bodyStyle={{ padding: '0 12px 12px' }}
                        >
                            <Tabs
                                activeKey={activeTab}
                                onChange={setActiveTab}
                                size="small"
                                items={queueTabItems}
                            />
                        </Card>
                    </Col>

                    {/* Side Panel */}
                    <Col xs={24} xl={8}>
                        {/* Recent Feedbacks */}
                        <Card
                            size="small"
                            title={
                                <Space>
                                    <StarFilled style={{ color: '#faad14' }} />
                                    <span>Đánh giá gần đây</span>
                                </Space>
                            }
                            style={{ marginBottom: 16 }}
                            bodyStyle={{ padding: '8px 12px' }}
                        >
                            {recentFeedbacks.length === 0 ? (
                                <Empty description="Chưa có phản hồi" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '12px 0' }} />
                            ) : (
                                <List
                                    size="small"
                                    dataSource={recentFeedbacks}
                                    renderItem={fb => (
                                        <List.Item style={{ padding: '8px 0', flexDirection: 'column', alignItems: 'flex-start' }}>
                                            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                                <Text strong style={{ fontSize: 12 }}>{fb.student?.account?.fullName}</Text>
                                                <Text type="secondary" style={{ fontSize: 11 }}>
                                                    {fb.createdDate ? new Date(fb.createdDate).toLocaleDateString('vi-VN') : ''}
                                                </Text>
                                            </Space>
                                            <Space size={1} style={{ margin: '2px 0' }}>
                                                {[...Array(5)].map((_, i) => (
                                                    <StarFilled key={i} style={{ fontSize: 11, color: i < fb.star ? '#faad14' : '#d9d9d9' }} />
                                                ))}
                                            </Space>
                                            <Text type="secondary" style={{ fontSize: 11 }}>{fb.simulation?.title}</Text>
                                            <Text style={{ fontSize: 12, fontStyle: 'italic', color: '#595959' }}>{`"${fb.content}"`}</Text>
                                        </List.Item>
                                    )}
                                />
                            )}
                        </Card>

                        {/* Quick Shortcuts */}
                        <Card
                            size="small"
                            title="Phím tắt vận hành"
                            bodyStyle={{ padding: '8px 12px' }}
                        >
                            <Row gutter={[8, 8]}>
                                {shortcuts.map(s => (
                                    <Col xs={12} key={s.href}>
                                        <a href={s.href} className={styles.shortcutLink}>
                                            {s.icon}
                                            <Text style={{ fontSize: 12 }}>{s.label}</Text>
                                        </a>
                                    </Col>
                                ))}
                            </Row>
                        </Card>
                    </Col>
                </Row>
            ),
        },
        {
            key: 'analytics',
            label: 'Thống kê & Biểu đồ',
            children: (
                <Row gutter={[16, 16]}>
                    {/* Area Chart */}
                    <Col xs={24} xl={16}>
                        <Card
                            size="small"
                            title="Xu hướng tăng trưởng thành viên"
                            extra={<Text type="secondary" style={{ fontSize: 12 }}>Học viên và giảng viên lũy kế theo tháng</Text>}
                        >
                            <div style={{ height: 220 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={growthData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#1890ff" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#1890ff" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorEducators" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#722ed1" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#722ed1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: 11 }} />
                                        <YAxis tickLine={false} axisLine={false} style={{ fontSize: 11 }} />
                                        <ReTooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                                        <Legend verticalAlign="top" height={28} iconType="circle" iconSize={8} style={{ fontSize: 12 }} />
                                        <Area type="monotone" dataKey="Students" stroke="#1890ff" strokeWidth={2} fillOpacity={1} fill="url(#colorStudents)" name="Học viên" />
                                        <Area type="monotone" dataKey="Educators" stroke="#722ed1" strokeWidth={2} fillOpacity={1} fill="url(#colorEducators)" name="Giảng viên" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </Col>

                    {/* Donut Chart */}
                    <Col xs={24} xl={8}>
                        <Card
                            size="small"
                            title="Mô phỏng theo danh mục"
                            extra={<Text type="secondary" style={{ fontSize: 12 }}>Tỷ lệ phân chia đề tài</Text>}
                            style={{ height: '100%' }}
                        >
                            <div style={{ height: 160 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <ReTooltip formatter={(value) => `${value} mô phỏng`} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                                        <Legend iconType="circle" iconSize={8} style={{ fontSize: 11 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </Col>
                </Row>
            ),
        },
    ];

    return (
        <PageWrapper routes={[{ breadcrumbName: 'Admin Dashboard' }]}>
            {/* Refresh Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <Button icon={<ReloadOutlined />} onClick={loadData} size="small">
                    Làm mới dữ liệu
                </Button>
            </div>

            {/* KPI Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card size="small" hoverable>
                        <Statistic
                            title="Mô Phỏng Hoạt Động"
                            value={stats.simulationsCount}
                            prefix={<BookOutlined />}
                            valueStyle={{ color: '#1890ff', fontSize: 24 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card size="small" hoverable>
                        <Statistic
                            title="Tổng Học Viên"
                            value={stats.studentsCount}
                            prefix={<TeamOutlined />}
                            valueStyle={{ color: '#52c41a', fontSize: 24 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card size="small" hoverable>
                        <Statistic
                            title="Giảng Viên Hoạt Động"
                            value={stats.educatorsCount}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#722ed1', fontSize: 24 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card
                        size="small"
                        hoverable
                        style={{ borderColor: pendingTotal > 0 ? '#faad14' : undefined }}
                    >
                        <Statistic
                            title="Chờ Phê Duyệt"
                            value={pendingTotal}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{ color: pendingTotal > 0 ? '#faad14' : '#52c41a', fontSize: 24 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Main Content Tabs */}
            <Tabs
                activeKey={mainTab}
                onChange={setMainTab}
                items={mainTabItems}
                style={{ backgroundColor: 'white', padding: '4px 0', borderRadius: 6 }}
            />
        </PageWrapper>
    );
}
