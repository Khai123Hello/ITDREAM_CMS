import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Empty } from 'antd';

import useListBase from '@hooks/useListBase';
import useTranslate from '@hooks/useTranslate';

import { DEFAULT_TABLE_ITEM_SIZE, CATEGORY_KIND_SPECIALIZATION, CATEGORY_KIND_BLOG } from '@constants';
import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';
import { FieldTypes } from '@constants/formConfig';

import BaseTable from '@components/common/table/BaseTable';
import ListPage from '@components/common/layout/ListPage';
import PageWrapper from '@components/common/layout/PageWrapper';

const CategoryListPage = ({ pageOptions = {} }) => {
    const translate = useTranslate();
    const navigate = useNavigate();

    const labels = {
        name: translate.formatMessage(commonMessage.name),
        noData: translate.formatMessage(commonMessage.noData),
        action: translate.formatMessage(commonMessage.action),
        category: 'Danh mục',
    };

    const { data, mixinFuncs, queryFilter, loading, pagination } = useListBase({
        apiConfig: {
            getList: apiConfig.category.getList,
            delete: apiConfig.category.delete,
            create: apiConfig.category.create,
            update: apiConfig.category.update,
        },
        options: {
            objectName: labels.category,
            pageSize: DEFAULT_TABLE_ITEM_SIZE,
        },
        override: (funcs) => {
            funcs.prepareGetListParams = (params) => ({
                ...params,
                kind: params.kind || CATEGORY_KIND_SPECIALIZATION,
            });

            funcs.getCreateLink = () => {
                const kind = queryFilter.kind || CATEGORY_KIND_SPECIALIZATION;
                return `/category/create?kind=${kind}`;
            };

            funcs.getItemDetailLink = (record) => {
                localStorage.setItem('edit_category_name', record.name);
                return `/category/${record.id}?kind=${record.kind}`;
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
                edit: () => mixinFuncs.hasPermission([apiConfig.category.update.permissionCode]),
                delete: () => mixinFuncs.hasPermission([apiConfig.category.delete.permissionCode]),
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
        : [{ breadcrumbName: translate.formatMessage(commonMessage.home) }, { breadcrumbName: labels.category }];

    return (
        <PageWrapper routes={breadcrumbs}>
            <ListPage
                searchForm={mixinFuncs.renderSearchForm({
                    fields: searchFields,
                    initialValues: {
                        kind: CATEGORY_KIND_SPECIALIZATION,
                        ...queryFilter,
                    },
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

export default CategoryListPage;
