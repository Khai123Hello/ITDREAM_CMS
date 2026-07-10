import apiConfig from '@constants/apiConfig';
import AchievementListPage from './index';

const paths = {
    achievementListPage: '/achievement',
};

export default {
    achievementListPage: {
        path: paths.achievementListPage,
        title: 'Quản lý thành tựu',
        auth: true,
        component: AchievementListPage,
        permission: [apiConfig.achievement.list.permissionCode],
        permissions: [apiConfig.achievement.list.permissionCode],
        pageOptions: {
            objectName: 'Thành tựu',
            renderBreadcrumbs: () => {
                return [{ breadcrumbName: 'Quản lý thành tựu' }];
            },
        },
    },
};
