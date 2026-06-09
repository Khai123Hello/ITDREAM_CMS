/**
 * layoutRegistry.js
 *
 * Centralized layout management - Giúp:
 * 1. Tránh lặp code import Layout ở nhiều nơi
 * 2. Dễ quản lý và scale khi có layout mới
 * 3. Dễ bảo trì khi thay đổi layout
 * 4. Tạo default layout khi không chỉ định
 */

import MainLayout from './MainLayout';
import PublicLayout from './PublicLayout';
import AuthLayout from './AuthLayout';
import AdminLayout from './AdminLayout';

/**
 * Registry tất cả layouts
 * Key: tên layout (dùng trong route config)
 * Value: component layout
 */
export const layoutRegistry = {
    // Mặc định
    main: MainLayout,
    public: PublicLayout,

    // Xác thực (login, register, forgot password)
    auth: AuthLayout,

    // Quản trị viên
    admin: AdminLayout,
};

/**
 * Helper function để lấy layout theo tên
 * @param {string} layoutName - Tên layout
 * @returns {Component} Layout component hoặc MainLayout mặc định
 */
export const getLayout = (layoutName) => {
    return layoutRegistry[layoutName] || MainLayout;
};

/**
 * Cách dùng:
 *
 * Thay vì import từng layout:
 * import MainLayout from '@modules/main/MainLayout';
 * import AuthLayout from '@modules/main/AuthLayout';
 * import AdminLayout from '@modules/main/AdminLayout';
 *
 * Dùng:
 * import { getLayout } from '@modules/main/layoutRegistry';
 *
 * const AuthLayoutComponent = getLayout('auth');
 * const AdminLayoutComponent = getLayout('admin');
 */

export default layoutRegistry;
