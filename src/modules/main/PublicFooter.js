import React from 'react';
import { Layout, Row, Col, Divider } from 'antd';
import {
    MailOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    LinkedinOutlined,
    TwitterOutlined,
    FacebookOutlined,
} from '@ant-design/icons';
import styles from './PublicFooter.module.scss';

/**
 * PublicFooter Component
 * Features:
 * - Company information
 * - Quick links
 * - Contact information
 * - Social media links
 * - Copyright notice
 */

const { Footer } = Layout;

const PublicFooter = () => {
    const currentYear = new Date().getFullYear();

    return (
        <Footer className={styles.publicFooter}>
            <div className={styles.footerContainer}>
                {/* Footer Content */}
                <Row gutter={[32, 32]} className={styles.footerContent}>
                    {/* About Company */}
                    <Col xs={24} sm={12} md={6}>
                        <div className={styles.footerSection}>
                            <h4 className={styles.footerTitle}>Về ITDream</h4>
                            <p className={styles.footerText}>
                                Hỗ trợ nhà giáo dục thiết lập bài mô phỏng học tập trực quan và hiệu quả.
                            </p>
                            <div className={styles.socialLinks}>
                                <a href="#facebook" className={styles.socialLink}>
                                    <FacebookOutlined />
                                </a>
                                <a href="#twitter" className={styles.socialLink}>
                                    <TwitterOutlined />
                                </a>
                                <a href="#linkedin" className={styles.socialLink}>
                                    <LinkedinOutlined />
                                </a>
                            </div>
                        </div>
                    </Col>

                    {/* Quick Links */}
                    <Col xs={24} sm={12} md={6}>
                        <div className={styles.footerSection}>
                            <h4 className={styles.footerTitle}>Liên kết nhanh</h4>
                            <ul className={styles.footerLinks}>
                                <li>
                                    <a href="/">Trang chủ</a>
                                </li>
                                <li>
                                    <a href="#simulations">Bài mô phỏng</a>
                                </li>
                                <li>
                                    <a href="/login">Đăng nhập</a>
                                </li>
                                <li>
                                    <a href="/register">Đăng ký</a>
                                </li>
                            </ul>
                        </div>
                    </Col>

                    {/* Resources */}
                    <Col xs={24} sm={12} md={6}>
                        <div className={styles.footerSection}>
                            <h4 className={styles.footerTitle}>Tài nguyên</h4>
                            <ul className={styles.footerLinks}>
                                <li>
                                    <a href="#docs">Tài liệu hướng dẫn</a>
                                </li>
                                <li>
                                    <a href="#blog">Blog</a>
                                </li>
                                <li>
                                    <a href="#faq">Câu hỏi thường gặp</a>
                                </li>
                                <li>
                                    <a href="#support">Hỗ trợ</a>
                                </li>
                            </ul>
                        </div>
                    </Col>

                    {/* Contact Info */}
                    <Col xs={24} sm={12} md={6}>
                        <div className={styles.footerSection}>
                            <h4 className={styles.footerTitle}>Liên hệ</h4>
                            <div className={styles.contactItem}>
                                <MailOutlined className={styles.contactIcon} />
                                <a href="mailto:info@itdream.com">info@itdream.com</a>
                            </div>
                            <div className={styles.contactItem}>
                                <PhoneOutlined className={styles.contactIcon} />
                                <a href="tel:+84123456789">+84 (123) 456-789</a>
                            </div>
                            <div className={styles.contactItem}>
                                <EnvironmentOutlined className={styles.contactIcon} />
                                <span>TP. Hồ Chí Minh, Việt Nam</span>
                            </div>
                        </div>
                    </Col>
                </Row>

                <Divider className={styles.footerDivider} />

                {/* Copyright */}
                <Row className={styles.footerBottom}>
                    <Col xs={24} md={12}>
                        <p className={styles.copyright}>© {currentYear} ITDream. Bảo lưu mọi quyền.</p>
                    </Col>
                    <Col xs={24} md={12}>
                        <div className={styles.legalLinks}>
                            <a href="#privacy">Chính sách bảo mật</a>
                            <span className={styles.separator}>•</span>
                            <a href="#terms">Điều khoản dịch vụ</a>
                            <span className={styles.separator}>•</span>
                            <a href="#cookies">Cài đặt Cookie</a>
                        </div>
                    </Col>
                </Row>
            </div>
        </Footer>
    );
};

export default PublicFooter;
