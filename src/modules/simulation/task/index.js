import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Empty, Tag, Button, message, Modal } from 'antd';
import {
    QuestionCircleOutlined,
    RightOutlined,
    PlusOutlined,
    EditOutlined,
    MenuOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';

import useFetch from '@hooks/useFetch';
import useListBase from '@hooks/useListBase';
import useTranslate from '@hooks/useTranslate';

import { DEFAULT_TABLE_ITEM_SIZE, storageKeys, UserTypes, TaskTypes } from '@constants';
import apiConfig from '@constants/apiConfig';
import { FieldTypes } from '@constants/formConfig';
import { taskKindOptions } from '@constants/masterData';
import { commonMessage } from '@locales/intl';

import '@components/simulation/TaskSubTaskDnd.css';
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
import ListPage from '@components/common/layout/ListPage';
import PageWrapper from '@components/common/layout/PageWrapper';

import { getData } from '@utils/localStorage';

const TaskListPage = ({ pageOptions }) => {
    const translate = useTranslate();
    const navigate = useNavigate();
    const location = useLocation();
    const { simulationId } = useParams();

    const userType = getData(storageKeys.USER_TYPE);
    const isEducator = userType === UserTypes.EDUCATOR;

    const formattedKindOptions = translate.formatKeys(taskKindOptions, ['label']);
    const kindMap = Object.fromEntries(formattedKindOptions.map((item) => [item.value, item]));

    const labels = {
        name: translate.formatMessage(commonMessage.name),
        title: translate.formatMessage(commonMessage.title),
        description: translate.formatMessage(commonMessage.description),
        introduction: translate.formatMessage(commonMessage.introduction),
        kind: translate.formatMessage(commonMessage.kind),
        type: translate.formatMessage(commonMessage.type),
        totalQuestion: translate.formatMessage(commonMessage.totalQuestion),
        maxErrors: translate.formatMessage(commonMessage.maxErrors),
        noData: translate.formatMessage(commonMessage.noData),
        action: translate.formatMessage(commonMessage.action),
        task: translate.formatMessage(commonMessage.task),
        image: translate.formatMessage(commonMessage.image),
        question: translate.formatMessage(commonMessage.question),
        viewDetails: translate.formatMessage(commonMessage.viewDetails),
        createSubTask: 'Tạo nhiệm vụ phụ',
        createTask: 'Tạo nhiệm vụ chính',
    };

    const kindValues = formattedKindOptions.map((item) => ({
        value: item.value,
        label: item.label,
    }));

    const apiConfiguration = isEducator
        ? {
            getList: apiConfig.task.listByEducator,
            delete: apiConfig.task.delete,
            create: apiConfig.task.create,
            update: apiConfig.task.update,
        }
        : {
            getList: apiConfig.task.getList,
        };

    const [taskItems, setTaskItems] = useState([]);

    const getTaskOrderInfo = (record) => {
        if (record.kind === TaskTypes.SUBTASK) {
            const parentId = record.parent?.id || record.parentId;
            const parentIndex = taskItems.findIndex((t) => String(t.id) === String(parentId));
            const parentOrder = parentIndex !== -1 ? parentIndex + 1 : 1;
            const parentTaskItem = taskItems[parentIndex];
            const subTaskIndex = parentTaskItem
                ? parentTaskItem.children?.findIndex((s) => String(s.id) === String(record.id))
                : -1;
            const taskOrder = subTaskIndex !== -1 ? subTaskIndex + 1 : 1;
            return { parentOrder, taskOrder };
        } else {
            const taskIndex = taskItems.findIndex((t) => String(t.id) === String(record.id));
            const taskOrder = taskIndex !== -1 ? taskIndex + 1 : 1;
            return { taskOrder };
        }
    };

    const { data, mixinFuncs, queryFilter } = useListBase({
        apiConfig: apiConfiguration,
        options: {
            objectName: labels.task,
            pageSize: DEFAULT_TABLE_ITEM_SIZE,
        },
        override: (funcs) => {
            funcs.prepareGetListParams = (params) => ({
                ...params,
                simulationId: simulationId,
                size: 1000,
            });

            funcs.renderKindColumn = (columnsProps) => ({
                title: labels.kind,
                dataIndex: 'kind',
                align: 'center',
                ...columnsProps,
                render: (kind) => {
                    const item = kindMap[kind] || {};
                    return (
                        <Tag color={item.color || 'default'}>
                            <div style={{ padding: '0 4px', fontSize: 14 }}>{item.label || 'N/A'}</div>
                        </Tag>
                    );
                },
            });

            const originalActionColumnButtons = funcs.actionColumnButtons;
            funcs.actionColumnButtons = (additionalButtons = {}) => {
                const buttons = originalActionColumnButtons(additionalButtons);
                return {
                    ...buttons,
                    edit: (dataRow) => {
                        if (!isEducator || !mixinFuncs.hasPermission([apiConfig.task.update.permissionCode])) {
                            return null;
                        }

                        return (
                            <Button
                                type="link"
                                style={{ padding: 0 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const { parentOrder, taskOrder } = getTaskOrderInfo(dataRow);
                                    navigate(`/simulation/${simulationId}/task/${dataRow.id}`, {
                                        state: {
                                            action: 'edit',
                                            prevPath: location.pathname,
                                            parentTask:
                                                dataRow.kind === TaskTypes.SUBTASK
                                                    ? dataRow.parent
                                                        ? {
                                                            id: dataRow.parent.id,
                                                            name: dataRow.parent.name,
                                                            title: dataRow.parent.title,
                                                        }
                                                        : {
                                                            id: dataRow.parentId,
                                                            name: '',
                                                            title: '',
                                                        }
                                                    : null,
                                            parentOrder,
                                            taskOrder,
                                        },
                                    });
                                }}
                                title={translate.formatMessage(commonMessage.edit)}
                            >
                                <EditOutlined color="red" />
                            </Button>
                        );
                    },
                    createSubTask: (dataRow) => {
                        if (dataRow.kind !== TaskTypes.TASK) {
                            return null;
                        }

                        return (
                            <Button
                                type="link"
                                style={{ padding: 0, color: '#52c41a' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const parentIndex = taskItems.findIndex((t) => String(t.id) === String(dataRow.id));
                                    const parentOrder = parentIndex !== -1 ? parentIndex + 1 : 1;
                                    const taskOrder = (dataRow.children?.length || 0) + 1;
                                    navigate(`/simulation/${simulationId}/task/create`, {
                                        state: {
                                            parentTask: {
                                                id: dataRow.id,
                                                name: dataRow.name,
                                                title: dataRow.title,
                                            },
                                            parentOrder,
                                            taskOrder,
                                        },
                                    });
                                }}
                                title={labels.createSubTask}
                            >
                                <PlusOutlined />
                            </Button>
                        );
                    },
                    question: (dataRow) => {
                        if (dataRow.kind !== TaskTypes.SUBTASK) {
                            return null;
                        }

                        return (
                            <Button
                                type="link"
                                style={{ padding: 0 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/simulation/${simulationId}/task/${dataRow.id}/question`, {
                                        state: dataRow.parent
                                            ? {
                                                parentTask: {
                                                    id: dataRow.parent.id,
                                                    name: dataRow.parent.name,
                                                    title: dataRow.parent.title,
                                                },
                                            }
                                            : null,
                                    });
                                }}
                                title={labels.question}
                            >
                                <QuestionCircleOutlined />
                            </Button>
                        );
                    },
                    viewDetails: (dataRow) => {
                        return (
                            <Button
                                type="link"
                                style={{ padding: 0 }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const { parentOrder, taskOrder } = getTaskOrderInfo(dataRow);
                                    navigate(`/simulation/${simulationId}/task/${dataRow.id}`, {
                                        state:
                                            dataRow.kind === TaskTypes.SUBTASK
                                                ? {
                                                    parentTask: dataRow.parent
                                                        ? {
                                                            id: dataRow.parent.id,
                                                            name: dataRow.parent.name,
                                                            title: dataRow.parent.title,
                                                        }
                                                        : {
                                                            id: dataRow.parentId,
                                                            name: '',
                                                            title: '',
                                                        },
                                                    parentOrder,
                                                    taskOrder,
                                                }
                                                : {
                                                    taskOrder,
                                                },
                                    });
                                }}
                                title={labels.viewDetails}
                            >
                                <RightOutlined />
                            </Button>
                        );
                    },
                };
            };

            funcs.getCreateLink = () => {
                return {
                    pathname: `/simulation/${simulationId}/task/create`,
                    state: {
                        taskOrder: taskItems.length + 1,
                    },
                };
            };

            const originalRenderActionBar = funcs.renderActionBar;
            funcs.renderActionBar = () => {
                return originalRenderActionBar({
                    createText: labels.createTask,
                });
            };
        },
    });

    const { execute: executeUpdateOrder } = useFetch(apiConfig.task.updateOrder, {
        immediate: false,
    });

    const { execute: executeDeleteTask } = useFetch(apiConfig.task.delete, {
        immediate: false,
    });

    // State for delete confirmation modal
    const [deleteModal, setDeleteModal] = useState({
        visible: false,
        task: null, // task object being deleted
        hasSubtasks: false, // whether it's a parent task with subtasks
        loading: false,
    });

    const handleDeleteClick = (e, task) => {
        e.stopPropagation();
        const hasSubtasks = !task.kind || task.kind === TaskTypes.TASK ? (task.children?.length || 0) > 0 : false;

        if (hasSubtasks) {
            // Parent task with subtasks: show confirmation modal
            setDeleteModal({ visible: true, task, hasSubtasks: true, loading: false });
        } else {
            // Subtask or task without subtasks: simple confirm then delete
            Modal.confirm({
                title: 'Xác nhận xóa',
                icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
                content: (
                    <div>
                        <p>
                            Bạn có chắc chắn muốn xóa{' '}
                            <strong>{`"${task.title || task.name || 'nhiệm vụ này'}"`}</strong>?
                        </p>
                        <p style={{ color: '#8c8c8c', fontSize: 13 }}>Hành động này không thể hoàn tác.</p>
                    </div>
                ),
                okText: 'Xóa',
                okType: 'danger',
                cancelText: 'Hủy',
                onOk: () => doDeleteTask(task.id),
            });
        }
    };

    const doDeleteTask = async (taskId) => {
        try {
            const result = await executeDeleteTask({
                pathParams: { id: taskId },
            });
            if (result?.result === true) {
                message.success('Xóa nhiệm vụ thành công!');
                mixinFuncs.getList();
            } else {
                message.error(result?.message || 'Không thể xóa nhiệm vụ. Vui lòng thử lại.');
            }
        } catch (error) {
            message.error('Có lỗi xảy ra khi xóa nhiệm vụ. Vui lòng thử lại.');
        }
    };

    const handleConfirmDeleteWithSubtasks = async () => {
        if (!deleteModal.task) return;
        setDeleteModal((prev) => ({ ...prev, loading: true }));
        await doDeleteTask(deleteModal.task.id);
        setDeleteModal({ visible: false, task: null, hasSubtasks: false, loading: false });
    };

    const [activeId, setActiveId] = useState(null);
    const [activeType, setActiveType] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const updateOrderOnServer = async ({ id, newOrder, newParentId }) => {
        try {
            const result = await executeUpdateOrder({
                data: {
                    id,
                    newOrder,
                    newParentId,
                },
            });

            if (result?.result === true) {
                message.success('Cập nhật vị trí thành công!');
                mixinFuncs.getList();
            } else {
                message.error(result?.message || 'Không thể cập nhật vị trí.');
                mixinFuncs.getList();
            }
        } catch (error) {
            message.error('Có lỗi khi cập nhật vị trí. Vui lòng thử lại.');
            mixinFuncs.getList();
        }
    };

    const hierarchicalData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const tasksMap = new Map();
        const subTasks = [];

        data.forEach((item) => {
            const isSubtask =
                Number(item.kind) === TaskTypes.SUBTASK ||
                (item.parentId && Number(item.parentId) !== 0) ||
                (item.parent && item.parent.id);

            if (isSubtask) {
                subTasks.push({
                    ...item,
                    kind: TaskTypes.SUBTASK,
                });
            } else {
                tasksMap.set(String(item.id), {
                    ...item,
                    kind: TaskTypes.TASK,
                    children: [],
                });
            }
        });

        subTasks.forEach((subTask) => {
            const parentId = subTask.parent?.id || subTask.parentId;
            const parentIdStr = parentId ? String(parentId) : null;
            if (parentIdStr && tasksMap.has(parentIdStr)) {
                const parentTask = tasksMap.get(parentIdStr);
                parentTask.children.push({
                    ...subTask,
                    parent: {
                        id: parentTask.id,
                        name: parentTask.name,
                        title: parentTask.title,
                    },
                });
            } else {
                tasksMap.set(`orphan_${subTask.id}`, subTask);
            }
        });

        return Array.from(tasksMap.values());
    }, [data]);

    useEffect(() => {
        setTaskItems(hierarchicalData);
    }, [hierarchicalData]);

    const findContainer = (id) => {
        if (taskItems.some((task) => task.id === id)) return id;
        const parentTask = taskItems.find((task) => task.children?.some((sub) => sub.id === id));
        return parentTask ? parentTask.id : null;
    };

    const findSubtaskById = (id) => {
        for (const task of taskItems) {
            const subtask = task.children?.find((sub) => sub.id === id);
            if (subtask) return subtask;
        }
        return null;
    };

    const handleDragStart = (event) => {
        const { active } = event;
        setActiveId(active.id);
        setActiveType(active.data.current?.type);
    };

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

        if (!overContainer && taskItems.some((t) => t.id === overId)) {
            overContainer = overId;
        }

        if (!activeContainer || !overContainer) return;
        if (activeContainer === overContainer) return;

        setTaskItems((prevTasks) => {
            const sourceTask = prevTasks.find((t) => t.id === activeContainer);
            const destinationTask = prevTasks.find((t) => t.id === overContainer);
            if (!sourceTask || !destinationTask) return prevTasks;

            const activeIndex = sourceTask.children.findIndex((item) => item.id === activeId);
            const overIndex = isOverSubtask
                ? destinationTask.children.findIndex((item) => item.id === overId)
                : destinationTask.children.length;

            const movingItem = sourceTask.children[activeIndex];
            if (!movingItem) return prevTasks;

            return prevTasks.map((task) => {
                if (task.id === activeContainer) {
                    return {
                        ...task,
                        children: task.children.filter((item) => item.id !== activeId),
                    };
                }
                if (task.id === overContainer) {
                    const newChildren = [...task.children];
                    newChildren.splice(overIndex, 0, movingItem);
                    return {
                        ...task,
                        children: newChildren,
                    };
                }
                return task;
            });
        });
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveType(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        const isActiveTask = active.data.current?.type === 'task';
        const isOverTask = over.data.current?.type === 'task';
        const isOverSubtask = over.data.current?.type === 'subtask';

        if (isActiveTask) {
            if (activeId === overId || !isOverTask) return;

            setTaskItems((prev) => {
                const oldIndex = prev.findIndex((item) => item.id === activeId);
                const newIndex = prev.findIndex((item) => item.id === overId);
                if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return prev;
                const next = arrayMove(prev, oldIndex, newIndex);
                updateOrderOnServer({ id: activeId, newOrder: newIndex, newParentId: null });
                return next;
            });
            return;
        }

        const activeContainer = findContainer(activeId);
        let overContainer = findContainer(overId);

        if (!overContainer && taskItems.some((t) => t.id === overId)) {
            overContainer = overId;
        }

        if (!activeContainer || !overContainer) return;

        const activeTaskIndex = taskItems.findIndex((t) => t.id === activeContainer);
        const activeTask = taskItems[activeTaskIndex];
        const activeIndex = activeTask.children.findIndex((item) => item.id === activeId);

        const targetTask = taskItems.find((t) => t.id === overContainer);
        const overIndex = isOverSubtask
            ? targetTask.children.findIndex((item) => item.id === overId)
            : targetTask.children.length;

        if (activeContainer === overContainer && activeIndex === overIndex) return;

        if (activeContainer === overContainer) {
            setTaskItems((prevTasks) => {
                return prevTasks.map((task) => {
                    if (task.id !== activeContainer) return task;
                    const nextChildren = arrayMove(task.children, activeIndex, overIndex);
                    return {
                        ...task,
                        children: nextChildren,
                    };
                });
            });
        } else {
            setTaskItems((prevTasks) => {
                let movingItem;
                const nextTasks = prevTasks.map((task) => {
                    if (task.id === activeContainer) {
                        const updatedChildren = task.children.filter((item) => {
                            if (item.id === activeId) {
                                movingItem = item;
                                return false;
                            }
                            return true;
                        });
                        return { ...task, children: updatedChildren };
                    }
                    return task;
                });

                return nextTasks.map((task) => {
                    if (task.id === overContainer && movingItem) {
                        const updatedChildren = [...task.children];
                        updatedChildren.splice(overIndex, 0, movingItem);
                        return { ...task, children: updatedChildren };
                    }
                    return task;
                });
            });
        }

        updateOrderOnServer({
            id: activeId,
            newOrder: overIndex,
            newParentId: overContainer,
        });
    };

    const getParentTaskState = (record) => {
        if (record.parent) {
            return {
                id: record.parent.id,
                name: record.parent.name,
                title: record.parent.title,
            };
        }

        if (record.parentId) {
            return {
                id: record.parentId,
                name: '',
                title: '',
            };
        }

        return null;
    };

    const handleRowClick = (record) => {
        const { parentOrder, taskOrder } = getTaskOrderInfo(record);
        navigate(`/simulation/${simulationId}/task/${record.id}`, {
            state:
                record.kind === TaskTypes.SUBTASK
                    ? {
                        parentTask: getParentTaskState(record),
                        parentOrder,
                        taskOrder,
                    }
                    : {
                        taskOrder,
                    },
        });
    };

    const createSubTaskForTask = (task) => {
        const parentIndex = taskItems.findIndex((t) => String(t.id) === String(task.id));
        const parentOrder = parentIndex !== -1 ? parentIndex + 1 : 1;
        const taskOrder = (task.children?.length || 0) + 1;
        navigate(`/simulation/${simulationId}/task/create`, {
            state: {
                parentTask: {
                    id: task.id,
                    name: task.name || task.title,
                    title: task.title,
                },
                parentOrder,
                taskOrder,
            },
        });
    };

    const TaskCard = ({ task }) => {
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

        const isSubTask = task.kind === TaskTypes.SUBTASK;
        const taskTitle = task.title || 'Nhiệm vụ không có tiêu đề';

        return (
            <div
                ref={setNodeRef}
                style={style}
                className={`task-container-card ${isDragging ? 'dragging-placeholder' : ''}`}
                onClick={() => handleRowClick(task)}
            >
                <div className="task-header">
                    <div className="task-header-left">
                        <span className="drag-handle-btn" {...attributes} {...listeners}>
                            <MenuOutlined />
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{taskTitle}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                <Tag color={isSubTask ? 'purple' : 'blue'}>{isSubTask ? 'Nhiệm vụ phụ' : 'Nhiệm vụ chính'}</Tag>
                                {isSubTask && task.parent?.title && (
                                    <Tag color="default">Nhiệm vụ chính: {task.parent.title}</Tag>
                                )}
                                {isSubTask && typeof task.totalQuestion !== 'undefined' && (
                                    <Tag color="default">Câu hỏi: {task.totalQuestion || 0}</Tag>
                                )}
                                {isSubTask && typeof task.maxErrors !== 'undefined' && (
                                    <Tag color="default">Lỗi tối đa: {task.maxErrors || 0}</Tag>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="task-header-actions">
                        {!isSubTask &&
                            isEducator &&
                            mixinFuncs.hasPermission([apiConfig.task.create.permissionCode]) && (
                            <Button
                                type="text"
                                icon={<PlusOutlined />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    createSubTaskForTask(task);
                                }}
                                title={labels.createSubTask}
                            />
                        )}
                        {isEducator && mixinFuncs.hasPermission([apiConfig.task.delete.permissionCode]) && (
                            <Button
                                type="text"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={(e) => handleDeleteClick(e, task)}
                                title="Xóa nhiệm vụ"
                            />
                        )}
                        <Button
                            type="text"
                            icon={<RightOutlined />}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(task);
                            }}
                            title={labels.viewDetails}
                        />
                    </div>
                </div>
                {!isSubTask ? (
                    <div className="subtasks-list">
                        {task.children?.length > 0 ? (
                            <SortableContext
                                items={task.children.map((sub) => sub.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {task.children.map((subtask) => (
                                    <SubTaskCard key={subtask.id} subtask={subtask} />
                                ))}
                            </SortableContext>
                        ) : (
                            <div className="empty-drop-zone">Chưa có nhiệm vụ phụ</div>
                        )}
                    </div>
                ) : null}
            </div>
        );
    };

    const SubTaskCard = ({ subtask }) => {
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
            <div
                ref={setNodeRef}
                style={style}
                className={`subtask-item-card ${isDragging ? 'dragging-placeholder' : ''}`}
                onClick={(e) => {
                    e.stopPropagation();
                    handleRowClick(subtask);
                }}
            >
                <div className="subtask-left">
                    <span className="subtask-drag-handle" {...attributes} {...listeners}>
                        <MenuOutlined />
                    </span>
                    <span style={{ color: '#9ca3af', fontSize: 14 }}>└─</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>
                            {subtask.title || 'Nhiệm vụ phụ không có tiêu đề'}
                        </div>
                        {subtask.parent?.title && (
                            <div style={{ fontSize: 12, color: '#64748b' }}>Thuộc nhiệm vụ: {subtask.parent.title}</div>
                        )}
                    </div>
                </div>
                <div className="subtask-right">
                    {isEducator && mixinFuncs.hasPermission([apiConfig.task.delete.permissionCode]) && (
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={(e) => handleDeleteClick(e, subtask)}
                            title="Xóa nhiệm vụ phụ"
                        />
                    )}
                    <Button
                        type="text"
                        icon={<RightOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(subtask);
                        }}
                    />
                </div>
            </div>
        );
    };

    const renderTaskBoard = () => (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <SortableContext items={taskItems.map((task) => task.id)} strategy={verticalListSortingStrategy}>
                <div className="task-board-container">
                    {taskItems.length === 0 ? (
                        <Empty description={labels.noData} />
                    ) : (
                        taskItems.map((task) => <TaskCard key={task.id} task={task} />)
                    )}
                </div>
            </SortableContext>
            <DragOverlay>
                {activeId ? (
                    activeType === 'task' ? (
                        <div className="task-container-card dragging-overlay-task">
                            <div className="task-header">
                                <div className="task-header-left">
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <span className="drag-handle-btn">
                                            <MenuOutlined />
                                        </span>
                                        <span>{taskItems.find((task) => task.id === activeId)?.title || ''}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="subtask-item-card dragging-overlay-subtask">
                            <div className="subtask-left">
                                <span className="subtask-drag-handle" />
                                <span>{findSubtaskById(activeId)?.title || ''}</span>
                            </div>
                        </div>
                    )
                ) : null}
            </DragOverlay>
        </DndContext>
    );

    const renderDeleteWithSubtasksModal = () => (
        <Modal
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ff4d4f' }}>
                    <ExclamationCircleOutlined />
                    <span>Xóa nhiệm vụ chính và toàn bộ nhiệm vụ phụ</span>
                </div>
            }
            open={deleteModal.visible}
            onCancel={() =>
                !deleteModal.loading &&
                setDeleteModal({ visible: false, task: null, hasSubtasks: false, loading: false })
            }
            footer={[
                <Button
                    key="cancel"
                    disabled={deleteModal.loading}
                    onClick={() => setDeleteModal({ visible: false, task: null, hasSubtasks: false, loading: false })}
                >
                    Hủy
                </Button>,
                <Button
                    key="confirm"
                    type="primary"
                    danger
                    loading={deleteModal.loading}
                    onClick={handleConfirmDeleteWithSubtasks}
                >
                    Xóa
                </Button>,
            ]}
            width={480}
        >
            <div style={{ padding: '8px 0' }}>
                <p style={{ marginBottom: 12 }}>
                    ⚠️ Bạn đang xóa nhiệm vụ chính{' '}
                    <strong>{`"${deleteModal.task?.title || deleteModal.task?.name || ''}"`}</strong> — đây là một{' '}
                    <strong>nhiệm vụ chính</strong>.
                </p>
                <p style={{ color: '#595959', marginBottom: 12 }}>
                    Nhiệm vụ này hiện có{' '}
                    <strong style={{ color: '#ff4d4f' }}>{deleteModal.task?.children?.length || 0} nhiệm vụ phụ</strong> bên
                    trong. Khi xóa nhiệm vụ chính, <strong>toàn bộ nhiệm vụ phụ thuộc về nó cũng sẽ bị xóa theo</strong>.
                </p>
                <p style={{ color: '#8c8c8c', fontSize: 13 }}>
                    Hành động này không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục không?
                </p>
            </div>
        </Modal>
    );

    const searchFields = [
        { key: 'title', placeholder: labels.title },
        {
            key: 'kind',
            placeholder: labels.kind,
            type: FieldTypes.SELECT,
            options: kindValues,
        },
        // {
        //     key: 'type',
        //     placeholder: labels.type,
        //     type: FieldTypes.SELECT,
        //     options: formattedTypeOptions,
        // },
    ];

    return (
        <PageWrapper routes={pageOptions.renderBreadcrumbs(commonMessage, translate, null, { simulationId })}>
            <ListPage
                searchForm={mixinFuncs.renderSearchForm({
                    fields: searchFields,
                    initialValues: queryFilter,
                })}
                actionBar={isEducator ? mixinFuncs.renderActionBar() : null}
                baseTable={renderTaskBoard()}
            />
            {renderDeleteWithSubtasksModal()}
        </PageWrapper>
    );
};

export default TaskListPage;
