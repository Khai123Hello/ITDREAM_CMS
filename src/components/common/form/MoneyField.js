import { Form, InputNumber } from 'antd';
import React from 'react';
import useFormField from '@hooks/useFormField';
import { formatNumber } from '@utils';
import { useCurrency } from '../elements/Currency';

const NumericField = (props) => {
    const {
        label,
        name,
        disabled,
        min,
        max,
        width,
        onChange,
        onBlur,
        formatter,
        parser,
        className,
        defaultValue,
        required,
        isCurrency,
        addonAfter,
    } = props;
    const currency = useCurrency();

    const fieldParser = (value) => {
        return value.replace(/\$\s?|(,*)/g, '');
    };

    const fieldFormatter = (value) => {
        if (!isCurrency) return value;
        return currency.format(value, '');
    };

    const { rules, placeholder } = useFormField(props);

    return (
        <Form.Item required={required} label={label} name={name} rules={rules} className={className}>
            <InputNumber
                addonAfter={isCurrency ? currency.symbol : addonAfter}
                placeholder={placeholder}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                max={max}
                min={min}
                disabled={disabled}
                style={{ width: width || '100%' }}
                parser={parser || fieldParser}
                onChange={onChange}
                onBlur={onBlur}
                defaultValue={defaultValue}
                {...props}
            />
        </Form.Item>
    );
};

export default NumericField;
