import apiConfig from '@constants/apiConfig';
import useListBase from '@hooks/useListBase';
import React from 'react';
import BaseTable from '@components/common/table/BaseTable';

import { DEFAULT_TABLE_ITEM_SIZE, UserTypes, groupPermissionKindsOptions, storageKeys } from '@constants';
import PageWrapper from '@components/common/layout/PageWrapper';
import ListPage from '@components/common/layout/ListPage';
import { FieldTypes } from '@constants/formConfig';
import { getData } from '@utils/localStorage';
import useTranslate from '@hooks/useTranslate';
import { commonMessage } from '@locales/intl';
import { Empty } from 'antd';

const GroupPermissionListPage = () => {
    const translate = useTranslate();
    const groupPermissionValues = translate.formatKeys(groupPermissionKindsOptions, ['label']);
    const useKind = getData(storageKeys.USER_KIND) || UserTypes.ADMIN;
    const { data, mixinFuncs, queryFilter, loading, pagination } = useListBase({
        apiConfig: apiConfig.groupPermission,
        options: {
            pageSize: DEFAULT_TABLE_ITEM_SIZE,
            objectName: translate.formatMessage(commonMessage.role)?.toLowerCase(),
        },
        override: (funcs) => {
            funcs.getList = () => {
                const params = mixinFuncs.prepareGetListParams(queryFilter);
                mixinFuncs.handleFetchList({ kind: useKind, ...params });
            };

            funcs.mappingData = (response) => {
                if (response.result === true) {
                    return {
                        data: response.data.content,
                        total: response.data.totalElements,
                    };
                }
            };
        },
    });

    const columns = [
        { title: translate.formatMessage(commonMessage.Name), dataIndex: 'name' },
        // { title: translate.formatMessage(commonMessage.description), dataIndex: 'description' },
        mixinFuncs.renderActionColumn(
            {
                edit: mixinFuncs.hasPermission([apiConfig?.groupPermission?.update?.permissionCode]),
                // delete: (record) => {
                //     return (
                //         !record.isSystemRole &&
                //         mixinFuncs.hasPermission([apiConfig?.groupPermission?.delete?.permissionCode])
                //     );
                // },
            },
            { width: '120px' },
        ),
    ];

    const searchFields = [
        {
            key: 'name',
            placeholder: translate.formatMessage(commonMessage.Name),
        },
        {
            key: 'kind',
            type: FieldTypes.SELECT,
            options: groupPermissionValues,
            placeholder: 'Kind',
            submitOnChanged: true,
        },
    ];

    return (
        <PageWrapper routes={[{ breadcrumbName: translate.formatMessage(commonMessage.role) }]}>
            <ListPage
                actionBar={mixinFuncs.renderActionBar({})}
                searchForm={mixinFuncs.renderSearchForm({
                    fields: searchFields,
                    initialValues: { kind: useKind, ...queryFilter },
                })}
                baseTable={
                    <BaseTable
                        onChange={mixinFuncs.changePagination}
                        columns={columns}
                        dataSource={data}
                        loading={loading}
                        rowKey={(record) => record.id}
                        pagination={pagination}
                        locale={{ emptyText: <Empty description={translate.formatMessage(commonMessage.noData)} /> }}
                    />
                }
            />
        </PageWrapper>
    );
};

export default GroupPermissionListPage;
