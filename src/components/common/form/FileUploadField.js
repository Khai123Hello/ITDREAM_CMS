import { Button, Form, Upload } from 'antd';
import React from 'react';
import { UploadOutlined } from '@ant-design/icons';
import useFormField from '@hooks/useFormField';

const FileUploadField = (props) => {
    const { label, fileList, disabled, fieldName, accept, onChange, beforeUpload, t } = props;

    const uploadFile = ({ file, onSuccess }) => {
        const { uploadFile } = this.props;
        if (uploadFile) {
            uploadFile(file, onSuccess);
        } else {
            setTimeout(() => {
                onSuccess('ok');
            }, 0);
        }
    };

    const { rules } = useFormField(props);

    return (
        <Form.Item label={label} name={fieldName} rules={rules} valuePropName={fieldName}>
            <Upload
                fileList={fileList}
                disabled={disabled}
                accept={accept}
                customRequest={uploadFile}
                beforeUpload={beforeUpload}
                onChange={onChange}
                showUploadList={true}
            >
                <Button>
                    <UploadOutlined />
                </Button>
            </Upload>
        </Form.Item>
    );
};

export default FileUploadField;
