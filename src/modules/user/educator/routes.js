import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';
import EducatorListPage from "@modules/user/educator";
import EducatorSavePage from "@modules/user/educator/EducatorSavePage";

const paths = {
    educatorListPage: '/educators',
    educatorSavePage: '/educators/:id',
};

export default {
    educatorListPage: {
        path: paths.educatorListPage,
        auth: true,
        component: EducatorListPage,
        permissions: [apiConfig.educator.getList.permissionCode],
        pageOptions: {
            objectName: commonMessage.educator,
            renderBreadcrumbs: (messages, t, title, options = {}) => {
                return [{ breadcrumbName: t.formatMessage(commonMessage.educator) }];
            },
        },
    },
    educatorSavePage: {
        path: paths.educatorSavePage,
        auth: true,
        component: EducatorSavePage,
        permissions: [apiConfig.educator.update.permissionCode],
        pageOptions: {
            objectName: commonMessage.educator,
            listPageUrl: paths.educatorListPage,
            renderBreadcrumbs: (messages, t, title, options = {}) => {
                return [
                    { breadcrumbName: t.formatMessage(messages.educator), path: paths.educatorListPage },
                    { breadcrumbName: title },
                ];
            },
        },
    },
};
