import apiConfig from '@constants/apiConfig';
import FeedbackListPage from '@modules/feedback/index';

const paths = {
    feedbackListPage: '/feedback',
};

export default {
    feedbackListPage: {
        path: paths.feedbackListPage,
        title: 'Feedback Management',
        auth: true,
        component: FeedbackListPage,
        permissions: [apiConfig.feedback.list.permissionCode],
        pageOptions: {
            objectName: 'Đánh giá',
            renderBreadcrumbs: (messages, t, title, options = {}) => {
                return [{ breadcrumbName: 'Đánh giá' }];
            },
        },
    },
};
