import React, { useState } from 'react';
import { Layout, Button, Menu, Drawer, Space, Avatar, Dropdown } from 'antd';
import {
    MenuOutlined,
    CloseOutlined,
    UserOutlined,
    DownOutlined,
    LoginOutlined,
    TranslationOutlined,
    DashboardOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styles from './PublicHeader.module.scss';
import useAuth from '@hooks/useAuth';
import { useDispatch } from 'react-redux';
import { accountActions, appActions } from '@store/actions';
import { removeCacheToken } from '@services/userService';
import { AppConstants } from '@constants';
import useLocale from '@hooks/useLocale';

/**
 * PublicHeader Component
 * Features:
 * - Logo ITDream (left)
 * - Navigation menu (Simulations)
 * - Sign In / Sign Up buttons or Profile Dropdown (right)
 * - Mobile responsive drawer menu
 */

const { Header } = Layout;

const PublicHeader = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { locale } = useLocale();
    const { isAuthenticated, profile } = useAuth();

    const handleSignIn = () => {
        navigate('/login');
    };

    const handleSignUp = () => {
        navigate('/register');
    };

    const handleSimulations = () => {
        // Scroll to simulations section or navigate
        const element = document.getElementById('simulations-section');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleChangeLocale = () => {
        dispatch(appActions.changeLanguage(locale === 'en' ? 'vi' : 'en'));
    };

    const onLogout = () => {
        removeCacheToken();
        dispatch(accountActions.logout());
        navigate('/');
    };

    return (
        <>
            <Header className={styles.publicHeader}>
                <div className={styles.headerContainer}>
                    {/* Logo */}
                    <div className={styles.logo}>
                        <a href="/" className={styles.logoLink}>
                            <div className={styles.logoBrand}>
                                <span className={styles.brandName}>ITDream</span>
                            </div>
                        </a>
                    </div>

                    {/* Desktop Navigation */}
                    <div className={styles.desktopNav}>
                        <Menu mode="horizontal" className={styles.navMenu} selectedKeys={[]}>
                            <Menu.Item key="simulations" onClick={handleSimulations}>
                                <span className={styles.navItem}>Bài mô phỏng</span>
                            </Menu.Item>
                        </Menu>
                    </div>

                    {/* Desktop Buttons or Profile */}
                    <div className={styles.desktopButtons}>
                        {isAuthenticated ? (
                            <Space size="middle">
                                <Button
                                    type="text"
                                    onClick={() => navigate('/dashboard')}
                                    className={styles.signInBtn}
                                    icon={<DashboardOutlined />}
                                >
                                    Dashboard
                                </Button>
                                <Dropdown
                                    menu={{
                                        items: [
                                            {
                                                label: 'Hồ sơ',
                                                icon: <UserOutlined />,
                                                key: 'profile',
                                                onClick: () => navigate('/profile'),
                                            },
                                            {
                                                label: locale === 'en' ? 'Tiếng Việt' : 'Tiếng Anh',
                                                key: 'locale',
                                                icon: <TranslationOutlined />,
                                                onClick: handleChangeLocale,
                                            },
                                            {
                                                label: 'Đăng xuất',
                                                icon: <LoginOutlined />,
                                                key: 'logout',
                                                onClick: onLogout,
                                            },
                                        ],
                                    }}
                                    trigger={['click']}
                                >
                                    <Space style={{ cursor: 'pointer' }}>
                                        <Avatar
                                            icon={<UserOutlined />}
                                            src={profile?.avatar && `${AppConstants.contentRootUrl}${profile.avatar}`}
                                        />
                                        <span style={{ fontWeight: 500, color: '#333' }}>{profile?.fullName}</span>
                                        <DownOutlined />
                                    </Space>
                                </Dropdown>
                            </Space>
                        ) : (
                            <Space size="middle">
                                <Button type="text" onClick={handleSignIn} className={styles.signInBtn}>
                                    Đăng nhập
                                </Button>
                                <Button type="primary" onClick={handleSignUp} className={styles.signUpBtn}>
                                    Đăng ký
                                </Button>
                            </Space>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className={styles.mobileMenuBtn}>
                        <Button type="text" icon={<MenuOutlined size={24} />} onClick={() => setMobileMenuOpen(true)} />
                    </div>
                </div>
            </Header>

            {/* Mobile Menu Drawer */}
            <Drawer
                placement="right"
                onClose={() => setMobileMenuOpen(false)}
                open={mobileMenuOpen}
                closeIcon={<CloseOutlined />}
                className={styles.mobileDrawer}
            >
                <div className={styles.mobileMenu}>
                    <Menu mode="vertical">
                        <Menu.Item
                            key="simulations-mobile"
                            onClick={() => {
                                handleSimulations();
                                setMobileMenuOpen(false);
                            }}
                        >
                            Bài mô phỏng
                        </Menu.Item>
                    </Menu>

                    {isAuthenticated ? (
                        <div className={styles.mobileButtons}>
                            <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                <Avatar
                                    size={64}
                                    icon={<UserOutlined />}
                                    src={profile?.avatar && `${AppConstants.contentRootUrl}${profile.avatar}`}
                                    style={{ marginBottom: 8 }}
                                />
                                <h4 style={{ margin: 0, color: '#333' }}>{profile?.fullName}</h4>
                            </div>
                            <Button
                                type="primary"
                                block
                                onClick={() => {
                                    navigate('/dashboard');
                                    setMobileMenuOpen(false);
                                }}
                                className={styles.signUpBtnMobile}
                                style={{ marginBottom: 8 }}
                                icon={<DashboardOutlined />}
                            >
                                Vào Dashboard
                            </Button>
                            <Button
                                type="default"
                                block
                                onClick={() => {
                                    navigate('/profile');
                                    setMobileMenuOpen(false);
                                }}
                                style={{ marginBottom: 8 }}
                                icon={<UserOutlined />}
                            >
                                Hồ sơ cá nhân
                            </Button>
                            <Button
                                type="text"
                                danger
                                block
                                onClick={() => {
                                    onLogout();
                                    setMobileMenuOpen(false);
                                }}
                                icon={<LoginOutlined />}
                            >
                                Đăng xuất
                            </Button>
                        </div>
                    ) : (
                        <div className={styles.mobileButtons}>
                            <Button
                                type="text"
                                block
                                onClick={() => {
                                    handleSignIn();
                                    setMobileMenuOpen(false);
                                }}
                                className={styles.signInBtnMobile}
                            >
                                Đăng nhập
                            </Button>
                            <Button
                                type="primary"
                                block
                                onClick={() => {
                                    handleSignUp();
                                    setMobileMenuOpen(false);
                                }}
                                className={styles.signUpBtnMobile}
                            >
                                Đăng ký
                            </Button>
                        </div>
                    )}
                </div>
            </Drawer>
        </>
    );
};

export default PublicHeader;
