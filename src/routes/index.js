import PageNotFound from '@components/common/page/PageNotFound';
import PageNotAllowed from '@components/common/page/PageNotAllowed';
import Dashboard from '@modules/entry';
import LandingPage from '@modules/main/LandingPage';
import ProfilePage from '@modules/profile/index';
import GroupPermissionListPage from '@modules/groupPermission';
import PermissionSavePage from '@modules/groupPermission/PermissionSavePage';
import SettingListPage from '@modules/listSetting';
import SettingSavePage from '@modules/listSetting/SettingSavePage';
import settingsRoutes from '@modules/settings/routes';
import adminRoutes from '@modules/user/admin/routes';
import authRoutes from '@modules/auth/routes';
import educatorRoutes from '@modules/user/educator/routes';
import studentRoutes from '@modules/user/student/routes';
import educatorDashboardRoutes from '@modules/educatorDashboard/routes';
import simulationRoutes from '@modules/simulation/routes';
import categoryRoutes from '@modules/category/routes';
import reviewSubmissionRoutes from '@modules/reviewSubmission/routes';
import blogRoutes from '@modules/blog/routes';
import organizationRoutes from '@modules/organization/routes';
import commentRoutes from '@modules/comment/routes';
import feedbackRoutes from '@modules/feedback/routes';
import permissionRoutes from '@modules/permission/routes';

/*
    auth
        + null: access login and not login
        + true: access login only
        + false: access not login only
*/
const routes = {
    landingPage: {
        path: '/',
        component: LandingPage,
        auth: null,
        // layout: 'public',
        title: 'Landing',
    },
    pageNotAllowed: {
        path: '/not-allowed',
        component: PageNotAllowed,
        auth: null,
        title: 'Page not allowed',
    },
    homePage: {
        path: '/dashboard',
        component: Dashboard,
        auth: true,
        title: 'Home',
    },
    settingPage: {
        path: '/settings',
        component: Dashboard,
        auth: true,
        title: 'Setting',
    },
    profilePage: {
        path: '/profile',
        component: ProfilePage,
        auth: true,
        title: 'Profile page',
    },
    groupPermissionPage: {
        path: '/group-permission',
        component: GroupPermissionListPage,
        auth: true,
        title: 'Profile page',
    },
    groupPermissionSavePage: {
        path: '/group-permission/:id',
        component: PermissionSavePage,
        auth: true,
        title: 'Profile page',
    },
    listSettingsPage: {
        path: '/settings',
        component: SettingListPage,
        auth: true,
        title: 'Settings page',
    },
    listSettingsPageSavePage: {
        path: '/settings/:id',
        component: SettingSavePage,
        auth: true,
        title: 'Settings page',
    },
    ...settingsRoutes,
    ...adminRoutes,
    ...authRoutes,
    ...educatorRoutes,
    ...studentRoutes,
    ...educatorDashboardRoutes,
    ...simulationRoutes,
    ...categoryRoutes,
    ...reviewSubmissionRoutes,
    ...blogRoutes,
    ...organizationRoutes,
    ...commentRoutes,
    ...feedbackRoutes,
    ...permissionRoutes,
    // keep this at last
    notFound: {
        component: PageNotFound,
        auth: null,
        title: 'Page not found',
        path: '*',
    },
};

export default routes;
