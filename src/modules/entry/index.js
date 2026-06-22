import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '@hooks/useAuth';
import { UserTypes } from '@constants';
import AdminDashboard from '../dashboard_new/AdminDashboard';

const Dashboard = () => {
    const { profile } = useAuth();

    if (!profile) {
        // No profile yet: stay or redirect to login if needed
        return <Navigate to="/login" />;
    }

    if (profile.kind === UserTypes.EDUCATOR) {
        return <Navigate to="/educator/dashboard" />;
    }

    // fallback (e.g. admin or unknown)
    return <AdminDashboard />;
};

export default Dashboard;
