import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';
import SimulationReviewListPage from '@modules/reviewSubmission/SimulationReviewListPage';
import StudentReviewDetailPage from '@modules/reviewSubmission/StudentReviewDetailPage';
import StudentDiscussionDetailPage from '@modules/reviewSubmission/StudentDiscussionDetailPage';
import SimulationDiscussionListPage from '@modules/reviewSubmission/SimulationDiscussionListPage';
import SimulationDiscussionDetailPage from '@modules/reviewSubmission/SimulationDiscussionDetailPage';

const paths = {
    simulationReviewList: '/simulation-review',
    studentReviewDetail: '/student-review-detail/:simulationId/:username',
    studentDiscussionDetail: '/student-discussion-detail/:simulationId/:username',
    simulationDiscussionList: '/simulation-discussion',
    simulationDiscussionDetail: '/simulation-discussion-detail/:simulationId',
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
                return [{ breadcrumbName: 'Nhận xét học viên' }];
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
                    { breadcrumbName: 'Nhận xét học viên', path: paths.simulationReviewList },
                    { breadcrumbName: `Chi tiết: ${username}` },
                ];
            },
        },
    },
    studentDiscussionDetail: {
        path: paths.studentDiscussionDetail,
        auth: true,
        component: StudentDiscussionDetailPage,
        permissions: [apiConfig.taskQuestionProgress.answerList.permissionCode, apiConfig.comment.list.permissionCode],
        pageOptions: {
            objectName: commonMessage.student,
            renderBreadcrumbs: (messages, t, simulationId, username) => {
                return [
                    { breadcrumbName: 'Nhận xét học viên', path: paths.simulationReviewList },
                    { breadcrumbName: `Thảo luận: ${username}` },
                ];
            },
        },
    },
    simulationDiscussionList: {
        path: paths.simulationDiscussionList,
        auth: true,
        component: SimulationDiscussionListPage,
        permissions: [apiConfig.simulation.getListForEducator.permissionCode],
        pageOptions: {
            objectName: commonMessage.simulation,
            renderBreadcrumbs: (messages, t) => {
                return [{ breadcrumbName: 'Thảo luận bài mô phỏng' }];
            },
        },
    },
    simulationDiscussionDetail: {
        path: paths.simulationDiscussionDetail,
        auth: true,
        component: SimulationDiscussionDetailPage,
        permissions: [apiConfig.comment.list.permissionCode],
        pageOptions: {
            objectName: commonMessage.simulation,
            renderBreadcrumbs: (messages, t, simulationId) => {
                return [
                    { breadcrumbName: 'Thảo luận bài mô phỏng', path: paths.simulationDiscussionList },
                    { breadcrumbName: 'Chi tiết thảo luận' },
                ];
            },
        },
    },
};
