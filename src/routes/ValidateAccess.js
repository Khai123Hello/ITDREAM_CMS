import React from 'react';

import { accessRouteTypeEnum } from '@constants';
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';

import PublicLayout from '@modules/main/PublicLayout';
import MainLayout from '@modules/main/MainLayout';
import { getLayout } from '@modules/main/layoutRegistry';
import HasPermission from '@components/common/elements/HasPermission';
import PageUnauthorized from '@components/common/page/unauthorized';
import { navMenuConfig } from '@constants/menuConfig';
import useValidatePermission from '@hooks/useValidatePermission';
const ValidateAccess = ({
    authRequire,
    component: Component,
    componentProps,
    isAuthenticated,
    profile,
    layout,
    permissions: routePermissions,
    onValidatePermissions,
    path,
    separate,
    pageOptions,
}) => {
    const location = useLocation();
    const { id } = useParams();
    const validatePermission = useValidatePermission();
    function getInitRoute(navs) {
        return navs.map((nav) => {
            const newNav = { ...nav };
            if (newNav.permission || newNav.kind) {
                if (!validatePermission(newNav.permission, newNav.kind, newNav.excludeKind, newNav.onValidate)) {
                    return null;
                }
            }

            if (newNav.children) {
                newNav.children = getInitRoute(nav.children);
                if (newNav.children.every((item) => item === null)) {
                    return null;
                }
            }

            return newNav;
        });
    }
    const getRedirect = (authRequire) => {
        const routes = require('.').default;

        if (authRequire === accessRouteTypeEnum.NOT_LOGIN && isAuthenticated) {
            const initRoutes = getInitRoute(navMenuConfig);
            if (initRoutes?.length > 0) {
                try {
                    return initRoutes.filter(Boolean)[0].children.filter(Boolean)[0].path;
                } catch (error) {
                    return routes.homePage.path;
                }
            }

            return routes.homePage.path;
        }

        if (authRequire === accessRouteTypeEnum.REQUIRE_LOGIN && !isAuthenticated) {
            return routes.loginPage.path;
        }

        // check permistion

        return false;
    };

    const redirect = getRedirect(authRequire);

    if (redirect) {
        return <Navigate state={{ from: location }} key={redirect} to={redirect} replace />;
    }

    // currently, only support custom layout for authRequire route
    // Nếu route có chỉ định layout, dùng getLayout('layoutName')
    // Nếu không chỉ định, dùng MainLayout (authRequire = true) hoặc PublicLayout (authRequire = false/null)
    const Layout = authRequire ? (layout ? getLayout(layout) : MainLayout) : PublicLayout;
    return (
        <Layout>
            <HasPermission
                onValidate={onValidatePermissions}
                requiredPermissions={routePermissions}
                path={{ name: path, type: id === 'create' ? 'create' : 'update' }}
                separate={separate}
                fallback={<PageUnauthorized />}
            >
                <Component pageOptions={pageOptions} {...(componentProps || {})}>
                    <Outlet />
                </Component>
            </HasPermission>
        </Layout>
    );
};

export default ValidateAccess;
