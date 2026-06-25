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
        permissions: [apiConfig.job.list.permissionCode],
        pageOptions: {
            objectName: 'cơ hội việc làm',
            renderBreadcrumbs: (messages, t, title, options = {}) => {
                return [{ breadcrumbName: 'Cơ hội việc làm' }];
            },
        },
    },
    jobSavePage: {
        path: paths.jobSavePage,
        title: 'Job Save',
        auth: true,
        component: JobSavePage,
        permissions: [apiConfig.job.create.permissionCode, apiConfig.job.update.permissionCode],
        pageOptions: {
            objectName: 'cơ hội việc làm',
            listPageUrl: paths.jobListPage,
            renderBreadcrumbs: (messages, t, title, options = {}) => {
                return [
                    { breadcrumbName: 'Cơ hội việc làm', path: paths.jobListPage },
                    { breadcrumbName: title },
                ];
            },
        },
    },
};
