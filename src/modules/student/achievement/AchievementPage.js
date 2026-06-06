import React, { useState, useEffect } from 'react';
import { 
    Card, 
    Row, 
    Col, 
    Empty, 
    Tag, 
    Button,
    Spin,
    Typography,
    Space,
    Modal,
    Image,
    Statistic,
    Timeline,
    Progress,
} from 'antd';
import { 
    TrophyOutlined,
    DownloadOutlined,
    EyeOutlined,
    ClockCircleOutlined,
    CheckCircleOutlined,
    StarOutlined,
    FireOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { showErrorMessage } from '@services/notifyService';
import apiConfig from '@constants/apiConfig';
import useFetch from '@hooks/useFetch';
import PageWrapper from '@components/common/layout/PageWrapper';
import { AppConstants } from '@constants';
import dayjs from 'dayjs';
import './AchievementPage.scss';

const { Title, Text, Paragraph } = Typography;

const AchievementPage = ({ pageOptions }) => {
    const navigate = useNavigate();
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedAchievement, setSelectedAchievement] = useState(null);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [statistics, setStatistics] = useState({
        total: 0,
        thisMonth: 0,
        thisWeek: 0,
    });
    
    const { execute: getAchievements } = useFetch(apiConfig.achievement.getListForStudent);

    useEffect(() => {
        fetchAchievements();
    }, []);

    const fetchAchievements = async () => {
        setLoading(true);
        try {
            const response = await getAchievements({
                params: {
                    pageSize: 100,
                    pageNumber: 0,
                },
            });
            
            if (response.data?.result) {
                const achievementList = response.data?.data?.content || [];
                setAchievements(achievementList);
                calculateStatistics(achievementList);
            }
        } catch (error) {
            showErrorMessage('Không thể tải danh sách thành tích');
        } finally {
            setLoading(false);
        }
    };

    const calculateStatistics = (achievementList) => {
        const now = dayjs();
        const thisMonthCount = achievementList.filter(a => 
            dayjs(a.createdDate).month() === now.month() && 
            dayjs(a.createdDate).year() === now.year(),
        ).length;
        
        const thisWeekCount = achievementList.filter(a => 
            dayjs(a.createdDate).week() === now.week() && 
            dayjs(a.createdDate).year() === now.year(),
        ).length;

        setStatistics({
            total: achievementList.length,
            thisMonth: thisMonthCount,
            thisWeek: thisWeekCount,
        });
    };

    const handleViewCertificate = (achievement) => {
        setSelectedAchievement(achievement);
        setPreviewVisible(true);
    };

    const handleDownloadCertificate = (achievement) => {
        const link = document.createElement('a');
        link.href = `${AppConstants.contentRootUrl}${achievement.filePath}`;
        link.download = `certificate_${achievement.simulation?.title || 'achievement'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleViewSimulation = (simulationId) => {
        navigate(`/simulations/${simulationId}`);
    };

    const getRankIcon = (index) => {
        switch(index) {
                        case 0: return <TrophyOutlined style={{ color: '#FFD700', fontSize: 24 }} />;
                        case 1: return <TrophyOutlined style={{ color: '#C0C0C0', fontSize: 24 }} />;
                        case 2: return <TrophyOutlined style={{ color: '#CD7F32', fontSize: 24 }} />;
                        default: return <TrophyOutlined style={{ color: '#999', fontSize: 20 }} />;
        }
    };

    const getLevelBadge = (level) => {
        const config = {
            1: { color: 'green', text: 'Dễ' },
            2: { color: 'orange', text: 'Trung bình' },
            3: { color: 'red', text: 'Khó' },
        };
        return config[level] || { color: 'default', text: 'Chưa xác định' };
    };

    if (loading) {
        return (
            <PageWrapper routes={pageOptions.renderBreadcrumbs()}>
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <Spin size="large" />
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper routes={pageOptions.renderBreadcrumbs()}>
            <div className="achievement-page">
                {/* Statistics Section */}
                <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
                    <Col xs={24} sm={8}>
                        <Card className="stat-card">
                            <Statistic
                                title="Tổng thành tích"
                                value={statistics.total}
                                prefix={<TrophyOutlined />}
                                valueStyle={{ color: '#3f8600' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card className="stat-card">
                            <Statistic
                                title="Thành tích tháng này"
                                value={statistics.thisMonth}
                                prefix={<FireOutlined />}
                                valueStyle={{ color: '#cf1322' }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Card className="stat-card">
                            <Statistic
                                title="Thành tích tuần này"
                                value={statistics.thisWeek}
                                prefix={<StarOutlined />}
                                valueStyle={{ color: '#1890ff' }}
                            />
                        </Card>
                    </Col>
                </Row>

                {/* Main Content */}
                <Row gutter={[24, 24]}>
                    {/* Left Column - Achievement List */}
                    <Col xs={24} lg={16}>
                        <Card 
                            className="achievement-list-card"
                            title={
                                <Space>
                                    <TrophyOutlined />
                                    <span>Danh sách thành tích ({achievements.length})</span>
                                </Space>
                            }
                        >
                            {achievements.length === 0 ? (
                                <Empty 
                                    description="Bạn chưa có thành tích nào"
                                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                                >
                                    <Button 
                                        type="primary" 
                                        onClick={() => navigate('/simulations')}
                                    >
                                        Bắt đầu học ngay
                                    </Button>
                                </Empty>
                            ) : (
                                <div className="achievement-list">
                                    {achievements.map((achievement, index) => {
                                        const levelBadge = getLevelBadge(achievement.simulation?.level);
                                        
                                        return (
                                            <Card 
                                                key={achievement.id}
                                                className="achievement-item"
                                                hoverable
                                            >
                                                <Row gutter={[16, 16]} align="middle">
                                                    <Col xs={24} sm={4} className="rank-column">
                                                        <div className="rank-badge">
                                                            {getRankIcon(index)}
                                                            <Text strong className="rank-number">
                                                                #{index + 1}
                                                            </Text>
                                                        </div>
                                                    </Col>
                                                    
                                                    <Col xs={24} sm={12}>
                                                        <div className="achievement-info">
                                                            <Title level={5} className="simulation-title">
                                                                {achievement.simulation?.title || 'Chưa có tiêu đề'}
                                                            </Title>
                                                            
                                                            <Space wrap style={{ marginTop: 8 }}>
                                                                <Tag color={levelBadge.color}>
                                                                    {levelBadge.text}
                                                                </Tag>
                                                                
                                                                <Text type="secondary">
                                                                    <ClockCircleOutlined /> {' '}
                                                                    {dayjs(achievement.createdDate).format('DD/MM/YYYY')}
                                                                </Text>
                                                                
                                                                <Tag icon={<CheckCircleOutlined />} color="success">
                                                                    Hoàn thành
                                                                </Tag>
                                                            </Space>
                                                            
                                                            {achievement.studentName && (
                                                                <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                                                                    Học viên: {achievement.studentName}
                                                                </Text>
                                                            )}
                                                        </div>
                                                    </Col>
                                                    
                                                    <Col xs={24} sm={8}>
                                                        <Space direction="vertical" style={{ width: '100%' }}>
                                                            {achievement.filePath && (
                                                                <>
                                                                    <Button 
                                                                        type="primary"
                                                                        icon={<EyeOutlined />}
                                                                        onClick={() => handleViewCertificate(achievement)}
                                                                        block
                                                                    >
                                                                        Xem chứng chỉ
                                                                    </Button>
                                                                    
                                                                    <Button 
                                                                        icon={<DownloadOutlined />}
                                                                        onClick={() => handleDownloadCertificate(achievement)}
                                                                        block
                                                                    >
                                                                        Tải xuống
                                                                    </Button>
                                                                </>
                                                            )}
                                                            
                                                            <Button 
                                                                onClick={() => handleViewSimulation(achievement.simulation?.id)}
                                                                block
                                                            >
                                                                Xem khóa học
                                                            </Button>
                                                        </Space>
                                                    </Col>
                                                </Row>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </Card>
                    </Col>

                    {/* Right Column - Timeline & Progress */}
                    <Col xs={24} lg={8}>
                        {/* Progress Card */}
                        <Card 
                            className="progress-card"
                            title={
                                <Space>
                                    <FireOutlined />
                                    <span>Tiến độ học tập</span>
                                </Space>
                            }
                        >
                            <div className="progress-item">
                                <Text>Hoàn thành tháng này</Text>
                                <Progress 
                                    percent={statistics.total > 0 ? Math.round((statistics.thisMonth / statistics.total) * 100) : 0}
                                    strokeColor={{
                                        '0%': '#108ee9',
                                        '100%': '#87d068',
                                    }}
                                />
                            </div>
                            
                            <div className="progress-item" style={{ marginTop: 16 }}>
                                <Text>Hoàn thành tuần này</Text>
                                <Progress 
                                    percent={statistics.total > 0 ? Math.round((statistics.thisWeek / statistics.total) * 100) : 0}
                                    strokeColor={{
                                        '0%': '#ff4d4f',
                                        '100%': '#faad14',
                                    }}
                                />
                            </div>
                        </Card>

                        {/* Timeline Card */}
                        {achievements.length > 0 && (
                            <Card 
                                className="timeline-card"
                                title={
                                    <Space>
                                        <ClockCircleOutlined />
                                        <span>Lịch sử thành tích</span>
                                    </Space>
                                }
                                style={{ marginTop: 16 }}
                            >
                                <Timeline mode="left">
                                    {achievements.slice(0, 5).map((achievement) => (
                                        <Timeline.Item 
                                            key={achievement.id}
                                            color="green"
                                            dot={<CheckCircleOutlined style={{ fontSize: 16 }} />}
                                        >
                                            <Text strong>{achievement.simulation?.title}</Text>
                                            <br />
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {dayjs(achievement.createdDate).format('DD/MM/YYYY HH:mm')}
                                            </Text>
                                        </Timeline.Item>
                                    ))}
                                </Timeline>
                                
                                {achievements.length > 5 && (
                                    <Text type="secondary" style={{ textAlign: 'center', display: 'block', marginTop: 8 }}>
                                        Và {achievements.length - 5} thành tích khác...
                                    </Text>
                                )}
                            </Card>
                        )}

                        {/* Motivation Card */}
                        <Card 
                            className="motivation-card"
                            style={{ marginTop: 16 }}
                        >
                            <div style={{ textAlign: 'center' }}>
                                <TrophyOutlined style={{ fontSize: 48, color: '#faad14', marginBottom: 16 }} />
                                <Title level={4}>Tiếp tục phấn đấu!</Title>
                                <Paragraph type="secondary">
                                    {statistics.total === 0 
                                        ? 'Hãy hoàn thành khóa học đầu tiên để nhận thành tích!'
                                        : `Bạn đã hoàn thành ${statistics.total} khóa học. Cố gắng lên!`
                                    }
                                </Paragraph>
                                {statistics.total > 0 && (
                                    <Button 
                                        type="primary" 
                                        size="large"
                                        onClick={() => navigate('/simulations')}
                                    >
                                        Học thêm khóa mới
                                    </Button>
                                )}
                            </div>
                        </Card>
                    </Col>
                </Row>

                {/* Certificate Preview Modal */}
                <Modal
                    visible={previewVisible}
                    title="Chứng chỉ hoàn thành"
                    footer={[
                        <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={() => handleDownloadCertificate(selectedAchievement)}>
                            Tải xuống
                        </Button>,
                        <Button key="close" onClick={() => setPreviewVisible(false)}>
                            Đóng
                        </Button>,
                    ]}
                    onCancel={() => setPreviewVisible(false)}
                    width={800}
                    centered
                >
                    {selectedAchievement?.filePath && (
                        <div style={{ textAlign: 'center' }}>
                            <Image
                                src={`${AppConstants.contentRootUrl}${selectedAchievement.filePath}`}
                                alt="Certificate"
                                style={{ maxWidth: '100%' }}
                                preview={false}
                            />
                        </div>
                    )}
                </Modal>
            </div>
        </PageWrapper>
    );
};

export default AchievementPage;