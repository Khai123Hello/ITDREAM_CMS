import React, { useEffect, useState } from 'react';
import { Empty, Avatar } from 'antd';
import dayjs from 'dayjs';

import useListBase from '@hooks/useListBase';
import useTranslate from '@hooks/useTranslate';
import useFetch from '@hooks/useFetch';
import useQueryParams from '@hooks/useQueryParams';

import { DEFAULT_TABLE_ITEM_SIZE, AppConstants, UserTypes, storageKeys } from '@constants';
import { FieldTypes } from '@constants/formConfig';
import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';
import { getData } from '@utils/localStorage';

import BaseTable from '@components/common/table/BaseTable';
import ListPage from '@components/common/layout/ListPage';
import PageWrapper from '@components/common/layout/PageWrapper';

const CommentListPage = () => {
    const translate = useTranslate();
    const { params: queryParams, deserializeParams } = useQueryParams();
    const [tasks, setTasks] = useState([]);

    const labels = {
        user: 'Học viên',
        task: 'Bài học',
        content: 'Nội dung',
        createdDate: 'Thời gian',
        action: translate.formatMessage(commonMessage.action),
        comment: 'Bình luận',
        noData: translate.formatMessage(commonMessage.noData),
    };

    const userType = getData(storageKeys.USER_TYPE);
    const isEducator = userType === UserTypes.EDUCATOR;

    const { execute: executeGetTasks } = useFetch(isEducator ? apiConfig.task.listByEducator : apiConfig.task.getList);

    const { data, mixinFuncs, loading, pagination, queryFilter, setData, setPagination, setLoading } = useListBase({
        apiConfig: {
            getList: apiConfig.comment.list,
            delete: apiConfig.comment.delete,
        },
        options: {
            objectName: labels.comment,
            pageSize: DEFAULT_TABLE_ITEM_SIZE,
        },
        override: (funcs) => {
            funcs.getCreateLink = () => null;
            funcs.getItemDetailLink = () => null;

            // Override handleFetchList to prevent fetching comments without taskId
            funcs.handleFetchList = (params) => {
                if (!params.taskId) {
                    setData([]);
                    setPagination((p) => ({ ...p, total: 0 }));
                    return;
                }
                setLoading(true);
                funcs.executeGetList({
                    params,
                    onCompleted: (response) => {
                        funcs.onCompletedGetList(response);
                        setLoading(false);
                    },
                    onError: (error) => {
                        funcs.handleGetListError(error);
                        setLoading(false);
                    },
                });
            };
        },
    });

    useEffect(() => {
        executeGetTasks({
            params: { page: 0, size: 100 },
            onCompleted: (res) => {
                const fetchedTasks = res.data?.content || [];
                setTasks(fetchedTasks);
                const currentFilter = deserializeParams(queryParams);
                if (!currentFilter.taskId && fetchedTasks.length > 0) {
                    mixinFuncs.changeFilter({ ...currentFilter, taskId: fetchedTasks[0].id });
                }
            },
        });
    }, []);

    const columns = [
        {
            title: '#',
            width: '60px',
            align: 'center',
            render: (_, record, index) => {
                return (pagination.current - 1) * pagination.pageSize + index + 1;
            },
        },
        {
            title: labels.user,
            width: '200px',
            render: (_, record) => {
                const account = record.user || {};
                const fullName = account.fullName || '-';
                const username = account.username ? `(${account.username})` : '';
                const avatar = account.avatar;
                const fullUrl = avatar
                    ? avatar.startsWith('http')
                        ? avatar
                        : `${AppConstants.contentRootUrl}${avatar}`
                    : null;
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Avatar src={fullUrl} size={32} />
                        <div>
                            <div style={{ fontWeight: '500' }}>{fullName}</div>
                            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{username}</div>
                        </div>
                    </div>
                );
            },
        },
        {
            title: labels.content,
            dataIndex: 'content',
            render: (content, record) => {
                const isReply = record.replyToUser;
                return (
                    <div>
                        {isReply && (
                            <span style={{ color: '#1890ff', marginRight: '6px', fontWeight: '500' }}>
                                @{record.replyToUser}
                            </span>
                        )}
                        <span>{content}</span>
                    </div>
                );
            },
        },
        {
            title: labels.createdDate,
            dataIndex: 'createdDate',
            width: '180px',
            render: (date) => (date ? dayjs(date).format('DD/MM/YYYY HH:mm:ss') : '-'),
        },
        mixinFuncs.renderActionColumn(
            {
                edit: false,
                delete: () => mixinFuncs.hasPermission([apiConfig.comment.delete.permissionCode]),
            },
            { width: '100px', title: labels.action, align: 'center' },
        ),
    ];

    const searchFields = [
        {
            key: 'taskId',
            type: FieldTypes.SELECT,
            options: tasks.map((t) => ({ label: t.name, value: t.id })),
            placeholder: 'Chọn bài học',
            submitOnChanged: true,
            colSpan: 6,
        },
        {
            key: 'keyWord',
            placeholder: 'Nội dung bình luận',
            colSpan: 6,
        },
    ];

    const breadcrumbs = [
        { breadcrumbName: translate.formatMessage(commonMessage.home) },
        { breadcrumbName: labels.comment },
    ];

    return (
        <PageWrapper routes={breadcrumbs}>
            <ListPage
                searchForm={mixinFuncs.renderSearchForm({
                    fields: searchFields,
                    initialValues: queryFilter,
                })}
                actionBar={null}
                baseTable={
                    <BaseTable
                        onChange={mixinFuncs.changePagination}
                        columns={columns}
                        dataSource={data}
                        loading={loading}
                        rowKey={(record) => record.id}
                        pagination={pagination}
                        locale={{ emptyText: <Empty description={labels.noData} /> }}
                    />
                }
            />
        </PageWrapper>
    );
};

export default CommentListPage;
