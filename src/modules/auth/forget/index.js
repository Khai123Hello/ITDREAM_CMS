import React, { useState } from 'react';
import { Form, Button, Input, message as antMessage, Steps } from 'antd';
import { MailOutlined, LockOutlined, SafetyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useFetch from '@hooks/useFetch';
import apiConfig from '@constants/apiConfig';
import usePasswordValidation from '@hooks/usePasswordValidation';
import styles from './index.module.scss';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [idHash, setIdHash] = useState('');

    const [form] = Form.useForm();

    const { passwordRules } = usePasswordValidation(8);

    const { execute: requestForgetPassword, loading: requestLoading } = useFetch(
        apiConfig.account.requestForgetPassword,
    );

    const { execute: resetPassword, loading: resetLoading } = useFetch(apiConfig.account.forgetPassword);

    const onRequestReset = (values) => {
        requestForgetPassword({
            data: { email: values.email },
            onCompleted: (res) => {
                setIdHash(res.data?.idHash || res.idHash);
                antMessage.success('Mã OTP đã được gửi đến email của bạn!');
                setCurrentStep(1);
            },
            onError: (error) => {
                antMessage.error(error.message || 'Gửi mã OTP thất bại!');
            },
        });
    };

    const onResetPassword = (values) => {
        resetPassword({
            data: {
                idHash: idHash,
                otp: values.otp,
                newPassword: values.newPassword,
            },
            onCompleted: () => {
                antMessage.success('Đặt lại mật khẩu thành công!');
                setTimeout(() => {
                    navigate('/login');
                }, 1500);
            },
            onError: (error) => {
                antMessage.error(error.message || 'Đặt lại mật khẩu thất bại!');
            },
        });
    };


    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                {/* LEFT PANEL */}
                <div className={styles.left}>
                    <div className={styles.leftContent}>
                        <h2>Khôi phục mật khẩu</h2>
                        <p>Đừng lo, chúng tôi sẽ giúp bạn lấy lại tài khoản</p>
                        <img src="/images/element/02.svg" alt="Illustration" className={styles.illustration} />
                    </div>
                </div>

                {/* RIGHT FORM */}
                <div className={styles.right}>
                    <div className={styles.formBox}>
                        <div className={styles.icon}>🔐</div>
                        <h2>Quên mật khẩu?</h2>

                        <p className={styles.subtitle}>
                            {currentStep === 0 ? 'Nhập email để nhận mã OTP' : 'Nhập mã OTP và mật khẩu mới'}
                        </p>

                        <Steps
                            current={currentStep}
                            className={styles.steps}
                            items={[{ title: 'Nhập Email' }, { title: 'Đặt lại mật khẩu' }]}
                        />

                        {/* STEP 1 — EMAIL */}
                        {currentStep === 0 ? (
                            <Form layout="vertical" onFinish={onRequestReset} className={styles.form}>
                                <Form.Item
                                    name="email"
                                    label="Email"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập email!' },
                                        { type: 'email', message: 'Email không hợp lệ!' },
                                    ]}
                                >
                                    <Input
                                        size="large"
                                        prefix={<MailOutlined className={styles.inputIcon} />}
                                        placeholder="Nhập email của bạn"
                                    />
                                </Form.Item>

                                <Form.Item>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        size="large"
                                        block
                                        loading={requestLoading}
                                    >
                                        Gửi mã OTP
                                    </Button>
                                </Form.Item>
                            </Form>
                        ) : (
                            /* STEP 2 — OTP + NEW PASSWORD */
                            <Form layout="vertical" onFinish={onResetPassword} className={styles.form} form={form}>
                                <Form.Item
                                    name="otp"
                                    label="Mã OTP"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập mã OTP!' },
                                        { len: 6, message: 'OTP phải gồm 6 số!' },
                                    ]}
                                >
                                    <Input
                                        size="large"
                                        prefix={<SafetyOutlined className={styles.inputIcon} />}
                                        placeholder="Nhập mã OTP"
                                        maxLength={6}
                                    />
                                </Form.Item>

                                <Form.Item name="newPassword" label="Mật khẩu mới" rules={passwordRules}>
                                    <Input.Password
                                        size="large"
                                        prefix={<LockOutlined className={styles.inputIcon} />}
                                        placeholder="Nhập mật khẩu mới"
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="confirmPassword"
                                    label="Xác nhận mật khẩu"
                                    dependencies={['newPassword']}
                                    rules={[
                                        { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || getFieldValue('newPassword') === value) {
                                                    return Promise.resolve();
                                                }
                                                return Promise.reject(new Error('Mật khẩu không khớp!'));
                                            },
                                        }),
                                    ]}
                                >
                                    <Input.Password
                                        size="large"
                                        prefix={<LockOutlined className={styles.inputIcon} />}
                                        placeholder="Nhập lại mật khẩu"
                                    />
                                </Form.Item>

                                <Form.Item>
                                    <Button type="primary" htmlType="submit" size="large" block loading={resetLoading}>
                                        Đặt lại mật khẩu
                                    </Button>
                                </Form.Item>
                            </Form>
                        )}

                        <div className={styles.backToLogin}>
                            <a href="/login">← Quay lại đăng nhập</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
