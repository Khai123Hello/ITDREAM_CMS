import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Button, Space, Tag, Empty, Spin, Rate, Avatar } from 'antd';
import {
    PlayCircleOutlined,
    CalendarOutlined,
    UserOutlined,
    TeamOutlined,
    FolderOpenOutlined,
    LineChartOutlined,
    BulbOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { sendRequest } from '@services/api';
import apiConfig from '@constants/apiConfig';
import styles from './LandingPage.module.scss';

/**
 * LandingPage Component
 *
 * Displays:
 * 1. Hero section with welcome message
 * 2. Featured simulations
 * 3. How it works section
 * 4. CTA buttons
 */

const LandingPage = () => {
    const navigate = useNavigate();
    const [simulations, setSimulations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchSimulations();
        fetchCategories();
    }, []);

    const fetchSimulations = async () => {
        try {
            setLoading(true);
            const response = await sendRequest(apiConfig.guestSimulation.getList, {});
            if (response?.data?.result) {
                setSimulations(response.data.data?.content || []);
            }
        } catch (error) {
            console.error('Error fetching simulations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await sendRequest(apiConfig.category.autocomplete, {});
            if (response?.data?.result) {
                setCategories(response.data.data?.content || []);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleSimulationClick = (id) => {
        // Store simulation id for viewing without authentication
        sessionStorage.setItem('guestSimulationId', id);
        navigate(`/login?redirect=/public-simulation/${id}`);
    };

    const handleTryNow = () => {
        navigate('/login');
    };

    return (
        <div className={styles.landingPage}>
            {/* Hero Section */}
            <section className={styles.heroSection}>
                <div className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>
                        Chào mừng đến với <span className={styles.highlight}>ITDream</span>
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Công cụ đắc lực hỗ trợ giảng viên thiết kế, quản lý và đánh giá kịch bản mô phỏng trực quan
                    </p>
                    <Space size="large">
                        <Button type="primary" size="large" onClick={handleTryNow} className={styles.ctaButton}>
                            Bắt đầu ngay
                        </Button>
                        <Button
                            size="large"
                            onClick={() => {
                                const element = document.getElementById('simulations-section');
                                element?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={styles.secondaryButton}
                        >
                            Khám phá bài mô phỏng
                        </Button>
                    </Space>
                </div>
                <div className={styles.heroImage}>
                    <div className={styles.heroGraphic}>
                        <div className={styles.circle1}></div>
                        <div className={styles.circle2}></div>
                        <div className={styles.circle3}></div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className={styles.featuresSection}>
                <h2 className={styles.sectionTitle}>Giải pháp cho Nhà giáo dục</h2>
                <Row gutter={[32, 32]}>
                    <Col xs={24} sm={12} md={6}>
                        <div className={styles.featureCard}>
                            <div className={styles.featureIcon}>
                                <PlayCircleOutlined />
                            </div>
                            <h3>Tạo bài mô phỏng học tập</h3>
                            <p>
                                Thiết kế các kịch bản mô phỏng tương tác cao, giúp người học tiếp cận môi trường thực
                                tế.
                            </p>
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <div className={styles.featureCard}>
                            <div className={styles.featureIcon}>
                                <FolderOpenOutlined />
                            </div>
                            <h3>Quản lý nội dung mô phỏng</h3>
                            <p>Dễ dàng tổ chức, cập nhật và tùy biến các học liệu mô phỏng trong hệ thống đào tạo.</p>
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <div className={styles.featureCard}>
                            <div className={styles.featureIcon}>
                                <LineChartOutlined />
                            </div>
                            <h3>Theo dõi & đánh giá kết quả</h3>
                            <p>Giám sát tiến độ học tập chi tiết, đánh giá chính xác năng lực và chấm điểm học viên.</p>
                        </div>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <div className={styles.featureCard}>
                            <div className={styles.featureIcon}>
                                <BulbOutlined />
                            </div>
                            <h3>Hỗ trợ giảng dạy & đào tạo</h3>
                            <p>
                                Cung cấp các công cụ giảng dạy đắc lực, tăng tính tương tác và nâng cao chất lượng giáo
                                dục.
                            </p>
                        </div>
                    </Col>
                </Row>
            </section>

            {/* Simulations Section */}
            <section id="simulations-section" className={styles.simulationsSection}>
                <h2 className={styles.sectionTitle}>Bài mô phỏng nổi bật</h2>

                {loading ? (
                    <div className={styles.loadingContainer}>
                        <Spin size="large" />
                    </div>
                ) : simulations.length === 0 ? (
                    <Empty description="Không có bài mô phỏng nào khả dụng" />
                ) : (
                    <Row gutter={[24, 24]}>
                        {simulations.slice(0, 6).map((simulation) => (
                            <Col key={simulation.id} xs={24} sm={12} md={8}>
                                <Card
                                    hoverable
                                    className={styles.simulationCard}
                                    cover={
                                        <div className={styles.cardCover}>
                                            {simulation.thumbnail ? (
                                                <img
                                                    src={simulation.thumbnail}
                                                    alt={simulation.title}
                                                    className={styles.cardImage}
                                                />
                                            ) : (
                                                <div className={styles.placeholderImage}>
                                                    <PlayCircleOutlined style={{ fontSize: '48px' }} />
                                                </div>
                                            )}
                                            <div className={styles.cardOverlay}>
                                                <Button
                                                    type="primary"
                                                    shape="circle"
                                                    icon={<PlayCircleOutlined />}
                                                    size="large"
                                                />
                                            </div>
                                        </div>
                                    }
                                >
                                    <div className={styles.cardContent}>
                                        <div className={styles.cardHeader}>
                                            <h4 className={styles.cardTitle}>{simulation.title}</h4>
                                            {simulation.status === 1 && <Tag color="green">Hoạt động</Tag>}
                                        </div>

                                        {/* Category and Rating */}
                                        {simulation.category && (
                                            <Tag color="blue" className={styles.categoryTag}>
                                                {simulation.category.name}
                                            </Tag>
                                        )}

                                        <div className={styles.ratingSection}>
                                            <Rate disabled defaultValue={simulation.avgStar || 0} allowHalf />
                                            <span className={styles.ratingCount}>
                                                ({simulation.avgStar?.toFixed(1) || 0})
                                            </span>
                                        </div>

                                        {/* Meta Information */}
                                        <div className={styles.metaInfo}>
                                            <Space direction="vertical" size="small">
                                                {simulation.duration && (
                                                    <div className={styles.metaItem}>
                                                        <CalendarOutlined />
                                                        <span>Thời lượng: {simulation.duration}</span>
                                                    </div>
                                                )}
                                                {simulation.totalParticipant !== undefined && (
                                                    <div className={styles.metaItem}>
                                                        <TeamOutlined />
                                                        <span>{simulation.totalParticipant} người tham gia</span>
                                                    </div>
                                                )}
                                            </Space>
                                        </div>

                                        {/* Educator Info */}
                                        {simulation.educator && (
                                            <div className={styles.educatorInfo}>
                                                <Avatar
                                                    size={32}
                                                    src={simulation.educator.profileAccountDto?.avatar}
                                                    icon={<UserOutlined />}
                                                />
                                                <div className={styles.educatorDetails}>
                                                    <p className={styles.educatorName}>
                                                        {simulation.educator.profileAccountDto?.fullName || 'Không rõ'}
                                                    </p>
                                                    <p className={styles.educatorRole}>Giảng viên</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* CTA Button */}
                                        <Button
                                            type="primary"
                                            block
                                            onClick={() => handleSimulationClick(simulation.id)}
                                            className={styles.enrollButton}
                                        >
                                            Khám phá
                                        </Button>
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                )}
            </section>

            {/* CTA Section */}
            <section className={styles.ctaSection}>
                <div className={styles.ctaContent}>
                    <h2>Sẵn sàng nâng cao chất lượng giảng dạy?</h2>
                    <p>Tham gia cùng hàng ngàn nhà giáo dục tối ưu hóa phương pháp đào tạo với ITDream</p>
                    <Space size="large">
                        <Button type="primary" size="large" onClick={handleTryNow}>
                            Đăng ký ngay
                        </Button>
                        <Button size="large" onClick={handleTryNow}>
                            Đăng nhập
                        </Button>
                    </Space>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
