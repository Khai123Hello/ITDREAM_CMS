import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';
import PermissionListPage from '@modules/permission/index';
import PermissionSavePage from '@modules/permission/PermissionSavePage';

const paths = {
    permissionListPage: '/permission',
    permissionSavePage: '/permission/:id',
};

export default {
    permissionListPage: {
        path: paths.permissionListPage,
        title: 'Permission Management',
        auth: true,
        component: PermissionListPage,
        permissions: [apiConfig.permission.getList.permissionCode],
        pageOptions: {
            objectName: commonMessage.permission,
            renderBreadcrumbs: () => {
                return [
                    { breadcrumbName: 'Quyền hạn', path: '/group-permission' },
                    { breadcrumbName: 'Quản lý Quyền' },
                ];
            },
        },
    },
    permissionSavePage: {
        path: paths.permissionSavePage,
        title: 'Permission Save',
        auth: true,
        component: PermissionSavePage,
        permissions: [apiConfig.permission.update.permissionCode],
        pageOptions: {
            objectName: commonMessage.permission,
            listPageUrl: paths.permissionListPage,
            renderBreadcrumbs: (messages, t, title) => {
                return [
                    { breadcrumbName: 'Quyền hạn', path: '/group-permission' },
                    { breadcrumbName: 'Quản lý Quyền', path: paths.permissionListPage },
                    { breadcrumbName: title },
                ];
            },
        },
    },
};
