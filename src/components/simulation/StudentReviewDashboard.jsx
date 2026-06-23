import React, { useEffect, useState, useMemo } from 'react';
import { Empty, Rate, Button, Row, Col, Progress, Spin, Pagination, Modal, message } from 'antd';
import { DeleteOutlined, StarFilled } from '@ant-design/icons';
import dayjs from 'dayjs';
import useFetch from '@hooks/useFetch';
import useValidatePermission from '@hooks/useValidatePermission';
import { AppConstants } from '@constants';
import apiConfig from '@constants/apiConfig';
import styles from './detail.module.scss';

// Helpers to match visual styles for student avatars
const getInitials = (fullName) => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const getAvatarColor = (name) => {
    const colors = [
        'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)', // amber
        'linear-gradient(135deg, #059669 0%, #10b981 100%)', // green
        'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', // indigo
        'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)', // pink
        'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', // blue
        'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', // cyan
    ];
    let hash = 0;
    const cleanName = name || '';
    for (let i = 0; i < cleanName.length; i++) {
        hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

const StudentReviewDashboard = ({ simulationId, avgStar = 0, totalParticipant = 0 }) => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    
    const { execute: executeGetFeedbacks } = useFetch(apiConfig.feedback.list, { immediate: false });
    const { execute: executeDeleteFeedback } = useFetch(apiConfig.feedback.delete, { immediate: false });
    const validatePermission = useValidatePermission();
    
    // Check permission to delete feedback
    const canDeleteFeedback = validatePermission([apiConfig.feedback.delete.permissionCode]);

    const fetchFeedbacks = () => {
        if (!simulationId || simulationId === 'create') return;
        setLoading(true);
        executeGetFeedbacks({
            params: {
                simulationId,
                page: page - 1,
                size: 6,
            },
            onCompleted: (res) => {
                setFeedbacks(res.data?.content || []);
                setTotal(res.data?.totalElements || res.data?.total || 0);
                setLoading(false);
            },
            onError: () => {
                setLoading(false);
            }
        });
    };

    useEffect(() => {
        setPage(1);
    }, [simulationId]);

    useEffect(() => {
        fetchFeedbacks();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [simulationId, page]);

    const ratingDistribution = useMemo(() => {
        const starCounts = [0, 0, 0, 0, 0];
        feedbacks.forEach((item) => {
            if (item.star >= 1 && item.star <= 5) {
                starCounts[item.star - 1]++;
            }
        });
        return starCounts;
    }, [feedbacks]);

    const currentListCount = feedbacks.length;

    const handleDelete = (id) => {
        Modal.confirm({
            title: 'Bạn có chắc chắn muốn xóa đánh giá này không?',
            okText: 'Có',
            cancelText: 'Không',
            okType: 'danger',
            onOk: () => {
                executeDeleteFeedback({
                    pathParams: { id },
                    onCompleted: () => {
                        message.success('Xóa đánh giá thành công');
                        if (feedbacks.length === 1 && page > 1) {
                            setPage(page - 1);
                        } else {
                            fetchFeedbacks();
                        }
                    },
                    onError: () => {
                        message.error('Không thể xóa đánh giá. Vui lòng thử lại!');
                    }
                });
            }
        });
    };

    if (!simulationId || simulationId === 'create') {
        return (
            <div style={{ padding: '32px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #e8e4dc', color: '#8a877f' }}>
                Vui lòng lưu thông tin bài mô phỏng trước để hiển thị đánh giá của học viên.
            </div>
        );
    }

    return (
        <div className={styles.dashboardContainer}>
            {/* Header statistics block */}
            <div className={styles.statsRow}>
                {/* Average rating block */}
                <div className={styles.avgCard}>
                    <div className={styles.avgVal}>{avgStar ? avgStar.toFixed(1) : '0.0'}</div>
                    <div className={styles.avgStars}>
                        <Rate disabled allowHalf value={avgStar || 0} style={{ fontSize: 18, color: '#f59e0b' }} />
                    </div>
                    <div className={styles.avgCount}>
                        <StarFilled style={{ color: '#d97706', marginRight: 4 }} />
                        {total || 0} học viên đã tham gia đánh giá
                    </div>
                </div>

                {/* Rating distribution breakdown */}
                <div className={styles.distributionCard}>
                    <div style={{ margin: '0 0 12px 0', color: '#1a1814', fontSize: '13px', fontWeight: '600' }}>
                        Phân bổ đánh giá (Trang này)
                    </div>
                    {[5, 4, 3, 2, 1].map((star) => {
                        const count = ratingDistribution[star - 1] || 0;
                        const percent = currentListCount > 0 ? Math.round((count / currentListCount) * 100) : 0;
                        return (
                            <div key={star} className={styles.distRow}>
                                <span className={styles.distLabel}>{star} ★</span>
                                <div className={styles.distBar}>
                                    <Progress percent={percent} showInfo={false} size="small" />
                                </div>
                                <span className={styles.distCount}>{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* List of reviews cards */}
            {loading ? (
                <div style={{ padding: '60px 0', textAlign: 'center' }}>
                    <Spin tip="Đang tải danh sách đánh giá..." />
                </div>
            ) : feedbacks.length > 0 ? (
                <>
                    <div className={styles.reviewsGrid}>
                        {feedbacks.map((record) => {
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
                                <div className={styles.feedbackCard} key={record.id}>
                                    <div>
                                        <div className={styles.cardHeader}>
                                            {avatarUrl ? (
                                                <img 
                                                    src={avatarUrl} 
                                                    alt={fullName} 
                                                    className={styles.cardAvatar} 
                                                />
                                            ) : (
                                                <div 
                                                    style={{ background: avatarBg }}
                                                    className={styles.cardAvatarText}
                                                >
                                                    {initials}
                                                </div>
                                            )}
                                            <div className={styles.cardMeta}>
                                                <div className={styles.cardName}>{fullName}</div>
                                                <div className={styles.cardUsername}>{username || 'Học viên'}</div>
                                            </div>
                                            <div className={styles.cardRatingArea}>
                                                <Rate disabled value={record.star} className={styles.cardRating} style={{ fontSize: 10, color: '#f59e0b' }} />
                                                <span className={styles.cardDate}>
                                                    {record.createdDate ? dayjs(record.createdDate).format('DD/MM/YYYY') : ''}
                                                </span>
                                            </div>
                                        </div>

                                        <div className={`${styles.cardContent} ${!record.content ? styles.empty : ''}`}>
                                            {record.content ? record.content : 'Học viên không để lại nhận xét bằng lời.'}
                                        </div>
                                    </div>

                                    {canDeleteFeedback && (
                                        <Button 
                                            type="text" 
                                            danger 
                                            icon={<DeleteOutlined />} 
                                            onClick={() => handleDelete(record.id)}
                                            className={styles.deleteBtn}
                                        >
                                            Xóa đánh giá
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {total > 6 && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                            <Pagination
                                current={page}
                                total={total}
                                pageSize={6}
                                onChange={(p) => setPage(p)}
                                showSizeChanger={false}
                            />
                        </div>
                    )}
                </>
            ) : (
                <div style={{ padding: '40px', background: '#fff', borderRadius: '12px', border: '1px solid #e8e4dc', textAlign: 'center' }}>
                    <Empty description="Bài mô phỏng này chưa có đánh giá nào." />
                </div>
            )}
        </div>
    );
};

export default StudentReviewDashboard;
