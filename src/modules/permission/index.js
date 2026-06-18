import React from 'react';
import { Empty } from 'antd';

import useListBase from '@hooks/useListBase';
import useTranslate from '@hooks/useTranslate';

import { DEFAULT_TABLE_ITEM_SIZE } from '@constants';
import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';

import BaseTable from '@components/common/table/BaseTable';
import ListPage from '@components/common/layout/ListPage';
import PageWrapper from '@components/common/layout/PageWrapper';

const PermissionListPage = ({ pageOptions = {} }) => {
    const translate = useTranslate();

    const labels = {
        name: translate.formatMessage(commonMessage.name),
        noData: translate.formatMessage(commonMessage.noData),
        action: translate.formatMessage(commonMessage.action),
        permission: 'Quyền hạn',
        permissionCode: 'Mã quyền',
        nameGroup: 'Nhóm quyền',
    };

    const { data, mixinFuncs, queryFilter, loading, pagination } = useListBase({
        apiConfig: {
            getList: apiConfig.permission.getList,
            delete: apiConfig.permission.delete,
            create: apiConfig.permission.create,
            update: apiConfig.permission.update,
        },
        options: {
            objectName: labels.permission,
            pageSize: DEFAULT_TABLE_ITEM_SIZE,
        },
        override: (funcs) => {
            funcs.getCreateLink = () => {
                return '/permission/create';
            };

            funcs.getItemDetailLink = (record) => {
                return `/permission/${record.id}`;
            };

            funcs.mappingData = (response) => {
                if (response.result === true) {
                    return {
                        data: response.data || [],
                        total: response.data ? response.data.length : 0,
                    };
                }
            };
        },
    });

    const processedData = React.useMemo(() => {
        if (!data) return [];
        
        // Sắp xếp theo tên nhóm quyền trước để các quyền cùng nhóm đứng cạnh nhau
        const sorted = [...data].sort((a, b) => {
            const groupA = a.nameGroup || '';
            const groupB = b.nameGroup || '';
            return groupA.localeCompare(groupB);
        });

        // Tính toán độ rộng dòng (rowSpan) cho cột nhóm quyền
        const spans = [];
        let i = 0;
        while (i < sorted.length) {
            const currentGroup = sorted[i].nameGroup;
            let j = i + 1;
            while (j < sorted.length && sorted[j].nameGroup === currentGroup) {
                j++;
            }
            const count = j - i;
            spans[i] = count;
            for (let k = i + 1; k < j; k++) {
                spans[k] = 0;
            }
            i = j;
        }

        return sorted.map((item, index) => ({
            ...item,
            rowSpan: spans[index] !== undefined ? spans[index] : 0,
        }));
    }, [data]);

    const columns = [
        {
            title: labels.nameGroup,
            dataIndex: 'nameGroup',
            width: '220px',
            onCell: (record) => ({
                rowSpan: record.rowSpan,
            }),
            render: (value) => <strong>{value || 'Chưa phân nhóm'}</strong>,
        },
        {
            title: '#',
            width: '80px',
            align: 'center',
            render: (_, record, index) => {
                return index + 1;
            },
        },
        {
            title: labels.name,
            dataIndex: 'name',
            width: '250px',
        },
        {
            title: labels.permissionCode,
            dataIndex: 'pcode',
            width: '200px',
        },
        {
            title: 'Action API',
            dataIndex: 'action',
            width: '200px',
        },
        mixinFuncs.renderActionColumn(
            {
                edit: () => mixinFuncs.hasPermission([apiConfig.permission.update.permissionCode]),
                delete: () => mixinFuncs.hasPermission([apiConfig.permission.delete.permissionCode]),
            },
            { width: '150px', title: labels.action },
        ),
    ];

    const searchFields = [
        {
            key: 'name',
            placeholder: labels.name,
        },
        {
            key: 'pcode',
            placeholder: labels.permissionCode,
        },
    ];

    const breadcrumbs = pageOptions.renderBreadcrumbs
        ? pageOptions.renderBreadcrumbs(commonMessage, translate)
        : [{ breadcrumbName: 'Quyền hạn', path: '/group-permission' }, { breadcrumbName: 'Quản lý Quyền' }];

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
                        dataSource={processedData}
                        loading={loading}
                        rowKey={(record) => record.id}
                        pagination={pagination}
                        bordered
                        locale={{ emptyText: <Empty description={labels.noData} /> }}
                    />
                }
            />
        </PageWrapper>
    );
};

export default PermissionListPage;
