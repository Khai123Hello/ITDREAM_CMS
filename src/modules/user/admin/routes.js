import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';
import AdminListPage from './index';
import AdminSavePage from './AdminSavePage';

const paths = {
    adminListPage: '/admins',
    adminSavePage: '/admins/:id',
};

export default {
    adminListPage: {
        path: paths.adminListPage,
        auth: true,
        component: AdminListPage,
        permissions: [apiConfig.account.getList.permissionCode],
        pageOptions: {
            objectName: commonMessage.admins,
            renderBreadcrumbs: (messages, t, title, options = {}) => {
                return [{ breadcrumbName: t.formatMessage(messages.admins) }];
            },
        },
    },
    adminSavePage: {
        path: paths.adminSavePage,
        auth: true,
        component: AdminSavePage,
        separateCheck: true,
        permissions: [apiConfig.account.createAdmin.permissionCode, apiConfig.account.updateAdmin.permissionCode],
        pageOptions: {
            objectName: commonMessage.admins,
            listPageUrl: paths.adminListPage,
            renderBreadcrumbs: (messages, t, title, options = {}) => {
                return [
                    { breadcrumbName: t.formatMessage(messages.admins), path: paths.adminListPage },
                    { breadcrumbName: title },
                ];
            },
        },
    },
};
