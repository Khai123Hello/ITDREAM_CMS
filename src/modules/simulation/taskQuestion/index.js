import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Empty, Tag, Button, Tooltip } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

import useListBase from '@hooks/useListBase';
import useTranslate from '@hooks/useTranslate';

import { DEFAULT_TABLE_ITEM_SIZE, storageKeys, UserTypes } from '@constants';
import apiConfig from '@constants/apiConfig';
import { FieldTypes } from '@constants/formConfig';
import { questionTypeOptions } from '@constants/masterData';
import { commonMessage } from '@locales/intl';

import BaseTable from '@components/common/table/BaseTable';
import ListPage from '@components/common/layout/ListPage';
import PageWrapper from '@components/common/layout/PageWrapper';

import { calculateIndex } from '@utils';
import { getData } from '@utils/localStorage';

const TaskQuestionListPage = ({ pageOptions }) => {
    const translate = useTranslate();
    const navigate = useNavigate();
    const { simulationId, taskId } = useParams();

    // Phát hiện user type
    const userType = getData(storageKeys.USER_TYPE);
    const isEducator = userType === UserTypes.EDUCATOR;
    const isAdmin = userType === UserTypes.ADMIN;

    const formattedQuestionTypeOptions = translate.formatKeys(questionTypeOptions, ['label']);
    const questionTypeMap = Object.fromEntries(
        formattedQuestionTypeOptions.map(item => [item.value, item]),
    );

    const labels = {
        question: translate.formatMessage(commonMessage.question),
        options: translate.formatMessage(commonMessage.options),
        questionType: translate.formatMessage(commonMessage.questionType),
        noData: translate.formatMessage(commonMessage.noData),
        action: translate.formatMessage(commonMessage.action),
        taskQuestion: translate.formatMessage(commonMessage.taskQuestion),
        title: translate.formatMessage(commonMessage.title),
        description: translate.formatMessage(commonMessage.description),
        simulation: translate.formatMessage(commonMessage.simulation),
    };

    const questionTypeValues = formattedQuestionTypeOptions.map(item => ({
        value: item.value,
        label: item.label,
    }));

    // Cấu hình API theo role
    const apiConfiguration = isEducator
        ? {
            getList: apiConfig.taskQuestion.educatorList,
            delete: apiConfig.taskQuestion.delete,
            create: apiConfig.taskQuestion.create,
            update: apiConfig.taskQuestion.update,
        }
        : {
            getList: apiConfig.taskQuestion.getList,
            // Admin không có quyền delete, create, update
        };

    const { data, mixinFuncs, queryFilter, loading, pagination } = useListBase({
        apiConfig: apiConfiguration,
        options: {
            objectName: labels.taskQuestion,
            pageSize: DEFAULT_TABLE_ITEM_SIZE,
        },
        override: (funcs) => {
            // Truyền simulationId và taskId vào params cho cả Educator và Admin
            funcs.prepareGetListParams = (params) => ({
                ...params,
                simulationId: simulationId,
                taskId: taskId,
            });

            funcs.renderQuestionTypeColumn = (columnsProps) => ({
                title: labels.questionType,
                dataIndex: 'questionType',
                align: 'center',
                ...columnsProps,
                render: (type) => {
                    const item = questionTypeMap[type] || {};
                    return (
                        <Tag color={item.color || 'blue'}>
                            <div style={{ padding: '0 4px', fontSize: 14 }}>{item.label || 'N/A'}</div>
                        </Tag>
                    );
                },
            });
        },
    });

    const parseOptions = (optionsStr) => {
        // Xử lý trường hợp null hoặc undefined
        if (!optionsStr || optionsStr === 'null' || optionsStr === 'undefined') {
            return <span style={{ color: '#999' }}>-</span>;
        }

        try {
            // Nếu optionsStr đã là object/array, không cần parse
            let options = typeof optionsStr === 'string' ? JSON.parse(optionsStr) : optionsStr;
            
            if (Array.isArray(options) && options.length > 0) {
                return (
                    <div>
                        {options.map((opt, idx) => {
                            // Xử lý trường hợp opt là object
                            let content = '';
                            let isCorrect = false;

                            if (typeof opt === 'object' && opt !== null) {
                                // Lấy content từ các key có thể có
                                content = opt.content || opt.text || opt.option || '';
                                // Kiểm tra answer hoặc isCorrect
                                isCorrect = opt.answer === true || opt.isCorrect === true;
                            } else {
                                // Nếu opt là string hoặc number
                                content = String(opt);
                            }

                            // Không hiển thị nếu content rỗng
                            if (!content) return null;

                            return (
                                <div key={idx} style={{ marginBottom: 4 }}>
                                    <Tag 
                                        color={isCorrect ? 'success' : 'default'}
                                        style={{ 
                                            padding: '2px 8px',
                                            fontSize: '13px',
                                            borderRadius: '4px',
                                        }}
                                    >
                                        {isCorrect && <span style={{ marginRight: 4 }}>✓</span>}
                                        {content}
                                    </Tag>
                                </div>
                            );
                        })}
                    </div>
                );
            }
            
            // Nếu options rỗng hoặc không phải array
            return <span style={{ color: '#999' }}>-</span>;
        } catch (error) {
            console.error('Error parsing options:', error);
            return <span style={{ color: '#999' }}>-</span>;
        }
    };

    const columns = [
        {
            title: '#',
            width: '40px',
            align: 'center',
            render: (_, __, index) => calculateIndex(index, pagination, queryFilter),
        },
        {
            title: labels.question,
            dataIndex: 'question',
            width: '350px',
            ellipsis: true,
            render: (text) => (
                <Tooltip title={text}>
                    <span>{text}</span>
                </Tooltip>
            ),
        },
        {
            title: labels.options,
            dataIndex: 'options',
            width: '300px',
            render: (options) => (
                <div style={{ maxHeight: 100, overflow: 'auto' }}>
                    {parseOptions(options)}
                </div>
            ),
        },
        mixinFuncs.renderQuestionTypeColumn({ width: '150px' }),
        mixinFuncs.renderActionColumn(
            {
                // Educator: có quyền edit và delete
                // Admin: không có quyền gì (chỉ xem)
                edit: isEducator 
                    ? () => mixinFuncs.hasPermission([apiConfig.taskQuestion.update.permissionCode])
                    : false,
                delete: isEducator 
                    ? () => mixinFuncs.hasPermission([apiConfig.taskQuestion.delete.permissionCode])
                    : false,
            },
            { width: '120px', title: labels.action },
        ),
    ];

    const searchFields = [
        { key: 'question', placeholder: labels.question },
        {
            key: 'questionType',
            placeholder: labels.questionType,
            type: FieldTypes.SELECT,
            options: questionTypeValues,
        },
    ];

    const handleCreateClick = () => {
        navigate(`/simulation/${simulationId}/task/${taskId}/question/create`);
    };

    return (
        <PageWrapper
            routes={pageOptions.renderBreadcrumbs(
                commonMessage,
                translate,
                null,
                { simulationId, taskId },
            )}
        >
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
                        dataSource={data}
                        loading={loading}
                        rowKey={(record) => record.id}
                        pagination={pagination}
                        onRow={(record, idx) => ({
                            style: { backgroundColor: idx % 2 ? '#f9f9f9' : '#ffffff' },
                        })}
                        locale={{ emptyText: <Empty description={labels.noData} /> }}
                    />
                }
            />
        </PageWrapper>
    );
};

export default TaskQuestionListPage;