// GenericModal.js
import React from 'react';
import { Modal } from 'antd';
import useTranslate from '@hooks/useTranslate';
import AvatarField from '@components/common/form/AvatarField';
import { UserOutlined } from '@ant-design/icons';
import { AppConstants } from '@constants';
import { modalMessages } from '../../../constants/modalMessages';

const getNestedValue = (obj, key) => {
    return key.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const GenericModal = ({ visible, onClose, titleMessage, sections, record }) => {
    const translate = useTranslate();

    return (
        <Modal
            visible={visible}
            title={translate.formatMessage(titleMessage)}
            footer={null}
            onCancel={onClose}
            bodyStyle={{ maxHeight: '70vh', overflowY: 'auto' }}
        >
            {record ? (
                sections.map((section, index) => (
                    <fieldset key={index} style={{ marginBottom: '1rem' }}>
                        <legend>{translate.formatMessage(section.titleMessage)}</legend>
                        {section.header && section.header(record)}
                        {section.fields ? (
                            section.fields.map((field, fieldIndex) => (
                                <p key={fieldIndex}>
                                    {field.labelMessage && (
                                        <strong>{translate.formatMessage(field.labelMessage)}: </strong>
                                    )}
                                    {field.render
                                        ? field.render(record)
                                        : (() => {
                                            const value = getNestedValue(record, field.dataKey);
                                            const displayValue = field.formatter
                                                ? field.formatter(value)
                                                : value;
                                            return (
                                                displayValue ||
                                          translate.formatMessage(
                                              field.defaultMessage || modalMessages.noInfo,
                                          )
                                            );
                                        })()}
                                </p>
                            ))
                        ) : (
                            section.render && section.render(record)
                        )}
                    </fieldset>
                ))
            ) : null}
        </Modal>
    );
};

export default GenericModal;
