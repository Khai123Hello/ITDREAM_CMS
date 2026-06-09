import React, { useState } from 'react';
import { Layout } from 'antd';
import NavSider from './NavSider';
import AppHeader from './AppHeader';
import styles from './AdminLayout.module.scss';
import { brandName } from '@constants';
import { defineMessages } from 'react-intl';
import useTranslate from '@hooks/useTranslate';

/**
 * AdminLayout - Dành cho các trang admin
 * Đặc điểm:
 * - Giống MainLayout nhưng có thể tùy chỉnh riêng (màu sắc, menu khác, v.v.)
 * - Dễ mở rộng khi admin có yêu cầu đặc biệt
 *
 * Ưu điểm:
 * - Tách biệt logic admin riêng
 * - Dễ bảo trì khi có sự khác biệt giữa admin và user thường
 * - Có thể thêm features chỉ dành cho admin (ví dụ: admin stats, debug info)
 */

const { Content, Footer } = Layout;
const SIDEBAR_WIDTH_EXPAND = 320;

const message = defineMessages({
    copyRight: ' <strong>{brandName} </strong>- © Copyright {year}. All Rights Reserved.',
});

const AdminLayout = ({ children }) => {
    const [collapsed, setCollapsed] = useState(false);
    const translate = useTranslate();
    const toggleCollapsed = () => setCollapsed((prev) => !prev);

    return (
        <Layout hasSider>
            <NavSider collapsed={collapsed} onCollapse={toggleCollapsed} width={SIDEBAR_WIDTH_EXPAND} />
            <Layout>
                <AppHeader collapsed={collapsed} onCollapse={toggleCollapsed} />
                <Content className={styles.adminContent}>
                    <div className={styles.wrapper}>{children}</div>
                    <Footer className={styles.adminFooter}>
                        {translate.formatMessage(message.copyRight, {
                            strong: (chunk) => <strong>{chunk}</strong>,
                            brandName,
                            year: new Date().getFullYear(),
                        })}
                    </Footer>
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminLayout;
