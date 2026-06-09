import React, { useState } from 'react';
import { Tabs } from 'antd';

const tabItems = [
    { key: 'all', label: 'All Simulations' },
    { key: 'enrollments', label: 'My Enrollments' },
];

const StudentDashboard = () => {
    const [activeTab, setActiveTab] = useState('all');
    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
            <h1>Student Dashboard</h1>
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems.map((tab) => ({
                    ...tab,
                    children:
                        tab.key === 'all' ? (
                            <div>All simulations will be listed here.</div>
                        ) : (
                            <div>List of enrolled simulations will be shown here.</div>
                        ),
                }))}
            />
        </div>
    );
};

export default StudentDashboard;
