import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Empty, Progress, Tag, Rate, Spin } from 'antd';
import { ClockCircleOutlined, UserOutlined, TrophyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { showErrorMessage } from '@services/notifyService';
import apiConfig from '@constants/apiConfig';
import useFetch from '@hooks/useFetch';
import PageWrapper from '@components/common/layout/PageWrapper';
import { AppConstants } from '@constants';
import './SimulationListPage.scss';

const SimulationListPage = ({ pageOptions }) => {
    const navigate = useNavigate();
    const [simulations, setSimulations] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const { execute: getSimulations } = useFetch(apiConfig.simulation.getListForStudent);

    useEffect(() => {
        fetchSimulations();
    }, []);

    const fetchSimulations = async () => {
        setLoading(true);
        try {
            const response = await getSimulations({
                params: {
                    pageSize: 100,
                    pageNumber: 0,
                },
            });
            
            if (response.data?.result) {
                setSimulations(response.data?.data?.content || []);
            }
        } catch (error) {
            showErrorMessage('Không thể tải danh sách bài mô phỏng');
        } finally {
            setLoading(false);
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

    const handleCardClick = (id) => {
        navigate(`/simulations/${id}`);
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
            <div className="simulation-list-page">
                {simulations.length === 0 ? (
                    <Empty description="Chưa có bài mô phỏng nào" />
                ) : (
                    <Row gutter={[24, 24]}>
                        {simulations.map((simulation) => (
                            <Col xs={24} sm={12} lg={8} xl={6} key={simulation.id}>
                                <Card
                                    hoverable
                                    className="simulation-card"
                                    onClick={() => handleCardClick(simulation.id)}
                                    cover={
                                        <div className="card-cover">
                                            <img
                                                alt={simulation.title}
                                                src={
                                                    simulation.imagePath
                                                        ? `${AppConstants.contentRootUrl}${simulation.imagePath}`
                                                        : '/assets/images/default-simulation.png'
                                                }
                                            />
                                            <div className="card-overlay">
                                                <Tag color={getLevelColor(simulation.level)}>
                                                    {getLevelText(simulation.level)}
                                                </Tag>
                                            </div>
                                        </div>
                                    }
                                >
                                    <Card.Meta
                                        title={
                                            <div className="card-title">
                                                {simulation.title}
                                            </div>
                                        }
                                        description={
                                            <div className="card-description">
                                                <div className="info-row">
                                                    <ClockCircleOutlined />
                                                    <span>{simulation.totalEstimatedTime || 'Chưa xác định'}</span>
                                                </div>
                                                
                                                <div className="info-row">
                                                    <UserOutlined />
                                                    <span>{simulation.participantQuantity || 0} học viên</span>
                                                </div>
                                                
                                                <div className="info-row">
                                                    <Rate 
                                                        disabled 
                                                        defaultValue={simulation.avgRating || 0} 
                                                        style={{ fontSize: 14 }}
                                                    />
                                                    <span>({simulation.avgRating?.toFixed(1) || '0.0'})</span>
                                                </div>
                                                
                                                {simulation.percent !== undefined && (
                                                    <div className="progress-section">
                                                        <Progress 
                                                            percent={Math.round(simulation.percent)} 
                                                            size="small"
                                                            status={simulation.percent === 100 ? 'success' : 'active'}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        }
                                    />
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </div>
        </PageWrapper>
    );
};

export default SimulationListPage;