import apiConfig from '@constants/apiConfig';
import CommentListPage from '@modules/comment/index';

const paths = {
    commentListPage: '/comment',
};

export default {
    commentListPage: {
        path: paths.commentListPage,
        title: 'Comment Management',
        auth: true,
        component: CommentListPage,
        permissions: [apiConfig.comment.list.permissionCode],
        pageOptions: {
            objectName: 'Bình luận',
            renderBreadcrumbs: (messages, t, title, options = {}) => {
                return [{ breadcrumbName: 'Bình luận' }];
            },
        },
    },
};
