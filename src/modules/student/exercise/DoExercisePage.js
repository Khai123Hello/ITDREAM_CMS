import React, { useState, useEffect } from 'react';
import { 
    Card, 
    Button, 
    Radio,
    Space,
    Typography,
    Progress,
    Modal,
    Alert,
    Spin,
    Result,
    Divider,
    Row,
    Col,
} from 'antd';
import { 
    ArrowLeftOutlined,
    ArrowRightOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    TrophyOutlined,
    SendOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { showErrorMessage, showSuccessMessage } from '@services/notifyService';
import apiConfig from '@constants/apiConfig';
import useFetch from '@hooks/useFetch';
import PageWrapper from '@components/common/layout/PageWrapper';
import './DoExercisePage.scss';

const { Title, Text, Paragraph } = Typography;

const DoExercisePage = ({ pageOptions }) => {
    const navigate = useNavigate();
    const { simulationId, taskId } = useParams();
    
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submittedAnswers, setSubmittedAnswers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [progress, setProgress] = useState(null);
    const [score, setScore] = useState(null);
    
    const { execute: getQuestions } = useFetch(apiConfig.taskQuestion.getListForStudent);
    const { execute: getProgress } = useFetch(apiConfig.subTaskProgress.getForStudent);
    const { execute: submitAnswer } = useFetch(apiConfig.taskQuestionProgress.create);
    const { execute: completeTask } = useFetch(apiConfig.subTaskProgress.complete);
    const { execute: getPreviousAnswers } = useFetch(apiConfig.taskQuestionProgress.getListForStudent);

    useEffect(() => {
        fetchQuestions();
        fetchProgress();
    }, []);

    const fetchQuestions = async () => {
        setLoading(true);
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
                const questionList = response.data?.data?.content || [];
                setQuestions(questionList);
                
                // Parse options for each question
                questionList.forEach(q => {
                    if (q.options) {
                        try {
                            q.parsedOptions = JSON.parse(q.options);
                        } catch (e) {
                            q.parsedOptions = [];
                        }
                    }
                });
            }
        } catch (error) {
            showErrorMessage('Không thể tải danh sách câu hỏi');
        } finally {
            setLoading(false);
        }
    };

    const fetchProgress = async () => {
        try {
            const response = await getProgress({
                pathParams: { taskId },
            });
            
            if (response.data?.result) {
                setProgress(response.data?.data);
                
                // Nếu đã hoàn thành, load lại các câu trả lời trước đó
                if (response.data?.data?.state === 2) {
                    fetchPreviousAnswers(response.data?.data?.id);
                }
            }
        } catch (error) {
            console.error('Error fetching progress:', error);
        }
    };

    const fetchPreviousAnswers = async (progressId) => {
        try {
            const response = await getPreviousAnswers({
                params: {
                    taskId: taskId,
                    studentSubTaskProgressId: progressId,
                    pageSize: 100,
                    pageNumber: 0,
                },
            });
            
            if (response.data?.result) {
                const previousAnswers = response.data?.data?.content || [];
                setSubmittedAnswers(previousAnswers);
                setIsSubmitted(true);
                
                // Calculate score
                const correct = previousAnswers.filter(a => a.isCorrect).length;
                setScore({
                    correct: correct,
                    total: previousAnswers.length,
                    percentage: (correct / previousAnswers.length * 100).toFixed(1),
                });
            }
        } catch (error) {
            console.error('Error fetching previous answers:', error);
        }
    };

    const handleAnswerChange = (questionId, value) => {
        setAnswers({
            ...answers,
            [questionId]: value,
        });
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleSubmit = () => {
        const unansweredCount = questions.length - Object.keys(answers).length;
        
        if (unansweredCount > 0) {
            Modal.confirm({
                title: 'Xác nhận nộp bài',
                content: `Bạn còn ${unansweredCount} câu chưa trả lời. Bạn có chắc chắn muốn nộp bài?`,
                okText: 'Nộp bài',
                cancelText: 'Hủy',
                onOk: submitAllAnswers,
            });
        } else {
            Modal.confirm({
                title: 'Xác nhận nộp bài',
                content: 'Bạn đã hoàn thành tất cả câu hỏi. Bạn có muốn nộp bài không?',
                okText: 'Nộp bài',
                cancelText: 'Hủy',
                onOk: submitAllAnswers,
            });
        }
    };

    const submitAllAnswers = async () => {
        setLoading(true);
        try {
            const results = [];
            
            for (const question of questions) {
                const userAnswer = answers[question.id];
                if (!userAnswer) continue;
                
                // Check if answer is correct
                const correctOption = question.parsedOptions?.find(opt => opt.isCorrect);
                const isCorrect = correctOption && userAnswer === correctOption.key;
                
                const response = await submitAnswer({
                    data: {
                        taskQuestionId: question.id,
                        studentSubTaskProgressId: progress?.id,
                        answer: userAnswer,
                        isCorrect: isCorrect,
                    },
                });
                
                if (response.data?.result) {
                    results.push({
                        taskQuestion: question,
                        answer: userAnswer,
                        isCorrect: isCorrect,
                    });
                }
            }
            
            setSubmittedAnswers(results);
            setIsSubmitted(true);
            
            // Calculate score
            const correct = results.filter(r => r.isCorrect).length;
            setScore({
                correct: correct,
                total: questions.length,
                percentage: (correct / questions.length * 100).toFixed(1),
            });
            
            // Complete task
            await completeTask({
                data: { taskId: parseInt(taskId) },
            });
            
            showSuccessMessage('Nộp bài thành công!');
            
        } catch (error) {
            showErrorMessage('Không thể nộp bài. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleBackToTask = () => {
        navigate(`/simulations/${simulationId}/tasks/${taskId}`);
    };

    const handleBackToSimulation = () => {
        navigate(`/simulations/${simulationId}`);
    };

    const getAnswerResult = (questionId) => {
        return submittedAnswers.find(a => a.taskQuestion.id === questionId);
    };

    if (loading && questions.length === 0) {
        return (
            <PageWrapper routes={pageOptions.renderBreadcrumbs()}>
                <div style={{ textAlign: 'center', padding: '100px 0' }}>
                    <Spin size="large" />
                </div>
            </PageWrapper>
        );
    }

    if (questions.length === 0) {
        return (
            <PageWrapper routes={pageOptions.renderBreadcrumbs()}>
                <Result
                    status="warning"
                    title="Bài tập này chưa có câu hỏi"
                    extra={
                        <Button type="primary" onClick={handleBackToTask}>
                            Quay lại
                        </Button>
                    }
                />
            </PageWrapper>
        );
    }

    // If submitted, show result
    if (isSubmitted && score) {
        return (
            <PageWrapper routes={pageOptions.renderBreadcrumbs()}>
                <div className="exercise-result-page">
                    <Card className="result-card">
                        <Result
                            icon={<TrophyOutlined style={{ color: score.percentage >= 70 ? '#52c41a' : '#faad14' }} />}
                            title={score.percentage >= 70 ? 'Chúc mừng bạn!' : 'Cố gắng lần sau nhé!'}
                            subTitle={`Bạn đã trả lời đúng ${score.correct}/${score.total} câu hỏi (${score.percentage}%)`}
                            extra={[
                                <Button key="review" size="large" onClick={() => setIsSubmitted(false)}>
                                    Xem lại đáp án
                                </Button>,
                                <Button key="back" type="primary" size="large" onClick={handleBackToSimulation}>
                                    Quay lại khóa học
                                </Button>,
                            ]}
                        />
                        
                        <Divider />
                        
                        <div className="score-breakdown">
                            <Row gutter={[16, 16]}>
                                <Col span={8}>
                                    <Card>
                                        <div style={{ textAlign: 'center' }}>
                                            <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a' }} />
                                            <Title level={4} style={{ marginTop: 8 }}>{score.correct}</Title>
                                            <Text type="secondary">Câu đúng</Text>
                                        </div>
                                    </Card>
                                </Col>
                                <Col span={8}>
                                    <Card>
                                        <div style={{ textAlign: 'center' }}>
                                            <CloseCircleOutlined style={{ fontSize: 32, color: '#ff4d4f' }} />
                                            <Title level={4} style={{ marginTop: 8 }}>{score.total - score.correct}</Title>
                                            <Text type="secondary">Câu sai</Text>
                                        </div>
                                    </Card>
                                </Col>
                                <Col span={8}>
                                    <Card>
                                        <div style={{ textAlign: 'center' }}>
                                            <TrophyOutlined style={{ fontSize: 32, color: '#faad14' }} />
                                            <Title level={4} style={{ marginTop: 8 }}>{score.percentage}%</Title>
                                            <Text type="secondary">Điểm số</Text>
                                        </div>
                                    </Card>
                                </Col>
                            </Row>
                        </div>
                    </Card>
                </div>
            </PageWrapper>
        );
    }

    const currentQuestion = questions[currentIndex];
    const answerResult = getAnswerResult(currentQuestion?.id);
    const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);
    return (
        <PageWrapper routes={pageOptions.renderBreadcrumbs()}>
            <div className="do-exercise-page">
                <Card className="exercise-card">
                    {/* Progress Bar */}
                    <div className="exercise-progress">
                        <Text strong>Câu hỏi {currentIndex + 1}/{questions.length}</Text>
                        <Progress 
                            percent={progressPercent} 
                            showInfo={false}
                            strokeColor={{
                                '0%': '#108ee9',
                                '100%': '#87d068',
                            }}
                        />
                    </div>

                    <Divider />

                    {/* Question */}
                    <div className="question-section">
                        <Title level={4}>
                            Câu {currentIndex + 1}: {currentQuestion?.question}
                        </Title>

                        {answerResult && (
                            <Alert
                                message={answerResult.isCorrect ? 'Câu trả lời đúng!' : 'Câu trả lời sai!'}
                                type={answerResult.isCorrect ? 'success' : 'error'}
                                showIcon
                                style={{ marginBottom: 16 }}
                            />
                        )}

                        <Radio.Group 
                            value={answers[currentQuestion?.id]}
                            onChange={(e) => handleAnswerChange(currentQuestion?.id, e.target.value)}
                            disabled={!!answerResult}
                            style={{ width: '100%' }}
                        >
                            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                {currentQuestion?.parsedOptions?.map((option) => {
                                    const isSelected = answers[currentQuestion?.id] === option.key;
                                    const isCorrect = option.isCorrect;
                                    const showCorrect = answerResult && isCorrect;
                                    const showWrong = answerResult && isSelected && !isCorrect;

                                    return (
                                        <Radio 
                                            key={option.key} 
                                            value={option.key}
                                            className={`
                                                answer-option 
                                                ${showCorrect ? 'correct-answer' : ''} 
                                                ${showWrong ? 'wrong-answer' : ''}
                                            `}
                                        >
                                            <div className="option-content">
                                                <Text>{option.key}. {option.value}</Text>
                                                {showCorrect && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                                                {showWrong && <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                                            </div>
                                        </Radio>
                                    );
                                })}
                            </Space>
                        </Radio.Group>
                    </div>

                    <Divider />

                    {/* Navigation */}
                    <div className="exercise-navigation">
                        <Button 
                            icon={<ArrowLeftOutlined />}
                            onClick={handlePrevious}
                            disabled={currentIndex === 0}
                        >
                            Câu trước
                        </Button>

                        <Space>
                            <Text type="secondary">
                                Đã trả lời: {Object.keys(answers).length}/{questions.length}
                            </Text>
                            
                            {currentIndex === questions.length - 1 && !answerResult && (
                                <Button 
                                    type="primary"
                                    icon={<SendOutlined />}
                                    onClick={handleSubmit}
                                    loading={loading}
                                >
                                    Nộp bài
                                </Button>
                            )}
                        </Space>

                        <Button 
                            icon={<ArrowRightOutlined />}
                            onClick={handleNext}
                            disabled={currentIndex === questions.length - 1}
                            type={currentIndex < questions.length - 1 ? 'primary' : 'default'}
                        >
                            Câu tiếp
                        </Button>
                    </div>
                </Card>

                {/* Question Navigator */}
                <Card className="question-navigator" style={{ marginTop: 16 }}>
                    <Title level={5}>Danh sách câu hỏi</Title>
                    <div className="question-grid">
                        {questions.map((q, index) => {
                            const hasAnswer = !!answers[q.id];
                            const result = getAnswerResult(q.id);
                            const isCorrect = result?.isCorrect;
                            const isCurrent = index === currentIndex;

                            return (
                                <Button
                                    key={q.id}
                                    onClick={() => setCurrentIndex(index)}
                                    className={`
                                        question-button 
                                        ${isCurrent ? 'current' : ''} 
                                        ${hasAnswer && !result ? 'answered' : ''}
                                        ${isCorrect ? 'correct' : ''}
                                        ${result && !isCorrect ? 'wrong' : ''}
                                    `}
                                >
                                    {index + 1}
                                </Button>
                            );
                        })}
                    </div>
                </Card>
            </div>
        </PageWrapper>
    );
};
export default DoExercisePage;