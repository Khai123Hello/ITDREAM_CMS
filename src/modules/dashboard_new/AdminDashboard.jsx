import React, { useEffect, useState } from 'react';
import {
    IconBook,
    IconUsers,
    IconSchool,
    IconCheck,
    IconX,
    IconChecklist,
    IconChartBar,
    IconArrowUpRight,
    IconStar,
    IconSettings,
    IconShield,
    IconBuildingBank,
} from '@tabler/icons-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';

import useFetch from '../../hooks/useFetch';
import apiConfig from '../../constants/apiConfig';
import styles from './AdminDashboard.module.scss';

// Palette for charts
const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

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
    
    // Lists for queues
    const [pendingEducators, setPendingEducators] = useState([]);
    const [pendingSimulations, setPendingSimulations] = useState([]);
    const [pendingBlogs, setPendingBlogs] = useState([]);
    const [recentFeedbacks, setRecentFeedbacks] = useState([]);
    
    // Chart processed data
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
            
            // 1. Fetch counts & lists
            const simsRes = await getSims({ params: { page: 0, size: 200 } });
            if (simsRes?.data) {
                sims = simsRes.data.content || [];
            }

            const studentsRes = await getStudents({ params: { page: 0, size: 200 } });
            if (studentsRes?.data) {
                studentsList = studentsRes.data.content || [];
            }

            const educatorsRes = await getEducators({ params: { page: 0, size: 200 } });
            if (educatorsRes?.data) {
                educatorsList = educatorsRes.data.content || [];
            }

            const blogsRes = await getBlogs({ params: { page: 0, size: 200 } });
            if (blogsRes?.data) {
                blogsList = blogsRes.data.content || [];
            }

            const feedbacksRes = await getFeedbacks({ params: { page: 0, size: 5 } });
            if (feedbacksRes?.data) {
                setRecentFeedbacks(feedbacksRes.data.content || []);
            }

            // 2. Filter queues & sub-states
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

            // 3. Process growth chart data (group by Month based on createdDate)
            const monthlyGrowth = {};
            const months = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'];
            
            // Seed current year months
            months.forEach(m => {
                monthlyGrowth[m] = { Students: 0, Educators: 0 };
            });

            studentsList.forEach(st => {
                const dateStr = st.account?.createdDate;
                if (dateStr) {
                    const monthIdx = new Date(dateStr).getMonth();
                    const mName = months[monthIdx];
                    if (monthlyGrowth[mName]) monthlyGrowth[mName].Students += 1;
                }
            });

            educatorsList.forEach(ed => {
                const dateStr = ed.account?.createdDate;
                if (dateStr) {
                    const monthIdx = new Date(dateStr).getMonth();
                    const mName = months[monthIdx];
                    if (monthlyGrowth[mName]) monthlyGrowth[mName].Educators += 1;
                }
            });

            // Cumulative growth mapping
            let cumulativeSt = 0;
            let cumulativeEd = 0;
            const growthChart = months.map(m => {
                cumulativeSt += monthlyGrowth[m].Students;
                cumulativeEd += monthlyGrowth[m].Educators;
                return {
                    month: m,
                    Students: cumulativeSt || 10,
                    Educators: cumulativeEd || 2,
                };
            });
            setGrowthData(growthChart);

            // 4. Process Category distribution
            const categoriesCount = {};
            sims.forEach(sim => {
                const catName = sim.category?.name || 'Khác';
                categoriesCount[catName] = (categoriesCount[catName] || 0) + 1;
            });
            const donutData = Object.keys(categoriesCount).map(key => ({
                name: key,
                value: categoriesCount[key],
            }));
            setCategoryData(donutData.length > 0 ? donutData : [{ name: 'Không có dữ liệu', value: 1 }]);

        } catch (err) {
            console.error('Lỗi khi tải thông tin Dashboard', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Handlers for quick actions
    const handleEducatorApprove = async (id, approve) => {
        const fetchAction = approve ? approveEducator : rejectEducator;
        await fetchAction({
            payload: { id },
            onCompleted: () => {
                loadData();
            },
        });
    };

    const handleSimulationApprove = async (id, status, approve) => {
        if (status === 2) {
            const fetchAction = approve ? approveSimulation : rejectSimulation;
            await fetchAction({
                payload: { id, notice: approve ? '' : 'Không được phê duyệt do thông tin chưa đầy đủ' },
                onCompleted: () => {
                    loadData();
                },
            });
        } else if (status === 3) {
            const fetchAction = approve ? approveDeleteSimulation : rejectDeleteSimulation;
            await fetchAction({
                pathParams: { id },
                onCompleted: () => {
                    loadData();
                },
            });
        }
    };

    const handleBlogApprove = async (id, approve) => {
        const fetchAction = approve ? approveBlog : rejectBlog;
        await fetchAction({
            payload: { id },
            onCompleted: () => {
                loadData();
            },
        });
    };

    if (loading) {
        return (
            <div className={styles.loadingSpinner}>
                <div style={{ textAlign: 'center' }}>
                    <div className={styles.spinner}></div>
                    <p>Đang đồng bộ dữ liệu hệ thống...</p>
                </div>
            </div>
        );
    }

    const pendingTotal = stats.pendingEducatorsCount + stats.pendingSimulationsCount + stats.pendingDeletesCount + stats.pendingBlogsCount;

    return (
        <div className={styles.dashboardContainer}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1>Admin Dashboard</h1>
                    <p>Tổng quan hoạt động hệ thống và hàng đợi phê duyệt thời gian thực.</p>
                </div>
                <div>
                    <button onClick={loadData} className={styles.refreshBtn}>
                        Làm mới dữ liệu
                    </button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className={styles.kpiGrid}>
                {/* KPI 1 */}
                <div className={styles.kpiCard}>
                    <div className={`${styles.kpiIcon} ${styles.blue}`}>
                        <IconBook size={20} />
                    </div>
                    <div className={styles.kpiContent}>
                        <span className={styles.kpiTitle}>Mô Phỏng Hoạt Động</span>
                        <span className={styles.kpiValue}>{stats.simulationsCount}</span>
                    </div>
                </div>

                {/* KPI 2 */}
                <div className={styles.kpiCard}>
                    <div className={`${styles.kpiIcon} ${styles.emerald}`}>
                        <IconUsers size={20} />
                    </div>
                    <div className={styles.kpiContent}>
                        <span className={styles.kpiTitle}>Tổng Học Viên</span>
                        <span className={styles.kpiValue}>{stats.studentsCount}</span>
                    </div>
                </div>

                {/* KPI 3 */}
                <div className={styles.kpiCard}>
                    <div className={`${styles.kpiIcon} ${styles.purple}`}>
                        <IconSchool size={20} />
                    </div>
                    <div className={styles.kpiContent}>
                        <span className={styles.kpiTitle}>Giảng Viên Hoạt Động</span>
                        <span className={styles.kpiValue}>{stats.educatorsCount}</span>
                    </div>
                </div>

                {/* KPI 4 */}
                <div className={styles.kpiCardPending}>
                    <div className={`${styles.kpiIcon} ${styles.indigo}`}>
                        <IconChecklist size={20} />
                    </div>
                    <div className={styles.kpiContent}>
                        <span className={styles.kpiTitle}>Chờ Phê Duyệt</span>
                        <span className={styles.kpiValue}>{pendingTotal}</span>
                    </div>
                </div>
            </div>

            {/* Main Tabs Switcher */}
            <div className={styles.mainTabHeader}>
                <button
                    onClick={() => setMainTab('operations')}
                    className={`${styles.mainTabBtn} ${mainTab === 'operations' ? styles.active : ''}`}
                >
                    Tác vụ vận hành ({pendingTotal})
                </button>
                <button
                    onClick={() => setMainTab('analytics')}
                    className={`${styles.mainTabBtn} ${mainTab === 'analytics' ? styles.active : ''}`}
                >
                    Thống kê &amp; Biểu đồ
                </button>
            </div>

            {/* Tab Contents */}
            <div className={styles.tabContentContainer}>
                {mainTab === 'analytics' ? (
                    /* Graphs Grid */
                    <div className={styles.chartsGrid}>
                        {/* Growth Area Chart */}
                        <div className={styles.chartCardLarge}>
                            <h2 className={styles.cardTitle}>Xu Hướng Tăng Trưởng Thành Viên</h2>
                            <p className={styles.cardSubtitle}>Tổng số lượng học viên và giảng viên lũy kế qua các tháng.</p>
                            <div style={{ height: 200, width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorEducators" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: 11 }} />
                                        <YAxis tickLine={false} axisLine={false} style={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Legend verticalAlign="top" height={28} iconType="circle" />
                                        <Area type="monotone" dataKey="Students" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorStudents)" name="Học viên" />
                                        <Area type="monotone" dataKey="Educators" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorEducators)" name="Giảng viên" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Category Donut Chart */}
                        <div className={styles.chartCardSmall}>
                            <h2 className={styles.cardTitle}>Mô Phỏng Theo Danh Mục</h2>
                            <p className={styles.cardSubtitle}>Tỷ lệ phân chia đề tài bài tập mô phỏng.</p>
                            <div className={styles.donutContainer}>
                                <ResponsiveContainer width="100%" height="80%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={65}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `${value} mô phỏng`} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className={styles.legendList}>
                                    {categoryData.map((entry, index) => (
                                        <div key={entry.name} className={styles.legendItem}>
                                            <span className={styles.legendDot} style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}></span>
                                            <span>{entry.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Approval Workspace and Quick Actions */
                    <div className={styles.mainWorkspace}>
                        {/* Approval Queue Tabs & Tables */}
                        <div className={styles.queueCard}>
                            <div className={styles.queueHeader}>
                                <div>
                                    <h2 className={styles.cardTitle}>Danh Sách Chờ Phê Duyệt</h2>
                                    <p className={styles.cardSubtitle} style={{ marginBottom: 0 }}>Xử lý hồ sơ giảng viên, xuất bản mô phỏng hoặc bài thảo luận.</p>
                                </div>
                                <div className={styles.tabGroup}>
                                    <button
                                        onClick={() => setActiveTab('educators')}
                                        className={`${styles.tabBtn} ${activeTab === 'educators' ? styles.active : ''}`}
                                    >
                                        Giảng viên ({stats.pendingEducatorsCount})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('simulations')}
                                        className={`${styles.tabBtn} ${activeTab === 'simulations' ? styles.active : ''}`}
                                    >
                                        Mô phỏng ({stats.pendingSimulationsCount + stats.pendingDeletesCount})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('blogs')}
                                        className={`${styles.tabBtn} ${activeTab === 'blogs' ? styles.active : ''}`}
                                    >
                                        Blogs ({stats.pendingBlogsCount})
                                    </button>
                                </div>
                            </div>

                            <div className={styles.queueBody}>
                                {activeTab === 'educators' && (
                                    <div className={styles.tableWrapper}>
                                        <table className={styles.customTable}>
                                            <thead>
                                                <tr>
                                                    <th>Giảng viên</th>
                                                    <th>Email</th>
                                                    <th>Tổ chức</th>
                                                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pendingEducators.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} style={{ padding: '16px 0', textAlign: 'center', color: '#94a3b8' }}>
                                                            Không có giảng viên chờ duyệt.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    pendingEducators.map(ed => (
                                                        <tr key={ed.id}>
                                                            <td style={{ fontWeight: 600 }}>{ed.account?.fullName}</td>
                                                            <td>{ed.account?.email}</td>
                                                            <td>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                    <IconBuildingBank size={16} style={{ color: '#94a3b8' }} />
                                                                    <span>{ed.organization?.name}</span>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <div className={styles.actionCell}>
                                                                    <button
                                                                        onClick={() => handleEducatorApprove(ed.id, true)}
                                                                        className={styles.approveBtn}
                                                                        title="Duyệt tài khoản"
                                                                    >
                                                                        <IconCheck size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleEducatorApprove(ed.id, false)}
                                                                        className={styles.rejectBtn}
                                                                        title="Từ chối"
                                                                    >
                                                                        <IconX size={16} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === 'simulations' && (
                                    <div className={styles.tableWrapper}>
                                        <table className={styles.customTable}>
                                            <thead>
                                                <tr>
                                                    <th>Mô phỏng</th>
                                                    <th>Giảng viên</th>
                                                    <th>Yêu cầu</th>
                                                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pendingSimulations.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} style={{ padding: '16px 0', textAlign: 'center', color: '#94a3b8' }}>
                                                            Không có mô phỏng chờ phê duyệt.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    pendingSimulations.map(sim => (
                                                        <tr key={sim.id}>
                                                            <td>
                                                                <div style={{ fontWeight: 600 }}>{sim.title}</div>
                                                                <div style={{ fontSize: 11, color: '#94a3b8' }}>{sim.category?.name} • Cấp {sim.level}</div>
                                                            </td>
                                                            <td>{sim.educator?.account?.fullName || 'N/A'}</td>
                                                            <td>
                                                                {sim.status === 2 ? (
                                                                    <span className={`${styles.badge} ${styles.blue}`}>Tạo mới</span>
                                                                ) : (
                                                                    <span className={`${styles.badge} ${styles.orange}`}>Yêu cầu xóa</span>
                                                                )}
                                                            </td>
                                                            <td>
                                                                <div className={styles.actionCell}>
                                                                    <button
                                                                        onClick={() => handleSimulationApprove(sim.id, sim.status, true)}
                                                                        className={styles.approveBtn}
                                                                        title="Phê duyệt"
                                                                    >
                                                                        <IconCheck size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleSimulationApprove(sim.id, sim.status, false)}
                                                                        className={styles.rejectBtn}
                                                                        title="Từ chối"
                                                                    >
                                                                        <IconX size={16} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {activeTab === 'blogs' && (
                                    <div className={styles.tableWrapper}>
                                        <table className={styles.customTable}>
                                            <thead>
                                                <tr>
                                                    <th>Tiêu đề bài viết</th>
                                                    <th>Tác giả</th>
                                                    <th style={{ textAlign: 'right' }}>Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pendingBlogs.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={3} style={{ padding: '16px 0', textAlign: 'center', color: '#94a3b8' }}>
                                                            Không có bài viết chờ duyệt.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    pendingBlogs.map(blog => (
                                                        <tr key={blog.id}>
                                                            <td style={{ fontWeight: 600 }}>{blog.title}</td>
                                                            <td>{blog.authorName || 'N/A'}</td>
                                                            <td>
                                                                <div className={styles.actionCell}>
                                                                    <button
                                                                        onClick={() => handleBlogApprove(blog.id, true)}
                                                                        className={styles.approveBtn}
                                                                        title="Phê duyệt"
                                                                    >
                                                                        <IconCheck size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleBlogApprove(blog.id, false)}
                                                                        className={styles.rejectBtn}
                                                                        title="Từ chối"
                                                                    >
                                                                        <IconX size={16} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Side Panel: Feedbacks & Shortcuts */}
                        <div className={styles.sidePanel}>
                            {/* Recent Feedbacks */}
                            <div className={styles.feedbackCard}>
                                <h2 className={styles.cardTitle}>Đánh Giá Gần Đây</h2>
                                <div className={styles.feedbackList}>
                                    {recentFeedbacks.length === 0 ? (
                                        <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>
                                            Chưa nhận được phản hồi học viên.
                                        </p>
                                    ) : (
                                        recentFeedbacks.map(fb => (
                                            <div key={fb.id} className={styles.feedbackItem}>
                                                <div className={styles.feedbackMeta}>
                                                    <span className={styles.studentName}>{fb.student?.account?.fullName}</span>
                                                    <span className={styles.feedbackDate}>{fb.createdDate ? new Date(fb.createdDate).toLocaleDateString('vi-VN') : ''}</span>
                                                </div>
                                                <div className={styles.stars}>
                                                    {[...Array(5)].map((_, i) => (
                                                        <IconStar key={i} size={11} fill={i < fb.star ? 'currentColor' : 'none'} />
                                                    ))}
                                                </div>
                                                <p className={styles.feedbackCourse}>
                                                    {fb.simulation?.title}
                                                </p>
                                                <p className={styles.feedbackText}>
                                                    &quot;{fb.content}&quot;
                                                </p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Quick Settings Shortcut */}
                            <div className={styles.shortcutsCard}>
                                <h2 className={styles.cardTitle}>Phím Tắt Vận Hành</h2>
                                <div className={styles.shortcutsGrid}>
                                    <a href="/settings" className={styles.shortcutLink}>
                                        <IconSettings style={{ color: '#3b82f6' }} size={16} />
                                        <span>Thiết lập chung</span>
                                    </a>
                                    <a href="/group-permission" className={styles.shortcutLink}>
                                        <IconShield style={{ color: '#4f46e5' }} size={16} />
                                        <span>Phân quyền</span>
                                    </a>
                                    <a href="/category" className={styles.shortcutLink}>
                                        <IconChartBar style={{ color: '#10b981' }} size={16} />
                                        <span>Danh mục</span>
                                    </a>
                                    <a href="/user/admin/create" className={styles.shortcutLink}>
                                        <IconUsers style={{ color: '#8b5cf6' }} size={16} />
                                        <span>Tạo Admin</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}



