/**
 * src/modules/auth/routes.js - CẬP NHẬT
 * 
 * Cách dùng layout trong route config:
 * layout: 'auth' - dùng AuthLayout
 */

import RegisterPage from "@modules/auth/register";
import LoginPage from "@modules/auth/login";
import ForgotPasswordPage from "./forget";

export default {
    registerPage: {
        path: '/register',
        title: 'Register',
        auth: false,
        component: RegisterPage,
        layout: 'auth', // ← Chỉ định dùng AuthLayout
    },
    loginPage: {
        path: '/login',
        component: LoginPage,
        auth: false,
        title: 'Login page',
        layout: 'auth', // ← Chỉ định dùng AuthLayout
    },
    FogetPage: {
        path: '/forgot-password',
        component: ForgotPasswordPage,
        auth: false,
        title: 'Forgot Password',
        layout: 'auth', // ← Chỉ định dùng AuthLayout
    },
};
