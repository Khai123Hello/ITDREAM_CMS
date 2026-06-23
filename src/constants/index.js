import { commonMessage } from '@locales/intl';

export const apiUrl = process.env.REACT_APP_API;
export const apiMediaUrl = process.env.REACT_APP_API_MEDIA;
export const enableExposure = process.env.REACT_APP_ENABLE_EXPOSURE === 'true';
export const apiTenantUrl = 'http://api-path/';

export const fixedPath = {
    privacy: `${apiUrl}${process.env.REACT_APP_PRIVACY_PATH}`,
    help: `${apiUrl}${process.env.REACT_APP_HELP_PATH}`,
    aboutUs: `${apiUrl}${process.env.REACT_APP_ABOUT_US_PATH}`,
};

export const brandName = 'CMS';

export const appName = 'media-cms-app';
export const appType = process.env.REACT_APP_TYPE;

export const storageKeys = {
    USER_ACCESS_TOKEN: `${appName}-user-access-token`,
    USER_REFRESH_TOKEN: `${appName}-user-refresh-token`,
    USER_KIND: `${appName}-${process.env.REACT_APP_ENV}-user-kind`,
    TENANT_HEADER: `X-tenant`,
    TENANT_API_URL: `${appName}-${process.env.REACT_APP_ENV}-tenant-api-url`,
    USER_TYPE: 'USER_TYPE',
};

export const AppConstants = {
    apiRootUrl: process.env.REACT_APP_API,
    contentRootUrl: `${process.env.REACT_APP_API_MEDIA}v1/file/download`,
    mediaRootUrl: `${process.env.REACT_APP_API_MEDIA}`,
    langKey: 'vi',
};

export const THEMES = {
    DARK: 'dark',
    LIGHT: 'light',
};

export const defaultLocale = 'en';
export const locales = ['en', 'vi'];

export const activityType = {
    GAME: 'game',
    VIDEO: 'video',
    ARTICLE: 'article',
    FOCUS_AREA: 'focus-area',
};

export const DATE_DISPLAY_FORMAT = 'DD-MM-YYYY HH:mm';
export const DATE_SHORT_MONTH_FORMAT = 'DD MMM YYYY';
export const TIME_FORMAT_DISPLAY = 'HH:mm';
export const DATE_FORMAT_VALUE = 'DD/MM/YYYY';
export const DATE_FORMAT_DISPLAY = 'DD/MM/YYYY';
export const DEFAULT_FORMAT = 'DD/MM/YYYY HH:mm:ss';
export const TIME_FORMAT_FULL = 'HH:mm:ss';
export const DATE_FORMAT_ZERO_TIME = 'DD/MM/YYYY 00:00:00';
export const DATE_FORMAT_END_OF_DAY_TIME = 'DD/MM/YYYY 23:59:59';

export const navigateTypeEnum = {
    PUSH: 'PUSH',
    POP: 'POP',
    REPLACE: 'REPLACE',
};

export const articleTypeEnum = {
    URL: 'url',
    PLAIN: 'plain',
};

export const accessRouteTypeEnum = {
    NOT_LOGIN: false,
    REQUIRE_LOGIN: true,
    BOTH: null,
};

export const UploadFileTypes = {
    AVATAR: 'AVATAR',
    LOGO: 'LOGO',
    DOCUMENT: 'DOCUMENT',
    IMAGE: 'IMAGE',
    VIEO: 'VIDEO',
};

export const LIMIT_IMAGE_SIZE = 512000;

export const ACCOUNT_STATUS_ACTIVE = 1;
export const ACCOUNT_STATUS_FORGET_PASSWORD = 0;
export const ACCOUNT_STATUS_VERIFY = 3;
export const ACCOUNT_STATUS_WAITING_APPROVE = 2;
export const ACCOUNT_STATUS_LOCK = -1;
export const ACCOUNT_STATUS_REJECT = -2;

export const accountStatus = {
    ACTIVE: 1,
    REJECT: -2,
    LOCK: -1,
    VERIFY: 3,
    WAITING_APPROVE: 2,
    FORGET_PASSWORD: 0,
};

export const STATUS_ACTIVE = 1;
export const STATUS_FORGET_PASSWORD = 0;
export const STATUS_PENDING = 0;
export const STATUS_VERIFY = 3;
export const STATUS_WAITING_APPROVE = 2;
export const STATUS_WAITING_APPROVE_DELETE = 3;
export const STATUS_LOCK = -1;
export const STATUS_REJECT = -2;
export const STATE_WAITING_OTP = 0;
export const STATUS_INACTIVE = -1;
export const STATUS_DELETE = -2;

export const commonStatus = {
    PENDING: 0,
    ACTIVE: 1,
    INACTIVE: -1,
    DELETE: -2,
    LOCK: -1,
};

export const DEFAULT_TABLE_ITEM_SIZE = 100;
export const DEFAULT_TABLE_PAGE_START = 0;

export const CATEGORY_KIND_SPECIALIZATION = 1;
export const CATEGORY_KIND_BLOG = 2;

export const CategoryKind = {
    SPECIALIZATION: 1,
    BLOG: 2,
};

export const UserTypes = {
    ADMIN: 1,
    EDUCATOR: 2,
    STUDENT: 3,
};

export const ORGANIZATION_TYPE_UNIVERSITY = 1;
export const ORGANIZATION_TYPE_COMPANY = 2;
export const ORGANIZATION_TYPES = [ORGANIZATION_TYPE_UNIVERSITY, ORGANIZATION_TYPE_COMPANY];

export const ORGANIZATION_TYPE_OPTIONS = [
    {
        labelKey: 'organizationTypeUniversity',
        value: ORGANIZATION_TYPE_UNIVERSITY,
    },
    {
        labelKey: 'organizationTypeCompany',
        value: ORGANIZATION_TYPE_COMPANY,
    },
];

export const TaskTypes = {
    TASK: 1,
    SUBTASK: 2,
};

export const TaskContentTypes = {
    OVERVIEW: 0,
    CONTENT: 1,
    QUESTION: 2,
    ANSWER: 3,
};

export const commonStatusColor = {
    [commonStatus.PENDING]: 'warning',
    [commonStatus.ACTIVE]: 'green',
    [commonStatus.INACTIVE]: 'red',
    [commonStatus.LOCK]: 'red',
};

export const accountStatusColor = {
    [accountStatus.ACTIVE]: 'green',
    [accountStatus.REJECT]: 'red',
    [accountStatus.LOCK]: 'red',
    [accountStatus.VERIFY]: 'blue',
    [accountStatus.WAITING_APPROVE]: 'orange',
    [accountStatus.FORGET_PASSWORD]: 'gray',
};

export const categoryKind = {
    news: 1,
};

export const appAccount = {
    APP_USERNAME: process.env.REACT_APP_USERNAME,
    APP_PASSWORD: process.env.REACT_APP_PASSWORD,
};

export const GROUP_KIND_ADMIN = 1;
export const GROUP_KIND_EDUCATOR = 2;
export const GROUP_KIND_STUDENT = 3;

export const groupPermissionKindsOptions = [
    { label: commonMessage.admin, value: GROUP_KIND_ADMIN },
    { label: commonMessage.educator, value: GROUP_KIND_EDUCATOR },
    { label: commonMessage.student, value: GROUP_KIND_STUDENT },
];

export const ROLE_SUPPER_ADMIN = 15;
export const ROLE_ADMIN = 16;

export const groupRolesOptions = [
    { label: commonMessage.superAdmin, value: ROLE_SUPPER_ADMIN },
    { label: commonMessage.admin, value: ROLE_ADMIN },
];

export const isSystemSettingOptions = [
    { label: commonMessage.showSystemSettings, value: 1 },
    { label: commonMessage.hideSystemSettings, value: 0 },
];

export const PROVINCE_KIND = 1;
export const DISTRICT_KIND = 2;
export const VILLAGE_KIND = 3;

export const SettingTypes = {
    Money: 'Money',
    Timezone: 'Timezone',
    System: 'System',
};

export const ADMIN_LOGIN_TYPE = 'password';

export const GENDER_MALE = 1;
export const GENDER_FEMALE = 2;
export const GENDER_OTHER = 3;

export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
export const PHONE_REGEX = /^\d+$/;

export const PASSWORD_MIN_LENGTH = 8;
export const PHONE_MIN_LENGTH = 10;
export const PHONE_MAX_LENGTH = 10;

export const DURATION_TYPE_HOUR = 'h';
export const DURATION_TYPE_MINUTE = 'm';
export const DURATION_TYPE_SECOND = 's';

export const PLATFORM_ANDROID = 1;
export const PLATFORM_IOS = 2;

export const LOCALE_EN = 'en';
export const LOCALE_VI = 'vi';

export const MESSAGE_TYPE_SEND = 1;
export const MESSAGE_TYPE_RECEIVE = 2;

export const MESSAGE_STATUS_READ = 1;
export const MESSAGE_STATUS_READ_FOR_ICON = true;
export const MESSAGE_STATUS_UNREAD = 0;
export const MESSAGE_STATUS_UNREAD_FOR_ICON = false;
export const BREAKPOINTS = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400,
};

export const GRANT_TYPE_ADMIN = 'password';
export const GRANT_TYPE_EMPLOYEE = 'employee';

export const TAG_KIND_PHONE_CALL_MESSAGE = 1;
export const TAG_KIND_CONTACT = 2;
export const CATEGORY_KIND_DEVICE = 3;
export const CATEGORY_KIND_DEVICE_HISTORY_COST = 4;
export const ERROR_CATEGORY_EXIST = 'ERROR-CATEGORY-0001';
export const ERROR_ACCOUNT_EXIST = 'ERROR-ACCOUNT-0001';
export const ERROR_USERNAME_EXISTED = 'ERROR-ACCOUNT-0001';

// Review Status for SimulationEnrollment
export const ReviewStatus = {
    NOT_REVIEWED: 0, // Chưa nhận xét
    REVIEWED: 1,     // Đã nhận xét hoàn tất
};
