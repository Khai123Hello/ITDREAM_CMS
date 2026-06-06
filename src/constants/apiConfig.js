import { apiUrl, apiTenantUrl, apiMediaUrl } from '.';
import { UserTypes } from '@constants';
import { getData } from '@utils/localStorage';
import { storageKeys } from '@constants';
import { create, update } from 'lodash';
const baseHeader = {
    'Content-Type': 'application/json',
};

const multipartFormHeader = {
    'Content-Type': 'multipart/form-data',
};

const apiConfig = {
    organization: {
        guestList: {
            baseURL: `${apiUrl}v1/organization/guest_list`,
            method: 'GET',
            headers: baseHeader,
        },
    },
    account: {
        login: {
            baseURL: `${apiUrl}v1/account/login`,
            method: 'POST',
            headers: baseHeader,
        },
        loginGoogle:{
            baseURL: `${apiUrl}v1/google/educator-login`,
            method: 'POST',
            headers: baseHeader,
        },
        loginBasic: {
            baseURL: `${apiUrl}api/token`,
            method: 'POST',
            headers: baseHeader,
        },
        loginSSO: {
            baseURL: `${apiUrl}v1/account/login-sso`,
            method: 'POST',
            headers: baseHeader,
        },
        get getProfile() {
            const userType = getData(storageKeys.USER_TYPE);
            
            if (userType === UserTypes.EDUCATOR) {
                return {
                    baseURL: `${apiUrl}v1/educator/profile`,
                    method: 'GET',
                    headers: baseHeader,
                    permissionCode: 'ED_U_P',
                };
            }
            
            if (userType === UserTypes.STUDENT) {
                return {
                    baseURL: `${apiUrl}v1/student/profile`,
                    method: 'GET',
                    headers: baseHeader,
                    permissionCode: 'ST_U_P',
                };
            }
            
            return {
                baseURL: `${apiUrl}v1/account/profile`,
                method: 'GET',
                headers: baseHeader,
            };
        },
        get updateProfile() {
            const userType = getData(storageKeys.USER_TYPE);
            
            if (userType === UserTypes.EDUCATOR) {
                return {
                    baseURL: `${apiUrl}v1/educator/client_update`,
                    method: `PUT`,
                    headers: baseHeader,
                    permissionCode: 'ED_U_U',
                };
            }
            
            if (userType === UserTypes.STUDENT) {
                return {
                    baseURL: `${apiUrl}v1/student/update`,
                    method: `PUT`,
                    headers: baseHeader,
                    permissionCode: 'ST_U',
                };
            }
            
            return {
                baseURL: `${apiUrl}v1/account/update_profile_admin`,
                method: 'PUT',
                headers: baseHeader,
                permissionCode: 'ACC_AD_U',
            };
        },
        forgetPassword: {
            baseURL: `${apiUrl}v1/account/forget_password`,
            method: 'POST',
            headers: baseHeader,
        },
        requestForgetPassword: {
            baseURL: `${apiUrl}v1/account/request_forget_password`,
            method: 'POST',
            headers: baseHeader,
        },
        getById: {
            baseURL: `${apiUrl}v1/account/get/:id`,
            method: 'GET',
            headers: baseHeader,
            permissionCode: 'ACC_V',
        },
        logout: {
            baseURL: `${apiUrl}v1/account/logout`,
            method: 'GET',
            headers: baseHeader,
        },
        getList: {
            baseURL: `${apiUrl}v1/account/list`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'ACC_L',
        },
        adminList: {
            baseURL: `${apiUrl}v1/account/list?kind=1`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'ACC_L',
        },
        updateAdmin: {
            baseURL: `${apiUrl}v1/account/update_admin`,
            method: `PUT`,
            headers: baseHeader,
            permissionCode: 'ACC_U',
        },
        delete: {
            baseURL: `${apiUrl}v1/account/delete/:id`,
            method: `DELETE`,
            headers: baseHeader,
            permissionCode: 'ACC_D',
        },
        createAdmin: {
            baseURL: `${apiUrl}v1/account/create_admin`,
            method: `POST`,
            headers: baseHeader,
            permissionCode: 'ACC_C',
        },
    },
    simulation: {
        approve: {
            baseURL: `${apiUrl}v1/simulation/approve`,
            method: `PUT`,
            headers: baseHeader,
            permissionCode: 'SI_AP',
        },
        approveDelete: {
            baseURL: `${apiUrl}v1/simulation/approve-delete/:id`,
            method: `DELETE`,
            headers: baseHeader,
            permissionCode: 'SI_APD',
        },
        create: {
            baseURL: `${apiUrl}v1/simulation/create`,
            method: `POST`,
            headers: baseHeader,
            permissionCode: 'SI_C',
        },
        getSimulationForEducator: {
            baseURL: `${apiUrl}v1/simulation/educator_get/:id`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'SI_ED_V',
        },
        getListForEducator: {
            baseURL: `${apiUrl}v1/simulation/educator_list`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'SI_ED_L',
        },
        requestDelete: {
            baseURL: `${apiUrl}v1/simulation/educator-request-delete/:id`,
            method: `DELETE`,
            headers: baseHeader,
            permissionCode: 'SI_ED_RED',
        },
        getById: {
            baseURL: `${apiUrl}v1/simulation/get/:id`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'SI_V',
        },
        getList: {
            baseURL: `${apiUrl}v1/simulation/list`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'SI_L',
        },
        reject: {
            baseURL: `${apiUrl}v1/simulation/reject`,
            method: `PUT`,
            headers: baseHeader,
            permissionCode: 'SI_RJ',
        },
        rejectDelete: {
            baseURL: `${apiUrl}v1/simulation/reject-delete/:id`,
            method: `DELETE`,
            headers: baseHeader,
            permissionCode: 'SI_RJD',
        },
        studentComplete: {
            baseURL: `${apiUrl}v1/student/complete_list`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'ST_ED_CL',
        },
        getSimulationForStudent: {
            baseURL: `${apiUrl}v1/simulation/student-get/:id`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'SI_ST_V',
        },
        getListForStudent: {
            baseURL: `${apiUrl}v1/simulation/student_list`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'SI_ST_L',
        },
        update: {
            baseURL: `${apiUrl}v1/simulation/update`,
            method: `PUT`,
            headers: baseHeader,
            permissionCode: 'SI_U',
        },
        educatorDelete: {
            baseURL: `${apiUrl}v1/simulation/educator-delete/:id`,
            method: `DELETE`,
            headers: baseHeader,
            permissionCode: 'SI_ED_D',
        },   
    },


    // Task APIs
    task: {
        getList: {
            baseURL: `${apiUrl}v1/task/list`,
            method: 'GET',
            headers: baseHeader,
            permissionCode: 'TA_L',
        },
        getById: {
            baseURL: `${apiUrl}v1/task/get/:id`,
            method: 'GET',
            headers: baseHeader,
            permissionCode: 'TA_V',
        },
        create: {
            baseURL: `${apiUrl}v1/task/create`,
            method: 'POST',
            headers: baseHeader,
            permissionCode: 'TA_ED_C',
        },
        update: {
            baseURL: `${apiUrl}v1/task/update`,
            method: 'PUT',
            headers: baseHeader,
            permissionCode: 'TA_U',
        },
        delete: {
            baseURL: `${apiUrl}v1/task/delete/:id`,
            method: 'DELETE',
            headers: baseHeader,
            permissionCode: 'TA_D',
        },
        educatorList: {
            baseURL: `${apiUrl}v1/task/educator_list`,
            method: 'GET',
            headers: baseHeader,
            permissionCode: 'TA_ED_L',
        },
        educatorGet: {
            baseURL: `${apiUrl}v1/task/educator_get/:id`,
            method: 'GET',
            headers: baseHeader,
            permissionCode: 'TA_ED_V',
        },
        studentList: {
            baseURL: `${apiUrl}v1/task/student_list`,
            method: 'GET',
            headers: baseHeader,
            permissionCode: 'TA_ST_L',
        },
        studentGet: {
            baseURL: `${apiUrl}v1/task/student-get/:id`,
            method: 'GET',
            headers: baseHeader,
            permissionCode: 'TA_ST_V',
        },
        videoProcess: {
            baseURL: `${apiUrl}v1/task/video-process`,
            method: 'POST',
            headers: baseHeader,
            permissionCode: 'TA_VP',
        },
    },

    // Task Question APIs
    taskQuestion: {
        getList: {
            baseURL: `${apiUrl}v1/task_question/list`,
            method: 'GET',
            headers: baseHeader,
            permissionCode: 'TQ_L',
        },
        create: {
            baseURL: `${apiUrl}v1/task_question/create`,
            method: 'POST',
            headers: baseHeader,
            permissionCode: 'TQ_C',
        },
        update: {
            baseURL: `${apiUrl}v1/task_question/update`,
            method: 'PUT',
            headers: baseHeader,
            permissionCode: 'TQ_U',
        },
        delete: {
            baseURL: `${apiUrl}v1/task_question/delete/:id`,
            method: 'DELETE',
            headers: baseHeader,
            permissionCode: 'TQ_D',
        },
        educatorList: {
            baseURL: `${apiUrl}v1/task_question/educator_list`,
            method: 'GET',
            headers: baseHeader,
            permissionCode: 'TQ_ED_L',
        },
        studentList: {
            baseURL: `${apiUrl}v1/task_question/student_list`,
            method: 'GET',
            headers: baseHeader,
            permissionCode: 'TQ_ST_L',
        },
    },

    // Student SubTask Progress APIs
    subtaskProgress: {
        getList: {
            baseURL: `${apiUrl}v1/subtask-progress/list`,
            method: 'GET',
            headers: baseHeader,
            permissionCode: 'STSP_L',
        },
        create: {
            baseURL: `${apiUrl}v1/subtask-progress/create`,
            method: 'POST',
            headers: baseHeader,
            permissionCode: 'STSP_C',
        },
        complete: {
            baseURL: `${apiUrl}v1/subtask-progress/complete`,
            method: 'PUT',
            headers: baseHeader,
            permissionCode: 'STSP_CPL',
        },
        restart: {
            baseURL: `${apiUrl}v1/subtask-progress/restart`,
            method: 'PUT',
            headers: baseHeader,
            permissionCode: 'STSP_RES',
        },
        access: {
            baseURL: `${apiUrl}v1/subtask-progress/access`,
            method: 'POST',
            headers: baseHeader,
            permissionCode: 'STSP_ACC',
        },
        studentList: {
            baseURL: `${apiUrl}v1/subtask-progress/student_list`,
            method: 'GET',
            headers: baseHeader,
            permissionCode: 'STSP_ST_L',
        },
        studentGet: {
            baseURL: `${apiUrl}v1/subtask-progress/student-get/:id`,
            method: 'GET',
            headers: baseHeader,
            permissionCode: 'STSP_ST_V',
        },
    },

    taskQuestionProgress: {
        answerList: {
            baseURL: `${apiUrl}v1/task-question-progress/answer_list`,
            method: 'GET',
            headers: baseHeader,
            permissionCode: 'STTQ_ED_LR',
        },
        getList: {
            baseURL: `${apiUrl}v1/task-question-progress/list`,
            method: 'GET',
            headers: baseHeader,
            permissionCode: 'STTQ_L',
        },
        create: {
            baseURL: `${apiUrl}v1/task-question-progress/create`,
            method: 'POST',
            headers: baseHeader,
            permissionCode: 'STTQ_C',
        },
        delete: {
            baseURL: `${apiUrl}v1/task-question-progress/delete/:id`,
            method: 'DELETE',
            headers: baseHeader,
            permissionCode: 'STTQ_D',
        },
        studentList: {
            baseURL: `${apiUrl}v1/task-question-progress/student_list`,
            method: 'GET',
            headers: baseHeader,
            permissionCode: 'STTQ_ST_L',
        },
    },

    specialization: {
        getList: {
            baseURL: `${apiUrl}v1/specialization/list`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'SP_L',
        },
        create: {
            baseURL: `${apiUrl}v1/specialization/create`,
            method: `POST`,
            headers: baseHeader,
            permissionCode: 'SP_C',
        },
        update: {
            baseURL: `${apiUrl}v1/specialization/update`,
            method: `PUT`,
            headers: baseHeader,
            permissionCode: 'SP_U',
        },
        delete: {
            baseURL: `${apiUrl}v1/specialization/delete/:id`,
            method: `DELETE`,
            headers: baseHeader,
            permissionCode: 'SP_D',
        },
        getById: {
            baseURL: `${apiUrl}v1/specialization/get/:id`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'SP_L',
        },
    },
    student: {
        autoComplete: {
            baseURL: `${apiUrl}v1/student/auto-complete`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'ST_AP',
        },
        clientUpdate: {
            baseURL: `${apiUrl}v1/student/client_update`,
            method: `PUT`,
            headers: baseHeader,
            permissionCode: 'ST_U_U',
        },
        delete: {
            baseURL: `${apiUrl}v1/student/delete/:id`,
            method: `DELETE`,
            headers: baseHeader,
            permissionCode: 'ST_D',
        },
        getById: {
            baseURL: `${apiUrl}v1/student/get/:id`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'ST_V',
        },
        getList: {
            baseURL: `${apiUrl}v1/student/list`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'ST_L',
        },
        profile: {
            baseURL: `${apiUrl}v1/student/profile`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'ST_U_P',
        },
        register: {
            baseURL: `${apiUrl}v1/student/signup`,
            method: `POST`,
            headers: baseHeader,
        },
        update: {
            baseURL: `${apiUrl}v1/student/update`,
            method: `PUT`,
            headers: baseHeader,
            permissionCode: 'ST_U',
        },
        otp: {
            baseURL: `${apiUrl}v1/student/verify`,
            method: `POST`,
            headers: baseHeader,
        },
    },
    educator: {
        approve: {
            baseURL: `${apiUrl}v1/educator/approve`,
            method: `PUT`,
            headers: baseHeader,
            permissionCode: 'ED_AP',
        },
        autoComplete: {
            baseURL: `${apiUrl}v1/educator/auto-complete`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'ED_AP',
        },
        clientUpdate: {
            baseURL: `${apiUrl}v1/educator/client_update`,
            method: `PUT`,
            headers: baseHeader,
            permissionCode: 'ED_U_U',
        },
        delete: {
            baseURL: `${apiUrl}v1/educator/delete/:id`,
            method: `DELETE`,
            headers: baseHeader,
            permissionCode: 'ED_D',
        },
        getById: {
            baseURL: `${apiUrl}v1/educator/get/:id`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'ED_V',
        },
        getList: {
            baseURL: `${apiUrl}v1/educator/list`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'ED_L',
        },
        profile: {
            baseURL: `${apiUrl}v1/educator/profile`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'ED_U_P',
        },
        reject: {
            baseURL: `${apiUrl}v1/educator/reject`,
            method: `PUT`,
            headers: baseHeader,
            permissionCode: 'ED_RJ',
        },
        register: {
            baseURL: `${apiUrl}v1/educator/signup`,
            method: `POST`,
            headers: baseHeader,
        },
        update: {
            baseURL: `${apiUrl}v1/educator/update`,
            method: `PUT`,
            headers: baseHeader,
            permissionCode: 'ED_U',
        },
        otp: {
            baseURL: `${apiUrl}v1/educator/verify`,
            method: `POST`,
            headers: baseHeader,
        },
    },
    user: {
        getList: {
            baseURL: `${apiUrl}v1/account/list`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'ACC_L',
        },
        autocomplete: {
            baseURL: `${apiUrl}v1/account/auto-complete`,
            method: `GET`,
            headers: baseHeader,
        },
        getById: {
            baseURL: `${apiUrl}v1/account/get/:id`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'ACC_V',
        },
        create: {
            baseURL: `${apiUrl}v1/account/create_admin`,
            method: `POST`,
            headers: baseHeader,
            permissionCode: 'ACC_C_AD',
        },
        update: {
            baseURL: `${apiUrl}v1/account/update_admin`,
            method: `PUT`,
            headers: baseHeader,
            permissionCode: 'ACC_U_AD',
        },
        delete: {
            baseURL: `${apiUrl}v1/account/delete/:id`,
            method: `DELETE`,
            headers: baseHeader,
            permissionCode: 'ACC_D',
        },
    },
    file: {
        upload: {
            path: `${apiMediaUrl}v1/file/upload`,
            method: 'POST',
            headers: multipartFormHeader,
            isRequiredTenantId: true,
            isUpload: true,
            permissionCode: 'FILE_U',
        },
    },
    post: {
        getList: {
            baseURL: `${apiUrl}api/posts/list`,
            method: `GET`,
            headers: baseHeader,
        },
        getById: {
            baseURL: `${apiUrl}api/posts/get/:id`,
            method: `GET`,
            headers: baseHeader,
        },
        create: {
            baseURL: `${apiUrl}api/posts/create`,
            method: `POST`,
            headers: baseHeader,
        },
        update: {
            baseURL: `${apiUrl}api/posts/update`,
            method: `PUT`,
            headers: baseHeader,
        },
        delete: {
            baseURL: `${apiUrl}api/posts/:id`,
            method: `DELETE`,
            headers: baseHeader,
        },
        autocomplete: {
            baseURL: `${apiUrl}api/posts/auto-complete`,
            method: `GET`,
            headers: baseHeader,
        },
    },
    category: {
        getListForBrand: {
            baseURL: `${apiUrl}v1/category/list?kind=2`,
            method: 'GET',
            headers: baseHeader,
            isRequiredTenantId: true,
            permissionCode: 'CATE_L',
        },
        getList: {
            baseURL: `${apiUrl}v1/category/list`,
            method: 'GET',
            headers: baseHeader,
            isRequiredTenantId: true,
            permissionCode: 'CATE_L',
        },
        getById: {
            baseURL: `${apiUrl}v1/category/get/:id`,
            method: 'GET',
            headers: baseHeader,
            isRequiredTenantId: true,
            permissionCode: 'CATE_V',
        },
        create: {
            baseURL: `${apiUrl}v1/category/create`,
            method: 'POST',
            headers: baseHeader,
            isRequiredTenantId: true,
            permissionCode: 'CATE_C',
        },
        update: {
            baseURL: `${apiUrl}v1/category/update`,
            method: 'PUT',
            headers: baseHeader,
            isRequiredTenantId: true,
            permissionCode: 'CATE_U',
        },
        delete: {
            baseURL: `${apiUrl}v1/category/delete/:id`,
            method: 'DELETE',
            headers: baseHeader,
            isRequiredTenantId: true,
            permissionCode: 'CATE_D',
        },
        // autocomplete: {
        //     baseURL: `${apiUrl}v1/category/auto-complete`,
        //     method: 'GET',
        //     headers: baseHeader,
        //     isRequiredTenantId: true,
        // },
        autocomplete: {
            baseURL: `${apiUrl}v1/category/auto-complete`,
            method: 'GET',
            headers: baseHeader,
        },
    },
    device: {
        getListForClient: {
            baseURL: `${apiUrl}v1/device/client_list`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'DEV_L',
        },
        getListForAdmin: {
            baseURL: `${apiUrl}v1/device/list`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'DEV_L_AD',
        },
        getByIdForClient: {
            baseURL: `${apiUrl}v1/device/client-get/:id`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'DEV_V',
        },
        getByIdForAdmin: {
            baseURL: `${apiUrl}v1/device/get/:id`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'DEV_V_AD',
        },
        create: {
            baseURL: `${apiUrl}v1/device/create`,
            method: `POST`,
            headers: baseHeader,
            permissionCode: 'DEV_C',
        },
        update: {
            baseURL: `${apiUrl}v1/device/update`,
            method: `PUT`,
            headers: baseHeader,
            permissionCode: 'DEV_U',
        },
        delete: {
            baseURL: `${apiUrl}v1/device/delete/:id`,
            method: `DELETE`,
            headers: baseHeader,
            permissionCode: 'DEV_D',
        },
        autocomplete: {
            baseURL: `${apiUrl}v1/device/auto-complete`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'DEV_L',
        },
    },

    review: {
        create: {
            baseURL: `${apiUrl}v1/review/create`,
            method: 'POST',
            headers: baseHeader,
            permissionCode: 'RE_C',
        },
        list: {
            baseURL: `${apiUrl}v1/review/list`,
            method: 'GET',
            headers: baseHeader,
            permissionCode: 'RE_L',
        },
        update: {
            baseURL: `${apiUrl}v1/review/update`,
            method: 'PUT', // hoặc POST nếu backend dùng POST
            headers: baseHeader,
            permissionCode: 'RE_U',
        },
        delete: {
            baseURL: `${apiUrl}v1/review/delete`,
            method: 'DELETE', // hoặc POST nếu backend dùng POST
            headers: baseHeader,
            permissionCode: 'RE_D',
        },

        // Nếu vẫn cần client_list thì anh thêm vào
        getListForClient: {
            baseURL: `${apiUrl}v1/review/client_list`,
            method: 'GET',
            headers: baseHeader,
            permissionCode: 'RE_L',
        },
    },

    notification: {
        getByStudent: {
            baseURL: `${apiUrl}v1/notification/student-get`,
            method: 'GET',
            headers: baseHeader,
            permissionCode: 'NO_ST_V',
        },
        getListByStudent: {
            baseURL: `${apiUrl}v1/notification/student_list`,
            method: 'GET',
            headers: baseHeader,
            permissionCode: 'NO_ST_L',
        },
    },

    reviewSubmission: {
        getForEducator: {
            baseURL: `${apiUrl}v1/review-submission/educator-get/:simulationId/student/:username`,
            method: 'GET',
            headers: baseHeader,
            permissionCode: 'RESUB_ED_V', 
        },
        getForStudent: {
            baseURL: `${apiUrl}v1/review-submission/student-get/:simulationId`,
            method: 'GET',
            headers: baseHeader,
            permissionCode: 'RESUB_ST_V',
        },
        create: {
            baseURL: `${apiUrl}v1/review-submission/create`,
            method: 'POST',
            headers: baseHeader,
            permissionCode: 'RESUB_C',
        },
        delete: {
            baseURL: `${apiUrl}v1/review-submission/delete/:id`,
            method: 'DELETE',
            headers: baseHeader,
            permissionCode: 'RESUB_D',
        },
        update: {
            baseURL: `${apiUrl}v1/review-submission/update`,
            method: 'PUT',
            headers: baseHeader,
            permissionCode: 'RESUB_U',
        },
    },
    groupPermission: {
        getGroupList: {
            baseURL: `${apiUrl}v1/group/list`,
            method: 'GET',
            headers: baseHeader,
            permissionCode: 'GR_L',
        },
        getList: {
            baseURL: `${apiUrl}v1/group/list`,
            method: 'GET',
            headers: baseHeader,
            permissionCode: 'GR_L',
        },
        getPemissionList: {
            baseURL: `${apiUrl}v1/permission/list`,
            method: 'GET',
            headers: baseHeader,
            permissionCode: 'PER_L',
        },
        getPemissionListByApp: {
            baseURL: `${apiUrl}v1/project-role-permission/list-by-app`,
            method: 'GET',
            headers: baseHeader,
            permissionCode: 'PRP_L_A',
        },
        getById: {
            baseURL: `${apiUrl}v1/group/get/:id`,
            method: 'GET',
            headers: baseHeader,
            permissionCode: 'GR_V',
        },
        create: {
            baseURL: `${apiUrl}v1/group/create`,
            method: 'POST',
            headers: baseHeader,
            permissionCode: 'GR_C',
        },
        update: {
            baseURL: `${apiUrl}v1/group/update`,
            method: 'PUT',
            headers: baseHeader,
            permissionCode: 'GR_U',
        },
        delete: {
            baseURL: `${apiUrl}v1/group/delete/:id`,
            method: 'DELETE',
            headers: baseHeader,
            permissionCode: 'GR_D',
        },
        getGroupListCombobox: {
            baseURL: `${apiUrl}v1/group/list_combobox`,
            method: 'GET',
            headers: baseHeader,
        },
    },
    settings: {
        getList: {
            baseURL: `${apiTenantUrl}v1/setting/list`,
            method: 'GET',
            headers: baseHeader,
            isRequiredTenantId: true,
            permissionCode: 'SET_L',
        },
        getById: {
            baseURL: `${apiTenantUrl}v1/setting/get/:id`,
            method: 'GET',
            headers: baseHeader,
            isRequiredTenantId: true,
            permissionCode: 'SET_V',
        },
        create: {
            baseURL: `${apiTenantUrl}v1/setting/create`,
            method: 'POST',
            headers: baseHeader,
            isRequiredTenantId: true,
            permissionCode: 'SET_C',
        },
        update: {
            baseURL: `${apiTenantUrl}v1/setting/update`,
            method: 'PUT',
            headers: baseHeader,
            isRequiredTenantId: true,
            permissionCode: 'SET_U',
        },
        delete: {
            baseURL: `${apiTenantUrl}v1/setting/delete/:id`,
            method: 'DELETE',
            headers: baseHeader,
            isRequiredTenantId: true,
            permissionCode: 'SET_D',
        },
        autocomplete: {
            baseURL: `${apiTenantUrl}v1/setting/auto-complete`,
            method: 'GET',
            headers: baseHeader,
            isRequiredTenantId: true,
        },
        settings: {
            baseURL: `${apiTenantUrl}v1/setting/settings`,
            method: 'GET',
            headers: baseHeader,
            isRequiredTenantId: true,
        },
    },
    contacts: {
        getList: {
            baseURL: `${apiUrl}v1/contacts/list`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'CNT_L_AD',
        },
        getListClient: {
            baseURL: `${apiUrl}v1/contacts/client_list`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'CNT_L',
        },
        getById: {
            baseURL: `${apiUrl}v1/contacts/get/:id`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'CNT_V_AD',
        },
        getByIdClient: {
            baseURL: `${apiUrl}v1/contacts/client-get/:id`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'CNT_V',
        },
        create: {
            baseURL: `${apiUrl}v1/contacts/create`,
            method: `POST`,
            headers: baseHeader,
            permissionCode: 'CNT_C',
        },
        update: {
            baseURL: `${apiUrl}v1/contacts/update`,
            method: `PUT`,
            headers: baseHeader,
            permissionCode: 'CNT_U',
        },
        delete: {
            baseURL: `${apiUrl}v1/contacts/delete/:id`,
            method: `DELETE`,
            headers: baseHeader,
            permissionCode: 'CNT_D',
        },
    },
    employee: {
        getList: {
            baseURL: `${apiUrl}v1/employee/list`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'EMP_L',
        },
        getById: {
            baseURL: `${apiUrl}v1/employee/get/:id`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'EMP_V',
        },
        create: {
            baseURL: `${apiUrl}v1/employee/create`,
            method: `POST`,
            headers: baseHeader,
            permissionCode: 'EMP_C',
        },
        update: {
            baseURL: `${apiUrl}v1/employee/update`,
            method: `PUT`,
            headers: baseHeader,
            permissionCode: 'EMP_U',
        },
        delete: {
            baseURL: `${apiUrl}v1/employee/delete/:id`,
            method: `DELETE`,
            headers: baseHeader,
            permissionCode: 'EMP_D',
        },
        autocomplete: {
            baseURL: `${apiUrl}v1/employee/auto-complete`,
            method: `GET`,
            headers: baseHeader,
        },
    },
    phoneCall: {
        admin: {
            getList: {
                baseURL: `${apiUrl}v1/phone-call/list`,
                method: `GET`,
                headers: baseHeader,
                permissionCode: 'PC_L',
            },
            getById: {
                baseURL: `${apiUrl}v1/phone-call/get/:id`,
                method: `GET`,
                headers: baseHeader,
                permissionCode: 'PC_V',
            },
            create: {
                baseURL: `${apiUrl}v1/phone-call/create`,
                method: `POST`,
                headers: baseHeader,
                permissionCode: 'PC_C',
            },
            update: {
                baseURL: `${apiUrl}v1/phone-call/update`,
                method: `PUT`,
                headers: baseHeader,
                permissionCode: 'PC_U',
            },
            delete: {
                baseURL: `${apiUrl}v1/phone-call/delete/:id`,
                method: `DELETE`,
                headers: baseHeader,
                permissionCode: 'PC_D',
            },
        },
        employee: {
            getList: {
                baseURL: `${apiUrl}v1/phone-call/employee_list`,
                method: `GET`,
                headers: baseHeader,
                permissionCode: 'PC_EL',
            },
            getById: {
                baseURL: `${apiUrl}v1/phone-call/employee-get/:id`,
                method: `GET`,
                headers: baseHeader,
                permissionCode: 'PC_EV',
            },
            create: {
                baseURL: `${apiUrl}v1/phone-call/employee-create`,
                method: `POST`,
                headers: baseHeader,
                permissionCode: 'PC_EC',
            },
            update: {
                baseURL: `${apiUrl}v1/phone-call/employee-update`,
                method: `PUT`,
                headers: baseHeader,
                permissionCode: 'PC_EU',
            },
            delete: {
                baseURL: `${apiUrl}v1/phone-call/employee-delete/:id`,
                method: `DELETE`,
                headers: baseHeader,
                permissionCode: 'PC_ED',
            },
        },
    },
    deviceEmployee: {
        getList: {
            baseURL: `${apiUrl}v1/device-employee/list`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'DEE_L',
        },
        getListForClient: {
            baseURL: `${apiUrl}v1/device-employee/client_list`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'CNT_L',
        },
        getById: {
            baseURL: `${apiUrl}v1/device-employee/get/:id`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'DEE_V',
        },
        getByIdForClient: {
            baseURL: `${apiUrl}v1/device-employee/client-get/:id`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'CNT_V',
        },
        create: {
            baseURL: `${apiUrl}v1/device-employee/create`,
            method: `POST`,
            headers: baseHeader,
            permissionCode: 'CNT_C',
        },
        createForClient: {
            baseURL: `${apiUrl}v1/device-employee/client-create`,
            method: `POST`,
            headers: baseHeader,
            permissionCode: 'DEE_C',
        },
        update: {
            baseURL: `${apiUrl}v1/device-employee/update`,
            method: `PUT`,
            headers: baseHeader,
            permissionCode: 'DEE_U',
        },
        updateForClient: {
            baseURL: `${apiUrl}v1/device-employee/client-update`,
            method: `PUT`,
            headers: baseHeader,
            permissionCode: 'CNT_U',
        },
        delete: {
            baseURL: `${apiUrl}v1/device-employee/delete/:id`,
            method: `DELETE`,
            headers: baseHeader,
            permissionCode: 'DEE_D',
        },
    },
    message: {
        getList: {
            baseURL: `${apiUrl}v1/message/list`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'MES_L_AD',
        },
        getListForClient: {
            baseURL: `${apiUrl}v1/message/client_list`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'MES_L',
        },
        getById: {
            baseURL: `${apiUrl}v1/message/get/:id`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'MES_V_AD',
        },
        getByIdForClient: {
            baseURL: `${apiUrl}v1/message/client-get/:id`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'MES_V',
        },
        create: {
            baseURL: `${apiUrl}v1/message/create`,
            method: `POST`,
            headers: baseHeader,
            permissionCode: 'MES_C',
        },
        update: {
            baseURL: `${apiUrl}v1/message/update`,
            method: `PUT`,
            headers: baseHeader,
            permissionCode: 'MES_U',
        },
        delete: {
            baseURL: `${apiUrl}v1/message/delete/:id`,
            method: `DELETE`,
            headers: baseHeader,
            permissionCode: 'MES_D',
        },
    },
    nation: {
        getList: {
            baseURL: `${apiUrl}v1/nation/list`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'NAT_L',
        },
        getById: {
            baseURL: `${apiUrl}v1/nation/get/:id`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'NAT_V',
        },
        autoComplete: {
            baseURL: `${apiUrl}v1/nation/auto-complete`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'NAT_L',
        },
        create: {
            baseURL: `${apiUrl}v1/nation/create`,
            method: `POST`,
            headers: baseHeader,
            permissionCode: 'NAT_C',
        },
        update: {
            baseURL: `${apiUrl}v1/nation/update`,
            method: `PUT`,
            headers: baseHeader,
            permissionCode: 'NAT_U',
        },
        delete: {
            baseURL: `${apiUrl}v1/nation/delete/:id`,
            method: `DELETE`,
            headers: baseHeader,
            permissionCode: 'NAT_D',
        },
        getClientList: {
            baseURL: `${apiUrl}v1/nation/client_list`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'NAT_L',
        },
        getClientById: {
            baseURL: `${apiUrl}v1/nation/client-get/:id`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'NAT_V',
        },
    },
    tag: {
        getList: {
            baseURL: `${apiUrl}v1/tag/list`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'TAG_L',
        },
        getById: {
            baseURL: `${apiUrl}v1/tag/get/:id`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'TAG_V',
        },
        create: {
            baseURL: `${apiUrl}v1/tag/create`,
            method: `POST`,
            headers: baseHeader,
            permissionCode: 'TAG_C',
        },
        update: {
            baseURL: `${apiUrl}v1/tag/update`,
            method: `PUT`,
            headers: baseHeader,
            permissionCode: 'TAG_U',
        },
        delete: {
            baseURL: `${apiUrl}v1/tag/delete/:id`,
            method: `DELETE`,
            headers: baseHeader,
            permissionCode: 'TAG_D',
        },
    },
    deviceEmployeeLog: {
        getList: {
            baseURL: `${apiUrl}v1/device-employee-log/list`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'DEL_L',
        },
        getById: {
            baseURL: `${apiUrl}v1/device-employee-log/get/:id`,
            method: `GET`,
            headers: baseHeader,
            permissionCode: 'DEL_V',
        },
    },
    guestSimulation: {
        getList: {
            baseURL: `${apiUrl}v1/simulation/guest_list`,
            method: 'GET',
            headers: baseHeader,
        },
        getById: {
            baseURL: `${apiUrl}v1/simulation/guest_get/:id`,
            method: 'GET',
            headers: baseHeader,
        },
    },
};


export default apiConfig;
