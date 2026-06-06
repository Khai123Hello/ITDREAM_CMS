import { commonMessage } from '@locales/intl';
import { notification } from 'antd';

const showSucsessMessage = (content, translate) => {
    const message = translate?.formatMessage 
        ? translate.formatMessage(commonMessage.success) 
        : translate?.t?.(`${translate.ns}:success`, 'Success') || 'Success';
    
    notification.success({
        message: message,
        description: content,
    });
};

const showErrorMessage = (content, translate) => {
    const message = translate?.formatMessage 
        ? translate.formatMessage(commonMessage.error) 
        : translate?.t?.(`${translate.ns}:error`, 'Lỗi') || 'Lỗi';
    
    notification.error({
        message: message,
        description: content,
    });
};

const showWarningMessage = (content, translate) => {
    const message = translate?.formatMessage 
        ? translate.formatMessage(commonMessage.warning) 
        : translate?.t?.(`${translate.ns}:error`, 'Error Message') || 'Warning';
    
    notification.warning({
        message: message,
        description: content,
    });
};

export { showErrorMessage, showWarningMessage, showSucsessMessage };