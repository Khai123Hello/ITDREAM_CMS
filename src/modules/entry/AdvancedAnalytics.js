import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import { BookOutlined, UserOutlined, ReadOutlined, MessageOutlined } from '@ant-design/icons';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

import useFetch from '@hooks/useFetch';
import apiConfig from '@constants/apiConfig';

const COLORS = ['#52c41a', '#1890ff', '#fa8c16', '#f5222d', '#722ed1'];

const enrollmentData = [
    { month: 'T1', Enrollments: 45, Completions: 32 },
    { month: 'T2', Enrollments: 68, Completions: 48 },
    { month: 'T3', Enrollments: 85, Completions: 61 },
    { month: 'T4', Enrollments: 120, Completions: 89 },
    { month: 'T5', Enrollments: 140, Completions: 110 },
    { month: 'T6', Enrollments: 175, Completions: 142 },
];

const simPopularityData = [
    { name: 'Mô phỏng Quản lý Dự án', Enrollments: 120, Completions: 98 },
    { name: 'Thực hành Lập trình Java', Enrollments: 98, Completions: 74 },
    { name: 'Kỹ năng Giao tiếp Client', Enrollments: 86, Completions: 80 },
    { name: 'Mô phỏng Phân tích Data', Enrollments: 75, Completions: 50 },
    { name: 'Thực hành Kế toán ảo', Enrollments: 64, Completions: 42 },
];

const feedbackDistData = [
    { name: '5 Sao (Rất tốt)', value: 65 },
    { name: '4 Sao (Tốt)', value: 25 },
    { name: '3 Sao (Bình thường)', value: 8 },
    { name: '2 Sao (Kém)', value: 1 },
    { name: '1 Sao (Tệ)', value: 1 },
];

const AdvancedAnalytics = () => {
    const [stats, setStats] = useState({
        simulations: 0,
        students: 0,
        educators: 0,
        pendingBlogs: 0,
    });
    const [loading, setLoading] = useState(true);

    const { execute: getSims } = useFetch(apiConfig.simulation.getList);
    const { execute: getStudents } = useFetch(apiConfig.student.getList);
    const { execute: getEducators } = useFetch(apiConfig.educator.getList);
    const { execute: getBlogs } = useFetch(apiConfig.blog.getList);

    useEffect(() => {
        let active = true;
        setLoading(true);

        const fetchAllStats = async () => {
            try {
                let simsCount = 0;
                let studentsCount = 0;
                let educatorsCount = 0;
                let blogsCount = 0;

                // Fetch Simulations count
                await getSims({
                    params: { page: 0, size: 1 },
                    onCompleted: (res) => {
                        simsCount = res.data?.totalElements || 0;
                    },
                });

                // Fetch Students count
                await getStudents({
                    params: { page: 0, size: 1 },
                    onCompleted: (res) => {
                        studentsCount = res.data?.totalElements || 0;
                    },
                });

                // Fetch Educators count
                await getEducators({
                    params: { page: 0, size: 1 },
                    onCompleted: (res) => {
                        educatorsCount = res.data?.totalElements || 0;
                    },
                });

                // Fetch Pending Blogs count (status = 0)
                await getBlogs({
                    params: { page: 0, size: 1, status: 0 },
                    onCompleted: (res) => {
                        blogsCount = res.data?.totalElements || 0;
                    },
                });

                if (active) {
                    setStats({
                        simulations: simsCount,
                        students: studentsCount,
                        educators: educatorsCount,
                        pendingBlogs: blogsCount,
                    });
                    setLoading(false);
                }
            } catch (err) {
                console.error('Failed to fetch analytics statistics', err);
                if (active) setLoading(false);
            }
        };

        fetchAllStats();
        return () => {
            active = false;
        };
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Spin size="large" tip="Đang tải dữ liệu phân tích..." />
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            <h1 style={{ marginBottom: '24px', fontWeight: 'bold' }}>Dashboard Phân Tích Hệ Thống</h1>

            {/* KPI Cards */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card style={{ borderRadius: '12px', borderLeft: '5px solid #1890ff' }} hoverable>
                        <Statistic
                            title="Bài Mô Phỏng"
                            value={stats.simulations}
                            prefix={<BookOutlined style={{ color: '#1890ff', marginRight: '8px' }} />}
                            valueStyle={{ fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card style={{ borderRadius: '12px', borderLeft: '5px solid #52c41a' }} hoverable>
                        <Statistic
                            title="Học Viên (Students)"
                            value={stats.students}
                            prefix={<UserOutlined style={{ color: '#52c41a', marginRight: '8px' }} />}
                            valueStyle={{ fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card style={{ borderRadius: '12px', borderLeft: '5px solid #722ed1' }} hoverable>
                        <Statistic
                            title="Giảng Viên (Educators)"
                            value={stats.educators}
                            prefix={<ReadOutlined style={{ color: '#722ed1', marginRight: '8px' }} />}
                            valueStyle={{ fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card style={{ borderRadius: '12px', borderLeft: '5px solid #fa8c16' }} hoverable>
                        <Statistic
                            title="Blog Chờ Duyệt"
                            value={stats.pendingBlogs}
                            prefix={<MessageOutlined style={{ color: '#fa8c16', marginRight: '8px' }} />}
                            valueStyle={{ fontWeight: 'bold' }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Chart Area */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                {/* Enrollment & Completed Area Chart */}
                <Col xs={24} lg={12}>
                    <Card title="Xu Hướng Đăng Ký & Hoàn Thành (6 Tháng Qua)" style={{ borderRadius: '12px' }}>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <AreaChart data={enrollmentData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorEnroll" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1890ff" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#1890ff" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorComplete" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#52c41a" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#52c41a" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="Enrollments"
                                        name="Đăng ký mới"
                                        stroke="#1890ff"
                                        fillOpacity={1}
                                        fill="url(#colorEnroll)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="Completions"
                                        name="Hoàn thành"
                                        stroke="#52c41a"
                                        fillOpacity={1}
                                        fill="url(#colorComplete)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>

                {/* Simulation Popularity Bar Chart */}
                <Col xs={24} lg={12}>
                    <Card title="Mô Phỏng Phổ Biến Nhất" style={{ borderRadius: '12px' }}>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={simPopularityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="Enrollments" name="Lượt học" fill="#1890ff" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="Completions" name="Hoàn thành" fill="#52c41a" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                {/* Feedback Star Rating Pie Chart */}
                <Col xs={24} lg={12}>
                    <Card title="Phân Bổ Sao Đánh Giá (Mức Độ Hài Lòng)" style={{ borderRadius: '12px' }}>
                        <div
                            style={{
                                width: '100%',
                                height: 300,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <ResponsiveContainer width="70%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={feedbackDistData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={true}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {feedbackDistData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} lg={12}>
                    <Card title="Thông Tin Vận Hành Hệ Thống" style={{ borderRadius: '12px' }}>
                        <div style={{ padding: '16px', lineHeight: '2' }}>
                            <p>
                                🌟 <strong>Trạng thái hệ thống:</strong> Ổn định (Hoạt động 99.9% uptime)
                            </p>
                            <p>
                                📈 <strong>Tỉ lệ hoàn thành trung bình:</strong> 74.2%
                            </p>
                            <p>
                                💬 <strong>Tốc độ phản hồi trung bình (Thảo luận):</strong> 1.5 giờ
                            </p>
                            <p>
                                📝 <strong>Lượng bài viết mới tuần này:</strong> 15 bài đăng
                            </p>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default AdvancedAnalytics;
