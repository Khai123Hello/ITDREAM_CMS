import apiConfig from '@constants/apiConfig';
import OrganizationListPage from '@modules/organization/index';
import OrganizationSavePage from '@modules/organization/OrganizationSavePage';

const paths = {
    organizationListPage: '/organization',
    organizationSavePage: '/organization/:id',
};

export default {
    organizationListPage: {
        path: paths.organizationListPage,
        title: 'Organization Management',
        auth: true,
        component: OrganizationListPage,
        permissions: [apiConfig.organization.list.permissionCode],
        pageOptions: {
            objectName: 'tổ chức',
            renderBreadcrumbs: (messages, t, title, options = {}) => {
                return [{ breadcrumbName: 'Tổ chức' }];
            },
        },
    },
    organizationSavePage: {
        path: paths.organizationSavePage,
        title: 'Organization Save',
        auth: true,
        component: OrganizationSavePage,
        permissions: [apiConfig.organization.create.permissionCode, apiConfig.organization.update.permissionCode],
        pageOptions: {
            objectName: 'tổ chức',
            listPageUrl: paths.organizationListPage,
            renderBreadcrumbs: (messages, t, title, options = {}) => {
                return [{ breadcrumbName: 'Tổ chức', path: paths.organizationListPage }, { breadcrumbName: title }];
            },
        },
    },
};
