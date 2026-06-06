import React, { useState } from 'react';
import { Tabs, Alert } from 'antd';
import SimulationsList from './SimulationsList';
import TasksList from './TasksList';
import TaskQuestionsList from './TaskQuestionsList';

const tabItems = [
    { key: 'simulations', label: 'Simulations' },
    { key: 'tasks', label: 'Tasks' },
    { key: 'questions', label: 'Questions' },
];

const EducatorDashboard = () => {
    const [activeTab, setActiveTab] = useState('simulations');
    const [selectedSimulation, setSelectedSimulation] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
            <h1>Educator Dashboard</h1>
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={tabItems.map((tab) => ({
                    ...tab,
                    children:
                        tab.key === 'simulations' ? (
                            <SimulationsList
                                onSelectSimulation={(sim) => {
                                    setSelectedSimulation(sim);
                                    setSelectedTask(null);
                                    setActiveTab('tasks');
                                }}
                                selectedSimulation={selectedSimulation}
                            />
                        ) : tab.key === 'tasks' ? (
                            selectedSimulation ? (
                                <TasksList
                                    simulation={selectedSimulation}
                                    selectedTask={selectedTask}
                                    onSelectTask={(task) => {
                                        setSelectedTask(task);
                                        setActiveTab('questions');
                                    }}
                                />
                            ) : (
                                <Alert
                                    showIcon
                                    message="Select a simulation from the Simulations tab to manage its tasks."
                                    type="info"
                                />
                            )
                        ) : selectedSimulation && selectedTask ? (
                            <div>
                                <TaskQuestionsList task={selectedTask} />
                            </div>
                        ) : (
                            <Alert
                                showIcon
                                message="Select a simulation and a task to manage its questions."
                                type="info"
                            />
                        ),
                }))}
            />
        </div>
    );
};

export default EducatorDashboard;
