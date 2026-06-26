import React, { useEffect, useState, useMemo } from 'react';
import { Spin } from 'antd';
import TipTapJsonRenderer from '@components/common/editor/TipTapJsonRenderer';
import useFetch from '@hooks/useFetch';
import { getData } from '@utils/localStorage';
import { storageKeys, UserTypes } from '@constants';
import apiConfig from '@constants/apiConfig';

import './TaskContentLayout.scss';

export default function TaskContentLayout({
    parentTasks = [],
    selectedParentTaskId,
    onSelectParentTask,

    subtasks = [],
    selectedSubtaskId,
    onSelectSubtask,

    pageTitle = '',
    taskHeading = '',
    taskDescriptionContent = '',
    content = '',
    mediaPath = null,
    urlBase = '',

    loading = false,

    canGoBack = false,
    canGoNext = false,
    isLastSubtask = false,
    onBack = () => {},
    onNext = () => {},

    quizSubmissionMap,
    questionMap,

    customStepButton,
    customTaskCircle,
    rightPane,
    reviewPane,

    children,
}) {
    // State for subtask questions
    const [subtaskQuestions, setSubtaskQuestions] = useState([]);
    const [questionsLoaded, setQuestionsLoaded] = useState(false);

    const isEducator = getData(storageKeys.USER_TYPE) === UserTypes.EDUCATOR;
    const { execute: fetchQuestions } = useFetch(
        isEducator ? apiConfig.taskQuestion.educatorList : apiConfig.taskQuestion.getList,
        {
            immediate: false,
            onCompleted: (response) => {
                const resData = response?.data || (response?.result === undefined ? response : null);
                if (resData) {
                    const fetched = (resData.content || []).map(q => {
                        let parsed = [];
                        try { parsed = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []); } catch (_) { /* ignore */ }
                        return { ...q, options: parsed };
                    });
                    setSubtaskQuestions(fetched);
                }
                setQuestionsLoaded(true);
            },
            onError: () => setQuestionsLoaded(true),
        },
    );

    // Load questions whenever a subtask is selected
    useEffect(() => {
        if (selectedSubtaskId) {
            setQuestionsLoaded(false);
            fetchQuestions({ params: { taskId: selectedSubtaskId, page: 0, size: 100 } });
        } else {
            setSubtaskQuestions([]);
            setQuestionsLoaded(true);
        }
    }, [selectedSubtaskId]);

    const currentQuestionMap = useMemo(() => subtaskQuestions.reduce((acc, q) => {
        acc[q.id] = q;
        return acc;
    }, {}), [subtaskQuestions]);

    const renderMedia = () => {
        if (!mediaPath) return null;
        const fullMediaPath = mediaPath.startsWith('http') ? mediaPath : `${urlBase}${mediaPath}`;
        const ext = mediaPath.split('.').pop().toLowerCase();

        if ([ 'jpg', 'jpeg', 'png', 'gif', 'webp' ].includes(ext)) {
            return (
                <div className="tfo-media-section">
                    <div className="tfo-media-container">
                        <img src={fullMediaPath} alt="Task media" className="tfo-media-img" />
                    </div>
                </div>
            );
        }
        if ([ 'mp4', 'webm', 'ogg' ].includes(ext)) {
            return (
                <div className="tfo-media-section">
                    <div className="tfo-media-container">
                        <video controls className="tfo-media-video">
                            <source src={fullMediaPath} type={`video/${ext}`} />
                        </video>
                    </div>
                </div>
            );
        }
        return null;
    };

    if (loading || !questionsLoaded) {
        return (
            <div className="tfo-content-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <>
            <div className="tfo-content-area">
                <aside className="tfo-sidebar">
                    <div className="tfo-sidebar-header">
                        <span className="tfo-sidebar-header-title">Danh sách nhiệm vụ</span>
                    </div>
                    <div className="tfo-separator" />
                    <div className="tfo-task-list">
                        {parentTasks.map((task, idx) => {
                            const isActive = selectedParentTaskId === task.id;
                            const isLast = idx === parentTasks.length - 1;

                            return (
                                <div key={task.id || idx} className="tfo-task-list-row">
                                    <div className="tfo-task-timeline">
                                        {customTaskCircle ? (
                                            customTaskCircle(task, idx, isActive, isLast)
                                        ) : (
                                            <button
                                                className={`tfo-task-circle${isActive ? ' active' : ''}`}
                                                onClick={() => onSelectParentTask(task.id)}
                                            >
                                                {idx + 1}
                                            </button>
                                        )}
                                        {!isLast && <div className="tfo-task-connector" />}
                                    </div>
                                    <button
                                        className="tfo-task-content-btn"
                                        onClick={() => onSelectParentTask(task.id)}
                                    >
                                        <div className={`tfo-task-title${isActive ? ' active' : ''}`}>
                                            {task.title || task.name}
                                        </div>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </aside>

                <main className="tfo-pane">
                    <div className="tfo-pane-layout">
                        <div className="tfo-pane-left">
                            <div className="tfo-pane-topbar">
                                <div className="tfo-pane-title">{pageTitle}</div>
                                {subtasks.length > 0 && (
                                    <div className="tfo-step-pagination">
                                        {subtasks.map((st, index) => {
                                            const isActiveSub = st.id === selectedSubtaskId;
                                            if (customStepButton) {
                                                return customStepButton(st, index, isActiveSub);
                                            }
                                            return (
                                                <button
                                                    key={st.id}
                                                    className={`tfo-step-btn${isActiveSub ? ' active' : ''}`}
                                                    onClick={() => onSelectSubtask(st.id)}
                                                >
                                                    {index + 1}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="tfo-separator" />

                            <div className="tfo-task-content">
                                <div className="tfo-task-heading-container">
                                    <div className="tfo-task-heading">{taskHeading}</div>
                                </div>

                                <div className="tfo-task-body">
                                    {taskDescriptionContent && (
                                        <p className="tfo-body-text" style={{ whiteSpace: 'pre-line' }}>
                                            {taskDescriptionContent}
                                        </p>
                                    )}

                                    {content && (
                                        <TipTapJsonRenderer
                                            content={content}
                                            quizSubmissionMap={quizSubmissionMap}
                                            questionMap={currentQuestionMap}
                                        />
                                    )}

                                    {renderMedia()}

                                    {children}
                                </div>
                            </div>

                            {reviewPane && (
                                <div className="tfo-review-pane-inline">
                                    {reviewPane}
                                </div>
                            )}
                        </div>

                        {rightPane && (
                            <div className="tfo-pane-right">
                                {rightPane}
                            </div>
                        )}
                    </div>

                    <footer className="tfo-footer-nav">
                        <div className="tfo-footer-inner">
                            <div className="tfo-footer-buttons">
                                <button className="tfo-btn-back" onClick={onBack} disabled={!canGoBack}>
                                    Quay lại
                                </button>
                                <button className="tfo-btn-next" onClick={onNext} disabled={!canGoNext}>
                                    {isLastSubtask ? 'Hoàn thành' : 'Tiếp tục'}
                                </button>
                            </div>
                        </div>
                    </footer>
                </main>
            </div>
        </>
    );
}
