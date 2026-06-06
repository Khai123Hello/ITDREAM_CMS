import React from 'react';
import { Tooltip } from 'antd';
import { defineMessages, useIntl } from 'react-intl';

const message = defineMessages({
    edit: {
        id: 'components.common.form.baseTooltip.edit',
        defaultMessage: 'Sửa {objectName}',
    },
    delete: {
        id: 'components.common.form.baseTooltip.delete',
        defaultMessage: 'Xoá {objectName}',
    },
});

export const BaseTooltip = ({
    placement = 'bottom',
    type,
    objectName = '',
    title,
    toLowerCase = true,
    children,
    ...props
}) => {
    const intl = useIntl();
    if (toLowerCase) {
        objectName = objectName.toLowerCase();
    }
    const titleMapping = {
        edit: intl.formatMessage(message.edit, { objectName: objectName }),
        delete: intl.formatMessage(message.delete, { objectName: objectName }),
    };

    title = titleMapping[type] || title;
    return (
        <Tooltip placement={placement} title={title} {...props}>
            {children}
        </Tooltip>
    );
};
