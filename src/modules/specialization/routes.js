import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';
import SpecializationListPage from "@modules/specialization/index";
import SpecializationSavePage from "@modules/specialization/SpecializationSavePage";


const paths = {
    specializationListPage: '/specialization',
    specializationSavePage: '/specialization/:id',
};

export default {
    specializationListPage: {
        path: paths.specializationListPage,
        title: 'Specialization Management',
        auth: true,
        component: SpecializationListPage,
        permissions: [apiConfig.specialization.getList.permissionCode],
        pageOptions: {
            objectName: commonMessage.specialization,
            renderBreadcrumbs: (messages, t, title, options = {}) => {
                return [{ breadcrumbName: t.formatMessage(commonMessage.specialization) }];
            },
        },
    },
    specializationSavePage: {
        path: paths.specializationSavePage,
        title: 'Specialization Save',
        auth: true,
        component: SpecializationSavePage,
        permissions: [apiConfig.specialization.update.permissionCode],
        pageOptions: {
            objectName: commonMessage.specialization,
            listPageUrl: paths.specializationListPage,
            renderBreadcrumbs: (messages, t, title, options = {}) => {
                return [
                    { breadcrumbName: t.formatMessage(messages.specialization), path: paths.specializationListPage },
                    { breadcrumbName: title },
                ];
            },
        },
    },
};
