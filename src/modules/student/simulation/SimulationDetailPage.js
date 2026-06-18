import React, { useState, useEffect } from 'react';
import {
    Card,
    Row,
    Col,
    Descriptions,
    Tag,
    Rate,
    Progress,
    Button,
    List,
    Avatar,
    Divider,
    Spin,
    Space,
    Typography,
    Collapse,
    Empty,
} from 'antd';
import {
    ClockCircleOutlined,
    UserOutlined,
    TrophyOutlined,
    PlayCircleOutlined,
    BookOutlined,
    ArrowLeftOutlined,
    CheckCircleOutlined,
    LockOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { showErrorMessage } from '@services/notifyService';
import apiConfig from '@constants/apiConfig';
import useFetch from '@hooks/useFetch';
import PageWrapper from '@components/common/layout/PageWrapper';
import { AppConstants } from '@constants';
import './SimulationDetailPage.scss';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

const SimulationDetailPage = ({ pageOptions }) => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [simulation, setSimulation] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(false);

    const { execute: getSimulationDetail } = useFetch(apiConfig.simulation.getDetailForStudent);
    const { execute: getTaskList } = useFetch(apiConfig.task.getListForStudent);
    const { execute: getReviews } = useFetch(apiConfig.review.getListForClient);

    useEffect(() => {
        if (id) {
            fetchSimulationDetail();
            fetchTasks();
            fetchReviews();
        }
    }, [id]);

    const fetchSimulationDetail = async () => {
        setLoading(true);
        try {
            const response = await getSimulationDetail({
                pathParams: { id },
            });

            if (response.data?.result) {
                setSimulation(response.data?.data);
            }
        } catch (error) {
            showErrorMessage('Không thể tải thông tin bài mô phỏng');
        } finally {
            setLoading(false);
        }
    };

    const fetchTasks = async () => {
        try {
            const response = await getTaskList({
                params: {
                    simulationId: id,
                    pageSize: 100,
                    pageNumber: 0,
                },
            });

            if (response.data?.result) {
                setTasks(response.data?.data?.content || []);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    const fetchReviews = async () => {
        try {
            const response = await getReviews({
                params: {
                    simulationId: id,
                    pageSize: 10,
                    pageNumber: 0,
                },
            });

            if (response.data?.result) {
                setReviews(response.data?.data?.content || []);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        }
    };

    const getLevelColor = (level) => {
        switch (level) {
                        case 1:
                            return 'green';
                        case 2:
                            return 'orange';
                        case 3:
                            return 'red';
                        default:
                            return 'default';
        }
    };

    const getLevelText = (level) => {
        switch (level) {
                        case 1:
                            return 'Dễ';
                        case 2:
                            return 'Trung bình';
                        case 3:
                            return 'Khó';
                        default:
                            return 'Chưa xác định';
        }
    };

    const handleStartTask = (taskId) => {
        navigate(`/simulations/${id}/tasks/${taskId}`);
    };

    const handleBack = () => {
        navigate('/simulations');
    };

    const groupTasksByParent = () => {
        const parentTasks = tasks.filter((task) => !task.parent);
        const childTasks = tasks.filter((task) => task.parent);

        return parentTasks.map((parent) => ({
            ...parent,
            children: childTasks.filter((child) => child.parent.id === parent.id),
        }));
    };

    if (loading) {
        return (
            <PageWrapper routes={pageOptions.renderBreadcrumbs(null, null, simulation?.title)}>
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <Spin size="large" />
                </div>
            </PageWrapper>
        );
    }

    if (!simulation) {
        return (
            <PageWrapper routes={pageOptions.renderBreadcrumbs()}>
                <Empty description="Không tìm thấy bài mô phỏng" />
            </PageWrapper>
        );
    }

    const groupedTasks = groupTasksByParent();

    return (
        <PageWrapper routes={pageOptions.renderBreadcrumbs(null, null, simulation.title)}>
            <div className="simulation-detail-page">
                <Button icon={<ArrowLeftOutlined />} onClick={handleBack} style={{ marginBottom: 16 }}>
                    Quay lại
                </Button>

                <Row gutter={[24, 24]}>
                    {/* Left Column - Main Content */}
                    <Col xs={24} lg={16}>
                        {/* Video/Image Section */}
                        <Card className="media-card">
                            {simulation.videoPath ? (
                                <video
                                    controls
                                    style={{ width: '100%', borderRadius: 8 }}
                                    poster={
                                        simulation.imagePath
                                            ? `${AppConstants.contentRootUrl}${simulation.imagePath}`
                                            : ''
                                    }
                                >
                                    <source src={`${AppConstants.contentRootUrl}${simulation.videoPath}`} />
                                </video>
                            ) : (
                                <img
                                    src={
                                        simulation.imagePath
                                            ? `${AppConstants.contentRootUrl}${simulation.imagePath}`
                                            : '/assets/images/default-simulation.png'
                                    }
                                    alt={simulation.title}
                                    style={{ width: '100%', borderRadius: 8 }}
                                />
                            )}
                        </Card>

                        {/* Title and Info */}
                        <Card className="info-card">
                            <Title level={2}>{simulation.title}</Title>

                            <Space size="large" wrap style={{ marginBottom: 16 }}>
                                <Tag
                                    color={getLevelColor(simulation.level)}
                                    style={{ fontSize: 14, padding: '4px 12px' }}
                                >
                                    {getLevelText(simulation.level)}
                                </Tag>

                                <Space>
                                    <ClockCircleOutlined />
                                    <Text>{simulation.totalEstimatedTime || 'Chưa xác định'}</Text>
                                </Space>

                                <Space>
                                    <UserOutlined />
                                    <Text>{simulation.participantQuantity || 0} học viên</Text>
                                </Space>

                                <Space>
                                    <Rate disabled defaultValue={simulation.avgRating || 0} style={{ fontSize: 16 }} />
                                    <Text>({simulation.avgRating?.toFixed(1) || '0.0'})</Text>
                                </Space>
                            </Space>

                            {simulation.percent !== undefined && (
                                <div style={{ marginTop: 16 }}>
                                    <Text strong>Tiến độ học tập:</Text>
                                    <Progress
                                        percent={Math.round(simulation.percent)}
                                        status={simulation.percent === 100 ? 'success' : 'active'}
                                        strokeColor={{
                                            '0%': '#108ee9',
                                            '100%': '#87d068',
                                        }}
                                    />
                                </div>
                            )}

                            <Divider />

                            {/* Overview */}
                            <div className="overview-section">
                                {(() => {
                                    const parseOverview = (overviewInput) => {
                                        if (!overviewInput) return null;
                                        if (typeof overviewInput === 'object') return overviewInput;
                                        try {
                                            const parsed = JSON.parse(overviewInput);
                                            if (
                                                parsed &&
                                                typeof parsed === 'object' &&
                                                !Array.isArray(parsed) &&
                                                (parsed.hero || parsed.intro || parsed.howItWorks)
                                            ) {
                                                return parsed;
                                            }
                                            if (Array.isArray(parsed) && parsed.length > 0) {
                                                const title = parsed[0].title || '';
                                                const content = parsed[0].content || '';
                                                return {
                                                    hero: {
                                                        title:
                                                            title ||
                                                            'Tại sao nên hoàn thành bài mô phỏng công việc này?',
                                                        description: content
                                                            ? content.replace(/<[^>]*>/g, '').substring(0, 200)
                                                            : '',
                                                        badges: [],
                                                        button: 'Xem tất cả',
                                                    },
                                                    intro: {
                                                        content: content,
                                                    },
                                                    howItWorks: {
                                                        title: 'Cách thức hoạt động',
                                                        items: [],
                                                    },
                                                };
                                            }
                                            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                                                return {
                                                    hero: {
                                                        title:
                                                            parsed.title ||
                                                            'Tại sao nên hoàn thành bài mô phỏng công việc này?',
                                                        description: parsed.content
                                                            ? parsed.content.replace(/<[^>]*>/g, '').substring(0, 200)
                                                            : '',
                                                        badges: [],
                                                        button: 'Xem tất cả',
                                                    },
                                                    intro: {
                                                        content: parsed.content || '',
                                                    },
                                                    howItWorks: {
                                                        title: 'Cách thức hoạt động',
                                                        items: [],
                                                    },
                                                };
                                            }
                                        } catch (e) {
                                            console.error('Error parsing overview JSON:', e);
                                        }
                                        return {
                                            hero: {
                                                title: 'Tại sao nên hoàn thành bài mô phỏng công việc này?',
                                                description: '',
                                                badges: [],
                                                button: 'Xem tất cả',
                                            },
                                            intro: {
                                                content: overviewInput,
                                            },
                                            howItWorks: {
                                                title: 'Cách thức hoạt động',
                                                items: [],
                                            },
                                        };
                                    };

                                    const overview = parseOverview(simulation.overview);
                                    if (!overview) {
                                        return <Paragraph>Chưa có thông tin tổng quan</Paragraph>;
                                    }

                                    const hasHero =
                                        overview.hero?.title ||
                                        overview.hero?.description ||
                                        overview.hero?.badges?.length > 0;
                                    const hasIntro = overview.intro?.content;
                                    const hasHowItWorks = overview.howItWorks?.items?.length > 0;

                                    if (!hasHero && !hasIntro && !hasHowItWorks) {
                                        return <Paragraph>Chưa có thông tin tổng quan</Paragraph>;
                                    }

                                    const isImageLink = (icon) => {
                                        if (!icon || typeof icon !== 'string') return false;
                                        const cleanIcon = icon.trim();
                                        return (
                                            cleanIcon.startsWith('http://') ||
                                            cleanIcon.startsWith('https://') ||
                                            cleanIcon.startsWith('/') ||
                                            cleanIcon.startsWith('./')
                                        );
                                    };

                                    return (
                                        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '8px 0' }}>
                                            {/* HERO SECTION */}
                                            {hasHero && (
                                                <div style={{ marginBottom: 24 }}>
                                                    <h3
                                                        style={{
                                                            fontSize: '24px',
                                                            fontWeight: '700',
                                                            color: '#1f2937',
                                                            marginBottom: '12px',
                                                            lineHeight: '1.2',
                                                        }}
                                                    >
                                                        {overview.hero.title}
                                                    </h3>
                                                    {overview.hero.description && (
                                                        <Paragraph
                                                            style={{
                                                                fontSize: '15px',
                                                                lineHeight: '1.6',
                                                                color: '#4b5563',
                                                                marginBottom: '16px',
                                                            }}
                                                        >
                                                            {overview.hero.description}
                                                        </Paragraph>
                                                    )}
                                                    {overview.hero.badges && overview.hero.badges.length > 0 && (
                                                        <div
                                                            style={{
                                                                display: 'flex',
                                                                flexWrap: 'wrap',
                                                                gap: '8px',
                                                                marginBottom: '16px',
                                                            }}
                                                        >
                                                            {overview.hero.badges.map((badge, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    style={{
                                                                        background: '#e0f2fe',
                                                                        color: '#0369a1',
                                                                        fontWeight: '600',
                                                                        padding: '4px 10px',
                                                                        borderRadius: '20px',
                                                                        fontSize: '12px',
                                                                    }}
                                                                >
                                                                    {badge}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {overview.hero.button && (
                                                        <div
                                                            style={{
                                                                display: 'inline-block',
                                                                border: '1px solid #1890ff',
                                                                color: '#1890ff',
                                                                padding: '8px 16px',
                                                                borderRadius: '6px',
                                                                fontWeight: '600',
                                                                cursor: 'pointer',
                                                                fontSize: '14px',
                                                            }}
                                                        >
                                                            {overview.hero.button}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {hasHero && (hasIntro || hasHowItWorks) && (
                                                <Divider style={{ margin: '20px 0' }} />
                                            )}

                                            {/* INTRO SECTION */}
                                            {hasIntro && (
                                                <div style={{ marginBottom: 24 }}>
                                                    <div
                                                        className="ql-editor preview-content"
                                                        style={{
                                                            padding: 0,
                                                            fontSize: '15px',
                                                            lineHeight: '1.8',
                                                            color: '#4b5563',
                                                        }}
                                                        dangerouslySetInnerHTML={{ __html: overview.intro.content }}
                                                    />
                                                </div>
                                            )}

                                            {hasIntro && hasHowItWorks && <Divider style={{ margin: '20px 0' }} />}

                                            {/* HOW IT WORKS SECTION */}
                                            {hasHowItWorks && (
                                                <div>
                                                    <h3
                                                        style={{
                                                            fontSize: '20px',
                                                            fontWeight: '600',
                                                            color: '#1f2937',
                                                            marginBottom: '16px',
                                                        }}
                                                    >
                                                        {overview.howItWorks.title || 'Cách thức hoạt động'}
                                                    </h3>
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: '12px',
                                                        }}
                                                    >
                                                        {overview.howItWorks.items.map((item, idx) => (
                                                            <div
                                                                key={idx}
                                                                style={{
                                                                    display: 'flex',
                                                                    gap: '16px',
                                                                    padding: '16px',
                                                                    borderRadius: '8px',
                                                                    background: '#f8fafc',
                                                                    border: '1px solid #f1f5f9',
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        width: '48px',
                                                                        height: '48px',
                                                                        borderRadius: '50%',
                                                                        background: '#1890ff',
                                                                        color: 'white',
                                                                        display: 'flex',
                                                                        justifyContent: 'center',
                                                                        alignItems: 'center',
                                                                        fontSize: '20px',
                                                                        flexShrink: 0,
                                                                        overflow: 'hidden',
                                                                    }}
                                                                >
                                                                    {isImageLink(item.icon) ? (
                                                                        <img
                                                                            src={
                                                                                item.icon.startsWith('/') &&
                                                                                !item.icon.startsWith('//')
                                                                                    ? `${AppConstants.contentRootUrl}${item.icon}`
                                                                                    : item.icon
                                                                            }
                                                                            alt="step-icon"
                                                                            style={{
                                                                                width: '100%',
                                                                                height: '100%',
                                                                                objectFit: 'cover',
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        item.icon || '💡'
                                                                    )}
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        flex: 1,
                                                                        fontSize: '14px',
                                                                        lineHeight: '1.6',
                                                                        color: '#4b5563',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                    }}
                                                                >
                                                                    {item.text}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>

                            <Divider />

                            {/* Description */}
                            <div className="description-section">
                                <Title level={4}>Mô tả chi tiết</Title>
                                <Paragraph>{simulation.description || 'Chưa có mô tả chi tiết'}</Paragraph>
                            </div>

                            <Divider />

                            {/* Educator Info */}
                            <div className="educator-section">
                                <Title level={4}>Giảng viên</Title>
                                <Space>
                                    <Avatar
                                        size={48}
                                        src={
                                            simulation.educator?.profileAccountDto?.avatar
                                                ? `${AppConstants.contentRootUrl}${simulation.educator.profileAccountDto.avatar}`
                                                : null
                                        }
                                        icon={<UserOutlined />}
                                    />
                                    <div>
                                        <Text strong>
                                            {simulation.educator?.profileAccountDto?.fullName || 'Chưa có thông tin'}
                                        </Text>
                                        <br />
                                        <Text type="secondary">{simulation.educator?.profileAccountDto?.email}</Text>
                                    </div>
                                </Space>
                            </div>
                        </Card>

                        {/* Reviews Section */}
                        <Card className="reviews-card" title="Đánh giá từ học viên">
                            {reviews.length === 0 ? (
                                <Empty description="Chưa có đánh giá nào" />
                            ) : (
                                <List
                                    itemLayout="horizontal"
                                    dataSource={reviews}
                                    renderItem={(review) => (
                                        <List.Item>
                                            <List.Item.Meta
                                                avatar={
                                                    <Avatar
                                                        src={
                                                            review.student?.profileAccountDto?.avatar
                                                                ? `${AppConstants.contentRootUrl}${review.student.profileAccountDto.avatar}`
                                                                : null
                                                        }
                                                        icon={<UserOutlined />}
                                                    />
                                                }
                                                title={
                                                    <Space>
                                                        <Text strong>
                                                            {review.student?.profileAccountDto?.fullName}
                                                        </Text>
                                                        <Rate
                                                            disabled
                                                            defaultValue={review.star}
                                                            style={{ fontSize: 14 }}
                                                        />
                                                    </Space>
                                                }
                                                description={review.comment}
                                            />
                                        </List.Item>
                                    )}
                                />
                            )}
                        </Card>
                    </Col>

                    {/* Right Column - Tasks Sidebar */}
                    <Col xs={24} lg={8}>
                        <Card
                            className="tasks-sidebar"
                            title={
                                <Space>
                                    <BookOutlined />
                                    <span>Nội dung khóa học</span>
                                </Space>
                            }
                        >
                            {tasks.length === 0 ? (
                                <Empty description="Chưa có nhiệm vụ nào" />
                            ) : (
                                <Collapse
                                    defaultActiveKey={groupedTasks.map((_, index) => index.toString())}
                                    expandIconPosition="right"
                                    className="tasks-collapse"
                                >
                                    {groupedTasks.map((parentTask, index) => (
                                        <Panel
                                            header={
                                                <div className="panel-header">
                                                    <Text strong>{parentTask.name || parentTask.title}</Text>
                                                </div>
                                            }
                                            key={index.toString()}
                                        >
                                            {parentTask.children.length === 0 ? (
                                                <Button
                                                    type="link"
                                                    icon={<PlayCircleOutlined />}
                                                    onClick={() => handleStartTask(parentTask.id)}
                                                    block
                                                    style={{ textAlign: 'left' }}
                                                >
                                                    Bắt đầu học
                                                </Button>
                                            ) : (
                                                <List
                                                    size="small"
                                                    dataSource={parentTask.children}
                                                    renderItem={(childTask) => (
                                                        <List.Item
                                                            className="task-item"
                                                            onClick={() => handleStartTask(childTask.id)}
                                                        >
                                                            <Space>
                                                                <PlayCircleOutlined style={{ color: '#1890ff' }} />
                                                                <Text>{childTask.name || childTask.title}</Text>
                                                            </Space>
                                                        </List.Item>
                                                    )}
                                                />
                                            )}
                                        </Panel>
                                    ))}
                                </Collapse>
                            )}
                        </Card>

                        {/* Specialization */}
                        {simulation.specialization && (
                            <Card className="specialization-card" style={{ marginTop: 16 }}>
                                <Title level={5}>Chuyên ngành</Title>
                                <Tag color="blue" style={{ fontSize: 14, padding: '6px 16px' }}>
                                    {simulation.specialization.name}
                                </Tag>
                            </Card>
                        )}
                    </Col>
                </Row>
            </div>
        </PageWrapper>
    );
};

export default SimulationDetailPage;
