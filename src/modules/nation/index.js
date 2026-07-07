import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Empty, Button } from 'antd';
import { UnorderedListOutlined, ArrowLeftOutlined } from '@ant-design/icons';

import useListBase from '@hooks/useListBase';
import useTranslate from '@hooks/useTranslate';
import useFetch from '@hooks/useFetch';

import { DEFAULT_TABLE_ITEM_SIZE } from '@constants';
import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';

import BaseTable from '@components/common/table/BaseTable';
import ListPage from '@components/common/layout/ListPage';
import PageWrapper from '@components/common/layout/PageWrapper';

const NationListPage = ({ pageOptions = {} }) => {
    const translate = useTranslate();
    const navigate = useNavigate();

    const labels = {
        name: translate.formatMessage(commonMessage.name),
        noData: translate.formatMessage(commonMessage.noData),
        action: translate.formatMessage(commonMessage.action),
        nation: 'địa chỉ',
    };

    const { data, mixinFuncs, queryFilter, loading, pagination } = useListBase({
        apiConfig: {
            getList: apiConfig.nation.getList,
            delete: apiConfig.nation.delete,
            create: apiConfig.nation.create,
            update: apiConfig.nation.update,
        },
        options: {
            objectName: labels.nation,
            pageSize: DEFAULT_TABLE_ITEM_SIZE,
        },
        override: (funcs) => {
            const originalPrepareGetListParams = funcs.prepareGetListParams;
            funcs.prepareGetListParams = (filter) => {
                const params = originalPrepareGetListParams(filter);
                const parentId = queryFilter.parentId;
                return {
                    ...params,
                    parentId: parentId ? parseInt(parentId) : undefined,
                    kind: parentId ? undefined : 1, // If there's parentId, we get children (kind=2). Otherwise, only provinces (kind=1).
                };
            };

            funcs.getCreateLink = () => {
                const parentId = queryFilter.parentId;
                if (parentId) {
                    return `/nation/create?kind=2&parentId=${parentId}`;
                }
                return `/nation/create?kind=1`;
            };

            funcs.getItemDetailLink = (record) => {
                const parentId = queryFilter.parentId;
                if (parentId) {
                    return `/nation/${record.id}?kind=2&parentId=${parentId}`;
                }
                return `/nation/${record.id}?kind=1`;
            };
        },
    });

    const { execute: fetchParent } = useFetch(apiConfig.nation.getById);
    const [parentData, setParentData] = useState(null);

    useEffect(() => {
        const parentId = queryFilter.parentId;
        if (parentId) {
            fetchParent({
                pathParams: { id: parentId },
                onCompleted: (res) => {
                    if (res.result) {
                        setParentData(res.data);
                    }
                },
            });
        } else {
            setParentData(null);
        }
    }, [queryFilter.parentId]);

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
    ];

    if (!queryFilter.parentId) {
        columns.push({
            title: 'Xem đơn vị con',
            align: 'center',
            width: '180px',
            render: (_, record) => {
                return (
                    <Button
                        type="link"
                        icon={<UnorderedListOutlined />}
                        onClick={() => navigate(`/nation?parentId=${record.id}`)}
                    >
                        Phường / Xã
                    </Button>
                );
            },
        });
    }

    columns.push(
        mixinFuncs.renderActionColumn(
            {
                edit: () => mixinFuncs.hasPermission([apiConfig.nation.update.permissionCode]),
                delete: () => mixinFuncs.hasPermission([apiConfig.nation.delete.permissionCode]),
            },
            { width: '150px', title: labels.action },
        ),
    );

    const searchFields = [
        {
            key: 'name',
            placeholder: labels.name,
        },
    ];

    const breadcrumbs = pageOptions.renderBreadcrumbs
        ? pageOptions.renderBreadcrumbs(commonMessage, translate, queryFilter.parentId, {
            parentName: parentData?.name,
        })
        : (() => {
            const crumbs = [
                {
                    breadcrumbName: 'Tỉnh thành',
                    path: queryFilter.parentId ? '/nation' : undefined,
                },
            ];
            if (parentData) {
                crumbs.push({
                    breadcrumbName: parentData.name,
                    path: `/nation?parentId=${queryFilter.parentId}`,
                });
                crumbs.push({ breadcrumbName: 'Phường xã' });
            }
            return crumbs;
        })();

    return (
        <PageWrapper routes={breadcrumbs}>
            <ListPage
                searchForm={mixinFuncs.renderSearchForm({
                    fields: searchFields,
                    initialValues: {
                        ...queryFilter,
                    },
                })}
                actionBar={
                    queryFilter.parentId ? (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                width: '100%',
                                gap: 8,
                            }}
                        >
                            <Button onClick={() => navigate('/nation')} icon={<ArrowLeftOutlined />}>
                                Quay lại
                            </Button>
                            {mixinFuncs.renderActionBar()}
                        </div>
                    ) : (
                        mixinFuncs.renderActionBar()
                    )
                }
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

export default NationListPage;
