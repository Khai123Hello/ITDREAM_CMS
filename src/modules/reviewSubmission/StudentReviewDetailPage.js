import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Collapse, Tag, Button, Space, Modal, Spin, Avatar, Descriptions, Divider } from 'antd';
import { UserOutlined, CheckCircleOutlined, CloseCircleOutlined, SaveOutlined, DeleteOutlined, ArrowLeftOutlined } from '@ant-design/icons';

import PageWrapper from '@components/common/layout/PageWrapper';
import { BaseForm } from '@components/common/form/BaseForm';
import TextField from '@components/common/form/TextField';

import useFetch from '@hooks/useFetch';
import useTranslate from '@hooks/useTranslate';
import useBasicForm from '@hooks/useBasicForm';

import apiConfig from '@constants/apiConfig';
import { AppConstants } from '@constants';
import { commonMessage } from '@locales/intl';
import useNotification from '@hooks/useNotification';
import { questionTypeOptions } from '@constants/masterData';

const { Panel } = Collapse;

const StudentReviewDetailPage = ({ pageOptions }) => {
    const translate = useTranslate();
    const notify = useNotification();
    const navigate = useNavigate();
    const { simulationId, username } = useParams();
    const [reviewId, setReviewId] = useState(null);
    const [studentInfo, setStudentInfo] = useState(null);
    const [taskQuestions, setTaskQuestions] = useState({});

    const { form } = useBasicForm();
    
    // Dịch questionType options
    const questionTypeValues = translate.formatKeys(questionTypeOptions, ['label']);

    // Helper: kiểm tra xem có phải JSON string không
    const isJsonString = (str) => {
        if (!str || typeof str !== 'string') return false;
        const trimmed = str.trim();
        if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return false;
        try {
            JSON.parse(str);
            return true;
        } catch (e) {
            return false;
        }
    };

    // Helper: parse introduction which might be a JSON string or already an object/array
    const parseIntroduction = (introduction) => {
        if (!introduction) return null;
        
        try {
            const parsed = isJsonString(introduction) 
                ? JSON.parse(introduction) 
                : introduction;
            
            if (Array.isArray(parsed)) return parsed;
            if (typeof parsed === 'object') return [parsed];
            return [{ title: null, content: String(introduction) }];
        } catch (e) {
            return [{ title: null, content: String(introduction) }];
        }
    };

    // Helper: render content - hỗ trợ cả HTML và plain text
    const renderContent = (content) => {
        if (!content) return null;
        
        // Nếu content chứa HTML tags
        if (typeof content === 'string' && content.includes('<')) {
            return (
                <div 
                    className="html-content"
                    style={{ 
                        lineHeight: '1.6',
                        '& p': { margin: '8px 0' },
                        '& ul, & ol': { paddingLeft: '20px', margin: '8px 0' },
                        '& li': { margin: '4px 0' },
                        '& h1, & h2, & h3': { margin: '12px 0 8px 0' },
                    }}
                    dangerouslySetInnerHTML={{ __html: content }}
                />
            );
        }
        
        // Plain text - giữ nguyên xuống dòng
        return String(content).split('\n').map((line, i) => (
            <p key={i} style={{ margin: '4px 0', whiteSpace: 'pre-wrap' }}>{line}</p>
        ));
    };

    // Fetch danh sách Task/SubTask
    const { data: tasks, loading: loadingTasks } = useFetch(apiConfig.task.educatorList, {
        immediate: true,
        params: { simulationId },
        mappingData: (res) => res.data?.content || [],
    });

    // Fetch câu trả lời của student
    const { data: answers, loading: loadingAnswers } = useFetch(
        apiConfig.taskQuestionProgress.answerList,
        {
            immediate: true,
            params: { simulationId, username },
            mappingData: (res) => res.data?.content || [],
        },
    );

    // Fetch nhận xét hiện có
    const { data: existingReview, loading: loadingReview, execute: refetchReview } = useFetch(
        apiConfig.reviewSubmission.getForEducator,
        {
            immediate: true,
            pathParams: { simulationId, username },
            mappingData: (res) => res.data,
        },
    );

    // Fetch task questions - sẽ gọi cho từng task
    const { execute: fetchTaskQuestions, loading: loadingQuestions } = useFetch(
        apiConfig.taskQuestion.educatorList,
        {
            immediate: false,
        },
    );

    const { execute: createReview, loading: creating } = useFetch(apiConfig.reviewSubmission.create, {
        immediate: false,
    });

    const { execute: updateReview, loading: updating } = useFetch(apiConfig.reviewSubmission.update, {
        immediate: false,
    });

    const { execute: deleteReview, loading: deleting } = useFetch(apiConfig.reviewSubmission.delete, {
        immediate: false,
    });

    useEffect(() => {
        if (existingReview) {
            setReviewId(existingReview.id);
            form.setFieldsValue({ content: existingReview.content });
        }
    }, [existingReview]);

    // Lấy thông tin student từ answers
    useEffect(() => {
        if (answers && answers.length > 0) {
            const firstAnswer = answers[0];
            setStudentInfo({
                username: username,
                fullName: firstAnswer.studentSubTaskProgress?.student?.account?.fullName || username,
                email: firstAnswer.studentSubTaskProgress?.student?.account?.email,
                avatar: firstAnswer.studentSubTaskProgress?.student?.account?.avatar,
            });
        }
    }, [answers, username]);

    // Fetch questions cho tất cả tasks và subtasks khi tasks được load
    useEffect(() => {
        if (tasks && tasks.length > 0 && simulationId) {
            // Lấy tất cả task IDs (bao gồm cả main tasks và subtasks)
            const allTaskIds = tasks.map(t => t.id);
            
            allTaskIds.forEach(taskId => {
                fetchTaskQuestions({
                    params: { simulationId, taskId },
                    onCompleted: (response) => {
                        const questions = response.data?.content || [];
                        setTaskQuestions(prev => ({
                            ...prev,
                            [taskId]: questions,
                        }));
                    },
                    onError: (error) => {
                        console.error(`Error fetching questions for task ${taskId}:`, error);
                    },
                });
            });
        }
    }, [tasks, simulationId]);

    // Tạo map để tra cứu nhanh câu trả lời theo taskQuestion.id
    const answerMap = {};
    answers?.forEach(answer => {
        if (answer.taskQuestion?.id) {
            answerMap[answer.taskQuestion.id] = answer;
        }
    });

    // Tìm câu trả lời của student cho một question cụ thể
    const getAnswerForQuestion = (questionId) => {
        return answerMap[questionId] || null;
    };

    // Parse options từ string JSON
    const parseOptions = (optionsStr) => {
        if (!optionsStr) return [];
        try {
            const parsed = typeof optionsStr === 'string' ? JSON.parse(optionsStr) : optionsStr;
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
            return [];
        }
    };

    // Tìm đáp án đúng trong options (cho questionType = 3)
    const getCorrectOption = (options) => {
        if (!Array.isArray(options)) return null;
        const correctOpt = options.find(opt => opt.answer === true);
        return correctOpt ? correctOpt.option : null;
    };
    
    // Hàm lấy label đã dịch cho questionType
    const getQuestionTypeLabel = (questionType) => {
        if (!questionType) return null;
        const found = questionTypeValues.find(opt => opt.value === questionType);
        return found ? found.label : questionType;
    };

    // Tính toán thống kê cho mỗi task dựa trên questions
    const getTaskStats = (taskId) => {
        const questions = taskQuestions[taskId] || [];
        let correctCount = 0;
        let totalCount = 0;

        questions.forEach(question => {
            const answer = getAnswerForQuestion(question.id);
            if (answer) {
                totalCount++;
                if (answer.isCorrect) {
                    correctCount++;
                }
            }
        });

        const percentage = totalCount > 0 ? ((correctCount / totalCount) * 100).toFixed(1) : 0;
        return { correctCount, totalCount, percentage };
    };

    const handleSaveReview = (values) => {
        if (!values.content || values.content.trim() === '') {
            notify({ type: 'error', message: 'Vui lòng nhập nội dung nhận xét!' });
            return;
        }

        const apiCall = reviewId ? updateReview : createReview;
        const payload = reviewId 
            ? { id: reviewId, content: values.content }
            : { simulationId: Number(simulationId), username, content: values.content };

        apiCall({
            data: payload,
            onCompleted: () => {
                notify({
                    type: 'success',
                    message: reviewId ? 'Cập nhật nhận xét thành công!' : 'Tạo nhận xét thành công!',
                });
                refetchReview();
            },
            onError: (error) => {
                notify({ 
                    type: 'error', 
                    message: error?.message || 'Có lỗi xảy ra!',
                });
            },
        });
    };

    const handleDeleteReview = () => {
        Modal.confirm({
            title: 'Xác nhận xóa nhận xét',
            content: 'Bạn có chắc chắn muốn xóa nhận xét này không?',
            okText: 'Xóa',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            onOk: () => {
                deleteReview({
                    pathParams: { id: reviewId },
                    onCompleted: () => {
                        notify({ type: 'success', message: 'Xóa nhận xét thành công!' });
                        setReviewId(null);
                        form.resetFields();
                        refetchReview();
                    },
                    onError: (error) => {
                        notify({ type: 'error', message: error?.message || 'Có lỗi xảy ra!' });
                    },
                });
            },
        });
    };

    const loading = loadingTasks || loadingAnswers || loadingReview;

    // Phân loại task và subtask
    const mainTasks = tasks?.filter(t => t.kind === 1) || [];
    const getSubTasks = (parentId) => tasks?.filter(t => t.kind === 2 && t.parent?.id === parentId) || [];

    // Component để render câu hỏi
    const renderQuestions = (taskId) => {
        const questions = taskQuestions[taskId] || [];
        
        if (questions.length === 0) {
            return <p style={{ textAlign: 'center', color: '#999' }}>Chưa có câu hỏi</p>;
        }

        return questions.map((question, qIdx) => {
            const studentAnswer = getAnswerForQuestion(question.id);
            const options = parseOptions(question.options);
            const questionTypeLabel = getQuestionTypeLabel(question.questionType);
            
            return (
                <Card 
                    key={question.id} 
                    size="small" 
                    style={{ 
                        marginTop: 12,
                        marginBottom: 12,
                        borderLeft: studentAnswer?.isCorrect ? '4px solid #52c41a' : studentAnswer ? '4px solid #ff4d4f' : '4px solid #d9d9d9',
                    }}
                    title={
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Câu {qIdx + 1}</span>
                            {studentAnswer ? (
                                studentAnswer.isCorrect ? (
                                    <Tag color="green" icon={<CheckCircleOutlined />}>Đã nộp</Tag>
                                ) : (
                                    <Tag color="red" icon={<CloseCircleOutlined />}>Chưa nộp</Tag>
                                )
                            ) : (
                                <Tag color="default">Chưa trả lời</Tag>
                            )}
                        </div>
                    }
                >
                    <div style={{ marginBottom: 8 }}>
                        <strong>❓ Câu hỏi:</strong>
                        <div style={{ marginTop: 4 }}>
                            {renderContent(question.question)}
                        </div>
                    </div>
                    
                    {questionTypeLabel && (
                        <p><strong>📋 Loại:</strong> <Tag>{questionTypeLabel}</Tag></p>
                    )}
                    
                    {/* Hiển thị options nếu có */}
                    {options.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                            <strong>🔘 Các lựa chọn:</strong>
                            <div style={{ marginTop: 4, paddingLeft: 16 }}>
                                {options.map((opt, optIdx) => (
                                    <div key={optIdx} style={{ marginBottom: 4 }}>
                                        <Tag color={studentAnswer?.answer === opt ? 'blue' : 'default'}>
                                            {String.fromCharCode(65 + optIdx)}. {opt}
                                        </Tag>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {studentAnswer ? (
                        <div style={{ marginTop: 8 }}>
                            <strong>✍️ Câu trả lời của học viên:</strong>
                            <div style={{ marginTop: 4 }}>
                                {renderContent(studentAnswer.answer)}
                            </div>
                        </div>
                    ) : (
                        <p style={{ marginTop: 8, color: '#999' }}>
                            <em>Học viên chưa trả lời câu hỏi này</em>
                        </p>
                    )}
                </Card>
            );
        });
    };

    return (
        <PageWrapper 
            loading={loading}
            routes={pageOptions.renderBreadcrumbs(commonMessage, translate, simulationId, username)}
        >
            <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => navigate('/simulation-review')}
                style={{ marginBottom: 16 }}
            >
                Quay lại danh sách
            </Button>

            <Spin spinning={loading}>
                {/* Thông tin học viên */}
                <Card title="📋 Thông tin học viên" style={{ marginBottom: 16 }}>
                    <Row gutter={16} align="middle">
                        <Col span={4} style={{ textAlign: 'center' }}>
                            <Avatar
                                size={100}
                                icon={<UserOutlined />}
                                src={studentInfo?.avatar ? `${AppConstants.contentRootUrl}${studentInfo.avatar}` : null}
                            />
                        </Col>
                        <Col span={20}>
                            <Descriptions column={2} bordered>
                                <Descriptions.Item label="Họ tên" span={1}>
                                    <strong>{studentInfo?.fullName || username}</strong>
                                </Descriptions.Item>
                                <Descriptions.Item label="Username" span={1}>
                                    {username}
                                </Descriptions.Item>
                                <Descriptions.Item label="Email" span={1}>
                                    {studentInfo?.email || '-'}
                                </Descriptions.Item>
                                <Descriptions.Item label="Tổng câu hỏi" span={1}>
                                    <strong>{answers?.length || 0}</strong> câu
                                </Descriptions.Item>
                            </Descriptions>
                        </Col>
                    </Row>
                </Card>

                {/* Danh sách Task & câu trả lời */}
                <Card title="📝 Chi tiết bài làm" style={{ marginBottom: 16 }}>
                    <Collapse accordion defaultActiveKey={mainTasks[0]?.id}>
                        {mainTasks.map((task, taskIndex) => {
                            const taskStats = getTaskStats(task.id);
                            const subTasks = getSubTasks(task.id);
                            const introItems = parseIntroduction(task.introduction);
                            
                            return (
                                <Panel 
                                    header={
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>
                                                <strong>Task {taskIndex + 1}:</strong> {task.name || task.title}
                                            </span>
                                            {taskStats.totalCount > 0 && (
                                                <Tag color={taskStats.percentage >= 70 ? 'green' : taskStats.percentage >= 50 ? 'orange' : 'red'}>
                                                    Đã nộp: {taskStats.correctCount}/{taskStats.totalCount} ({taskStats.percentage}%)
                                                </Tag>
                                            )}
                                        </div>
                                    }
                                    key={task.id}
                                >
                                    {task.description && (
                                        <div style={{ marginBottom: 12 }}>
                                            <strong>📄 Mô tả:</strong>
                                            <div style={{ marginTop: 4 }}>
                                                {renderContent(task.description)}
                                            </div>
                                        </div>
                                    )}

                                    {/* Render introduction */}
                                    {introItems && introItems.length > 0 && (
                                        <div style={{ marginTop: 12, marginBottom: 12 }}>
                                            <strong>💡 Giới thiệu:</strong>
                                            {introItems.map((item, idx) => (
                                                <div key={idx} style={{ marginTop: 8, padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                                                    {item.title && (
                                                        <div style={{ fontWeight: 600, marginBottom: 6, fontSize: '15px' }}>
                                                            {item.title}
                                                        </div>
                                                    )}
                                                    {item.content && (
                                                        <div style={{ marginTop: 4 }}>
                                                            {renderContent(item.content)}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <Divider />

                                    {/* Hiển thị questions của main task */}
                                    <strong>📋 Câu hỏi của Task:</strong>
                                    {renderQuestions(task.id)}

                                    {/* SubTasks */}
                                    {subTasks.length > 0 && (
                                        <>
                                            <Divider>SubTasks</Divider>
                                            <Collapse defaultActiveKey={subTasks[0]?.id}>
                                                {subTasks.map((subtask, subIndex) => {
                                                    const subtaskStats = getTaskStats(subtask.id);
                                                    const subIntroItems = parseIntroduction(subtask.introduction);
                                                    
                                                    return (
                                                        <Panel 
                                                            header={
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <span>
                                                                        <strong>SubTask {subIndex + 1}:</strong> {subtask.name || subtask.title}
                                                                    </span>
                                                                    {subtaskStats.totalCount > 0 && (
                                                                        <Tag color={subtaskStats.percentage >= 70 ? 'green' : subtaskStats.percentage >= 50 ? 'orange' : 'red'}>
                                                                            {subtaskStats.correctCount}/{subtaskStats.totalCount} ({subtaskStats.percentage}%)
                                                                        </Tag>
                                                                    )}
                                                                </div>
                                                            }
                                                            key={subtask.id}
                                                        >
                                                            {subtask.description && (
                                                                <div style={{ marginBottom: 12 }}>
                                                                    <strong>📄 Mô tả:</strong>
                                                                    <div style={{ marginTop: 4 }}>
                                                                        {renderContent(subtask.description)}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Render subtask introduction */}
                                                            {subIntroItems && subIntroItems.length > 0 && (
                                                                <div style={{ marginTop: 12, marginBottom: 12 }}>
                                                                    <strong>💡 Giới thiệu:</strong>
                                                                    {subIntroItems.map((item, i) => (
                                                                        <div key={i} style={{ marginTop: 8, padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                                                                            {item.title && (
                                                                                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                                                                                    {item.title}
                                                                                </div>
                                                                            )}
                                                                            {item.content && (
                                                                                <div style={{ marginTop: 4 }}>
                                                                                    {renderContent(item.content)}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            
                                                            <Divider>Câu trả lời</Divider>
                                                            
                                                            {renderQuestions(subtask.id)}
                                                        </Panel>
                                                    );
                                                })}
                                            </Collapse>
                                        </>
                                    )}
                                </Panel>
                            );
                        })}
                    </Collapse>
                </Card>

                {/* Form nhận xét */}
                <Card title="💬 Nhận xét chung">
                    <BaseForm form={form} onFinish={handleSaveReview}>
                        <TextField
                            name="content"
                            label="Nội dung nhận xét"
                            required
                            type="textarea"
                            rows={8}
                            placeholder="Nhập nhận xét của bạn về bài làm của học viên... (Ưu điểm, nhược điểm, góp ý cải thiện...)"
                        />
                        
                        <Space style={{ marginTop: 16 }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                icon={<SaveOutlined />}
                                loading={creating || updating}
                                size="large"
                            >
                                {reviewId ? 'Cập nhật nhận xét' : 'Lưu nhận xét'}
                            </Button>
                            
                            {reviewId && (
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={handleDeleteReview}
                                    loading={deleting}
                                    size="large"
                                >
                                    Xóa nhận xét
                                </Button>
                            )}
                            
                            <Button 
                                onClick={() => navigate('/simulation-review')}
                                size="large"
                            >
                                Quay lại
                            </Button>
                        </Space>
                    </BaseForm>
                </Card>
            </Spin>
        </PageWrapper>
    );
};

export default StudentReviewDetailPage;