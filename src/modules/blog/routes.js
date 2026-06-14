import apiConfig from '@constants/apiConfig';
import BlogListPage from '@modules/blog/index';
import BlogSavePage from '@modules/blog/BlogSavePage';

const paths = {
    blogListPage: '/blog',
    blogSavePage: '/blog/:id',
};

export default {
    blogListPage: {
        path: paths.blogListPage,
        title: 'Blog Management',
        auth: true,
        component: BlogListPage,
        permissions: [apiConfig.blog.getList.permissionCode, apiConfig.blog.educatorList.permissionCode],
        pageOptions: {
            objectName: 'Blog',
            renderBreadcrumbs: (messages, t, title, options = {}) => {
                return [{ breadcrumbName: 'Blog' }];
            },
        },
    },
    blogSavePage: {
        path: paths.blogSavePage,
        title: 'Blog Save',
        auth: true,
        component: BlogSavePage,
        permissions: [apiConfig.blog.create.permissionCode, apiConfig.blog.update.permissionCode],
        pageOptions: {
            objectName: 'Blog',
            listPageUrl: paths.blogListPage,
            renderBreadcrumbs: (messages, t, title, options = {}) => {
                return [{ breadcrumbName: 'Blog', path: paths.blogListPage }, { breadcrumbName: title }];
            },
        },
    },
};
