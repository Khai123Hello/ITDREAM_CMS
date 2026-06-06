import React, { useState, useMemo, useEffect } from 'react';
import { Form, ColorPicker } from 'antd';
import useFormField from '@hooks/useFormField';

const DEFAULT_COLOR = '#1677ff';

const ColorPickerFieldV1 = ({
    color,
    key,
    label = '',
    name = '',
    size,
    allowClear = false,
    disabled,
    onChange,
    format = 'hex',
    showText = true,
    formItemProps,
    fieldProps,
    style,
    ...props
}) => {
    const { rules } = useFormField(props);
    const [selectedColor, setSelectedColor] = useState(null);
    useEffect(() => {
        setSelectedColor(color || DEFAULT_COLOR);
    }, [color]);
    const colorBoxStyle = {
        backgroundColor: selectedColor,
        height: '30px',
        width: '100%',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: '0.3s',
        ...style,
    };

    return (
        <Form.Item key={key} {...formItemProps} label={label} name={name} rules={rules}>
            <ColorPicker
                {...fieldProps}
                size={size}
                disabled={disabled}
                allowClear={allowClear}
                format={format}
                showText={showText}
                value={selectedColor}
                onChange={(value, hex) => {
                    setSelectedColor(hex);
                    onChange?.(value, hex);
                }}
            >
                <div style={colorBoxStyle} />
            </ColorPicker>
        </Form.Item>
    );
};

export default ColorPickerFieldV1;
