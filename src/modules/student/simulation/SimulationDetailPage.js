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
        switch(level) {
                        case 1: return 'green';
                        case 2: return 'orange';
                        case 3: return 'red';
                        default: return 'default';
        }
    };

    const getLevelText = (level) => {
        switch(level) {
                        case 1: return 'Dễ';
                        case 2: return 'Trung bình';
                        case 3: return 'Khó';
                        default: return 'Chưa xác định';
        }
    };

    const handleStartTask = (taskId) => {
        navigate(`/simulations/${id}/tasks/${taskId}`);
    };

    const handleBack = () => {
        navigate('/simulations');
    };

    const groupTasksByParent = () => {
        const parentTasks = tasks.filter(task => !task.parent);
        const childTasks = tasks.filter(task => task.parent);
        
        return parentTasks.map(parent => ({
            ...parent,
            children: childTasks.filter(child => child.parent.id === parent.id),
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
                <Button 
                    icon={<ArrowLeftOutlined />} 
                    onClick={handleBack}
                    style={{ marginBottom: 16 }}
                >
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
                                    poster={simulation.imagePath ? `${AppConstants.contentRootUrl}${simulation.imagePath}` : ''}
                                >
                                    <source src={`${AppConstants.contentRootUrl}${simulation.videoPath}`} />
                                </video>
                            ) : (
                                <img 
                                    src={simulation.imagePath ? `${AppConstants.contentRootUrl}${simulation.imagePath}` : '/assets/images/default-simulation.png'}
                                    alt={simulation.title}
                                    style={{ width: '100%', borderRadius: 8 }}
                                />
                            )}
                        </Card>

                        {/* Title and Info */}
                        <Card className="info-card">
                            <Title level={2}>{simulation.title}</Title>
                            
                            <Space size="large" wrap style={{ marginBottom: 16 }}>
                                <Tag color={getLevelColor(simulation.level)} style={{ fontSize: 14, padding: '4px 12px' }}>
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
                                <Title level={4}>Tổng quan</Title>
                                <Paragraph>{simulation.overview || 'Chưa có thông tin tổng quan'}</Paragraph>
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
                                        src={simulation.educator?.profileAccountDto?.avatar ? 
                                            `${AppConstants.contentRootUrl}${simulation.educator.profileAccountDto.avatar}` : null}
                                        icon={<UserOutlined />}
                                    />
                                    <div>
                                        <Text strong>{simulation.educator?.profileAccountDto?.fullName || 'Chưa có thông tin'}</Text>
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
                                                        src={review.student?.profileAccountDto?.avatar ? 
                                                            `${AppConstants.contentRootUrl}${review.student.profileAccountDto.avatar}` : null}
                                                        icon={<UserOutlined />}
                                                    />
                                                }
                                                title={
                                                    <Space>
                                                        <Text strong>{review.student?.profileAccountDto?.fullName}</Text>
                                                        <Rate disabled defaultValue={review.star} style={{ fontSize: 14 }} />
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