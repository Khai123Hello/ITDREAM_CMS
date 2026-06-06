import React from 'react';
import { Layout, Menu, Avatar, Space } from 'antd';
import {
    DownOutlined,
    UserOutlined,
    LoginOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    TranslationOutlined,
} from '@ant-design/icons';
const { Header } = Layout;

import styles from './AppHeader.module.scss';
import useAuth from '@hooks/useAuth';
import { useDispatch } from 'react-redux';
import { accountActions, appActions } from '@store/actions';
import useFetch from '@hooks/useFetch';
import apiConfig from '@constants/apiConfig';
import { removeCacheToken } from '@services/userService';
import { useNavigate } from 'react-router-dom';
import { AppConstants } from '@constants';
import { defineMessages } from 'react-intl';
import useTranslate from '@hooks/useTranslate';
import useLocale from '@hooks/useLocale';

const message = defineMessages({
    profile: 'Profile',
    logout: 'Logout',
    locale: '{locale, select, en {Vietnamese} other {English}}',
});

const AppHeader = ({ collapsed, onCollapse }) => {
    const { locale } = useLocale();
    const { profile } = useAuth();

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { execute: executeLogout } = useFetch(apiConfig.account.logout);
    const translate = useTranslate();

    const handleChangeLocale = () => {
        dispatch(appActions.changeLanguage(locale === 'en' ? 'vi' : 'en'));
    };

    const onLogout = () => {
        removeCacheToken();
        dispatch(accountActions.logout());
    };

    return (
        <Header className={styles.appHeader} style={{ padding: 0, background: 'white' }}>
            <span className={styles.iconCollapse} onClick={onCollapse}>
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </span>
            <Menu
                mode="horizontal"
                className={styles.rightMenu}
                selectedKeys={[]}
                items={[
                    {
                        key: 'menu',
                        label: (
                            <Space>
                                <Avatar
                                    icon={<UserOutlined />}
                                    src={profile.avatar && `${AppConstants.contentRootUrl}${profile.avatar}`}
                                />
                                {profile?.fullName}
                                <DownOutlined />
                            </Space>
                        ),
                        children: [
                            {
                                label: translate.formatMessage(message.profile),
                                icon: <UserOutlined />,
                                key: 'profile',
                                onClick: () => navigate('/profile'),
                            },
                            {
                                label: translate.formatMessage(message.locale, { locale }),
                                key: 'locale',
                                icon: <TranslationOutlined />,
                                onClick: handleChangeLocale,
                            },
                            {
                                label: translate.formatMessage(message.logout),
                                icon: <LoginOutlined />,
                                key: 'logout',
                                onClick: onLogout,
                            },
                        ],
                    },
                ]}
            />
        </Header>
    );
};

export default AppHeader;
