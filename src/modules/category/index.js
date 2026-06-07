import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Empty } from 'antd';

import useListBase from '@hooks/useListBase';
import useTranslate from '@hooks/useTranslate';

import { DEFAULT_TABLE_ITEM_SIZE } from '@constants';
import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';

import BaseTable from '@components/common/table/BaseTable';
import ListPage from '@components/common/layout/ListPage';
import PageWrapper from '@components/common/layout/PageWrapper';

const SpecializationListPage = ({ pageOptions = {} }) => {
    const translate = useTranslate();
    const navigate = useNavigate();

    const labels = {
        name: translate.formatMessage(commonMessage.name),
        noData: translate.formatMessage(commonMessage.noData),
        action: translate.formatMessage(commonMessage.action),
        specialization: translate.formatMessage(commonMessage.specialization),
    };

    const { data, mixinFuncs, queryFilter, loading, pagination } = useListBase({
        apiConfig: {
            getList: apiConfig.specialization.getList,
            delete: apiConfig.specialization.delete,
            create: apiConfig.specialization.create,
            update: apiConfig.specialization.update,
        },
        options: {
            objectName: labels.specialization,
            pageSize: DEFAULT_TABLE_ITEM_SIZE,
        },
        override: (funcs) => {
            funcs.prepareGetListParams = (params) => ({
                ...params,
            });

            // Override để truyền data qua navigate state khi edit
            funcs.onEdit = (record) => {
                navigate(`/specialization/${record.id}`, {
                    state: { detail: record },
                });
            };
        },
    });

    const columns = [
        {
            title: '#',
            width: '80px',
            align: 'center',
            render: (_, record, index) => {
                return (pagination.current - 1) * pagination.pageSize + index + 1;
            },
        },
        {
            title: labels.name,
            dataIndex: 'name',
            width: '400px',
        },
        mixinFuncs.renderActionColumn(
            {
                edit: () => mixinFuncs.hasPermission([apiConfig.specialization.update.permissionCode]),
                delete: () => mixinFuncs.hasPermission([apiConfig.specialization.delete.permissionCode]),
            },
            { width: '150px', title: labels.action },
        ),
    ];

    const searchFields = [
        { 
            key: 'name', 
            placeholder: labels.name,
        },
    ];

    // Safe render breadcrumbs
    const breadcrumbs = pageOptions.renderBreadcrumbs 
        ? pageOptions.renderBreadcrumbs(commonMessage, translate)
        : [
            { breadcrumbName: translate.formatMessage(commonMessage.home) },
            { breadcrumbName: translate.formatMessage(commonMessage.specialization) },
        ];

    return (
        <PageWrapper routes={breadcrumbs}>
            <ListPage
                searchForm={mixinFuncs.renderSearchForm({
                    fields: searchFields,
                    initialValues: queryFilter,
                })}
                actionBar={mixinFuncs.renderActionBar()}
                baseTable={
                    <BaseTable
                        onChange={mixinFuncs.changePagination}
                        columns={columns}
                        dataSource={data}
                        loading={loading}
                        rowKey={record => record.id}
                        pagination={pagination}
                        locale={{ emptyText: <Empty description={labels.noData} /> }}
                    />
                }
            />
        </PageWrapper>
    );
};

export default SpecializationListPage;