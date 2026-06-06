import React, { useState } from 'react';
import { Layout } from 'antd';
import PublicHeader from './PublicHeader';
import PublicFooter from './PublicFooter';
import styles from './PublicLayout.module.scss';

/**
 * PublicLayout - Dành cho trang công khai
 * 
 * Structure:
 * - Header: Logo, Navigation, Sign In/Up buttons
 * - Content: Landing page hoặc các trang công khai khác
 * - Footer: Thông tin công ty, liên hệ
 */

const { Content } = Layout;

const PublicLayout = ({ children }) => {
    return (
        <Layout className={styles.publicLayout}>
            <PublicHeader />
            <Content className={styles.publicContent}>
                {children}
            </Content>
            <PublicFooter />
        </Layout>
    );
};

export default PublicLayout;
