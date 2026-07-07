import apiConfig from '@constants/apiConfig';
import NationListPage from './index';
import NationSavePage from './NationSavePage';
import { commonMessage } from '@locales/intl';

const paths = {
    nationListPage: '/nation',
    nationSavePage: '/nation/:id',
};

export default {
    nationListPage: {
        path: paths.nationListPage,
        title: 'Tỉnh thành',
        auth: true,
        component: NationListPage,
        permission: [apiConfig.nation.getList.permissionCode],
        permissions: [apiConfig.nation.getList.permissionCode],
        pageOptions: {
            objectName: commonMessage.address,
            renderBreadcrumbs: (messages, t, parentId, options = {}) => {
                const breadcrumbs = [{ breadcrumbName: 'Tỉnh thành', path: parentId ? '/nation' : undefined }];
                if (parentId && options.parentName) {
                    breadcrumbs.push({
                        breadcrumbName: options.parentName,
                        path: `/nation?parentId=${parentId}`,
                    });
                    breadcrumbs.push({ breadcrumbName: 'Quận huyện' });
                }
                return breadcrumbs;
            },
        },
    },
    nationSavePage: {
        path: paths.nationSavePage,
        title: 'Nation Save',
        auth: true,
        component: NationSavePage,
        separateCheck: true,
        permission: [apiConfig.nation.create.permissionCode, apiConfig.nation.update.permissionCode],
        permissions: [apiConfig.nation.create.permissionCode, apiConfig.nation.update.permissionCode],
        pageOptions: {
            objectName: commonMessage.address,
            listPageUrl: paths.nationListPage,
            renderBreadcrumbs: (messages, t, title, options = {}) => {
                const breadcrumbs = [{ breadcrumbName: 'Tỉnh thành', path: paths.nationListPage }];
                if (options.parentId) {
                    breadcrumbs.push({
                        breadcrumbName: options.parentName || 'Đơn vị cha',
                        path: `/nation?parentId=${options.parentId}`,
                    });
                    breadcrumbs.push({ breadcrumbName: 'Quận huyện', path: `/nation?parentId=${options.parentId}` });
                }
                breadcrumbs.push({ breadcrumbName: title });
                return breadcrumbs;
            },
        },
    },
};
