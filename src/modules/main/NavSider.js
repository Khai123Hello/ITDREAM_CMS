import logo from '@assets/images/logo.png';

import { Layout, Menu } from 'antd';
import React, { useMemo } from 'react';

import useAuth from '@hooks/useAuth';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import styles from './NavSider.module.scss';
import useValidatePermission from '@hooks/useValidatePermission';
import { navMenuConfig } from '@constants/menuConfig';
const { Sider } = Layout;

const NavSider = ({ collapsed, onCollapse, width }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const validatePermission = useValidatePermission();
    const { profile } = useAuth();

    const activeNav = useMemo(() => {
        const activeNav = findActiveNav(navMenuConfig);

        if (activeNav) {
            return activeNav;
        }

        return {
            selectedKeys: [],
            openKeys: [],
        };
    }, [location.pathname, location.search]);

    function makeNavs(navs) {
        return navs.map((nav) => {
            const newNav = { ...nav };
            if (newNav.permission || newNav.kind) {
                if (!validatePermission(newNav.permission, newNav.kind, newNav.excludeKind, newNav.onValidate)) {
                    return null;
                }
            }

            if (newNav.children) {
                newNav.children = makeNavs(nav.children);
                if (newNav.children.every((item) => item === null)) {
                    return null;
                }
            }

            return newNav;
        });
    }

    function handleMenuItemClick(item) {
        let selectedNav;
        navMenuConfig.map((navItem) => {
            if (navItem.key === item.key) selectedNav = navItem;
            else if (navItem.children) {
                navItem.children.map((navChild) => {
                    if (navChild.key === item.key) selectedNav = navChild;
                });
            }
        });

        navigate(selectedNav?.path);
    }

    function findActiveNav(navs) {
        let matchedFallback = null;
        for (const nav of navs) {
            if (nav.children) {
                const activeItem = findActiveNav(nav.children);
                if (activeItem) {
                    return {
                        selectedKeys: activeItem.selectedKeys,
                        openKeys: [nav.key, ...activeItem.openKeys],
                    };
                }
            } else if (nav.path) {
                const [navPathname, navSearch] = nav.path.split('?');
                if (matchPath(navPathname + '/*', location.pathname)) {
                    if (navSearch) {
                        const currentParams = new URLSearchParams(location.search);
                        const navParams = new URLSearchParams(navSearch);
                        let isQueryMatch = true;
                        for (const [key, value] of navParams.entries()) {
                            if (currentParams.get(key) !== value) {
                                isQueryMatch = false;
                                break;
                            }
                        }
                        if (isQueryMatch) {
                            return {
                                selectedKeys: [nav.key],
                                openKeys: [],
                            };
                        }
                    } else {
                        matchedFallback = {
                            selectedKeys: [nav.key],
                            openKeys: [],
                        };
                    }
                }
            }
        }

        return matchedFallback;
    }

    return (
        <Sider
            className={'app-sider ' + styles.sidebar}
            collapsible
            collapsed={collapsed}
            width={width}
            onCollapse={onCollapse}
            trigger={null}
        >
            <div data-collapsed={collapsed} className={styles.logo} style={{ width: '100%' }}>
                <img src={logo} alt="Mira" />
            </div>
            <Menu
                key={location.pathname == '/' ? 'initial' : 'navSider'}
                theme="dark"
                mode="inline"
                className={styles.menu}
                defaultSelectedKeys={activeNav.selectedKeys}
                defaultOpenKeys={activeNav.openKeys}
                selectedKeys={activeNav.selectedKeys}
                items={makeNavs(navMenuConfig)}
                onSelect={(item) => handleMenuItemClick(item)}
            />
        </Sider>
    );
};

export default NavSider;
