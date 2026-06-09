import {
    STATUS_ACTIVE,
    STATUS_INACTIVE,
    STATUS_PENDING,
    STATUS_WAITING_APPROVE,
    STATUS_WAITING_APPROVE_DELETE,
    STATUS_REJECT,
    PROVINCE_KIND,
    DISTRICT_KIND,
    VILLAGE_KIND,
    GENDER_MALE,
    GENDER_FEMALE,
    GENDER_OTHER,
    DURATION_TYPE_HOUR,
    DURATION_TYPE_MINUTE,
    DURATION_TYPE_SECOND,
    PHONE_CALL_TYPE_OUTGOING,
    PHONE_CALL_TYPE_COMING,
    PHONE_CALL_TYPE_MISSING,
    PLATFORM_ANDROID,
    PLATFORM_IOS,
    MESSAGE_TYPE_SEND,
    MESSAGE_TYPE_RECEIVE,
    MESSAGE_STATUS_READ,
    MESSAGE_STATUS_UNREAD,
    STATUS_LOCK,
    STATE_WAITING_OTP,
    TaskTypes,
    accountStatus,
} from '@constants';
import { defineMessages } from 'react-intl';
import { actionMessage } from './intl';
import { commonMessage } from '@locales/intl';

export const languageOptions = [
    { value: 1, label: 'EN' },
    { value: 2, label: 'VN' },
    { value: 3, label: 'Other' },
];

export const commonStatus = [
    { value: STATUS_ACTIVE, label: 'Active', color: 'green' },
    { value: STATUS_PENDING, label: 'Pending', color: 'warning' },
    { value: STATUS_INACTIVE, label: 'Inactive', color: 'red' },
];

export const statusOptions = [
    { value: STATUS_ACTIVE, label: commonMessage.statusActive, color: '#00A648' },
    { value: STATUS_PENDING, label: commonMessage.statusPending, color: '#FFBF00' },
    { value: STATUS_INACTIVE, label: commonMessage.statusInactive, color: '#CC0000' },
];

export const localAccountStatusOptions = [
    { value: accountStatus.ACTIVE, label: commonMessage.statusActive, color: '#00A648' },
    { value: accountStatus.WAITING_APPROVE, label: commonMessage.statusWaitingApproveSinup, color: '#FFBF00' },
    { value: accountStatus.FORGET_PASSWORD, label: commonMessage.statusForgetPassword, color: '#007accff' },
    { value: accountStatus.REJECT, label: commonMessage.statusReject, color: '#CC0000' },
    { value: accountStatus.LOCK, label: commonMessage.statusLock, color: '#CC0000' },
    { value: accountStatus.VERIFY, label: commonMessage.statusVerify, color: '#007accff' },
];

export const studentStatusOptions = [
    { value: 1, label: commonMessage.statusActive, color: '#00A648' },
    { value: 0, label: commonMessage.statusWaitingOtp, color: '#007accff' },
];

export const levelOptions = [
    { value: 1, label: commonMessage.level_1, color: '#00A648' },
    { value: 2, label: commonMessage.level_2, color: '#FFBF00' },
    { value: 3, label: commonMessage.level_3, color: '#CC0000' },
];

export const simulationStatusOptions = [
    { value: STATUS_ACTIVE, label: commonMessage.statusActive, color: '#00A648' },
    { value: STATUS_WAITING_APPROVE, label: commonMessage.statusWaitingApprove, color: '#1890ff' },
    { value: STATUS_WAITING_APPROVE_DELETE, label: commonMessage.statusWaitingApproveDelete, color: '#fa8c16' },
];

export const formSize = {
    small: '700px',
    normal: '800px',
    big: '900px',
    large: '1200px',
    extraLarge: '1500px',
};

export const settingGroups = {
    GENERAL: 'general',
    PAGE: 'page_config',
    REVENUE: 'revenue_config',
    TRAINING: 'training_config',
};
export const dataTypeSetting = {
    INT: 'int',
    STRING: 'string',
    BOOLEAN: 'boolean',
    DOUBLE: 'double',
    RICHTEXT: 'richtext',
};

export const settingKeyName = {
    MONEY_UNIT: 'money_unit',
    TRAINING_UNIT: 'training_percent',
    BUG_UNIT: 'training_project_percent',
    NUMBER_OF_TRAINING_PROJECT: 'number_of_training_projects',
};

export const actionOptions = [
    {
        value: 1,
        label: actionMessage.contactForm,
    },
    { value: 2, label: actionMessage.navigation },
];

export const genderOptions = [
    { value: GENDER_MALE, label: commonMessage.genderMale, color: '#00A648' },
    { value: GENDER_FEMALE, label: commonMessage.genderFemale, color: '#FFBF00' },
    { value: GENDER_OTHER, label: commonMessage.genderOther, color: '#FFBF00' },
];

export const taskKindOptions = [
    { value: TaskTypes.TASK, label: { id: 'task', defaultMessage: 'Task' }, color: '#00A648' },
    { value: TaskTypes.SUBTASK, label: { id: 'subtask', defaultMessage: 'SubTask' }, color: '#FFBF00' },
];

export const taskTypeOptions = [
    { value: 0, label: { id: 'task.type.overview', defaultMessage: 'Overview' }, color: '#1890ff' },
    { value: 1, label: { id: 'task.type.content', defaultMessage: 'Content' }, color: '#52c41a' },
    { value: 2, label: { id: 'task.type.question', defaultMessage: 'Question' }, color: '#fa8c16' },
    { value: 3, label: { id: 'task.type.answer', defaultMessage: 'Answer' }, color: '#722ed1' },
];

export const questionTypeOptions = [
    {
        value: 1,
        label: { id: 'question.type.file', defaultMessage: 'File Upload' },
        color: 'blue',
    },
    {
        value: 2,
        label: { id: 'question.type.text', defaultMessage: 'Text Answer' },
        color: 'green',
    },
    {
        value: 3,
        label: { id: 'question.type.choice', defaultMessage: 'Multiple Choice' },
        color: 'orange',
    },
];
