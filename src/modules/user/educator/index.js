import React from 'react';
import { Empty, Tag, Button, Modal } from 'antd';
import { UserOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import useListBase from '@hooks/useListBase';
import useFetch from '@hooks/useFetch';
import useTranslate from '@hooks/useTranslate';
import useNotification from '@hooks/useNotification';

import {
    AppConstants,
    DEFAULT_TABLE_ITEM_SIZE,
} from '@constants';
import apiConfig from '@constants/apiConfig';
import { FieldTypes } from '@constants/formConfig';
import { educatorStatusOptions } from '@constants/masterData';
import { commonMessage } from '@locales/intl';

import AvatarField from '@components/common/form/AvatarField';
import BaseTable from '@components/common/table/BaseTable';
import ListPage from '@components/common/layout/ListPage';
import PageWrapper from '@components/common/layout/PageWrapper';

import { calculateIndex, getColumnWidth } from '@utils';

// Định nghĩa status constants
const STATUS_ACTIVE = 1;
const STATUS_WAITING_APPROVE = 2;
const STATUS_REJECT = -2;

const EducatorListPage = ({ pageOptions }) => {
    const translate = useTranslate();
    const navigate = useNavigate();
    const notificationApi = useNotification();

    const formattedStatusOptions = translate.formatKeys(educatorStatusOptions, ['label']);
    const statusMap = Object.fromEntries(
        formattedStatusOptions.map(item => [item.value, item]),
    );

    const labels = {
        fullName:       translate.formatMessage(commonMessage.fullName),
        email:          translate.formatMessage(commonMessage.email),
        phone:          translate.formatMessage(commonMessage.phone),
        avatar:         translate.formatMessage(commonMessage.avatar),
        status:         translate.formatMessage(commonMessage.status),
        noData:         translate.formatMessage(commonMessage.noData),
        action:         translate.formatMessage(commonMessage.action),
        educator:       'khoa chuyên môn',
    };

    const statusValues = formattedStatusOptions.map(item => ({
        value: item.value,
        label: item.label,
    }));

    // Khởi tạo hooks cho approve/reject
    const { execute: executeApprove } = useFetch(apiConfig.educator.approve);
    const { execute: executeReject } = useFetch(apiConfig.educator.reject);

    const { data, mixinFuncs, queryFilter, loading, pagination, setData, setLoading } = useListBase({
        apiConfig: {
            getList:      apiConfig.educator.getList,
            delete:       apiConfig.educator.delete,
            update:       apiConfig.educator.update,
            approve:      apiConfig.educator.approve,
            reject:       apiConfig.educator.reject,
        },
        options: {
            objectName: labels.educator,
            pageSize:   DEFAULT_TABLE_ITEM_SIZE,
        },
        override: (funcs) => {
            // ============ HELPER FUNCTIONS ============
            const handleApiResponse = (response, successMessage, errorMessage, onSuccess) => {
                console.log('=== API Response ===');
                console.log('Full Response:', response);
                console.log('Result:', response?.result);
                console.log('Message:', response?.message);
                console.log('===================');

                const { result, message: apiMessage } = response;
                if (result === true) {
                    notificationApi({
                        type: 'success',
                        message: apiMessage ? `${successMessage}: ${apiMessage}` : successMessage,
                    });
                    onSuccess?.();
                } else {
                    notificationApi({
                        type: 'error',
                        message: apiMessage || errorMessage,
                    });
                }
            };

            const handleApiError = (error, defaultMessage) => {
                console.log('=== API Error Details ===');
                console.log('Full Error:', error);
                console.log('Response Data:', error?.response?.data);
                console.log('Status:', error?.response?.status);
                console.log('========================');

                const errorMessage = error?.response?.data?.message || error.message || defaultMessage;
                notificationApi({
                    type: 'error',
                    message: errorMessage,
                });
            };

            // ============ APPROVE FUNCTION ============
            funcs.handleApprove = (id) => {
                if (!apiConfig.educator.approve || !id) return;

                Modal.confirm({
                    title: 'Xác nhận phê duyệt',
                    content: `Bạn có chắc chắn muốn phê duyệt ${labels.educator} này?`,
                    okText: 'Xác nhận',
                    cancelText: 'Hủy',
                    onOk: () => {
                        setLoading(true);

                        executeApprove({
                            data: { id },
                            onCompleted: (response) => {
                                handleApiResponse(
                                    response,
                                    `Phê duyệt ${labels.educator} thành công`,
                                    `Phê duyệt ${labels.educator} thất bại`,
                                    () => {
                                        // Cập nhật status thành ACTIVE
                                        setData((prevData) =>
                                            prevData.map((item) =>
                                                item.id === id 
                                                    ? { 
                                                        ...item, 
                                                        account: { 
                                                            ...item.account, 
                                                            status: STATUS_ACTIVE, 
                                                        }, 
                                                    } 
                                                    : item,
                                            ),
                                        );
                                    },
                                );
                                setLoading(false);
                            },
                            onError: (error) => {
                                handleApiError(error, 'Có lỗi xảy ra khi phê duyệt');
                                setLoading(false);
                            },
                        });
                    },
                });
            };

            // ============ REJECT FUNCTION ============
            funcs.handleReject = (id) => {
                if (!apiConfig.educator.reject || !id) return;

                Modal.confirm({
                    title: 'Xác nhận từ chối',
                    content: `Bạn có chắc chắn muốn từ chối ${labels.educator} này?`,
                    okText: 'Xác nhận',
                    cancelText: 'Hủy',
                    okButtonProps: { danger: true },
                    onOk: () => {
                        setLoading(true);

                        executeReject({
                            data: { id },
                            onCompleted: (response) => {
                                handleApiResponse(
                                    response,
                                    `Từ chối ${labels.educator} thành công`,
                                    `Từ chối ${labels.educator} thất bại`,
                                    () => {
                                        // Cập nhật status thành REJECT
                                        setData((prevData) =>
                                            prevData.map((item) =>
                                                item.id === id 
                                                    ? { 
                                                        ...item, 
                                                        account: { 
                                                            ...item.account, 
                                                            status: STATUS_REJECT, 
                                                        }, 
                                                    } 
                                                    : item,
                                            ),
                                        );
                                    },
                                );
                                setLoading(false);
                            },
                            onError: (error) => {
                                handleApiError(error, 'Có lỗi xảy ra khi từ chối');
                                setLoading(false);
                            },
                        });
                    },
                });
            };

            // ============ STATUS COLUMN ============
            funcs.renderStatusColumn = (columnsProps) => ({
                title: labels.status,
                dataIndex: ['account', 'status'],
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

            // ============ ACTION BUTTONS ============
            const originalActionColumnButtons = funcs.actionColumnButtons;
            funcs.actionColumnButtons = (additionalButtons = {}) => {
                const buttons = {
                    ...originalActionColumnButtons(additionalButtons),
                    // Nút Approve
                    approve: ({ id, account, buttonProps }) =>
                        account?.status === STATUS_WAITING_APPROVE ? (
                            <Button
                                type="link"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    funcs.handleApprove(id);
                                }}
                                title="Phê duyệt"
                                {...buttonProps}
                            >
                                <CheckCircleOutlined />
                            </Button>
                        ) : null,
                    // Nút Reject
                    reject: ({ id, account, buttonProps }) =>
                        account?.status === STATUS_WAITING_APPROVE ? (
                            <Button
                                type="link"
                                danger
                                onClick={(e) => {
                                    e.stopPropagation();
                                    funcs.handleReject(id);
                                }}
                                title="Từ chối"
                                {...buttonProps}
                            >
                                <CloseCircleOutlined />
                            </Button>
                        ) : null,
                };

                return buttons;
            };

            funcs.renderActionBar = () => null;
        },
    });

    const columns = [
        {
            title: '#',
            width: '40px',
            align: 'center',
            render: (_, __, index) => calculateIndex(index, pagination, queryFilter),
        },
        {
            title: labels.avatar,
            dataIndex: ['account', 'avatar'],
            align: 'center',
            render: avatar => (
                <AvatarField
                    size="large"
                    icon={<UserOutlined />}
                    src={avatar ? `${AppConstants.contentRootUrl}${avatar}` : null}
                />
            ),
            width: getColumnWidth({ width: labels.avatar.length * 12 }),
        },
        {
            title: labels.fullName,
            dataIndex: ['account', 'fullName'],
        },
        {
            title: labels.email,
            dataIndex: ['account', 'email'],
            width: getColumnWidth({ data, dataIndex: 'account.email', ratio: 8 }),
        },
        {
            title: labels.phone,
            dataIndex: ['account', 'phone'],
            width: labels.phone.length * 10,
        },
        mixinFuncs.renderStatusColumn({ width: '120px' }),
        mixinFuncs.renderActionColumn(
            {
                edit: record =>
                    mixinFuncs.hasPermission([apiConfig.educator.update.permissionCode]),
                delete: record =>
                    mixinFuncs.hasPermission([apiConfig.educator.delete.permissionCode]) &&
                    !record.isSuperAdmin,
                approve: record =>
                    record.account?.status === STATUS_WAITING_APPROVE &&
                    mixinFuncs.hasPermission([apiConfig.educator.approve?.permissionCode]),
                reject: record =>
                    record.account?.status === STATUS_WAITING_APPROVE &&
                    mixinFuncs.hasPermission([apiConfig.educator.reject?.permissionCode]),
            },
            {
                width: '180px',
                title: labels.action,
            },
        ),
    ];

    const searchFields = [
        { key: 'fullName', placeholder: labels.fullName },
        { key: 'phone',    placeholder: labels.phone, type: FieldTypes.NUMBER },
        { key: 'email',    placeholder: labels.email },
        {
            key: 'status',
            placeholder: labels.status,
            type: FieldTypes.SELECT,
            options: statusValues,
        },
    ];

    return (
        <PageWrapper routes={pageOptions.renderBreadcrumbs(commonMessage, translate)}>
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
                        onRow={(record, idx) => ({
                            style: { backgroundColor: idx % 2 ? '#f9f9f9' : '#ffffff' },
                        })}
                        locale={{
                            emptyText: <Empty description={labels.noData} />,
                        }}
                    />
                }
            />
        </PageWrapper>
    );
};

export default EducatorListPage;