import EducatorDashboard from '../dashboard_new/EducatorDashboard';

export default {
    educatorDashboardPage: {
        path: '/educator/dashboard',
        component: EducatorDashboard,
        auth: true,
        title: 'Educator Dashboard',
    },
};
