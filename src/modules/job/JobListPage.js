import React from 'react';
import { Empty, Tag, Avatar, Tooltip } from 'antd';

import useListBase from '@hooks/useListBase';
import useTranslate from '@hooks/useTranslate';

import { DEFAULT_TABLE_ITEM_SIZE, AppConstants } from '@constants';
import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';

import BaseTable from '@components/common/table/BaseTable';
import ListPage from '@components/common/layout/ListPage';
import PageWrapper from '@components/common/layout/PageWrapper';

const opportunityTypeMap = {
    1: { label: 'Sự kiện', color: 'blue' },
    2: { label: 'Công việc', color: 'green' },
};

const roleTypeMap = {
    1: { label: 'Thực tập', color: 'orange' },
    2: { label: 'Chính thức', color: 'purple' },
};

const JobListPage = () => {
    const translate = useTranslate();

    const labels = {
        name: 'Tiêu đề',
        company: 'Công ty',
        opportunityType: 'Loại',
        roleType: 'Vai trò',
        field: 'Lĩnh vực',
        country: 'Quốc gia',
        recommended: 'Đề xuất',
        noData: translate.formatMessage(commonMessage.noData),
        action: translate.formatMessage(commonMessage.action),
        job: 'Cơ hội việc làm',
    };

    const { data, mixinFuncs, loading, pagination, queryFilter } = useListBase({
        apiConfig: {
            getList: apiConfig.job.list,
            delete: apiConfig.job.delete,
        },
        options: {
            objectName: labels.job,
            pageSize: DEFAULT_TABLE_ITEM_SIZE,
        },
        override: (funcs) => {
            funcs.getCreateLink = () => '/job/create';
            funcs.getItemDetailLink = (record) => `/job/${record.id}`;
        },
    });

    const columns = [
        {
            title: '#',
            width: '60px',
            align: 'center',
            render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
        },
        {
            title: 'Logo',
            dataIndex: 'logoUrl',
            width: '70px',
            align: 'center',
            render: (logoUrl) => {
                const url = logoUrl
                    ? logoUrl.startsWith('http')
                        ? logoUrl
                        : `${AppConstants.contentRootUrl}${logoUrl}`
                    : null;
                return <Avatar src={url} shape="square" size={36} icon={!url} />;
            },
        },
        {
            title: labels.company,
            dataIndex: 'companyName',
            width: '180px',
        },
        {
            title: labels.name,
            dataIndex: 'title',
            width: '200px',
            ellipsis: true,
            render: (text, record) => (
                <Tooltip title={record.detailTitle || text}>
                    <span style={{ fontWeight: 600 }}>{text}</span>
                </Tooltip>
            ),
        },
        {
            title: labels.opportunityType,
            dataIndex: 'opportunityType',
            width: '100px',
            align: 'center',
            render: (val) => {
                const item = opportunityTypeMap[val] || { label: 'N/A', color: 'default' };
                return <Tag color={item.color}>{item.label}</Tag>;
            },
        },
        {
            title: labels.roleType,
            dataIndex: 'roleType',
            width: '100px',
            align: 'center',
            render: (val) => {
                const item = roleTypeMap[val] || { label: 'N/A', color: 'default' };
                return <Tag color={item.color}>{item.label}</Tag>;
            },
        },
        {
            title: labels.field,
            dataIndex: 'field',
            width: '130px',
            ellipsis: true,
        },
        {
            title: labels.country,
            dataIndex: 'country',
            width: '110px',
        },
        {
            title: labels.recommended,
            dataIndex: 'isRecommended',
            width: '90px',
            align: 'center',
            render: (val) => (
                <Tag color={val === 1 ? 'gold' : 'default'}>
                    {val === 1 ? '★ Nổi bật' : 'Thường'}
                </Tag>
            ),
        },
        mixinFuncs.renderActionColumn(
            {
                edit: true,
                delete: () => mixinFuncs.hasPermission([apiConfig.job.delete.permissionCode]),
            },
            { width: '120px', title: labels.action },
        ),
    ];

    const searchFields = [
        { key: 'title', placeholder: labels.name },
        { key: 'companyName', placeholder: labels.company },
    ];

    return (
        <PageWrapper routes={[{ breadcrumbName: labels.job }]}>
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

export default JobListPage;
