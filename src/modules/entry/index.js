import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '@hooks/useAuth';
import { UserTypes, storageKeys } from '@constants';
import { getData } from '@utils/localStorage';
import AdminDashboard from '../dashboard_new/AdminDashboard';

const Dashboard = () => {
    const { profile } = useAuth();

    if (!profile) {
        // No profile yet: stay or redirect to login if needed
        return <Navigate to="/login" />;
    }

    const userType = getData(storageKeys.USER_TYPE);

    if (userType === UserTypes.EDUCATOR) {
        return <Navigate to="/educator/dashboard" />;
    }

    if (userType === UserTypes.ADMIN) {
        return <AdminDashboard />;
    }

    // fallback for student or unknown user type
    return <Navigate to="/not-allowed" />;
};

export default Dashboard;
