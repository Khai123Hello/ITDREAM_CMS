import React, { useState } from 'react';
import { Form, Button, Input, message as antMessage, DatePicker, Select, Row, Col } from 'antd';
import useFetch from '@hooks/useFetch';
import apiConfig from '@constants/apiConfig';
import { DEFAULT_FORMAT } from '@constants';
import {
    LockOutlined,
    MailOutlined,
    UserOutlined,
    PhoneOutlined,
    CalendarOutlined,
    BankOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import styles from './index.module.scss';
import { useNavigate } from 'react-router-dom';
import useRegisterEducator from '@hooks/useRegisterEducator';
import useRegisterStudent from '@hooks/useRegisterStudent';
import useVerifyOtpEducator from '@hooks/useVerifyOtpEducator';

const RegisterPage = () => {
    const role = 'educator'; // always educator now
    const [orgOptions, setOrgOptions] = useState([]);
    const [orgLoading, setOrgLoading] = useState(false);
    const [form] = Form.useForm();
    const [otpForm] = Form.useForm();
    const [step, setStep] = useState('register');
    const [email, setEmail] = useState('');
    const [idHash, setIdHash] = useState('');
    const navigate = useNavigate();

    const {
        data: orgData,
        loading: orgFetching,
        error: orgError,
        execute: fetchOrgs,
    } = useFetch(apiConfig.organization.guestList);

    const { register: registerEducator, loading: educatorRegistering } = useRegisterEducator();
    const { register: registerStudent, loading: studentRegistering } = useRegisterStudent();
    const { verifyOtp, loading: verifying } = useVerifyOtpEducator();
    const { execute: executeResendVerify, loading: resendingOtp } = useFetch(apiConfig.account.resendVerify);

    // Fetch organization list on mount
    React.useEffect(() => {
        if (role === 'educator') {
            setOrgLoading(true);
            fetchOrgs({
                onCompleted: (res) => {
                    if (res && res.data && Array.isArray(res.data.content)) {
                        setOrgOptions(res.data.content);
                    } else {
                        setOrgOptions([]);
                    }
                    setOrgLoading(false);
                },
                onError: () => {
                    setOrgOptions([]);
                    setOrgLoading(false);
                },
            });
        }
    }, [role, fetchOrgs]);

    const onRegisterFinish = (values) => {
        const formattedBirthday = dayjs(values.birthday).format(DEFAULT_FORMAT);
        const payload = {
            fullName: values.fullName,
            username: values.username,
            email: values.email,
            password: values.password,
            phone: values.phone,
            birthday: formattedBirthday,
            organizationId: values.organizationId,
        };

        const afterRegisterSuccess = (res) => {
            antMessage.success(res?.message || 'Đăng ký thành công!');
            setEmail(values.email);
            setIdHash(res?.data?.idHash);
            setStep('otp');
        };
        const afterRegisterError = (err) => {
            const errMsg = err?.response?.data?.message || err?.message || 'Đăng ký thất bại!';
            antMessage.error(errMsg);
        };

        registerEducator(payload, afterRegisterSuccess, afterRegisterError);
    };

    const onOtpFinish = (values) => {
        const payload = {
            idHash,
            otp: values.otp,
        };

        verifyOtp(
            payload,
            () => {
                antMessage.success('Xác thực OTP thành công!');
                navigate('/login');
            },
            (err) => {
                const errMsg = err?.response?.data?.message || err?.message || 'Xác thực OTP thất bại!';
                antMessage.error(errMsg);
            },
        );
    };

    const handleResendVerify = () => {
        if (!email) {
            antMessage.error('Không tìm thấy địa chỉ email!');
            return;
        }
        executeResendVerify({
            data: { email },
            onCompleted: (res) => {
                if (res?.result === true) {
                    antMessage.success(res?.message || 'Gửi lại mã OTP thành công!');
                    if (res?.data?.idHash) {
                        setIdHash(res.data.idHash);
                    }
                } else {
                    antMessage.error(res?.message || 'Gửi lại mã OTP thất bại!');
                }
            },
            onError: (err) => {
                const errMsg = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi gửi lại mã OTP!';
                antMessage.error(errMsg);
            },
        });
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                {/* Left Section */}
                <div className={styles.left}>
                    <div className={styles.leftContent}>
                        <h2>Chào mừng đến với cộng đồng lớn nhất của chúng tôi</h2>
                        <p>Công cụ tối ưu dành cho nhà giáo dục!</p>
                        <img src="/images/element/02.svg" alt="Illustration" className={styles.illustration} />
                        <div className={styles.students}>
                            <img src="/images/avatar/01.jpg" alt="avatar" className={styles.avatar} />
                            <img src="/images/avatar/02.jpg" alt="avatar" className={styles.avatar} />
                            <img src="/images/avatar/03.jpg" alt="avatar" className={styles.avatar} />
                            <img src="/images/avatar/04.jpg" alt="avatar" className={styles.avatar} />
                            <p>Hơn 100 tổ chức giáo dục và giảng viên đã tham gia tạo bài mô phỏng.</p>
                        </div>
                    </div>
                </div>

                {/* Right Section */}
                <div className={styles.right}>
                    <div className={styles.formBox}>
                        <img src="/images/element/03.svg" className={styles.waveIcon} alt="icon" />

                        {step === 'register' ? (
                            <>
                                <div className={styles.formHeader}>
                                    <h2>Đăng ký tài khoản Educator!</h2>
                                    <p>Rất vui được gặp bạn! Vui lòng đăng ký tài khoản.</p>
                                </div>

                                <Form layout="vertical" form={form} onFinish={onRegisterFinish} requiredMark={false}>
                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                name="fullName"
                                                label="Họ và tên"
                                                rules={[
                                                    { required: true, message: 'Vui lòng nhập họ và tên' },
                                                    { min: 2, message: 'Họ tên phải có ít nhất 2 ký tự' },
                                                ]}
                                            >
                                                <Input
                                                    size="large"
                                                    prefix={<UserOutlined className={styles.inputIcon} />}
                                                    placeholder="Nguyễn Văn A"
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                name="username"
                                                label="Tên đăng nhập"
                                                rules={[
                                                    { required: true, message: 'Vui lòng nhập tên đăng nhập' },
                                                    { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự' },
                                                ]}
                                            >
                                                <Input
                                                    size="large"
                                                    prefix={<UserOutlined className={styles.inputIcon} />}
                                                    placeholder="nguyenvana"
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                name="email"
                                                label="Địa chỉ email"
                                                rules={[
                                                    { required: true, message: 'Vui lòng nhập email' },
                                                    { type: 'email', message: 'Vui lòng nhập email hợp lệ' },
                                                ]}
                                            >
                                                <Input
                                                    size="large"
                                                    prefix={<MailOutlined className={styles.inputIcon} />}
                                                    placeholder="example@email.com"
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                name="phone"
                                                label="Số điện thoại"
                                                rules={[
                                                    { required: true, message: 'Vui lòng nhập số điện thoại' },
                                                    {
                                                        pattern: /^[0-9]{10,11}$/,
                                                        message: 'Vui lòng nhập số điện thoại hợp lệ',
                                                    },
                                                ]}
                                            >
                                                <Input
                                                    size="large"
                                                    prefix={<PhoneOutlined className={styles.inputIcon} />}
                                                    placeholder="0987654321"
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                name="birthday"
                                                label="Ngày sinh"
                                                rules={[{ required: true, message: 'Vui lòng chọn ngày sinh' }]}
                                            >
                                                <DatePicker
                                                    size="large"
                                                    style={{ width: '100%' }}
                                                    format="DD/MM/YYYY"
                                                    placeholder="Chọn ngày sinh"
                                                    suffixIcon={<CalendarOutlined className={styles.inputIcon} />}
                                                    disabledDate={(current) =>
                                                        current && current > dayjs().endOf('day')
                                                    }
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                name="organizationId"
                                                label="Tổ chức/Doanh nghiệp"
                                                rules={[{ required: true, message: 'Vui lòng chọn tổ chức' }]}
                                            >
                                                <Select
                                                    showSearch
                                                    size="large"
                                                    placeholder="Chọn tổ chức hoặc doanh nghiệp"
                                                    optionFilterProp="children"
                                                    loading={orgLoading}
                                                    suffixIcon={<BankOutlined className={styles.inputIcon} />}
                                                    filterOption={(input, option) =>
                                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                                    }
                                                >
                                                    {orgOptions.map((org) => (
                                                        <Select.Option
                                                            value={org.id}
                                                            key={org.id}
                                                            label={org.shortName || org.name}
                                                        >
                                                            {org.shortName ? `${org.shortName} - ${org.name}` : org.name}
                                                        </Select.Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Row gutter={16}>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                name="password"
                                                label="Mật khẩu"
                                                rules={[
                                                    { required: true, message: 'Vui lòng nhập mật khẩu' },
                                                    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
                                                ]}
                                            >
                                                <Input.Password
                                                    size="large"
                                                    prefix={<LockOutlined className={styles.inputIcon} />}
                                                    placeholder="Nhập mật khẩu"
                                                />
                                            </Form.Item>
                                        </Col>
                                        <Col xs={24} md={12}>
                                            <Form.Item
                                                name="confirmPassword"
                                                label="Xác nhận mật khẩu"
                                                dependencies={['password']}
                                                rules={[
                                                    { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                                                    ({ getFieldValue }) => ({
                                                        validator(_, value) {
                                                            if (!value || getFieldValue('password') === value) {
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
                                                    placeholder="Xác nhận mật khẩu"
                                                />
                                            </Form.Item>
                                        </Col>
                                    </Row>

                                    <Form.Item className={styles.submitButton}>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            size="large"
                                            block
                                            loading={educatorRegistering}
                                        >
                                            Tạo tài khoản
                                        </Button>
                                    </Form.Item>
                                </Form>

                                <div className={styles.signInRedirect}>
                                    Đã có tài khoản? <a href="/login">Đăng nhập tại đây</a>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className={styles.formHeader}>
                                    <h2>Xác thực email của bạn</h2>
                                    <p>Chúng tôi đã gửi mã xác thực đến</p>
                                    <strong className={styles.emailDisplay}>{email}</strong>
                                </div>

                                <Form form={otpForm} onFinish={onOtpFinish} layout="vertical" requiredMark={false}>
                                    <Form.Item
                                        name="otp"
                                        label="Mã xác thực"
                                        rules={[
                                            { required: true, message: 'Vui lòng nhập mã xác thực' },
                                            { len: 6, message: 'Mã OTP phải có 6 chữ số' },
                                        ]}
                                    >
                                        <Input size="large" placeholder="Nhập mã 6 chữ số" maxLength={6} className={styles.otpInput} />
                                    </Form.Item>

                                    <Form.Item>
                                        <Button type="primary" htmlType="submit" size="large" block loading={verifying}>
                                            Xác thực email
                                        </Button>
                                    </Form.Item>

                                    <div className={styles.resendSection}>
                                        Không nhận được mã?{' '}
                                        <Button
                                            type="link"
                                            onClick={handleResendVerify}
                                            loading={resendingOtp}
                                            style={{ padding: 0, height: 'auto', lineHeight: 'inherit' }}
                                        >
                                            Gửi lại
                                        </Button>
                                    </div>
                                </Form>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
