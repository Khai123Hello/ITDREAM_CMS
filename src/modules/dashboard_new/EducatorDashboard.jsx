import React, { useEffect, useState } from 'react';
import {
    IconBook,
    IconUsers,
    IconStar,
    IconClipboardList,
    IconChevronRight,
    IconClock,
    IconUserCheck,
    IconAlertCircle,
    IconFolderOpen,
    IconX,
} from '@tabler/icons-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

import useFetch from '../../hooks/useFetch';
import apiConfig from '../../constants/apiConfig';
import styles from './EducatorDashboard.module.scss';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

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

    // Hook Fetchers
    const { execute: getEducatorSims } = useFetch(apiConfig.simulation.getListForEducator);
    const { execute: getCompleteStudents } = useFetch(apiConfig.simulation.studentComplete || apiConfig.studentComplete || {
        baseURL: `${apiConfig.simulation.getList.baseURL.split('simulation')[0]}simulation_enrollment/student_complete_list`,
        method: 'GET',
    });
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
            
            // Filter completed students that belong to the educator's simulations
            const educatorSimIds = new Set(sims.map(s => s.id));
            const myCompletes = allCompletes.filter(item => educatorSimIds.has(item.simulationId));
            const pendingReviews = myCompletes.filter(item => !item.isReviewed);
            
            setGradingQueue(pendingReviews);

            // 3. Process KPI Summary
            const totalSims = sims.length;
            const totalParticipants = sims.reduce((acc, curr) => acc + (curr.totalParticipant || 0), 0);
            const ratedSims = sims.filter(s => s.avgStar > 0);
            const avgRating = ratedSims.length > 0 
                ? parseFloat((ratedSims.reduce((acc, curr) => acc + curr.avgStar, 0) / ratedSims.length).toFixed(1))
                : 0;

            setKpis({
                totalSims,
                totalParticipants,
                avgRating,
                pendingGrading: pendingReviews.length,
            });

            // 4. Process Enrollments vs Completions chart data
            const completionsMap = {};
            myCompletes.forEach(item => {
                completionsMap[item.simulationId] = (completionsMap[item.simulationId] || 0) + 1;
            });

            const performanceChart = sims.map(s => ({
                name: s.title.length > 20 ? s.title.substring(0, 18) + '...' : s.title,
                'Lượt đăng ký': s.totalParticipant || 0,
                'Hoàn thành': completionsMap[s.id] || 0,
            }));
            setSimPerformanceData(performanceChart);

            // 5. Fetch feedback & star distribution for selected simulation
            const activeSimId = selectedSimId === 'all' ? (sims[0]?.id || null) : selectedSimId;
            if (activeSimId) {
                const fbRes = await getFeedbacks({ params: { simulationId: activeSimId, size: 100 } });
                const feedbacks = fbRes?.data?.content || [];
                setSelectedSimulationFeedbacks(feedbacks);

                // Compute Star Distribution for chart
                const starsCount = { '5 Sao': 0, '4 Sao': 0, '3 Sao': 0, '2 Sao': 0, '1 Sao': 0 };
                feedbacks.forEach(fb => {
                    if (fb.star === 5) starsCount['5 Sao']++;
                    else if (fb.star === 4) starsCount['4 Sao']++;
                    else if (fb.star === 3) starsCount['3 Sao']++;
                    else if (fb.star === 2) starsCount['2 Sao']++;
                    else if (fb.star === 1) starsCount['1 Sao']++;
                });

                const starChart = Object.keys(starsCount).map(key => ({
                    name: key,
                    value: starsCount[key],
                })).filter(item => item.value > 0);
                
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

    const handleOpenReview = (student) => {
        setReviewingStudent(student);
        setReviewContent('');
        setShowReviewModal(true);
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!reviewingStudent) return;
        setSubmittingReview(true);
        try {
            await submitReview({
                payload: {
                    studentSubmissionId: reviewingStudent.id,
                    studentTaskProgressId: reviewingStudent.id, 
                    content: reviewContent || 'Hoàn thành đánh giá bài học mô phỏng.',
                },
            });

            await markReviewComplete({
                payload: {
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
            <div className={styles.loadingSpinner}>
                <div style={{ textAlign: 'center' }}>
                    <div className={styles.spinner}></div>
                    <p>Đang tải tiến độ và phản hồi...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.dashboardContainer}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1>Educator Dashboard</h1>
                    <p>Theo dõi tình hình học tập và nhận xét năng lực của học viên.</p>
                </div>
                {/* Simulation Filter */}
                <div className={styles.filterGroup}>
                    <span>Mô phỏng:</span>
                    <select
                        value={selectedSimId}
                        onChange={(e) => {
                            const val = e.target.value;
                            setSelectedSimId(val === 'all' ? 'all' : parseInt(val));
                        }}
                        className={styles.filterSelect}
                    >
                        <option value="all">Tất cả bài mô phỏng</option>
                        {mySimulations.map(sim => (
                            <option key={sim.id} value={sim.id}>{sim.title}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* KPIs */}
            <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                    <div className={`${styles.kpiIcon} ${styles.emerald}`}>
                        <IconBook size={20} />
                    </div>
                    <div className={styles.kpiContent}>
                        <span className={styles.kpiTitle}>Mô Phỏng Của Tôi</span>
                        <span className={styles.kpiValue}>{kpis.totalSims}</span>
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={`${styles.kpiIcon} ${styles.blue}`}>
                        <IconUsers size={20} />
                    </div>
                    <div className={styles.kpiContent}>
                        <span className={styles.kpiTitle}>Tổng Lượt Tham Gia</span>
                        <span className={styles.kpiValue}>{kpis.totalParticipants}</span>
                    </div>
                </div>

                <div className={styles.kpiCard}>
                    <div className={`${styles.kpiIcon} ${styles.amber}`}>
                        <IconStar size={20} />
                    </div>
                    <div className={styles.kpiContent}>
                        <span className={styles.kpiTitle}>Đánh Giá Trung Bình</span>
                        <span className={styles.kpiValue} style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                            {kpis.avgRating} <span style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>/ 5.0</span>
                        </span>
                    </div>
                </div>

                <div className={styles.kpiCardPending}>
                    <div className={`${styles.kpiIcon} ${styles.teal}`}>
                        <IconClipboardList size={20} />
                    </div>
                    <div className={styles.kpiContent}>
                        <span className={styles.kpiTitle}>Bài Chờ Chấm Điểm</span>
                        <span className={styles.kpiValue}>{kpis.pendingGrading}</span>
                    </div>
                </div>
            </div>

            {/* Main Tabs Switcher */}
            <div className={styles.mainTabHeader}>
                <button
                    onClick={() => setMainTab('operations')}
                    className={`${styles.mainTabBtn} ${mainTab === 'operations' ? styles.active : ''}`}
                >
                    Hàng đợi chấm bài ({gradingQueue.length})
                </button>
                <button
                    onClick={() => setMainTab('analytics')}
                    className={`${styles.mainTabBtn} ${mainTab === 'analytics' ? styles.active : ''}`}
                >
                    Thống kê hiệu suất
                </button>
            </div>

            {/* Tab Contents */}
            <div className={styles.tabContentContainer}>
                {mainTab === 'analytics' ? (
                    /* Charts Grid */
                    <div className={styles.chartsGrid}>
                        {/* Bar Chart: Enrollments vs Completions */}
                        <div className={styles.chartCardLarge}>
                            <h2 className={styles.cardTitle}>Hiệu Suất Đăng Ký &amp; Hoàn Thành</h2>
                            <p className={styles.cardSubtitle}>So sánh số lượng học viên đăng ký với số lượng hoàn thành trên mỗi bài mô phỏng.</p>
                            <div style={{ height: 200 }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={simPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" tickLine={false} axisLine={false} style={{ fontSize: 11 }} />
                                        <YAxis tickLine={false} axisLine={false} style={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Legend verticalAlign="top" height={28} iconType="circle" />
                                        <Bar dataKey="Lượt đăng ký" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Hoàn thành" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Pie Chart: Ratings Distribution */}
                        <div className={styles.chartCardSmall}>
                            <h2 className={styles.cardTitle}>Mức Độ Hài Lòng</h2>
                            <p className={styles.cardSubtitle}>
                                {selectedSimId === 'all' ? 'Phân bổ sao của mô phỏng đầu tiên' : 'Phân bổ sao của mô phỏng đang chọn'}
                            </p>
                            <div className={styles.donutContainer}>
                                <ResponsiveContainer width="100%" height="80%">
                                    <PieChart>
                                        <Pie
                                            data={starDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={65}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {starDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `${value} lượt`} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className={styles.legendList}>
                                    {starDistribution.map((entry, index) => (
                                        <div key={entry.name} className={styles.legendItem}>
                                            <span className={styles.legendDot} style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                            <span>{entry.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Tables Grid */
                    <div className={styles.mainWorkspace}>
                        {/* Grading Queue Table */}
                        <div className={styles.queueCard}>
                            <div className={styles.queueHeader}>
                                <div>
                                    <h2 className={styles.cardTitle}>Hàng Đợi Chấm Bài</h2>
                                    <p className={styles.cardSubtitle} style={{ marginBottom: 0 }}>Danh sách học viên đã hoàn tất, cần giảng viên nhận xét năng lực.</p>
                                </div>
                                <div className={styles.headerBadge}>
                                    <IconUserCheck size={16} />
                                    <span>{gradingQueue.length} Chờ review</span>
                                </div>
                            </div>

                            <div className={styles.queueBody}>
                                <div className={styles.tableWrapper}>
                                    <table className={styles.customTable}>
                                        <thead>
                                            <tr>
                                                <th>Học viên</th>
                                                <th>Bài mô phỏng</th>
                                                <th>Hoàn thành ngày</th>
                                                <th style={{ textAlign: 'right' }}>Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {gradingQueue.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} style={{ padding: '16px 0', textAlign: 'center', color: '#94a3b8' }}>
                                                        Không có bài làm nào đang chờ đánh giá!
                                                    </td>
                                                </tr>
                                            ) : (
                                                gradingQueue.map(item => (
                                                    <tr key={item.id}>
                                                        <td>
                                                            <div style={{ fontWeight: 650 }}>{item.studentName}</div>
                                                            <div style={{ fontSize: 11, color: '#94a3b8' }}>@{item.studentUsername}</div>
                                                        </td>
                                                        <td style={{ fontWeight: 600 }}>{item.simulationTitle}</td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                                                                <IconClock size={14} style={{ color: '#94a3b8' }} />
                                                                <span>{item.createdDate ? new Date(item.createdDate).toLocaleDateString('vi-VN') : 'N/A'}</span>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                                <button
                                                                    onClick={() => handleOpenReview(item)}
                                                                    className={styles.gradeBtn}
                                                                >
                                                                    <span>Chấm điểm</span>
                                                                    <IconChevronRight size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Feedbacks Panel */}
                        <div className={styles.feedbackCard}>
                            <div className={styles.feedbackHeader}>
                                <h2 className={styles.cardTitle}>Phản Hồi &amp; Thảo Luận</h2>
                                <div className={styles.headerCounter}>
                                    {selectedSimulationFeedbacks.length} Đánh giá
                                </div>
                            </div>
                            <div className={styles.feedbackList}>
                                {selectedSimulationFeedbacks.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8' }}>
                                        <IconFolderOpen style={{ color: '#cbd5e1', marginBottom: 8 }} size={28} />
                                        <div style={{ fontSize: 12 }}>Chưa nhận được phản hồi nào cho bài mô phỏng này.</div>
                                    </div>
                                ) : (
                                    selectedSimulationFeedbacks.map(fb => (
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
                                            <p className={styles.feedbackText}>
                                                &quot;{fb.content}&quot;
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Grading / Review Modal */}
            {showReviewModal && reviewingStudent && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <div>
                                <h3>Nhận Xét Năng Lực Học Viên</h3>
                                <p>Gửi nhận xét kết quả bài làm cho {reviewingStudent.studentName}.</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowReviewModal(false);
                                    setReviewingStudent(null);
                                }}
                                className={styles.closeBtn}
                            >
                                <IconX size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitReview} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className={styles.studentInfoCard}>
                                <div><strong>Học viên:</strong> {reviewingStudent.studentName} (@{reviewingStudent.studentUsername})</div>
                                <div><strong>Nhiệm vụ:</strong> Hoàn thành bài mô phỏng <em>{reviewingStudent.simulationTitle}</em></div>
                                <div className={styles.infoAlert}>
                                    <IconAlertCircle size={14} />
                                    <span>Đánh giá này sẽ kích hoạt chứng nhận thành tựu và gửi email thông báo.</span>
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Nhận xét bài nộp tự luận / Báo cáo thực hành:</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={reviewContent}
                                    onChange={(e) => setReviewContent(e.target.value)}
                                    placeholder="Nhập nhận xét chi tiết, nhận xét kỹ năng lập trình, giải quyết vấn đề của học viên..."
                                />
                            </div>

                            <div className={styles.modalFooter}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowReviewModal(false);
                                        setReviewingStudent(null);
                                    }}
                                    className={styles.cancelBtn}
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingReview}
                                    className={styles.submitBtn}
                                >
                                    {submittingReview ? 'Đang gửi...' : 'Xác nhận đánh giá'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}


