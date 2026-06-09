import React from 'react';
import { Card } from 'antd';
import TaskSubTaskDnd from '@components/simulation/TaskSubTaskDnd';

const TestPage = () => {
    return (
        <div style={{ padding: '24px', background: '#f1f5f9', minHeight: '100vh' }}>
            <Card 
                title={<span style={{ fontSize: '18px', fontWeight: 700 }}>Sandbox Kiểm Thử Tính Năng</span>}
                bordered={false}
                style={{ borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            >
                <p style={{ color: '#64748b', marginBottom: '24px' }}>
                    Trang này được sử dụng để kiểm thử các tính năng mới trực quan. Dưới đây là demo tính năng kéo thả Task và Subtask phân cấp bằng thư viện <code>@dnd-kit</code>.
                </p>
                <TaskSubTaskDnd />
            </Card>
        </div>
    );
};

export default TestPage;
