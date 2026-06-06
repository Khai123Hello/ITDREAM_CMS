import qs from 'query-string';
import {
    DATE_FORMAT_DISPLAY,
    DATE_FORMAT_END_OF_DAY_TIME,
    DATE_FORMAT_ZERO_TIME,
    DATE_SHORT_MONTH_FORMAT,
    DEFAULT_FORMAT,
    DEFAULT_TABLE_ITEM_SIZE,
    THEMES,
    TIME_FORMAT_FULL,
    apiUrl,
} from '@constants';
import dayjs from 'dayjs';
import moment from 'moment/moment';
import utc from 'dayjs/plugin/utc';
import { useNavigate } from 'react-router-dom';

dayjs.extend(utc);

export const convertGlobImportToObject = (modules) =>
    modules
        .filter((module) => !!module.default)
        .reduce(
            (rs, cur) => ({
                ...rs,
                [cur.default.name]: cur.default,
            }),
            {},
        );

export const convertGlobImportToArray = (modules) =>
    modules.filter((module) => !!module.default).map((module) => module.default);

export const destructCamelCaseString = (string) => {
    const arrString = [...string];
    const newArrString = [];
    arrString.forEach((char, index) => {
        if (char.charCodeAt(0) > 90) {
            newArrString.push(char);
        } else {
            index && newArrString.push('-');
            newArrString.push(char.toLowerCase());
        }
    });
    return newArrString.join('');
};

export const convertUtcToLocalTime = (utcTime, inputFormat = DATE_FORMAT_DISPLAY, format = DATE_FORMAT_DISPLAY) => {
    try {
        if (utcTime) return moment(moment.utc(utcTime, inputFormat).toDate()).format(format);
        return '';
    } catch (err) {
        return '';
    }
};
export function convertUtcToIso(date) {
    return dayjs(convertUtcToLocalTime(date, DEFAULT_FORMAT, DEFAULT_FORMAT), DEFAULT_FORMAT);
}

export const getBrowserTheme = () => {
    const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    return isDark ? THEMES.DARK : THEMES.LIGHT;
};

export const makeURL = (baseURL, params, pathParams) => {
    for (let key of Object.keys(pathParams || {})) {
        const keyCompare = `:${key}`;
        if (baseURL.indexOf(keyCompare) !== -1) {
            baseURL = baseURL.replace(keyCompare, pathParams[key]);
        }
    }

    if (params) {
        baseURL = baseURL + '?' + qs.stringify(params);
    }

    return baseURL;
};

export const parseURL = (url) => {
    try {
        return new URL(url);
    } catch (error) {
        return '';
    }
};

export const getYTEmbedLinkFromYTWatchLink = (watchLink) => {
    if (!watchLink) {
        return '';
    }

    const { v } = qs.parse(parseURL(watchLink).search);
    return v ? `https://www.youtube.com/embed/${v}?autoplay=1&mute=1` : watchLink;
};

export const getYoutubeVideoID = (url) => {
    let pattern = /(youtu.*be.*)\/(watch\?v=|embed\/|v|shorts|)(.*?((?=[&#?])|$))/gm;
    return pattern.exec(url)?.[3];
};

export const formatNumber = (value, setting) => {
    if (value) {
        const decimalPosition = value.toString().indexOf('.');
        if (decimalPosition > 0) {
            const intVal = value.toString().substring(0, decimalPosition);
            const decimalVal = value.toString().substring(decimalPosition + 1);
            return `${intVal.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${decimalVal}`;
        }
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    } else if (value === 0) return 0;
    return '';
};

export const formatDateString = (dateString, formatDate = DATE_SHORT_MONTH_FORMAT) => {
    return dayjs(dateString).format(formatDate);
};

export const removeAccents = (str) => {
    if (str)
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D');
    return str;
};

export const validateUsernameForm = (rule, username) => {
    return /^[a-z0-9_]+$/.exec(username)
        ? Promise.resolve()
        : Promise.reject('Username chỉ bao gồm các ký tự a-z, 0-9, _');
};

export const getBase64 = (img, callback) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result));
    reader.readAsDataURL(img);
};

export function ensureArray(value) {
    if (value === null || value === undefined) {
        return [];
    }

    if (Array.isArray(value)) {
        return value;
    }

    return [value];
}

export const removePathParams = (paths) => {
    return ensureArray(paths).map((path) => {
        if (typeof path !== 'string') return path;
        return path.replaceAll(/\/:[a-zA-Z]+/g, '');
    });
};

export const validatePermission = (
    requiredPermissions = [],
    userPermissions = [],
    requiredKind,
    excludeKind = [],
    userKind,
    profile,
    path,
    separate,
) => {
    if (ensureArray(excludeKind).length > 0) {
        if (ensureArray(excludeKind).some((kind) => kind == userKind)) return false;
    }
    if (requiredKind) {
        if (requiredKind !== userKind) return false;
    }
    if (!requiredPermissions || requiredPermissions?.length == 0) return true;
    if (userPermissions.some((code) => requiredPermissions.includes(code))) {
        return true;
    }
    let permissionsSavePage = [];
    if (separate && requiredPermissions.length > 0) {
        permissionsSavePage.push(path?.type === 'create' ? requiredPermissions[0] : requiredPermissions[1]);
    } else {
        permissionsSavePage = requiredPermissions;
    }
    return removePathParams(permissionsSavePage).every((item) => userPermissions?.includes(item?.replace(apiUrl, '/')));
};

export function generatePassword(options) {
    const { length, numbers, uppercase, lowercase, symbols, strict } = options;

    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const numberChars = '0123456789';
    const symbolChars = '!@#$%^&*()_+[]{}|;:,.<>?';

    let validChars = '';

    if (uppercase) {
        validChars += uppercaseChars;
    }
    if (lowercase) {
        validChars += lowercaseChars;
    }
    if (numbers) {
        validChars += numberChars;
    }
    if (symbols) {
        validChars += symbolChars;
    }

    if (validChars.length === 0) {
        throw new Error('At least one character type should be selected.');
    }

    let password = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * validChars.length);
        password += validChars.charAt(randomIndex);
    }

    if (strict) {
        // Ensure at least one character of each type is present
        if (uppercase && !/[A-Z]/.test(password)) {
            return generatePassword(options);
        }
        if (lowercase && !/[a-z]/.test(password)) {
            return generatePassword(options);
        }
        if (numbers && !/\d/.test(password)) {
            return generatePassword(options);
        }
        if (symbols && !/[!@#$%^&*()_+[\]{}|;:,.<>?]/.test(password)) {
            return generatePassword(options);
        }
    }

    return password;
}
export function copyToClipboard(text) {
    var textField = document.createElement('textarea');
    textField.innerText = text;
    document.body.appendChild(textField);
    textField.select();
    document.execCommand('copy');
    textField.remove();
}

export const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

export const convertSecondToTimeFormatFull = (seconds) => {
    if (!seconds || isNaN(seconds)) return null;
    return dayjs().startOf('day').add(seconds, 'seconds');
};

export const convertTimeFormatFullToSeconds = (timeValue) => {
    if (!timeValue) return null;
    const parsedTime = dayjs(timeValue, TIME_FORMAT_FULL);
    return parsedTime.diff(dayjs().startOf('day'), 'seconds');
};

export const formatDateToZeroTimeUTC = (date) => {
    if (!date) return '';
    const parsedDate = dayjs(date);
    if (!parsedDate.isValid()) return '';

    const dateString = parsedDate.format(DATE_FORMAT_ZERO_TIME);
    return dayjs(dateString, DEFAULT_FORMAT).utc().format(DEFAULT_FORMAT);
};

export const formatDateToEndOfDayTimeUTC = (date) => {
    if (!date) return '';
    const parsedDate = dayjs(date);
    if (!parsedDate.isValid()) return '';

    const dateString = parsedDate.format(DATE_FORMAT_END_OF_DAY_TIME);
    return dayjs(dateString, DEFAULT_FORMAT).utc().format(DEFAULT_FORMAT);
};

export const formatDateToZeroTime = (date) => {
    if (!date) return '';
    const parsedDate = dayjs(date);
    if (!parsedDate.isValid()) return '';

    return parsedDate.startOf('day').format(DATE_FORMAT_ZERO_TIME);
};


export const formatDateToEndOfDayTime = (date) => {
    if (!date) return '';

    const parsedDate = dayjs(date);
    if (!parsedDate.isValid()) return '';

    const endOfDayLocal = parsedDate.hour(23).minute(59).second(59);
    const endOfDayUTC = dayjs.utc(endOfDayLocal);

    return endOfDayUTC.format(DATE_FORMAT_END_OF_DAY_TIME);
};

export const calculateIndex = (index, pagination, queryFilter) => {
    const currentPage = queryFilter?.page || pagination?.current || 1;
    const pageSize = pagination?.pageSize || DEFAULT_TABLE_ITEM_SIZE;
    return index + 1 + (currentPage - 1) * pageSize;
};

export const useCustomNavigation = () => {
    const navigate = useNavigate();

    return (path) => {
        navigate(path);
    };
};

const getNestedValue = (obj, path) =>
    path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : ''), obj);

export const getColumnWidth = (params = {}) => {
    const { data = [], dataIndex = '', width = 100, ratio = 10 } = params;

    if (!Array.isArray(data) || data.length === 0 || !dataIndex) return width;

    const lengths = data
        .map((item) => {
            const value = getNestedValue(item, dataIndex);
            return value !== undefined && value !== null ? String(value).length : 0;
        })
        .filter((len) => len > 0);

    const maxLength = lengths.length > 0 ? Math.max(...lengths) : 0;

    return Math.max(width, maxLength * ratio);
};

export const formatCurrency = (val) => {
    const num = String(val ?? '')
        .replace(/\./g, '')
        .replace(/[^\d]/g, '');
    if (!num) return '';
    return Number(num).toLocaleString('vi-VN');
};

export const parseCurrency = (val) => {
    const num = String(val ?? '')
        .replace(/\./g, '')
        .replace(/[^\d]/g, '');
    return Number(num || 0);
};
