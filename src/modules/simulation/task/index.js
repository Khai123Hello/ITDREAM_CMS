import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Empty, Tag, Button } from 'antd';
import { QuestionCircleOutlined, RightOutlined, PlusOutlined, EditOutlined } from '@ant-design/icons';

import useListBase from '@hooks/useListBase';
import useTranslate from '@hooks/useTranslate';

import { DEFAULT_TABLE_ITEM_SIZE, storageKeys, UserTypes, TaskTypes } from '@constants';
import apiConfig from '@constants/apiConfig';
import { FieldTypes } from '@constants/formConfig';
import { taskKindOptions } from '@constants/masterData';
import { commonMessage } from '@locales/intl';

import BaseTable from '@components/common/table/BaseTable';
import ListPage from '@components/common/layout/ListPage';
import PageWrapper from '@components/common/layout/PageWrapper';

import { getData } from '@utils/localStorage';

const TaskListPage = ({ pageOptions }) => {
    const translate = useTranslate();
    const navigate = useNavigate();
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
        createSubTask: 'Tạo Task Con',
        createTask: 'Tạo Task',
    };

    const kindValues = formattedKindOptions.map((item) => ({
        value: item.value,
        label: item.label,
    }));

    const apiConfiguration = isEducator
        ? {
            getList: apiConfig.task.educatorList,
            delete: apiConfig.task.delete,
            create: apiConfig.task.create,
            update: apiConfig.task.update,
        }
        : {
            getList: apiConfig.task.getList,
        };

    const { data, mixinFuncs, queryFilter, loading, pagination } = useListBase({
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
                                                        }
                                                        : {
                                                            id: dataRow.parentId,
                                                            name: '',
                                                        }
                                                    : null,
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
                                    // Navigate với state
                                    navigate(`/simulation/${simulationId}/task/create`, {
                                        state: {
                                            parentTask: {
                                                id: dataRow.id,
                                                name: dataRow.name,
                                            },
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
                                    navigate(`/simulation/${simulationId}/task/${dataRow.id}`, {
                                        state:
                                            dataRow.kind === TaskTypes.SUBTASK
                                                ? {
                                                    parentTask: dataRow.parent
                                                        ? {
                                                            id: dataRow.parent.id,
                                                            name: dataRow.parent.name,
                                                        }
                                                        : {
                                                            id: dataRow.parentId,
                                                            name: '',
                                                        },
                                                }
                                                : null,
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

            const originalRenderActionBar = funcs.renderActionBar;
            funcs.renderActionBar = () => {
                return originalRenderActionBar({
                    createText: labels.createTask,
                });
            };
        },
    });

    const hierarchicalData = useMemo(() => {
        if (!data || data.length === 0) return [];

        const tasksMap = new Map();
        const subTasks = [];

        data.forEach((item) => {
            const isSubtask = item.parent || item.parentId || item.kind === TaskTypes.SUBTASK || item.kind === 0;

            if (isSubtask) {
                subTasks.push({
                    ...item,
                    kind: TaskTypes.SUBTASK,
                });
            } else {
                tasksMap.set(item.id, {
                    ...item,
                    kind: TaskTypes.TASK,
                    children: [],
                });
            }
        });

        subTasks.forEach((subTask) => {
            const parentId = subTask.parent?.id || subTask.parentId;
            if (parentId && tasksMap.has(parentId)) {
                const parentTask = tasksMap.get(parentId);
                tasksMap.get(parentId).children.push({
                    ...subTask,
                    parent: {
                        id: parentTask.id,
                        name: parentTask.name,
                    },
                });
            } else {
                tasksMap.set(`orphan_${subTask.id}`, subTask);
            }
        });

        return Array.from(tasksMap.values());
    }, [data]);

    const handleRowClick = (record) => {
        navigate(`/simulation/${simulationId}/task/${record.id}`, {
            state:
                record.kind === TaskTypes.SUBTASK
                    ? {
                        parentTask: record.parent
                            ? {
                                id: record.parent.id,
                                name: record.parent.name,
                            }
                            : {
                                id: record.parentId,
                                name: '',
                            },
                    }
                    : null,
        });
    };

    const columns = [
        {
            title: '#',
            width: '50px',
            align: 'center',
            render: (_, record) => {
                if (record.kind === TaskTypes.TASK) {
                    const parentIndex = hierarchicalData.findIndex((item) => item.id === record.id);
                    return parentIndex + 1;
                }
                return '';
            },
        },
        // {
        //     title: labels.image,
        //     dataIndex: 'imagePath',
        //     align: 'center',
        //     width: '80px',
        //     render: imagePath => (
        //         <AvatarField
        //             size="large"
        //             icon={<FileTextOutlined />}
        //             src={imagePath ? `${AppConstants.contentRootUrl}${imagePath}` : null}
        //             shape="square"
        //         />
        //     ),
        // },
        {
            title: labels.name,
            dataIndex: 'name',
            width: '200px',
            render: (text, record) => (
                <div
                    style={{
                        paddingLeft: record.kind === TaskTypes.SUBTASK ? 20 : 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        cursor: 'pointer',
                        color: record.kind === TaskTypes.TASK ? '#1890ff' : 'inherit',
                        fontWeight: record.kind === TaskTypes.TASK ? 600 : 400,
                    }}
                >
                    {record.kind === TaskTypes.SUBTASK && <span style={{ color: '#999' }}>└─</span>}
                    {text}
                </div>
            ),
        },
        {
            title: labels.title,
            dataIndex: 'title',
            width: '220px',
        },
        {
            title: labels.totalQuestion,
            dataIndex: 'totalQuestion',
            align: 'center',
            width: '120px',
            render: (value, record) => {
                return record.kind === TaskTypes.SUBTASK ? value || 0 : '-';
            },
        },
        {
            title: labels.maxErrors,
            dataIndex: 'maxErrors',
            align: 'center',
            width: '100px',
            render: (value, record) => {
                return record.kind === TaskTypes.SUBTASK ? value || 0 : '-';
            },
        },
        mixinFuncs.renderActionColumn(
            {
                edit: isEducator ? () => mixinFuncs.hasPermission([apiConfig.task.update.permissionCode]) : false,
                delete: isEducator ? () => mixinFuncs.hasPermission([apiConfig.task.delete.permissionCode]) : false,
                createSubTask: (record) => {
                    if (record.kind !== TaskTypes.TASK || !isEducator) {
                        return false;
                    }
                    return mixinFuncs.hasPermission([apiConfig.task.create.permissionCode]);
                },
                viewDetails: () => {
                    return isEducator ? false : true;
                },
                question: (record) => {
                    if (record.kind !== TaskTypes.SUBTASK) {
                        return false;
                    }
                    return mixinFuncs.hasPermission([
                        isEducator
                            ? apiConfig.taskQuestion.educatorList.permissionCode
                            : apiConfig.taskQuestion.getList.permissionCode,
                    ]);
                },
            },
            { width: '200px', title: labels.action },
        ),
    ];

    const searchFields = [
        { key: 'name', placeholder: labels.name },
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
                baseTable={
                    <BaseTable
                        onChange={mixinFuncs.changePagination}
                        columns={columns}
                        dataSource={hierarchicalData}
                        loading={loading}
                        rowKey={(record) => record.id}
                        pagination={pagination}
                        expandable={{
                            defaultExpandAllRows: true,
                            expandIcon: ({ expanded, onExpand, record }) => {
                                if (record.kind === TaskTypes.TASK && record.children?.length > 0) {
                                    return (
                                        <RightOutlined
                                            rotate={expanded ? 90 : 0}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onExpand(record, e);
                                            }}
                                            style={{
                                                cursor: 'pointer',
                                                marginRight: 8,
                                                transition: 'transform 0.3s',
                                            }}
                                        />
                                    );
                                }
                                return null;
                            },
                            indentSize: 0,
                        }}
                        onRow={(record) => ({
                            onClick: () => handleRowClick(record),
                            style: {
                                cursor: 'pointer',
                                backgroundColor: record.kind === TaskTypes.TASK ? '#fafafa' : '#ffffff',
                            },
                        })}
                        locale={{ emptyText: <Empty description={labels.noData} /> }}
                    />
                }
            />
        </PageWrapper>
    );
};

export default TaskListPage;
