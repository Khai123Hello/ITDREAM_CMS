import React, { useMemo, useState, useEffect } from 'react';
import { Empty, Spin } from 'antd';
import useFetch from '@hooks/useFetch';
import { storageKeys, UserTypes } from '@constants';
import apiConfig from '@constants/apiConfig';
import { getData } from '@utils/localStorage';
import styles from './SimulationTaskPanel.module.scss';
import MarkdocRenderer from '@components/common/editor/MarkdocRenderer';

// ─────────────────────────────────────────
// Main component
// ─────────────────────────────────────────
const SimulationTaskPanel = ({ simulationId }) => {
    const userType = getData(storageKeys.USER_TYPE);
    const isEducator = userType === UserTypes.EDUCATOR;

    const {
        data: tasks,
        loading: loadingTasks,
        execute: fetchTasks,
    } = useFetch(isEducator ? apiConfig.task.listByEducator : apiConfig.task.getList, {
        immediate: false,
        mappingData: (res) => res.data?.content || [],
    });

    useEffect(() => {
        if (simulationId && simulationId !== 'create') {
            fetchTasks({
                params: { simulationId, size: 1000 },
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [simulationId]);

    // Parent tasks (kind=1)
    const parentTasks = useMemo(
        () => (tasks || []).filter((t) => t.kind === 1).sort((a, b) => (a.orderInParent ?? 0) - (b.orderInParent ?? 0)),
        [ tasks ],
    );

    const [ activeParentId, setActiveParentId ] = useState(null);

    // Set first parent active once tasks loaded
    useEffect(() => {
        if (parentTasks.length > 0) {
            setActiveParentId(parentTasks[0].id);
        } else {
            setActiveParentId(null);
        }
    }, [ parentTasks ]);

    const handleSelectParent = (parentId) => {
        setActiveParentId(parentId);
    };

    if (!simulationId || simulationId === 'create') {
        return (
            <div style={{ padding: '32px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #e8e4dc', color: '#8a877f' }}>
                Vui lòng lưu thông tin bài mô phỏng trước để hiển thị danh sách nhiệm vụ.
            </div>
        );
    }

    if (loadingTasks) {
        return (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
                <Spin tip="Đang tải danh sách nhiệm vụ..." />
            </div>
        );
    }

    if (!parentTasks.length) {
        return (
            <div style={{ padding: '48px 0', background: '#fff', borderRadius: '12px', border: '1px solid #e8e4dc' }}>
                <Empty description="Chưa có nhiệm vụ nào trong bài mô phỏng này." />
            </div>
        );
    }

    return (
        <div className={styles.panel}>
            {/* ── SIDEBAR (task cha) ── */}
            <aside className={styles.sidebar}>
                {parentTasks.map((task, index) => {
                    const isActive = task.id === activeParentId;
                    const isLast = index === parentTasks.length - 1;
                    return (
                        <div key={task.id} className={styles.sidebarRow}>
                            {/* Timeline column */}
                            <div className={styles.sidebarTimeline}>
                                <button
                                    className={`${styles.sidebarCircle} ${isActive ? styles.sidebarCircleActive : ''}`}
                                    onClick={() => handleSelectParent(task.id)}
                                    aria-label={`Task ${index + 1}`}
                                >
                                    {index + 1}
                                </button>
                                {!isLast && <div className={styles.sidebarConnector} />}
                            </div>

                            {/* Content column */}
                            <button
                                className={`${styles.sidebarContentBtn}`}
                                onClick={() => handleSelectParent(task.id)}
                            >
                                <span className={`${styles.sidebarTitle} ${isActive ? styles.sidebarTitleActive : ''}`}>
                                    {task.title || task.name}
                                </span>
                                {task.description && (
                                    <span className={styles.sidebarDesc}>
                                        {task.description.length > 50
                                            ? `${task.description.slice(0, 50)}…`
                                            : task.description}
                                    </span>
                                )}
                                {task.estimatedTime && (
                                    <span className={styles.sidebarTime}>
                                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                                            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
                                            <path
                                                d="M7 4v3.5l2 1.5"
                                                stroke="currentColor"
                                                strokeWidth="1.2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        {task.estimatedTime}
                                    </span>
                                )}
                            </button>
                        </div>
                    );
                })}
            </aside>

            {/* ── DETAIL (Task chính) ── */}
            <div className={styles.detail}>
                {(() => {
                    const parent = parentTasks.find((p) => p.id === activeParentId);
                    return parent ? (
                        <div className={styles.detailContent}>
                            <h1 className={styles.detailTitle}>{parent.title || parent.name}</h1>
                            {parent.description && <p className={styles.detailDescription}>{parent.description}</p>}
                            <MarkdocRenderer content={parent.content} />
                        </div>
                    ) : (
                        <div className={styles.noTask}>Chọn một nhiệm vụ để xem nội dung.</div>
                    );
                })()}
            </div>
        </div>
    );
};

export default SimulationTaskPanel;
