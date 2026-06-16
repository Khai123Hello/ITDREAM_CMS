import React from 'react';
import { TeamOutlined, BookOutlined } from '@ant-design/icons';
import routes from '@routes';
import { FormattedMessage } from 'react-intl';
import apiConfig from './apiConfig';
import { IconSettings } from '@tabler/icons-react';

export const navMenuConfig = [
    {
        label: <FormattedMessage defaultMessage="Quản lý người dùng" />,
        key: 'quan-ly-nguoi-dung',
        icon: <TeamOutlined size={16} />,
        permission: apiConfig.educator.getList.permissionCode,
        children: [
            {
                label: <FormattedMessage defaultMessage="Quản trị viên" />,
                key: 'admin',
                path: routes.adminListPage.path,
                permission: apiConfig.account.getList.permissionCode,
            },
            {
                label: <FormattedMessage defaultMessage="Educator" />,
                key: 'educator',
                path: routes.educatorListPage.path,
                permission: apiConfig.educator.getList.permissionCode,
            },
            {
                label: <FormattedMessage defaultMessage="Student" />,
                key: 'student',
                path: routes.studentListPage.path,
                permission: apiConfig.student.getList.permissionCode,
            },
        ],
    },
    {
        label: <FormattedMessage defaultMessage="Quản lý hệ thống" />,
        key: 'quan-ly-he-thong',
        icon: <IconSettings size={16} />,
        children: [
            {
                label: <FormattedMessage defaultMessage="Quyền hạn" />,
                key: 'role',
                path: routes.groupPermissionPage.path,
                permission: [apiConfig.groupPermission.getList.permissionCode],
            },
            {
                label: <FormattedMessage defaultMessage="Tổ chức" />,
                key: 'organization',
                path: routes.organizationListPage.path,
                permission: [apiConfig.organization.list.permissionCode],
            },
        ],
    },
    {
        label: <FormattedMessage defaultMessage="Quản lý bài mô phỏng" />,
        key: 'quan-ly-bai-mo-phong',
        icon: <IconSettings size={16} />,
        children: [
            {
                label: <FormattedMessage defaultMessage="Danh sách mô phỏng" />,
                key: 'simulation',
                path: routes.simulationListPage.path,
            },
            {
                label: <FormattedMessage defaultMessage="Nhận xét bài mô phỏng" />,
                key: 'review-submission',
                path: routes.simulationReviewList.path,
                permission: [apiConfig.simulation.getListForEducator.permissionCode],
            },
            {
                label: <FormattedMessage defaultMessage="Quản lý Bình luận" />,
                key: 'comment',
                path: routes.commentListPage.path,
                permission: [apiConfig.comment.list.permissionCode],
            },
            {
                label: <FormattedMessage defaultMessage="Quản lý Đánh giá" />,
                key: 'feedback',
                path: routes.feedbackListPage.path,
                permission: [apiConfig.feedback.list.permissionCode],
            },
        ],
    },
    {
        label: <FormattedMessage defaultMessage="Quản lý Danh mục" />,
        key: 'quan-ly-chuyen-mon',
        icon: <IconSettings size={16} />,
        children: [
            {
                label: <FormattedMessage defaultMessage="Quản lý Chuyên ngành" />,
                key: 'category-specialization',
                path: '/category?kind=1',
                permission: [apiConfig.category.getList.permissionCode],
            },
            {
                label: <FormattedMessage defaultMessage="Quản lý Thể loại Blog" />,
                key: 'category-blog',
                path: '/category?kind=2',
                permission: [apiConfig.category.getList.permissionCode],
            },
        ],
    },
    {
        label: <FormattedMessage defaultMessage="Quản lý Blog" />,
        key: 'quan-ly-blog',
        icon: <BookOutlined size={16} />,
        children: [
            {
                label: <FormattedMessage defaultMessage="Danh sách Blog" />,
                key: 'blog',
                path: routes.blogListPage.path,
                permission: [apiConfig.blog.getList.permissionCode, apiConfig.blog.educatorList.permissionCode],
            },
            {
                label: <FormattedMessage defaultMessage="Duyệt bài viết" />,
                key: 'blog-moderation',
                path: routes.blogModerationListPage.path,
                permission: [apiConfig.blog.approve.permissionCode],
            },
        ],
    },
];
