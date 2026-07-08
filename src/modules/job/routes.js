import apiConfig from '@constants/apiConfig';
import JobListPage from '@modules/job/JobListPage';
import JobSavePage from '@modules/job/JobSavePage';

const paths = {
    jobListPage: '/job',
    jobSavePage: '/job/:id',
};

export default {
    jobListPage: {
        path: paths.jobListPage,
        title: 'Job Management',
        auth: true,
        component: JobListPage,
        permissions: [apiConfig.job.list.permissionCode, apiConfig.job.educatorList.permissionCode],
        pageOptions: {
            objectName: 'Tin tuyển dụng',
            renderBreadcrumbs: () => [{ breadcrumbName: 'Tin tuyển dụng' }],
        },
    },
    jobSavePage: {
        path: paths.jobSavePage,
        title: 'Job Save',
        auth: true,
        component: JobSavePage,
        permissions: [
            apiConfig.job.create.permissionCode,
            apiConfig.job.update.permissionCode,
            apiConfig.job.getById.permissionCode,
        ],
        pageOptions: {
            objectName: 'Tin tuyển dụng',
            listPageUrl: paths.jobListPage,
            renderBreadcrumbs: (messages, t, title) => [
                { breadcrumbName: 'Tin tuyển dụng', path: paths.jobListPage },
                { breadcrumbName: title },
            ],
        },
    },
};
