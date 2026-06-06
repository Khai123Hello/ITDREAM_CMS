import React, { useState, useEffect } from 'react';
import { 
    Card, 
    Row, 
    Col, 
    Button, 
    Space,
    Typography,
    Divider,
    Spin,
    Empty,
    Steps,
    Alert,
    Progress,
    Modal,
} from 'antd';
import { 
    ArrowLeftOutlined,
    PlayCircleOutlined,
    FileTextOutlined,
    VideoCameraOutlined,
    FileImageOutlined,
    CheckCircleOutlined,
    ClockCircleOutlined,
    BookOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { showErrorMessage, showSuccessMessage } from '@services/notifyService';
import apiConfig from '@constants/apiConfig';
import useFetch from '@hooks/useFetch';
import PageWrapper from '@components/common/layout/PageWrapper';
import { AppConstants } from '@constants';
import './TaskDetailPage.scss';

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;

const TaskDetailPage = ({ pageOptions }) => {
    const navigate = useNavigate();
    const { simulationId, taskId } = useParams();
    const [task, setTask] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);
    
    const { execute: getTaskDetail } = useFetch(apiConfig.task.getDetailForStudent);
    const { execute: getQuestions } = useFetch(apiConfig.taskQuestion.getListForStudent);
    const { execute: getProgress } = useFetch(apiConfig.subTaskProgress.getForStudent);
    const { execute: restartProgress } = useFetch(apiConfig.subTaskProgress.restart);

    useEffect(() => {
        if (taskId) {
            fetchTaskDetail();
            fetchQuestions();
            fetchProgress();
        }
    }, [taskId]);

    const fetchTaskDetail = async () => {
        setLoading(true);
        try {
            const response = await getTaskDetail({
                pathParams: { id: taskId },
            });
            
            if (response.data?.result) {
                setTask(response.data?.data);
            }
        } catch (error) {
            showErrorMessage('Không thể tải thông tin nhiệm vụ');
        } finally {
            setLoading(false);
        }
    };

    const fetchQuestions = async () => {
        try {
            const response = await getQuestions({
                params: {
                    simulationId: simulationId,
                    taskId: taskId,
                    pageSize: 100,
                    pageNumber: 0,
                },
            });
            
            if (response.data?.result) {
                setQuestions(response.data?.data?.content || []);
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
        }
    };

    const fetchProgress = async () => {
        try {
            const response = await getProgress({
                pathParams: { taskId },
            });
            
            if (response.data?.result) {
                setProgress(response.data?.data);
                // state: 0 = chưa bắt đầu, 1 = đang làm, 2 = hoàn thành
                setHasStarted(response.data?.data?.state > 0);
            }
        } catch (error) {
            console.error('Error fetching progress:', error);
        }
    };

    const handleBack = () => {
        navigate(`/simulations/${simulationId}`);
    };

    const handleStartExercise = () => {
        if (questions.length === 0) {
            showErrorMessage('Bài tập này chưa có câu hỏi');
            return;
        }
        navigate(`/simulations/${simulationId}/tasks/${taskId}/exercise`);
    };

    const handleRestartExercise = () => {
        Modal.confirm({
            title: 'Xác nhận làm lại',
            content: 'Bạn có chắc chắn muốn làm lại bài tập này? Kết quả cũ sẽ bị xóa.',
            okText: 'Làm lại',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    const response = await restartProgress({
                        data: { taskId: parseInt(taskId) },
                    });
                    
                    if (response.data?.result) {
                        showSuccessMessage('Đã reset bài tập thành công');
                        setHasStarted(false);
                        fetchProgress();
                    }
                } catch (error) {
                    showErrorMessage('Không thể reset bài tập');
                }
            },
        });
    };

    const getTaskTypeIcon = (task) => {
        if (task?.videoPath) return <VideoCameraOutlined />;
        if (task?.filePath) return <FileTextOutlined />;
        if (task?.imagePath) return <FileImageOutlined />;
        return <BookOutlined />;
    };

    const getProgressStatus = () => {
        if (!progress) return { text: 'Chưa bắt đầu', color: 'default' };
        
        switch(progress.state) {
                        case 0: return { text: 'Chưa bắt đầu', color: 'default' };
                        case 1: return { text: 'Đang thực hiện', color: 'processing' };
                        case 2: return { text: 'Đã hoàn thành', color: 'success' };
                        default: return { text: 'Chưa xác định', color: 'default' };
        }
    };

    if (loading) {
        return (
            <PageWrapper routes={pageOptions.renderBreadcrumbs(null, null, task?.title)}>
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <Spin size="large" />
                </div>
            </PageWrapper>
        );
    }

    if (!task) {
        return (
            <PageWrapper routes={pageOptions.renderBreadcrumbs()}>
                <Empty description="Không tìm thấy nhiệm vụ" />
            </PageWrapper>
        );
    }

    const progressStatus = getProgressStatus();

    return (
        <PageWrapper routes={pageOptions.renderBreadcrumbs(null, null, task.title)}>
            <div className="task-detail-page">
                <Button 
                    icon={<ArrowLeftOutlined />} 
                    onClick={handleBack}
                    style={{ marginBottom: 16 }}
                >
                    Quay lại
                </Button>

                <Row gutter={[24, 24]}>
                    {/* Left Column - Task Content */}
                    <Col xs={24} lg={16}>
                        <Card className="task-content-card">
                            {/* Task Header */}
                            <div className="task-header">
                                <Space size="large" align="start">
                                    <div className="task-icon">
                                        {getTaskTypeIcon(task)}
                                    </div>
                                    <div>
                                        <Title level={2}>{task.title || task.name}</Title>
                                        <Space wrap>
                                            <Text type="secondary">
                                                <BookOutlined /> Nhiệm vụ
                                            </Text>
                                            {questions.length > 0 && (
                                                <Text type="secondary">
                                                    <FileTextOutlined /> {questions.length} câu hỏi
                                                </Text>
                                            )}
                                        </Space>
                                    </div>
                                </Space>
                            </div>

                            <Divider />

                            {/* Introduction */}
                            {task.introduction && (
                                <div className="section">
                                    <Title level={4}>Giới thiệu</Title>
                                    <Paragraph>{task.introduction}</Paragraph>
                                </div>
                            )}

                            {/* Description */}
                            {task.description && (
                                <div className="section">
                                    <Title level={4}>Mô tả</Title>
                                    <Paragraph>{task.description}</Paragraph>
                                </div>
                            )}

                            {/* Video */}
                            {task.videoPath && (
                                <div className="section">
                                    <Title level={4}>
                                        <VideoCameraOutlined /> Video bài học
                                    </Title>
                                    <video 
                                        controls 
                                        style={{ width: '100%', borderRadius: 8, maxHeight: 500 }}
                                    >
                                        <source src={`${AppConstants.contentRootUrl}${task.videoPath}`} />
                                    </video>
                                </div>
                            )}

                            {/* Image */}
                            {task.imagePath && (
                                <div className="section">
                                    <Title level={4}>
                                        <FileImageOutlined /> Hình ảnh minh họa
                                    </Title>
                                    <img 
                                        src={`${AppConstants.contentRootUrl}${task.imagePath}`}
                                        alt={task.title}
                                        style={{ width: '100%', borderRadius: 8, maxHeight: 500, objectFit: 'contain' }}
                                    />
                                </div>
                            )}

                            {/* Content */}
                            {task.content && (
                                <div className="section">
                                    <Title level={4}>Nội dung chi tiết</Title>
                                    <div 
                                        className="task-content"
                                        dangerouslySetInnerHTML={{ __html: task.content }}
                                    />
                                </div>
                            )}

                            {/* File */}
                            {task.filePath && (
                                <div className="section">
                                    <Title level={4}>
                                        <FileTextOutlined /> Tài liệu đính kèm
                                    </Title>
                                    <Button 
                                        type="primary" 
                                        icon={<FileTextOutlined />}
                                        href={`${AppConstants.contentRootUrl}${task.filePath}`}
                                        target="_blank"
                                    >
                                        Tải tài liệu
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </Col>

                    {/* Right Column - Exercise Info */}
                    <Col xs={24} lg={8}>
                        {/* Progress Card */}
                        <Card className="progress-card">
                            <Title level={4}>Tiến độ</Title>
                            <Alert
                                message={progressStatus.text}
                                type={progressStatus.color === 'success' ? 'success' : 
                                    progressStatus.color === 'processing' ? 'info' : 'warning'}
                                showIcon
                                icon={progressStatus.color === 'success' ? <CheckCircleOutlined /> : 
                                    progressStatus.color === 'processing' ? <ClockCircleOutlined /> : 
                                        <BookOutlined />}
                                style={{ marginBottom: 16 }}
                            />

                            {questions.length > 0 && (
                                <>
                                    <Divider />
                                    <div className="exercise-info">
                                        <Title level={5}>Bài tập</Title>
                                        <Space direction="vertical" style={{ width: '100%' }}>
                                            <div className="info-row">
                                                <Text>Số câu hỏi:</Text>
                                                <Text strong>{questions.length}</Text>
                                            </div>
                                            
                                            {progress?.state === 2 && (
                                                <Alert
                                                    message="Bạn đã hoàn thành bài tập này!"
                                                    type="success"
                                                    showIcon
                                                    icon={<CheckCircleOutlined />}
                                                />
                                            )}
                                        </Space>
                                    </div>

                                    <Divider />

                                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                        {!hasStarted ? (
                                            <Button 
                                                type="primary" 
                                                size="large"
                                                icon={<PlayCircleOutlined />}
                                                onClick={handleStartExercise}
                                                block
                                            >
                                                Bắt đầu làm bài
                                            </Button>
                                        ) : (
                                            <>
                                                <Button 
                                                    type="primary" 
                                                    size="large"
                                                    icon={progress?.state === 2 ? <CheckCircleOutlined /> : <PlayCircleOutlined />}
                                                    onClick={handleStartExercise}
                                                    block
                                                >
                                                    {progress?.state === 2 ? 'Xem lại kết quả' : 'Tiếp tục làm bài'}
                                                </Button>
                                                
                                                <Button 
                                                    size="large"
                                                    onClick={handleRestartExercise}
                                                    block
                                                >
                                                    Làm lại từ đầu
                                                </Button>
                                            </>
                                        )}
                                    </Space>
                                </>
                            )}
                        </Card>

                        {/* Instructions Card */}
                        <Card className="instructions-card" style={{ marginTop: 16 }}>
                            <Title level={5}>Hướng dẫn</Title>
                            <Steps direction="vertical" size="small" current={-1}>
                                <Step 
                                    title="Xem nội dung" 
                                    description="Đọc kỹ nội dung bài học bên trái"
                                />
                                <Step 
                                    title="Làm bài tập" 
                                    description="Click 'Bắt đầu làm bài' để trả lời câu hỏi"
                                />
                                <Step 
                                    title="Hoàn thành" 
                                    description="Nộp bài và xem kết quả"
                                />
                            </Steps>
                        </Card>
                    </Col>
                </Row>
            </div>
        </PageWrapper>
    );
};

export default TaskDetailPage;