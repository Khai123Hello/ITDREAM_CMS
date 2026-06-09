import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';
import CategoryListPage from '@modules/category/index';
import CategorySavePage from '@modules/category/CategorySavePage';

const paths = {
    categoryListPage: '/category',
    categorySavePage: '/category/:id',
};

export default {
    categoryListPage: {
        path: paths.categoryListPage,
        title: 'Category Management',
        auth: true,
        component: CategoryListPage,
        permissions: [apiConfig.category.getList.permissionCode],
        pageOptions: {
            objectName: commonMessage.category,
            renderBreadcrumbs: (messages, t, title, options = {}) => {
                return [{ breadcrumbName: 'Danh mục' }];
            },
        },
    },
    categorySavePage: {
        path: paths.categorySavePage,
        title: 'Category Save',
        auth: true,
        component: CategorySavePage,
        permissions: [apiConfig.category.update.permissionCode],
        pageOptions: {
            objectName: commonMessage.category,
            listPageUrl: paths.categoryListPage,
            renderBreadcrumbs: (messages, t, title, options = {}) => {
                return [{ breadcrumbName: 'Danh mục', path: paths.categoryListPage }, { breadcrumbName: title }];
            },
        },
    },
};
