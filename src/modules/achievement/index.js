import React from 'react';
import { Empty, Button, Tooltip } from 'antd';
import { FilePdfOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import useListBase from '@hooks/useListBase';
import useTranslate from '@hooks/useTranslate';
import { DEFAULT_TABLE_ITEM_SIZE, AppConstants } from '@constants';
import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';

import BaseTable from '@components/common/table/BaseTable';
import ListPage from '@components/common/layout/ListPage';
import PageWrapper from '@components/common/layout/PageWrapper';

const AchievementListPage = ({ pageOptions = {} }) => {
    const translate = useTranslate();

    const labels = {
        fullName: 'Tên học viên',
        title: 'Tên bài mô phỏng',
        email: 'Email',
        dateCompleted: 'Ngày đạt được',
        certificate: 'Chứng chỉ',
        noData: translate.formatMessage(commonMessage.noData),
        action: translate.formatMessage(commonMessage.action),
        achievement: 'thành tựu',
    };

    const { data, loading, pagination, mixinFuncs, queryFilter } = useListBase({
        apiConfig: {
            getList: apiConfig.achievement.list,
        },
        options: {
            objectName: labels.achievement,
            pageSize: DEFAULT_TABLE_ITEM_SIZE,
        },
        override: (funcs) => {
            const originalPrepareGetListParams = funcs.prepareGetListParams;
            funcs.prepareGetListParams = (filter) => {
                const params = originalPrepareGetListParams(filter);
                return {
                    ...params,
                    fullName: filter.fullName || undefined,
                    title: filter.title || undefined,
                };
            };
        },
    });

    const handleDownload = (filePath) => {
        if (!filePath) return;
        const normalizedPath = filePath.replace(/\\/g, '/');
        const separator = AppConstants.contentRootUrl.endsWith('/') || normalizedPath.startsWith('/') ? '' : '/';
        const url = normalizedPath.startsWith('http')
            ? normalizedPath
            : `${AppConstants.contentRootUrl}${separator}${normalizedPath}`;
        window.open(url, '_blank');
    };

    const columns = [
        {
            title: '#',
            width: '50px',
            align: 'center',
            render: (_, record, index) => {
                return (pagination.current - 1) * pagination.pageSize + index + 1;
            },
        },
        {
            title: 'Học viên',
            width: '250px',
            render: (_, record) => {
                const fullName = record.student?.account?.fullName || '-';
                const username = record.student?.account?.username || '-';
                const email = record.student?.account?.email || '-';
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
                            {fullName} {username !== '-' && <span style={{ fontWeight: 'normal', color: '#64748b', fontSize: '12px' }}>({username})</span>}
                        </span>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                            {email}
                        </span>
                    </div>
                );
            },
        },
        {
            title: 'Bài mô phỏng',
            render: (_, record) => {
                const title = record.simulation?.title || '-';
                const createdDate = record.createdDate;
                const formattedDate = createdDate ? dayjs(createdDate).format('DD/MM/YYYY HH:mm') : '-';
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontWeight: '500', color: '#0f172a', fontSize: '14px' }}>
                            {title}
                        </span>
                        <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ClockCircleOutlined style={{ fontSize: '11px' }} />
                            <span>Đạt được: {formattedDate}</span>
                        </span>
                    </div>
                );
            },
        },
        {
            title: labels.certificate,
            dataIndex: 'filePath',
            width: '120px',
            align: 'center',
            render: (filePath) => {
                if (!filePath) {
                    return <span style={{ color: '#bfbfbf', fontStyle: 'italic' }}>Chưa sẵn sàng</span>;
                }
                return (
                    <Tooltip title="Tải xuống / Xem chứng chỉ">
                        <Button
                            type="primary"
                            shape="circle"
                            icon={<FilePdfOutlined />}
                            onClick={() => handleDownload(filePath)}
                        />
                    </Tooltip>
                );
            },
        },
    ];

    const searchFields = [
        {
            key: 'fullName',
            placeholder: labels.fullName,
        },
        {
            key: 'title',
            placeholder: labels.title,
        },
    ];

    const breadcrumbs = [
        {
            breadcrumbName: 'Quản lý thành tựu',
        },
    ];

    return (
        <PageWrapper routes={breadcrumbs}>
            <ListPage
                searchForm={mixinFuncs.renderSearchForm({
                    fields: searchFields,
                    initialValues: {
                        ...queryFilter,
                    },
                })}
                baseTable={
                    <BaseTable
                        scroll={{ x: false }}
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

export default AchievementListPage;
