import RegisterPage from "@modules/auth/register";
import LoginPage from "@modules/auth/login";
import ForgotPasswordPage from "./forget";

export default {
    registerPage: {
        path: '/register',
        title: 'Register',
        auth: false,
        component: RegisterPage,
        layout: 'auth',
    },
    loginPage: {
        path: '/login',
        component: LoginPage,
        auth: false,
        title: 'Login page',
        layout: 'auth',
    },
    FogetPage: {
        path: '/forgot-password',
        component: ForgotPasswordPage,
        auth: false,
        title: 'Forgot Password',
        layout: 'auth',
    },
};
