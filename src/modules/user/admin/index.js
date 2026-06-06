import React from 'react';

import useListBase from '@hooks/useListBase';
import useTranslate from '@hooks/useTranslate';
import { AppConstants, DEFAULT_TABLE_ITEM_SIZE } from '@constants';
import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';
import AvatarField from '@components/common/form/AvatarField';
import BaseTable from '@components/common/table/BaseTable';
import ListPage from '@components/common/layout/ListPage';
import PageWrapper from '@components/common/layout/PageWrapper';
import { educatorStatusOptions } from '@constants/masterData';

import { UserOutlined } from '@ant-design/icons';
import { Empty, Tag } from 'antd';
import { calculateIndex, getColumnWidth } from '@utils';
import { FieldTypes } from '@constants/formConfig';

const AdminListPage = ({ pageOptions }) => {
    const translate = useTranslate();

    const formattedStatusOptions = translate.formatKeys(educatorStatusOptions, ['label']);
    const statusMap = Object.fromEntries(
        formattedStatusOptions.map(item => [item.value, item]),
    );

    const apiConfiguration = {
        getList: apiConfig.account.adminList,
        delete: apiConfig.account.delete,
        create: apiConfig.account.createAdmin,
        update: apiConfig.account.updateAdmin,
    };

    const { data, mixinFuncs, queryFilter, loading, pagination } = useListBase({
        apiConfig: apiConfiguration,
        options: {
            pageSize: DEFAULT_TABLE_ITEM_SIZE,
            objectName: translate
                .formatMessage(pageOptions.objectName)
                ?.toLowerCase(),
        },
        override: (funcs) => {
            const originalActionColumnButtons = funcs.actionColumnButtons;

            // ✅ Ghi đè hàm renderStatusColumn
            funcs.renderStatusColumn = (columnsProps) => ({
                title: translate.formatMessage(commonMessage.status),
                dataIndex: 'status',
                align: 'center',
                ...columnsProps,
                render: (status) => {
                    const item = statusMap[status] || {};
                    return (
                        <Tag color={item.color}>
                            <div style={{ padding: '0 4px', fontSize: 14 }}>{item.label}</div>
                        </Tag>
                    );
                },
            });
        },
    });

    const columns = [
        {
            title: '#',
            width: '30px',
            align: 'center',
            render: (text, record, index) =>
                calculateIndex(index, pagination, queryFilter),
        },
        {
            title: translate.formatMessage(commonMessage.avatar),
            dataIndex: 'avatar',
            align: 'center',
            render: (avatar) => (
                <AvatarField
                    size="large"
                    icon={<UserOutlined />}
                    src={
                        avatar
                            ? `${AppConstants.contentRootUrl}${avatar}`
                            : null
                    }
                />
            ),
            width: getColumnWidth({
                width: translate.formatMessage(commonMessage.avatar).length * 10,
            }),
        },
        {
            title: translate.formatMessage(commonMessage.username),
            dataIndex: 'username',
        },
        {
            title: translate.formatMessage(commonMessage.fullName),
            dataIndex: 'fullName',
            width: getColumnWidth({
                data,
                dataIndex: 'fullName',
                ratio: 8,
                width: 120,
            }),
        },
        {
            title: translate.formatMessage(commonMessage.email),
            dataIndex: 'email',
            width: getColumnWidth({
                data,
                dataIndex: 'email',
                ratio: 8,
            }),
        },
        {
            title: translate.formatMessage(commonMessage.phone),
            dataIndex: 'phone',
            width: translate.formatMessage(commonMessage.phone).length * 10,
        },
        mixinFuncs.renderStatusColumn({ width: '120px' }),
        mixinFuncs.renderActionColumn(
            {
                edit: mixinFuncs.hasPermission([
                    apiConfig?.account?.updateAdmin?.permissionCode,
                ]),
                delete: (record) =>
                    mixinFuncs.hasPermission([
                        apiConfig?.account?.delete?.permissionCode,
                    ]) && !record.isSuperAdmin,
            },
            { width: '120px' },
        ),
    ];

    const searchFields = [
        {
            key: 'fullName',
            placeholder: translate.formatMessage(commonMessage.fullName),
        },
        {
            key: 'phone',
            placeholder: translate.formatMessage(commonMessage.phone),
            type: FieldTypes.NUMBER,
        },
        {
            key: 'email',
            placeholder: translate.formatMessage(commonMessage.email),
        },
    ];

    return (
        <PageWrapper
            routes={pageOptions.renderBreadcrumbs(commonMessage,translate)}
        >
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
                        onRow={(record, index) => ({
                            style: {
                                backgroundColor:
                                    index % 2 === 1 ? '#fefefe' : '#ffffff',
                            },
                        })}
                        locale={{
                            emptyText: (
                                <Empty
                                    description={translate.formatMessage(
                                        commonMessage.noData,
                                    )}
                                />
                            ),
                        }}
                    />
                }
            />
        </PageWrapper>
    );
};

export default AdminListPage;
