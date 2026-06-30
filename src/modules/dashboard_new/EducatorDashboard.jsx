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

import useFetch from '../../hooks/useFetch';
import apiConfig from '../../constants/apiConfig';
import PageWrapper from '@components/common/layout/PageWrapper';

const { Text } = Typography;
const { TextArea } = Input;
const CHART_COLORS = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1'];

export default function EducatorDashboard() {
    const [mySimulations, setMySimulations] = useState([]);
    const [selectedSimId, setSelectedSimId] = useState('all');
    const [mainTab, setMainTab] = useState('operations');

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

    // ─── API Hooks ───
    const { execute: getEducatorSims } = useFetch(apiConfig.simulation.getListForEducator);
    const { execute: getCompleteStudents } = useFetch(
        apiConfig.simulation.studentComplete || {
            baseURL: `${apiConfig.simulation.getList.baseURL.split('simulation')[0]}simulation_enrollment/student_complete_list`,
            method: 'GET',
        },
    );
    const { execute: getFeedbacks } = useFetch(apiConfig.feedback.list);
    const { execute: submitReview } = useFetch(apiConfig.reviewSubmission.create);
    const { execute: markReviewComplete } = useFetch(apiConfig.reviewSubmission.completeReview);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // 1. Fetch educator's simulations
            const simsRes = await getEducatorSims();
            const sims = simsRes?.data?.content || [];
            setMySimulations(sims);

            // 2. Fetch completed student list for grading
            const completesRes = await getCompleteStudents();
            const allCompletes = completesRes?.data?.content || [];

            // Filter by educator's simulations
            const educatorSimIds = new Set(sims.map(s => s.id));
            const myCompletes = allCompletes.filter(item => educatorSimIds.has(item.simulationId));
            const pendingReviews = myCompletes.filter(item => !item.isReviewed);

            setGradingQueue(pendingReviews);

            // 3. KPIs
            const totalSims = sims.length;
            const totalParticipants = sims.reduce((acc, curr) => acc + (curr.totalParticipant || 0), 0);
            const ratedSims = sims.filter(s => s.avgStar > 0);
            const avgRating =
                ratedSims.length > 0
                    ? parseFloat(
                        (ratedSims.reduce((acc, curr) => acc + curr.avgStar, 0) / ratedSims.length).toFixed(1),
                    )
                    : 0;

            setKpis({ totalSims, totalParticipants, avgRating, pendingGrading: pendingReviews.length });

            // 4. Performance chart
            const completionsMap = {};
            myCompletes.forEach(item => {
                completionsMap[item.simulationId] = (completionsMap[item.simulationId] || 0) + 1;
            });
            const performanceChart = sims.map(s => ({
                name: s.title?.length > 20 ? s.title.substring(0, 18) + '...' : s.title,
                'Lượt đăng ký': s.totalParticipant || 0,
                'Hoàn thành': completionsMap[s.id] || 0,
            }));
            setSimPerformanceData(performanceChart);

            // 5. Feedback & star distribution
            const activeSimId = selectedSimId === 'all' ? sims[0]?.id || null : selectedSimId;
            if (activeSimId) {
                const fbRes = await getFeedbacks({ params: { simulationId: activeSimId, size: 100 } });
                const feedbacks = fbRes?.data?.content || [];
                setSelectedSimulationFeedbacks(feedbacks);

                const starsCount = { '5 Sao': 0, '4 Sao': 0, '3 Sao': 0, '2 Sao': 0, '1 Sao': 0 };
                feedbacks.forEach(fb => {
                    if (fb.star === 5) starsCount['5 Sao']++;
                    else if (fb.star === 4) starsCount['4 Sao']++;
                    else if (fb.star === 3) starsCount['3 Sao']++;
                    else if (fb.star === 2) starsCount['2 Sao']++;
                    else if (fb.star === 1) starsCount['1 Sao']++;
                });

                const starChart = Object.keys(starsCount)
                    .map(key => ({ name: key, value: starsCount[key] }))
                    .filter(item => item.value > 0);

                setStarDistribution(starChart.length > 0 ? starChart : [{ name: 'Chưa có đánh giá', value: 1 }]);
            } else {
                setStarDistribution([{ name: 'Chưa có đánh giá', value: 1 }]);
            }
        } catch (err) {
            console.error('Lỗi khi tải thông tin Educator Dashboard', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, [selectedSimId]);

    const handleOpenReview = student => {
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
            render: (_, r) => (
                <Space>
                    <Avatar size={28} style={{ backgroundColor: '#52c41a', fontSize: 12 }}>
                        {(r.studentName || r.studentUsername || '?').charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                        <div style={{ fontWeight: 600, lineHeight: 1.3, fontSize: 13 }}>
                            {r.studentName || r.studentUsername}
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}>{r.studentEmail}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Bài mô phỏng',
            key: 'simulation',
            render: (_, r) => (
                <Text style={{ fontSize: 13, maxWidth: 200, display: 'block' }} ellipsis={{ tooltip: r.simulationTitle }}>
                    {r.simulationTitle}
                </Text>
            ),
        },
        {
            title: 'Ngày hoàn thành',
            dataIndex: 'completedDate',
            key: 'date',
            render: val => (
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {val ? new Date(val).toLocaleDateString('vi-VN') : '—'}
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
                    <Button
                        size="small"
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenReview(r)}
                    >
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
                                    onChange={val => setSelectedSimId(val)}
                                    options={[
                                        { label: 'Tất cả bài mô phỏng', value: 'all' },
                                        ...mySimulations.map(s => ({ label: s.title, value: s.id })),
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
                                    renderItem={fb => (
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
                <Row gutter={[16, 16]}>
                    {/* Performance Bar Chart */}
                    <Col xs={24} xl={16}>
                        <Card
                            size="small"
                            title="Hiệu suất mô phỏng"
                            extra={
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Lượt đăng ký vs hoàn thành
                                </Text>
                            }
                        >
                            <div style={{ height: 220 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={simPerformanceData}
                                        margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="name"
                                            tickLine={false}
                                            axisLine={false}
                                            style={{ fontSize: 10 }}
                                        />
                                        <YAxis tickLine={false} axisLine={false} style={{ fontSize: 10 }} />
                                        <ReTooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                                        <Legend
                                            verticalAlign="top"
                                            height={28}
                                            iconType="circle"
                                            iconSize={8}
                                            style={{ fontSize: 12 }}
                                        />
                                        <Bar dataKey="Lượt đăng ký" fill="#1890ff" radius={[3, 3, 0, 0]} />
                                        <Bar dataKey="Hoàn thành" fill="#52c41a" radius={[3, 3, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </Col>

                    {/* Star Distribution */}
                    <Col xs={24} xl={8}>
                        <Card
                            size="small"
                            title="Phân bố đánh giá sao"
                            style={{ height: '100%' }}
                        >
                            <div style={{ height: 180 }}>
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
                                            formatter={(value) => [`${value} đánh giá`]}
                                            contentStyle={{ fontSize: 12, borderRadius: 6 }}
                                        />
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
        <PageWrapper routes={[{ breadcrumbName: 'Educator Dashboard' }]}>
            {/* Refresh */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <Button icon={<ReloadOutlined />} onClick={loadDashboardData} size="small">
                    Làm mới dữ liệu
                </Button>
            </div>

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
                            title="Tổng Lượt Tham Gia"
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
                                onChange={e => setReviewContent(e.target.value)}
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
