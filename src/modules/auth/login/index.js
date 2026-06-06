import React, { useState } from 'react';
import { Form, Button, Input, message as antMessage, Segmented } from 'antd';
import { LockOutlined, MailOutlined, UserOutlined, GoogleOutlined, FacebookFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import apiConfig from '@constants/apiConfig';
import { setCacheAccessToken } from '@services/userService';
import { Buffer } from 'buffer';
import useFetch from '@hooks/useFetch';
import useFetchAction from '@hooks/useFetchAction';
import { accountActions } from '@store/actions';
import { setData } from '@utils/localStorage';
import { storageKeys, appAccount, UserTypes } from '@constants';
import styles from './index.module.scss';

window.Buffer = window.Buffer || Buffer;

const LoginPage = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [userType, setUserType] = useState(UserTypes.EDUCATOR);

    const base64Credentials = Buffer.from(`${appAccount.APP_USERNAME}:${appAccount.APP_PASSWORD}`).toString('base64');

    const loginOptions = {
        ...apiConfig.account.loginBasic,
        authorization: `Basic ${base64Credentials}`,
    };

    const { execute: loginEducator, loading: loadingEducator } = useFetch(loginOptions);
    const { execute: loginStudent, loading: loadingStudent } = useFetch(loginOptions);
    const { execute: loginAdmin, loading: loadingAdmin } = useFetch(loginOptions);
    const { execute: fetchEducatorProfile } = useFetch(apiConfig.educator.profile);
    const { execute: fetchStudentProfile } = useFetch(apiConfig.student.profile);
    const { execute: fetchProfile } = useFetchAction(accountActions.getProfile, {
        loading: useFetchAction.LOADING_TYPE.APP,
    });

    const loading = loadingEducator || loadingStudent || loadingAdmin;

    const onFinish = (values) => {
        const educatorPayload = {
            email: values.email,
            password: values.password,
            grant_type: 'educator',
        };

        const studentPayload = {
            email: values.email,
            password: values.password,
            grant_type: 'student',
        };

        const adminPayload = {
            username: values.username,
            password: values.password,
            grant_type: 'password',
        };

        const handleLoginSuccess = (res) => {
            setCacheAccessToken(res.access_token);
            setData(storageKeys.USER_KIND, res.user_kind);

            setData(storageKeys.USER_TYPE, userType);
            dispatch(accountActions.setUserType(userType));

            if (userType === UserTypes.EDUCATOR) {
                fetchEducatorProfile({
                    onCompleted: () => {
                        antMessage.success('Đăng nhập thành công!');
                        navigate('/dashboard');
                    },
                    onError: () => {
                        antMessage.error('Không thể tải thông tin Khoa chuyên môn!');
                    },
                });
            } else if (userType === UserTypes.STUDENT) {
                fetchStudentProfile({
                    onCompleted: () => {
                        antMessage.success('Đăng nhập thành công!');
                        navigate('/dashboard');
                    },
                    onError: () => {
                        antMessage.error('Không thể tải thông tin học viên!');
                    },
                });
            } else {
                fetchProfile({
                    onCompleted: () => {
                        antMessage.success('Đăng nhập thành công!');
                        navigate('/dashboard');
                    },
                    onError: () => {
                        antMessage.error('Không thể tải thông tin quản trị viên!');
                    },
                });
            }
        };

        if (userType === UserTypes.EDUCATOR) {
            loginEducator({
                data: educatorPayload,
                onCompleted: handleLoginSuccess,
                onError: () => {
                    antMessage.error(
                        'Đăng nhập thất bại! Thông tin không đúng hoặc Quản trị viên chưa kích hoạt tài khoản.',
                    );
                },
            });
        } else if (userType === UserTypes.STUDENT) {
            loginStudent({
                data: studentPayload,
                onCompleted: handleLoginSuccess,
                onError: () => {
                    antMessage.error('Đăng nhập thất bại!');
                },
            });
        } else {
            loginAdmin({
                data: adminPayload,
                onCompleted: handleLoginSuccess,
                onError: () => {
                    antMessage.error('Đăng nhập thất bại!');
                },
            });
        }
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.container}>
                {/* Left */}
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

                {/* Right */}
                <div className={styles.right}>
                    <div className={styles.formBox}>
                        <img src="/images/element/03.svg" className={styles.waveIcon} alt="icon" />

                        <div className={styles.formHeader}>
                            <h2>Đăng nhập vào ITDream!</h2>
                            <p>Rất vui được gặp bạn! Vui lòng đăng nhập với tài khoản của bạn.</p>
                        </div>

                        <Segmented
                            options={[
                                { label: 'Khoa chuyên môn', value: UserTypes.EDUCATOR },
                                { label: 'Quản trị', value: UserTypes.ADMIN },
                            ]}
                            value={userType}
                            onChange={setUserType}
                            style={{ marginBottom: 24, width: '100%' }}
                            block
                        />

                        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
                            {userType === UserTypes.ADMIN ? (
                                <Form.Item
                                    name="username"
                                    label="Tên đăng nhập"
                                    rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
                                >
                                    <Input
                                        size="large"
                                        prefix={<UserOutlined className={styles.inputIcon} />}
                                        placeholder="Tên đăng nhập"
                                    />
                                </Form.Item>
                            ) : (
                                <Form.Item
                                    name="email"
                                    label="Địa chỉ email"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập email!' },
                                        { type: 'email', message: 'Vui lòng nhập email hợp lệ!' },
                                    ]}
                                >
                                    <Input
                                        size="large"
                                        prefix={<MailOutlined className={styles.inputIcon} />}
                                        placeholder="example@email.com"
                                    />
                                </Form.Item>
                            )}

                            <Form.Item
                                name="password"
                                label="Mật khẩu"
                                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                            >
                                <Input.Password
                                    size="large"
                                    prefix={<LockOutlined className={styles.inputIcon} />}
                                    placeholder="Nhập mật khẩu"
                                />
                            </Form.Item>

                            <div className={styles.row}>
                                <span>Quên mật khẩu?</span>
                                <a href="/forgot-password" className={styles.forgotLink}>
                                    Nhấn vào đây để đặt lại mật khẩu
                                </a>
                            </div>

                            <Form.Item className={styles.submitButton}>
                                <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                                    Đăng nhập
                                </Button>
                            </Form.Item>
                        </Form>

                        <div className={styles.divider}>
                            <span>Hoặc tiếp tục với</span>
                        </div>

                        <div className={styles.socialButtons}>
                            <Button icon={<GoogleOutlined />} size="large" block className={styles.google}>
                                Google
                            </Button>
                            <Button icon={<FacebookFilled />} size="large" block className={styles.facebook}>
                                Facebook
                            </Button>
                        </div>

                        <div className={styles.signInRedirect}>
                            Chưa có tài khoản? <a href="/register">Đăng ký tại đây</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
