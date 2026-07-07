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
    Modal,
    Form,
    Input,
    Select,
    Spin,
    Empty,
    DatePicker,
    Divider,
} from 'antd';
import {
    BookOutlined,
    TeamOutlined,
    StarFilled,
    ClockCircleOutlined,
    EditOutlined,
    ReloadOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ReTooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

import dayjs from 'dayjs';
import useFetch from '../../hooks/useFetch';
import apiConfig from '../../constants/apiConfig';
import PageWrapper from '@components/common/layout/PageWrapper';
import styles from './EducatorDashboard.module.scss';

const { Text } = Typography;
const { TextArea } = Input;
const CHART_COLORS = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1'];

export default function EducatorDashboard() {
    const [mySimulations, setMySimulations] = useState([]);
    const [selectedSimId, setSelectedSimId] = useState('all');
    const [mainTab, setMainTab] = useState('operations');

    // Filter states
    const [filterType, setFilterType] = useState('all'); // 'all', 'month', 'year', 'range'
    const [filterDate, setFilterDate] = useState(null); // month/year selection
    const [filterRange, setFilterRange] = useState([]); // custom start/end date range

    const [kpis, setKpis] = useState({
        totalSims: 0,
        totalParticipants: 0,
        avgRating: 0,
        pendingGrading: 0,
    });

    const [loading, setLoading] = useState(true);
    const [gradingQueue, setGradingQueue] = useState([]);
    const [selectedSimulationFeedbacks, setSelectedSimulationFeedbacks] = useState([]);

    // Review Modal States
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewingStudent, setReviewingStudent] = useState(null);
    const [reviewContent, setReviewContent] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    // Chart data states
    const [simPerformanceData, setSimPerformanceData] = useState([]);
    const [starDistribution, setStarDistribution] = useState([]);
    const [trendingCareersData, setTrendingCareersData] = useState([]);

    // ─── API Hooks ───
    const { execute: getEducatorSims } = useFetch(apiConfig.simulation.getListForEducator);
    const { execute: getCompleteStudents } = useFetch(
        apiConfig.simulation.studentComplete || {
            baseURL: `${apiConfig.simulation.getList.baseURL.split('simulation')[0]}simulation_enrollment/student_complete_list`,
            method: 'GET',
        },
    );
    const { execute: getFeedbacks } = useFetch(apiConfig.feedback.educatorList);
    const { execute: submitReview } = useFetch(apiConfig.reviewSubmission.create);
    const { execute: markReviewComplete } = useFetch(apiConfig.reviewSubmission.completeReview);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Fetch educator's simulations
            const simsRes = await getEducatorSims();
            const sims = simsRes?.data?.content || [];
            setMySimulations(sims);

            // Calculate date filters
            let startDate = null;
            let endDate = null;

            if (filterType === 'month' && filterDate) {
                startDate = dayjs(filterDate).startOf('month').format('DD/MM/YYYY HH:mm:ss');
                endDate = dayjs(filterDate).endOf('month').format('DD/MM/YYYY HH:mm:ss');
            } else if (filterType === 'year' && filterDate) {
                startDate = dayjs(filterDate).startOf('year').format('DD/MM/YYYY HH:mm:ss');
                endDate = dayjs(filterDate).endOf('year').format('DD/MM/YYYY HH:mm:ss');
            } else if (filterType === 'range' && filterRange && filterRange.length === 2) {
                startDate = dayjs(filterRange[0]).startOf('day').format('DD/MM/YYYY HH:mm:ss');
                endDate = dayjs(filterRange[1]).endOf('day').format('DD/MM/YYYY HH:mm:ss');
            }

            const apiParams = {};
            if (startDate) apiParams.startDate = startDate;
            if (endDate) apiParams.endDate = endDate;

            // 2. Fetch completed student list for grading
            const completesRes = await getCompleteStudents({ params: { ...apiParams, size: 200 } });
            const allCompletes = completesRes?.data?.content || [];

            // Filter by educator's simulations
            const educatorSimIds = new Set(sims.map((s) => s.id));
            const myCompletes = allCompletes.filter((item) => educatorSimIds.has(item.simulation?.id));
            const pendingReviews = myCompletes.filter((item) => !item.isReviewed);

            setGradingQueue(pendingReviews);

            // 3. KPIs
            const totalSims = sims.length;
            const totalParticipants = sims.reduce((acc, curr) => acc + (curr.totalParticipant || 0), 0);
            const ratedSims = sims.filter((s) => s.avgStar > 0);
            const avgRating =
                ratedSims.length > 0
                    ? parseFloat((ratedSims.reduce((acc, curr) => acc + curr.avgStar, 0) / ratedSims.length).toFixed(1))
                    : 0;

            setKpis({ totalSims, totalParticipants, avgRating, pendingGrading: pendingReviews.length });

            // 4. Performance chart
            const completionsMap = {};
            myCompletes.forEach((item) => {
                const simId = item.simulation?.id;
                if (simId) {
                    completionsMap[simId] = (completionsMap[simId] || 0) + 1;
                }
            });

            // Filter simulations: if date filter is active, only show simulations that had completions in that range.
            const filteredSims = sims.filter((s) => !startDate || completionsMap[s.id] > 0);

            const performanceChart = filteredSims.map((s) => {
                const registered = s.totalParticipant || 0;
                const completed = completionsMap[s.id] || 0;
                const rate = registered > 0 ? Math.round((completed / registered) * 100) : 0;
                return {
                    id: s.id,
                    name: s.title,
                    'Tỷ lệ hoàn thành': Math.min(rate, 100),
                    'Đăng ký': registered,
                    'Hoàn thành': completed,
                };
            });
            setSimPerformanceData(performanceChart);

            // 4.1. Trending Careers Chart Data
            const catMap = {};
            filteredSims.forEach((s) => {
                if (s.category && s.category.name) {
                    const catName = s.category.name;
                    catMap[catName] = (catMap[catName] || 0) + (s.totalParticipant || 0);
                }
            });
            const trendingChart = Object.keys(catMap)
                .map((name) => ({
                    name: name,
                    'Đã đăng ký': catMap[name],
                }))
                .sort((a, b) => b['Đã đăng ký'] - a['Đã đăng ký']);
            setTrendingCareersData(trendingChart);

            // 5. Feedback & star distribution
            const feedbackParams = { ...apiParams, size: 100 };
            if (selectedSimId !== 'all') {
                feedbackParams.simulationId = selectedSimId;
            }

            const fbRes = await getFeedbacks({ params: feedbackParams });
            const feedbacks = fbRes?.data?.content || [];
            setSelectedSimulationFeedbacks(feedbacks);

            const starsCount = { '5 Sao': 0, '4 Sao': 0, '3 Sao': 0, '2 Sao': 0, '1 Sao': 0 };
            feedbacks.forEach((fb) => {
                if (fb.star === 5) starsCount['5 Sao']++;
                else if (fb.star === 4) starsCount['4 Sao']++;
                else if (fb.star === 3) starsCount['3 Sao']++;
                else if (fb.star === 2) starsCount['2 Sao']++;
                else if (fb.star === 1) starsCount['1 Sao']++;
            });

            const starChart = Object.keys(starsCount)
                .map((key) => ({ name: key, value: starsCount[key] }))
                .filter((item) => item.value > 0);

            setStarDistribution(starChart);
        } catch (err) {
            console.error('Lỗi khi tải thông tin Educator Dashboard', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, [selectedSimId, filterType, filterDate, filterRange]);

    useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => {
                window.scrollTo({
                    top: document.documentElement.scrollHeight,
                    behavior: 'smooth',
                });
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [loading]);

    const handleOpenReview = (student) => {
        setReviewingStudent(student);
        setReviewContent('');
        setShowReviewModal(true);
    };

    const handleSubmitReview = async () => {
        if (!reviewingStudent) return;
        setSubmittingReview(true);
        try {
            await submitReview({
                data: {
                    studentSubmissionId: reviewingStudent.id,
                    studentTaskProgressId: reviewingStudent.id,
                    content: reviewContent || 'Hoàn thành đánh giá bài học mô phỏng.',
                },
            });

            await markReviewComplete({
                data: {
                    simulationId: reviewingStudent.simulationId,
                    studentUsername: reviewingStudent.studentUsername,
                },
            });

            setShowReviewModal(false);
            setReviewingStudent(null);
            loadDashboardData();
        } catch (error) {
            console.error('Không thể lưu nhận xét đánh giá', error);
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <Spin size="large" tip="Đang tải tiến độ và phản hồi..." />
            </div>
        );
    }

    // ─── Grading Queue Table ───
    const gradingColumns = [
        {
            title: 'Học viên',
            key: 'student',
            render: (_, r) => {
                const studentName =
                    r.student?.profileAccountDto?.fullName || r.student?.profileAccountDto?.username || '?';
                const studentEmail = r.student?.profileAccountDto?.email || '';
                return (
                    <Space>
                        <Avatar size={28} style={{ backgroundColor: '#52c41a', fontSize: 12 }}>
                            {studentName.charAt(0).toUpperCase()}
                        </Avatar>
                        <div>
                            <div style={{ fontWeight: 600, lineHeight: 1.3, fontSize: 13 }}>{studentName}</div>
                            {studentEmail && (
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                    {studentEmail}
                                </Text>
                            )}
                        </div>
                    </Space>
                );
            },
        },
        {
            title: 'Bài mô phỏng',
            key: 'simulation',
            render: (_, r) => (
                <Text
                    style={{ fontSize: 13, maxWidth: 200, display: 'block' }}
                    ellipsis={{ tooltip: r.simulation?.title }}
                >
                    {r.simulation?.title}
                </Text>
            ),
        },

        {
            title: 'Trạng thái',
            key: 'reviewed',
            render: (_, r) =>
                r.isReviewed ? (
                    <Tag color="green" icon={<CheckCircleOutlined />}>
                        Đã nhận xét
                    </Tag>
                ) : (
                    <Tag color="orange" icon={<ClockCircleOutlined />}>
                        Chờ nhận xét
                    </Tag>
                ),
        },
        {
            title: '',
            key: 'action',
            align: 'right',
            render: (_, r) =>
                !r.isReviewed ? (
                    <Button size="small" type="primary" icon={<EditOutlined />} onClick={() => handleOpenReview(r)}>
                        Nhận xét
                    </Button>
                ) : null,
        },
    ];

    // ─── Main Tab Items ───
    const mainTabItems = [
        {
            key: 'operations',
            label: `Tác vụ ${kpis.pendingGrading > 0 ? `(${kpis.pendingGrading})` : ''}`,
            children: (
                <Row gutter={[16, 16]}>
                    {/* Grading Queue */}
                    <Col xs={24} xl={16}>
                        <Card
                            size="small"
                            title={
                                <Space>
                                    <ClockCircleOutlined />
                                    <span>Hàng đợi nhận xét</span>
                                    {kpis.pendingGrading > 0 && (
                                        <Badge count={kpis.pendingGrading} style={{ backgroundColor: '#faad14' }} />
                                    )}
                                </Space>
                            }
                            extra={
                                <Select
                                    size="small"
                                    style={{ width: 200 }}
                                    value={selectedSimId}
                                    onChange={(val) => setSelectedSimId(val)}
                                    options={[
                                        { label: 'Tất cả bài mô phỏng', value: 'all' },
                                        ...mySimulations.map((s) => ({ label: s.title, value: s.id })),
                                    ]}
                                />
                            }
                        >
                            <Table
                                dataSource={gradingQueue}
                                columns={gradingColumns}
                                rowKey="id"
                                size="small"
                                pagination={{ pageSize: 6, showSizeChanger: false, hideOnSinglePage: true }}
                                locale={{
                                    emptyText: (
                                        <Empty
                                            description="Không có bài chờ nhận xét"
                                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        />
                                    ),
                                }}
                            />
                        </Card>
                    </Col>

                    {/* Feedback Panel */}
                    <Col xs={24} xl={8}>
                        <Card
                            size="small"
                            title={
                                <Space>
                                    <StarFilled style={{ color: '#faad14' }} />
                                    <span>Phản hồi học viên</span>
                                </Space>
                            }
                            bodyStyle={{ padding: '8px 12px' }}
                        >
                            {selectedSimulationFeedbacks.length === 0 ? (
                                <Empty
                                    description="Chưa có phản hồi"
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                    style={{ margin: '16px 0' }}
                                />
                            ) : (
                                <List
                                    size="small"
                                    dataSource={selectedSimulationFeedbacks.slice(0, 6)}
                                    renderItem={(fb) => (
                                        <List.Item
                                            style={{
                                                padding: '8px 0',
                                                flexDirection: 'column',
                                                alignItems: 'flex-start',
                                            }}
                                        >
                                            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                                <Text strong style={{ fontSize: 12 }}>
                                                    {fb.student?.account?.fullName}
                                                </Text>
                                                <Space size={2}>
                                                    {[...Array(5)].map((_, i) => (
                                                        <StarFilled
                                                            key={i}
                                                            style={{
                                                                fontSize: 10,
                                                                color: i < fb.star ? '#faad14' : '#d9d9d9',
                                                            }}
                                                        />
                                                    ))}
                                                </Space>
                                            </Space>
                                            <Text
                                                type="secondary"
                                                style={{ fontSize: 11, fontStyle: 'italic', marginTop: 2 }}
                                            >
                                                {`"${fb.content}"`}
                                            </Text>
                                        </List.Item>
                                    )}
                                />
                            )}
                        </Card>
                    </Col>
                </Row>
            ),
        },
        {
            key: 'analytics',
            label: 'Thống kê',
            children: (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Card size="small" title="Báo cáo thống kê & Phân tích mô phỏng">
                        {/* Filter Bar */}
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingBottom: 12,
                                borderBottom: '1px solid #f0f0f0',
                                marginBottom: 16,
                            }}
                        >
                            <Space size="middle" wrap>
                                <span style={{ fontWeight: 600 }}>Bộ lọc thời gian:</span>
                                <Select
                                    value={filterType}
                                    onChange={(val) => {
                                        setFilterType(val);
                                        setFilterDate(null);
                                        setFilterRange([]);
                                    }}
                                    style={{ width: 180 }}
                                    options={[
                                        { label: 'Tất cả thời gian', value: 'all' },
                                        { label: 'Lọc theo tháng', value: 'month' },
                                        { label: 'Lọc theo năm', value: 'year' },
                                        { label: 'Lọc theo khoảng ngày', value: 'range' },
                                    ]}
                                />
                                {filterType === 'month' && (
                                    <DatePicker
                                        picker="month"
                                        placeholder="Chọn tháng"
                                        value={filterDate}
                                        onChange={(val) => setFilterDate(val)}
                                        format="MM/YYYY"
                                    />
                                )}
                                {filterType === 'year' && (
                                    <DatePicker
                                        picker="year"
                                        placeholder="Chọn năm"
                                        value={filterDate}
                                        onChange={(val) => setFilterDate(val)}
                                        format="YYYY"
                                    />
                                )}
                                {filterType === 'range' && (
                                    <DatePicker.RangePicker
                                        placeholder={['Ngày bắt đầu', 'Ngày kết thúc']}
                                        value={filterRange}
                                        onChange={(val) => setFilterRange(val || [])}
                                        format="DD/MM/YYYY"
                                    />
                                )}
                            </Space>
                            <Button icon={<ReloadOutlined />} onClick={loadDashboardData} size="small">
                                Làm mới dữ liệu
                            </Button>
                        </div>

                        <Row gutter={[24, 24]} align="stretch">
                            {/* Performance Bar Chart */}
                            <Col xs={24} xl={16}>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: 12,
                                    }}
                                >
                                    <Text strong style={{ fontSize: 14 }}>
                                        Tỷ lệ hoàn thành mô phỏng
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Phần trăm học viên hoàn thành / đăng ký
                                    </Text>
                                </div>
                                <div style={{ height: 220 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={simPerformanceData}
                                            margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                                            style={{ cursor: 'pointer' }}
                                            onClick={(state) => {
                                                if (state && state.activePayload && state.activePayload.length > 0) {
                                                    const clickedData = state.activePayload[0].payload;
                                                    if (clickedData && clickedData.id) {
                                                        setSelectedSimId(clickedData.id);
                                                    }
                                                }
                                            }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="name"
                                                tickLine={false}
                                                axisLine={false}
                                                style={{ fontSize: 10 }}
                                            />
                                            <YAxis
                                                domain={[0, 100]}
                                                tickFormatter={(v) => `${v}%`}
                                                tickLine={false}
                                                axisLine={false}
                                                style={{ fontSize: 10 }}
                                            />
                                            <ReTooltip
                                                contentStyle={{ fontSize: 12, borderRadius: 6 }}
                                                formatter={(value, name, props) => {
                                                    if (name === 'Tỷ lệ hoàn thành') return [`${value}%`, name];
                                                    return [value, name];
                                                }}
                                            />
                                            <Legend
                                                verticalAlign="top"
                                                height={28}
                                                iconType="circle"
                                                iconSize={8}
                                                style={{ fontSize: 12 }}
                                            />
                                            <Bar
                                                dataKey="Tỷ lệ hoàn thành"
                                                fill="#13c2c2"
                                                radius={[3, 3, 0, 0]}
                                                barSize={30}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Col>

                            {/* Star Distribution */}
                            <Col xs={24} xl={8} className={styles.cardDivider}>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: 12,
                                    }}
                                >
                                    <Text strong style={{ fontSize: 14 }}>
                                        Phân bố đánh giá sao
                                    </Text>
                                </div>
                                <div
                                    style={{
                                        height: 220,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {starDistribution.length === 0 ? (
                                        <Empty
                                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                                            description="Chưa có đánh giá (0)"
                                            style={{ margin: 0 }}
                                        />
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={starDistribution}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={45}
                                                    outerRadius={65}
                                                    paddingAngle={4}
                                                    dataKey="value"
                                                >
                                                    {starDistribution.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                                                        />
                                                    ))}
                                                </Pie>
                                                <ReTooltip
                                                    formatter={(value) => {
                                                        const total = starDistribution.reduce(
                                                            (sum, item) => sum + item.value,
                                                            0,
                                                        );
                                                        const percentage =
                                                            total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                                        return [`${value} đánh giá (${percentage}%)`];
                                                    }}
                                                    contentStyle={{ fontSize: 12, borderRadius: 6 }}
                                                />
                                                <Legend iconType="circle" iconSize={8} style={{ fontSize: 11 }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </Col>
                        </Row>

                        <Divider style={{ margin: '20px 0', borderColor: '#f0f0f0' }} />

                        <Row gutter={[24, 24]}>
                            {/* Trending Careers Chart */}
                            <Col span={24}>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: 12,
                                    }}
                                >
                                    <Text strong style={{ fontSize: 14 }}>
                                        Xu hướng chuyên ngành được quan tâm nhất
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Xếp hạng chuyên môn theo lượt đăng ký thực tế của học viên
                                    </Text>
                                </div>
                                <div style={{ height: 260 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart
                                            data={trendingCareersData}
                                            margin={{ top: 12, right: 8, left: -20, bottom: 12 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="name"
                                                tickLine={false}
                                                axisLine={false}
                                                style={{ fontSize: 11, fontWeight: 500 }}
                                            />
                                            <YAxis tickLine={false} axisLine={false} style={{ fontSize: 10 }} />
                                            <ReTooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                                            <Bar
                                                dataKey="Đã đăng ký"
                                                fill="#722ed1"
                                                radius={[4, 4, 0, 0]}
                                                barSize={40}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </Col>
                        </Row>
                    </Card>
                </Space>
            ),
        },
    ];

    return (
        <PageWrapper routes={[{ breadcrumbName: 'Educator Dashboard' }]}>
            {/* KPI Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card size="small" hoverable>
                        <Statistic
                            title="Mô Phỏng Của Tôi"
                            value={kpis.totalSims}
                            prefix={<BookOutlined />}
                            valueStyle={{ color: '#1890ff', fontSize: 24 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card size="small" hoverable>
                        <Statistic
                            title="Tổng Đã Đăng Ký"
                            value={kpis.totalParticipants}
                            prefix={<TeamOutlined />}
                            valueStyle={{ color: '#52c41a', fontSize: 24 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card size="small" hoverable>
                        <Statistic
                            title="Đánh Giá Trung Bình"
                            value={kpis.avgRating}
                            suffix="/ 5"
                            prefix={<StarFilled />}
                            precision={1}
                            valueStyle={{ color: '#faad14', fontSize: 24 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card
                        size="small"
                        hoverable
                        style={{ borderColor: kpis.pendingGrading > 0 ? '#faad14' : undefined }}
                    >
                        <Statistic
                            title="Chờ Nhận Xét"
                            value={kpis.pendingGrading}
                            prefix={<ClockCircleOutlined />}
                            valueStyle={{
                                color: kpis.pendingGrading > 0 ? '#faad14' : '#52c41a',
                                fontSize: 24,
                            }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Main Content */}
            <Tabs
                activeKey={mainTab}
                onChange={setMainTab}
                items={mainTabItems}
                style={{ backgroundColor: 'white', padding: '4px 0', borderRadius: 6 }}
            />

            {/* Review Modal */}
            <Modal
                title={
                    <Space>
                        <EditOutlined />
                        <span>Nhận xét học viên</span>
                    </Space>
                }
                open={showReviewModal}
                onCancel={() => {
                    setShowReviewModal(false);
                    setReviewingStudent(null);
                }}
                onOk={handleSubmitReview}
                okText="Gửi nhận xét"
                cancelText="Hủy"
                confirmLoading={submittingReview}
                width={520}
            >
                {reviewingStudent && (
                    <Form layout="vertical" style={{ marginTop: 8 }}>
                        <Form.Item label="Học viên">
                            <Space>
                                <Avatar size={32} style={{ backgroundColor: '#52c41a' }}>
                                    {(reviewingStudent.studentName || '?').charAt(0).toUpperCase()}
                                </Avatar>
                                <div>
                                    <div style={{ fontWeight: 600 }}>
                                        {reviewingStudent.studentName || reviewingStudent.studentUsername}
                                    </div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        {reviewingStudent.simulationTitle}
                                    </Text>
                                </div>
                            </Space>
                        </Form.Item>
                        <Form.Item label="Nội dung nhận xét" required>
                            <TextArea
                                rows={4}
                                placeholder="Nhập nhận xét chi tiết cho học viên..."
                                value={reviewContent}
                                onChange={(e) => setReviewContent(e.target.value)}
                                showCount
                                maxLength={1000}
                            />
                        </Form.Item>
                    </Form>
                )}
            </Modal>
        </PageWrapper>
    );
}
