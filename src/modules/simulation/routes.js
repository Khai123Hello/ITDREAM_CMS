import { commonMessage } from '@locales/intl';
import apiConfig from '@constants/apiConfig';
import SimulationListPage from '@modules/simulation/simulation/index';
import SimulationSavePage from '@modules/simulation/simulation/SimulationSavePage';

// Task imports
import TaskListPage from '@modules/simulation/task';
import TaskSavePage from '@modules/simulation/task/TaskSavePage';
import TaskQuestionListPage from '@modules/simulation/taskQuestion';
import TaskQuestionSavePage from '@modules/simulation/taskQuestion/TaskQuestionSavePage';
import TestPage from '@modules/simulation/test';

const paths = {
    // Simulation paths
    simulationListPage: '/simulation',
    simulationSavePage: '/simulation/:id',

    // Task paths - liên kết với Simulation
    taskListPage: '/simulation/:simulationId/task',
    taskSavePage: '/simulation/:simulationId/task/:id',
    taskQuestionListPage: '/simulation/:simulationId/task/:taskId/question',
    taskQuestionSavePage: '/simulation/:simulationId/task/:taskId/question/:id',

    //Test Page
    testPage: '/simulation/test',
};

export default {
    simulationListPage: {
        path: paths.simulationListPage,
        auth: true,
        component: SimulationListPage,
        permissions: [apiConfig.simulation.getList.permissionCode],
        pageOptions: {
            objectName: commonMessage.simulation,
            renderBreadcrumbs: (messages, t = {}) => [
                { breadcrumbName: t.formatMessage(commonMessage.simulation) },
            ],
        },
    },
    simulationSavePage: {
        path: paths.simulationSavePage,
        auth: true,
        component: SimulationSavePage,
        permissions: [apiConfig.simulation.update.permissionCode],
        pageOptions: {
            objectName: commonMessage.simulation,
            listPageUrl: paths.simulationListPage,
            renderBreadcrumbs: (messages, t, title) => [
                { breadcrumbName: t.formatMessage(commonMessage.simulation), path: paths.simulationListPage },
                { breadcrumbName: title },
            ],
        },
    },

    // ==================== TASK (Admin) ====================
    taskListPage: {
        path: paths.taskListPage,
        auth: true,
        component: TaskListPage,
        permissions: [apiConfig.task.getList.permissionCode],
        pageOptions: {
            objectName: commonMessage.task,
            renderBreadcrumbs: (messages, t, title, options = {}) => {
                const { simulationId } = options;
                return [
                    { breadcrumbName: t.formatMessage(commonMessage.simulation), path: paths.simulationListPage },
                    { breadcrumbName: t.formatMessage(commonMessage.task) },
                ];
            },
        },
    },
    taskSavePage: {
        path: paths.taskSavePage,
        auth: true,
        component: TaskSavePage,
        permissions: [apiConfig.task.create.permissionCode, apiConfig.task.update.permissionCode],
        pageOptions: {
            objectName: commonMessage.task,
            renderBreadcrumbs: (messages, t, title, options = {}) => {
                const { simulationId } = options;
                return [
                    { breadcrumbName: t.formatMessage(commonMessage.simulation), path: paths.simulationListPage },
                    { breadcrumbName: t.formatMessage(commonMessage.task), path: `/simulation/${simulationId}/task` },
                    { breadcrumbName: title },
                ];
            },
        },
    },

    taskQuestionListPage: {
        path: paths.taskQuestionListPage,
        auth: true,
        component: TaskQuestionListPage,
        permissions: [apiConfig.taskQuestion.getList.permissionCode],
        pageOptions: {
            objectName: commonMessage.taskQuestion,
            renderBreadcrumbs: (messages, t, title, options = {}) => {
                const { simulationId, taskId } = options;
                return [
                    { breadcrumbName: t.formatMessage(commonMessage.simulation), path: paths.simulationListPage },
                    { breadcrumbName: t.formatMessage(commonMessage.task), path: `/simulation/${simulationId}/task` },
                    { breadcrumbName: t.formatMessage(commonMessage.taskQuestion) },
                ];
            },
        },
    },
    taskQuestionSavePage: {
        path: paths.taskQuestionSavePage,
        auth: true,
        component: TaskQuestionSavePage,
        permissions: [apiConfig.taskQuestion.create.permissionCode, apiConfig.taskQuestion.update.permissionCode],
        pageOptions: {
            objectName: commonMessage.taskQuestion,
            renderBreadcrumbs: (messages, t, title, options = {}) => {
                const { simulationId, taskId } = options;
                return [
                    { breadcrumbName: t.formatMessage(commonMessage.simulation), path: paths.simulationListPage },
                    { breadcrumbName: t.formatMessage(commonMessage.task), path: `/simulation/${simulationId}/task` },
                    { breadcrumbName: t.formatMessage(commonMessage.taskQuestion), path: `/simulation/${simulationId}/task/${taskId}/question` },
                    { breadcrumbName: title },
                ];
            },
        },
    },

    // ==================== TEST PAGE ====================
    testPage: {
        path: paths.testPage,
        auth: true,
        component: TestPage,
        permissions: [],
        pageOptions: {
            objectName: commonMessage.test,
            renderBreadcrumbs: (messages, t) => [
                { breadcrumbName: t.formatMessage(commonMessage.test) },
            ],
        },
    },
};
