import React, { useState } from 'react';
import {
    DndContext,
    useSensor,
    useSensors,
    PointerSensor,
    KeyboardSensor,
    closestCenter,
    DragOverlay,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import './TaskSubTaskDnd.css';

// SVG Icons
const DragHandleIcon = () => (
    <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="9" cy="12" r="1.5" />
        <circle cx="9" cy="6" r="1.5" />
        <circle cx="9" cy="18" r="1.5" />
        <circle cx="15" cy="12" r="1.5" />
        <circle cx="15" cy="6" r="1.5" />
        <circle cx="15" cy="18" r="1.5" />
    </svg>
);

const PlusIcon = () => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const TrashIcon = () => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

const SubTaskDragIcon = () => (
    <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <line x1="4" y1="9" x2="20" y2="9" />
        <line x1="4" y1="15" x2="20" y2="15" />
    </svg>
);

// Initial mock data
const initialTasksData = [
    {
        id: 'task-1',
        title: 'Phát triển Landing Page',
        subTasks: [
            { id: 'subtask-101', title: 'Thiết kế bản vẽ Figma (Desktop & Mobile)', completed: true },
            { id: 'subtask-102', title: 'Cấu hình dự án React + Vite', completed: true },
            { id: 'subtask-103', title: 'Xây dựng layout chung và Responsive menu', completed: false },
        ],
    },
    {
        id: 'task-2',
        title: 'Tích hợp API & Quản lý State',
        subTasks: [
            { id: 'subtask-201', title: 'Cài đặt Redux Toolkit và Saga', completed: true },
            { id: 'subtask-202', title: 'Tạo dịch vụ Axios gọi API Authentication', completed: false },
            { id: 'subtask-203', title: 'Xử lý lỗi và hiển thị thông báo (Toast/Notification)', completed: false },
        ],
    },
    {
        id: 'task-3',
        title: 'Kiểm thử và Tối ưu hóa',
        subTasks: [
            { id: 'subtask-301', title: 'Viết unit test cho Helper và Selectors', completed: false },
            { id: 'subtask-302', title: 'Tối ưu hóa Lighthouse score (> 90)', completed: false },
        ],
    },
];

export default function TaskSubTaskDnd() {
    const [tasks, setTasks] = useState(initialTasksData);
    const [activeId, setActiveId] = useState(null);
    const [activeType, setActiveType] = useState(null); // 'task' | 'subtask'

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Tránh kích hoạt nhầm khi chỉ click chuột
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const findContainer = (id) => {
        if (tasks.some((t) => t.id === id)) return id;
        const foundTask = tasks.find((t) => t.subTasks.some((s) => s.id === id));
        return foundTask ? foundTask.id : null;
    };

    const findSubtaskById = (id) => {
        for (const task of tasks) {
            const subtask = task.subTasks.find((s) => s.id === id);
            if (subtask) return subtask;
        }
        return null;
    };

    // Kéo thả bắt đầu
    const handleDragStart = (event) => {
        const { active } = event;
        setActiveId(active.id);
        setActiveType(active.data.current?.type);
    };

    // Đang kéo qua lại
    const handleDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveSubtask = active.data.current?.type === 'subtask';
        const isOverSubtask = over.data.current?.type === 'subtask';

        if (!isActiveSubtask) return;

        const activeContainer = findContainer(activeId);
        let overContainer = findContainer(overId);

        // Nếu "overId" là một Task lớn, coi như kéo thả vào Task lớn đó
        if (!overContainer && tasks.some((t) => t.id === overId)) {
            overContainer = overId;
        }

        if (!activeContainer || !overContainer || activeContainer === overContainer) return;

        setTasks((prevTasks) => {
            const activeItems = prevTasks.find((t) => t.id === activeContainer).subTasks;
            const overItems = prevTasks.find((t) => t.id === overContainer).subTasks;

            const activeIndex = activeItems.findIndex((i) => i.id === activeId);
            const overIndex = isOverSubtask ? overItems.findIndex((i) => i.id === overId) : overItems.length;

            return prevTasks.map((task) => {
                if (task.id === activeContainer) {
                    return {
                        ...task,
                        subTasks: task.subTasks.filter((item) => item.id !== activeId),
                    };
                }
                if (task.id === overContainer) {
                    const newSubTasks = [...task.subTasks];
                    newSubTasks.splice(overIndex, 0, activeItems[activeIndex]);
                    return {
                        ...task,
                        subTasks: newSubTasks,
                    };
                }
                return task;
            });
        });
    };

    // Thả chuột kết thúc
    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveType(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        const isActiveTask = active.data.current?.type === 'task';

        if (isActiveTask) {
            if (activeId !== overId) {
                setTasks((prev) => {
                    const oldIndex = prev.findIndex((t) => t.id === activeId);
                    const newIndex = prev.findIndex((t) => t.id === overId);
                    return arrayMove(prev, oldIndex, newIndex);
                });
            }
            return;
        }

        const activeContainer = findContainer(activeId);
        const overContainer = findContainer(overId);

        if (activeContainer && activeContainer === overContainer) {
            const taskIndex = tasks.findIndex((t) => t.id === activeContainer);
            const subtasks = tasks[taskIndex].subTasks;
            const oldIndex = subtasks.findIndex((s) => s.id === activeId);
            const newIndex = subtasks.findIndex((s) => s.id === overId);

            if (oldIndex !== newIndex) {
                setTasks((prev) => {
                    return prev.map((task, index) => {
                        if (index === taskIndex) {
                            return {
                                ...task,
                                subTasks: arrayMove(task.subTasks, oldIndex, newIndex),
                            };
                        }
                        return task;
                    });
                });
            }
        }
    };

    // Các chức năng phụ trợ
    const handleAddTask = () => {
        const newTaskId = `task-${Date.now()}`;
        setTasks((prev) => [
            ...prev,
            {
                id: newTaskId,
                title: `Task mới ${prev.length + 1}`,
                subTasks: [],
            },
        ]);
    };

    const handleEditTaskTitle = (taskId, title) => {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, title } : t)));
    };

    const handleDeleteTask = (taskId) => {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
    };

    const handleAddSubTask = (taskId) => {
        const newSubTaskId = `subtask-${Date.now()}`;
        setTasks((prev) =>
            prev.map((t) => {
                if (t.id === taskId) {
                    return {
                        ...t,
                        subTasks: [...t.subTasks, { id: newSubTaskId, title: 'Subtask mới', completed: false }],
                    };
                }
                return t;
            }),
        );
    };

    const handleToggleSubTask = (subtaskId) => {
        setTasks((prev) =>
            prev.map((t) => ({
                ...t,
                subTasks: t.subTasks.map((s) => (s.id === subtaskId ? { ...s, completed: !s.completed } : s)),
            })),
        );
    };

    const handleEditSubTaskTitle = (subtaskId, title) => {
        setTasks((prev) =>
            prev.map((t) => ({
                ...t,
                subTasks: t.subTasks.map((s) => (s.id === subtaskId ? { ...s, title } : s)),
            })),
        );
    };

    const handleDeleteSubTask = (subtaskId) => {
        setTasks((prev) =>
            prev.map((t) => ({
                ...t,
                subTasks: t.subTasks.filter((s) => s.id !== subtaskId),
            })),
        );
    };

    return (
        <div className="task-dnd-wrapper">
            <div className="task-dnd-header">
                <h2>Quản lý Task & SubTask lồng nhau</h2>
                <button className="btn-add-task" onClick={handleAddTask}>
                    <PlusIcon /> Thêm Task
                </button>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                <div className="task-board-container">
                    <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                        {tasks.map((task) => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                onEditTitle={handleEditTaskTitle}
                                onDelete={handleDeleteTask}
                                onAddSubTask={handleAddSubTask}
                                onToggleSubTask={handleToggleSubTask}
                                onEditSubTaskTitle={handleEditSubTaskTitle}
                                onDeleteSubTask={handleDeleteSubTask}
                            />
                        ))}
                    </SortableContext>
                </div>

                <DragOverlay>
                    {activeId ? (
                        activeType === 'task' ? (
                            <div className="task-container-card dragging-overlay-task">
                                <div className="task-header">
                                    <div className="task-header-left">
                                        <span className="drag-handle-btn">
                                            <DragHandleIcon />
                                        </span>
                                        <input
                                            type="text"
                                            className="task-title-input"
                                            value={tasks.find((t) => t.id === activeId)?.title || ''}
                                            readOnly
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="subtask-item-card dragging-overlay-subtask">
                                <div className="subtask-left">
                                    <span className="subtask-drag-handle">
                                        <SubTaskDragIcon />
                                    </span>
                                    <input
                                        type="checkbox"
                                        className="subtask-checkbox"
                                        checked={findSubtaskById(activeId)?.completed || false}
                                        readOnly
                                    />
                                    <input
                                        type="text"
                                        className="subtask-title-input"
                                        value={findSubtaskById(activeId)?.title || ''}
                                        readOnly
                                    />
                                </div>
                            </div>
                        )
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

// Inner Component: TaskItem
function TaskItem({ task, onEditTitle, onDelete, onAddSubTask, onToggleSubTask, onEditSubTaskTitle, onDeleteSubTask }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: task.id,
        data: {
            type: 'task',
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`task-container-card ${isDragging ? 'dragging-placeholder' : ''}`}
        >
            <div className="task-header">
                <div className="task-header-left">
                    <span className="drag-handle-btn" {...attributes} {...listeners}>
                        <DragHandleIcon />
                    </span>
                    <input
                        type="text"
                        className="task-title-input"
                        value={task.title}
                        onChange={(e) => onEditTitle(task.id, e.target.value)}
                    />
                </div>
                <div className="task-header-actions">
                    <button className="btn-icon" onClick={() => onAddSubTask(task.id)} title="Thêm Subtask">
                        <PlusIcon />
                    </button>
                    <button className="btn-icon btn-delete" onClick={() => onDelete(task.id)} title="Xóa Task">
                        <TrashIcon />
                    </button>
                </div>
            </div>

            <div className="subtasks-list">
                <SortableContext items={task.subTasks.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    {task.subTasks.map((subtask) => (
                        <SubTaskItem
                            key={subtask.id}
                            subtask={subtask}
                            onToggle={onToggleSubTask}
                            onEditTitle={onEditSubTaskTitle}
                            onDelete={onDeleteSubTask}
                        />
                    ))}
                </SortableContext>
                {task.subTasks.length === 0 && <div className="empty-drop-zone">Kéo thả Subtask vào đây</div>}
            </div>
        </div>
    );
}

// Inner Component: SubTaskItem
function SubTaskItem({ subtask, onToggle, onEditTitle, onDelete }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: subtask.id,
        data: {
            type: 'subtask',
        },
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} className={`subtask-item-card ${isDragging ? 'dragging-placeholder' : ''}`}>
            <div className="subtask-left">
                <span className="subtask-drag-handle" {...attributes} {...listeners}>
                    <SubTaskDragIcon />
                </span>
                <input
                    type="checkbox"
                    className="subtask-checkbox"
                    checked={subtask.completed}
                    onChange={() => onToggle(subtask.id)}
                />
                <input
                    type="text"
                    className={`subtask-title-input ${subtask.completed ? 'completed' : ''}`}
                    value={subtask.title}
                    onChange={(e) => onEditTitle(subtask.id, e.target.value)}
                />
            </div>
            <button className="btn-icon btn-delete" onClick={() => onDelete(subtask.id)} title="Xóa Subtask">
                <TrashIcon />
            </button>
        </div>
    );
}
