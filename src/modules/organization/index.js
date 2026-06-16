import React from 'react';
import { Empty, Avatar } from 'antd';

import useListBase from '@hooks/useListBase';
import useTranslate from '@hooks/useTranslate';

import { DEFAULT_TABLE_ITEM_SIZE, AppConstants } from '@constants';
import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';

import BaseTable from '@components/common/table/BaseTable';
import ListPage from '@components/common/layout/ListPage';
import PageWrapper from '@components/common/layout/PageWrapper';

const OrganizationListPage = ({ pageOptions = {} }) => {
    const translate = useTranslate();

    const labels = {
        name: translate.formatMessage(commonMessage.name),
        shortName: 'Tên viết tắt',
        description: translate.formatMessage(commonMessage.description),
        logo: 'Logo',
        noData: translate.formatMessage(commonMessage.noData),
        action: translate.formatMessage(commonMessage.action),
        organization: 'Tổ chức',
    };

    const { data, mixinFuncs, loading, pagination, queryFilter } = useListBase({
        apiConfig: {
            getList: apiConfig.organization.list,
            delete: apiConfig.organization.delete,
            create: apiConfig.organization.create,
            update: apiConfig.organization.update,
        },
        options: {
            objectName: labels.organization,
            pageSize: DEFAULT_TABLE_ITEM_SIZE,
        },
        override: (funcs) => {
            funcs.getCreateLink = () => {
                return '/organization/create';
            };

            funcs.getItemDetailLink = (record) => {
                return `/organization/${record.id}`;
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
            title: labels.logo,
            dataIndex: 'logoUrl',
            width: '100px',
            align: 'center',
            render: (logoUrl) => {
                const fullUrl = logoUrl
                    ? logoUrl.startsWith('http')
                        ? logoUrl
                        : `${AppConstants.contentRootUrl}${logoUrl}`
                    : null;
                return <Avatar src={fullUrl} shape="square" size={40} alt="Logo" />;
            },
        },
        {
            title: labels.name,
            dataIndex: 'name',
            width: '250px',
        },
        {
            title: labels.shortName,
            dataIndex: 'shortName',
            width: '150px',
        },
        {
            title: labels.description,
            dataIndex: 'description',
            width: '350px',
            render: (text) => text || '-',
        },
        mixinFuncs.renderActionColumn(
            {
                edit: () => mixinFuncs.hasPermission([apiConfig.organization.update.permissionCode]),
                delete: () => mixinFuncs.hasPermission([apiConfig.organization.delete.permissionCode]),
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

    const breadcrumbs = [
        { breadcrumbName: translate.formatMessage(commonMessage.home) },
        { breadcrumbName: labels.organization },
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
                        rowKey={(record) => record.id}
                        pagination={pagination}
                        locale={{ emptyText: <Empty description={labels.noData} /> }}
                    />
                }
            />
        </PageWrapper>
    );
};

export default OrganizationListPage;
