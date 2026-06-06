import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';
import SimulationReviewListPage from '@modules/reviewSubmission/SimulationReviewListPage';
import StudentReviewDetailPage from '@modules/reviewSubmission/StudentReviewDetailPage';

const paths = {
    simulationReviewList: '/simulation-review',
    studentReviewDetail: '/student-review-detail/:simulationId/:username',
};

export default {
    simulationReviewList: {
        path: paths.simulationReviewList,
        auth: true,
        component: SimulationReviewListPage,
        permissions: [apiConfig.simulation.getListForEducator.permissionCode],
        pageOptions: {
            objectName: commonMessage.simulation,
            renderBreadcrumbs: (messages, t) => {
                return [{ breadcrumbName: 'Chấm điểm học viên' }];
            },
        },
    },
    studentReviewDetail: {
        path: paths.studentReviewDetail,
        auth: true,
        component: StudentReviewDetailPage,
        permissions: [
            apiConfig.taskQuestionProgress.answerList.permissionCode,
            apiConfig.reviewSubmission.create.permissionCode,
        ],
        pageOptions: {
            objectName: commonMessage.student,
            renderBreadcrumbs: (messages, t, simulationId, username) => {
                return [
                    { breadcrumbName: 'Chấm điểm học viên', path: paths.simulationReviewList },
                    { breadcrumbName: `Chi tiết: ${username}` },
                ];
            },
        },
    },
};