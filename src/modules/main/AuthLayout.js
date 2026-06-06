import React from 'react';
import styles from './AuthLayout.module.scss';

/**
 * AuthLayout - Dành cho các trang xác thực (login, register, forgot password)
 * Đặc điểm:
 * - Không có header, sidebar
 * - Centered layout với form ở giữa
 * - Có background image/color khác biệt
 */
const AuthLayout = ({ children }) => {
    return (
        <div className={styles.authContainer}>
            <div className={styles.authContent}>
                {children}
            </div>
        </div>
    );
};

export default AuthLayout;
