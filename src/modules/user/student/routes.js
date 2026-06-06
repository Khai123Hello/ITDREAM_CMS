import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';
import StudentListPage from "@modules/user/student/index";
import StudentSavePage from "@modules/user/student/StudentSavePage";


const paths = {
    studentListPage: '/students',
    studentSavePage: '/students/:id',
};

export default {
    studentListPage: {
        path: paths.studentListPage,
        auth: true,
        component: StudentListPage,
        permissions: [apiConfig.student.getList.permissionCode],
        pageOptions: {
            objectName: commonMessage.student,
            renderBreadcrumbs: (messages, t, title, options = {}) => {
                return [{ breadcrumbName: t.formatMessage(commonMessage.student) }];
            },
        },
    },
    studentSavePage: {
        path: paths.studentSavePage,
        auth: true,
        component: StudentSavePage,
        permissions: [apiConfig.student.update.permissionCode],
        pageOptions: {
            objectName: commonMessage.student,
            listPageUrl: paths.studentListPage,
            renderBreadcrumbs: (messages, t, title, options = {}) => {
                return [
                    { breadcrumbName: t.formatMessage(messages.student), path: paths.studentListPage },
                    { breadcrumbName: title },
                ];
            },
        },
    },
};
