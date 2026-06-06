import {
    DATE_FORMAT_VALUE,
    DEFAULT_FORMAT,
    EMAIL_REGEX,
    PASSWORD_MIN_LENGTH,
    PHONE_MAX_LENGTH,
    PHONE_MIN_LENGTH,
    PHONE_REGEX,
    STRONG_PASSWORD_REGEX,
} from '@constants';
import { commonMessage } from '@locales/intl';
import { formatDateString } from '@utils';
import dayjs from 'dayjs';

export const emailValidator = async (_, value, translate) => {
    if (value) {
        if (!EMAIL_REGEX.test(value)) {
            throw new Error(translate.formatMessage(commonMessage.invalidEmail));
        }
    }
};

export const phoneValidator = async (_, value, translate) => {
    if (value) {
        if (value.length < PHONE_MIN_LENGTH || value.length > PHONE_MAX_LENGTH) {
            throw new Error(translate.formatMessage(commonMessage.invalidPhoneLength));
        }

        if (!PHONE_REGEX.test(value)) {
            throw new Error(translate.formatMessage(commonMessage.invalidPhoneCharacter));
        }

        if (value.length > 1 && value[1] === '0') {
            throw new Error(translate.formatMessage(commonMessage.invalidPhoneSecondDigit));
        }
    }
};

export const passwordValidator = async (form, translate) => {
    const isTouched = form.isFieldTouched('password');
    const value = form.getFieldValue('password');

    if (isTouched && value) {
        if (value.length < PASSWORD_MIN_LENGTH) {
            throw new Error(translate.formatMessage(commonMessage.minLengthPassword));
        }

        if (!STRONG_PASSWORD_REGEX.test(value)) {
            throw new Error(translate.formatMessage(commonMessage.strongPassword));
        }
    }
};

export const confirmPasswordValidator = async (form, translate) => {
    const password = form.getFieldValue('password');
    const confirmPassword = form.getFieldValue('confirmPassword');

    if (confirmPassword && password !== confirmPassword) {
        throw new Error(translate.formatMessage(commonMessage.rePasswordNotMatch));
    }
};

export const dateMustBeforeNowValidator = async (_, value, translate, message) => {
    const date = dayjs(formatDateString(new Date(), DEFAULT_FORMAT), DATE_FORMAT_VALUE);
    if (date && value && value.isAfter(date)) {
        throw new Error(translate.formatMessage(message));
    }
};

export const oldPasswordValidator = async (_, value, form, translate) => {
    return new Promise((resolve) => {
        const password = form.getFieldValue('password');

        if (value && !password) {
            setTimeout(() => {
                form.setFields([
                    {
                        name: 'password',
                        errors: [translate.formatMessage(commonMessage.required)],
                    },
                ]);
            }, 0);
        } else {
            setTimeout(() => {
                form.setFields([{ name: 'password', errors: [] }]);
            }, 0);
        }

        resolve();
    });
};

export const passwordValidatorWithOldPassword = async (_, value, form, translate) => {
    const oldPassword = form.getFieldValue('oldPassword');

    return new Promise((resolve, reject) => {
        if (value && !oldPassword) {
            setTimeout(() => {
                form.setFields([
                    {
                        name: 'oldPassword',
                        errors: [translate.formatMessage(commonMessage.required)],
                    },
                ]);
            }, 0);
            return resolve();
        }

        if (value && value.length < PASSWORD_MIN_LENGTH) {
            return reject(translate.formatMessage(commonMessage.minLengthPassword));
        }

        if (value && !STRONG_PASSWORD_REGEX.test(value)) {
            return reject(translate.formatMessage(commonMessage.strongPassword));
        }

        setTimeout(() => {
            form.setFields([{ name: 'oldPassword', errors: [] }]);
        }, 0);

        resolve();
    });
};

export const checkDuplicateValue = (value, list, key, currentId, objectName, translate, message) => {
    if (!value) return;

    const isDuplicate = Array.isArray(list) && list.some(item =>
        item[key]?.toLowerCase() === value.toLowerCase() &&
        item.id !== (currentId || null),
    );

    if (isDuplicate) {
        throw new Error(`${objectName} ${translate.formatMessage(message)}`);
    }
};

export const checkDuplicateSerial = async (_, value, translate, devices, dataDetail) => {
    if (!value) return Promise.resolve();
    const serialRegex = /^[a-zA-Z0-9_-]+$/;
    if (!serialRegex.test(value)) {
        throw new Error(translate.formatMessage(commonMessage.invalidSerial));
    }
    const deviceList = devices?.content || [];
    checkDuplicateValue(
        value,
        deviceList,
        'serial',
        dataDetail?.id,
        'Serial',
        translate,
        commonMessage.duplicate,
    );
    return Promise.resolve();
};

export const checkSimNumber = async (_, value, translate, devices, dataDetail) => {
    if (!value) return Promise.resolve();
    const simNumberRegex = /^0\d{9}$/;
    if (!simNumberRegex.test(value)) {
        throw new Error(translate.formatMessage(commonMessage.invalidSimNumber));
    }
    const deviceList = devices?.content || [];
    checkDuplicateValue(
        value,
        deviceList,
        'simNumber',
        dataDetail?.id,
        'Số SIM',
        translate,
        commonMessage.duplicate,
    );

    return Promise.resolve();
};


