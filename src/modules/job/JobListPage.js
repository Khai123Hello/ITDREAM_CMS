import React, { useState } from 'react';
import { Empty, Tag, Avatar, Tooltip, Select, Modal, Input } from 'antd';
import dayjs from 'dayjs';

import useListBase from '@hooks/useListBase';
import useTranslate from '@hooks/useTranslate';
import useFetch from '@hooks/useFetch';
import useNotification from '@hooks/useNotification';

import { DEFAULT_TABLE_ITEM_SIZE, AppConstants, UserTypes, storageKeys } from '@constants';
import apiConfig from '@constants/apiConfig';
import { FieldTypes } from '@constants/formConfig';
import { commonMessage } from '@locales/intl';
import { getData } from '@utils/localStorage';

import BaseTable from '@components/common/table/BaseTable';
import ListPage from '@components/common/layout/ListPage';
import PageWrapper from '@components/common/layout/PageWrapper';

const opportunityTypeMap = {
    1: { label: 'Sự kiện', color: 'blue' },
    2: { label: 'Tuyển dụng', color: 'green' },
    3: { label: 'Mạng lưới tài năng', color: 'cyan' },
};

const roleTypeMap = {
    1: { label: 'Thực tập', color: 'orange' },
    2: { label: 'Bán thời gian', color: 'purple' },
    3: { label: 'Toàn thời gian', color: 'magenta' },
    4: { label: 'Thực tập & Bán thời gian', color: 'volcano' },
    5: { label: 'Thực tập & Toàn thời gian', color: 'gold' },
    6: { label: 'Bán thời gian & Toàn thời gian', color: 'geekblue' },
    7: { label: 'Tất cả vai trò', color: 'cyan' },
};

const JobListPage = () => {
    const translate = useTranslate();
    const userType = getData(storageKeys.USER_TYPE);
    const isEducator = userType === UserTypes.EDUCATOR;

    const notificationApi = useNotification();
    const { execute: executeUpdateStatus } = useFetch(apiConfig.job.updateStatus);
    const [isLockModalVisible, setIsLockModalVisible] = useState(false);
    const [currentRecordId, setCurrentRecordId] = useState(null);
    const [noticeText, setNoticeText] = useState('');

    const handleStatusChange = (id, newStatus) => {
        if (newStatus === -1) {
            setCurrentRecordId(id);
            setNoticeText('');
            setIsLockModalVisible(true);
        } else {
            Modal.confirm({
                title: 'Xác nhận thay đổi trạng thái',
                content: 'Bạn có chắc chắn muốn thay đổi trạng thái tin tuyển dụng này?',
                okText: 'Xác nhận',
                cancelText: 'Hủy',
                onOk: () => {
                    executeUpdateStatus({
                        data: {
                            id: id,
                            status: newStatus,
                            notice: ' ',
                        },
                        onCompleted: (response) => {
                            if (response.result === true) {
                                notificationApi({
                                    type: 'success',
                                    message: 'Cập nhật trạng thái thành công',
                                });
                                mixinFuncs.getList(); // Tải lại danh sách
                            } else {
                                notificationApi({
                                    type: 'error',
                                    message: response.message || 'Cập nhật trạng thái thất bại',
                                });
                            }
                        },
                        onError: (error) => {
                            notificationApi({
                                type: 'error',
                                message: error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái',
                            });
                        },
                    });
                },
            });
        }
    };

    const handleLockSubmit = () => {
        if (!currentRecordId) return;
        setIsLockModalVisible(false);
        executeUpdateStatus({
            data: {
                id: currentRecordId,
                status: -1,
                notice: noticeText.trim() || ' ',
            },
            onCompleted: (response) => {
                if (response.result === true) {
                    notificationApi({
                        type: 'success',
                        message: 'Khóa tin tuyển dụng thành công',
                    });
                    mixinFuncs.getList(); // Tải lại danh sách
                } else {
                    notificationApi({
                        type: 'error',
                        message: response.message || 'Khóa thất bại',
                    });
                }
                setCurrentRecordId(null);
                setNoticeText('');
            },
            onError: (error) => {
                notificationApi({
                    type: 'error',
                    message: error?.response?.data?.message || 'Có lỗi xảy ra khi khóa',
                });
                setCurrentRecordId(null);
                setNoticeText('');
            },
        });
    };

    const labels = {
        name: 'Tiêu đề',
        company: 'Người đăng / Tổ chức',
        opportunityType: 'Loại',
        roleType: 'Vai trò',
        noData: translate.formatMessage(commonMessage.noData),
        action: translate.formatMessage(commonMessage.action),
        job: 'Tin tuyển dụng',
    };

    const { data, mixinFuncs, loading, pagination, queryFilter } = useListBase({
        apiConfig: isEducator
            ? {
                  getList: apiConfig.job.educatorList,
                  getById: apiConfig.job.educatorGetById,
                  update: apiConfig.job.update,
                  delete: apiConfig.job.delete,
              }
            : {
                  getList: apiConfig.job.list,
                  getById: apiConfig.job.getById,
                  update: apiConfig.job.update,
              },
        options: {
            objectName: labels.job,
            pageSize: DEFAULT_TABLE_ITEM_SIZE,
        },
        override: (funcs) => {
            funcs.getCreateLink = () => {
                return isEducator ? '/job/create' : null;
            };
            funcs.getItemDetailLink = (record) => `/job/${record.id}`;
        },
    });

    const columns = [
        {
            title: '#',
            width: '50px',
            align: 'center',
            render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
        },
        {
            title: 'Tin tuyển dụng',
            dataIndex: 'title',
            render: (text, record) => {
                const image = record.image;
                const url = image
                    ? image.startsWith('http')
                        ? image
                        : `${AppConstants.contentRootUrl}${image}`
                    : null;

                const typeItem = opportunityTypeMap[record.type] || { label: 'N/A', color: 'default' };
                const roleItem = roleTypeMap[record.roleType] || { label: 'N/A', color: 'default' };

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Avatar src={url} shape="square" size={48} icon={!url} style={{ flexShrink: 0 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden' }}>
                            <Tooltip title={text}>
                                <span
                                    style={{
                                        fontWeight: 600,
                                        color: '#262626',
                                        fontSize: '14px',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        display: 'block',
                                    }}
                                >
                                    {text}
                                </span>
                            </Tooltip>
                            {record.notice && record.notice.trim() && (
                                <span
                                    style={{
                                        fontSize: '12px',
                                        color: '#ff4d4f',
                                        fontWeight: '500',
                                        display: 'block',
                                        marginTop: '2px',
                                    }}
                                >
                                    ⚠️ Lý do từ chối/khóa: {record.notice}
                                </span>
                            )}
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                <Tag color={typeItem.color} style={{ margin: 0 }}>
                                    {typeItem.label}
                                </Tag>
                                <Tag color={roleItem.color} style={{ margin: 0 }}>
                                    {roleItem.label}
                                </Tag>
                            </div>
                            {record.jobUrl && (
                                <a
                                    href={record.jobUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        fontSize: '12px',
                                        color: '#1890ff',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        width: 'fit-content',
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    Liên kết ứng tuyển ↗
                                </a>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            title: 'Người đăng / Tổ chức',
            dataIndex: 'educator',
            width: '220px',
            render: (educator, record) => {
                const name =
                    educator?.profileAccountDto?.fullName ||
                    educator?.fullName ||
                    educator?.account?.fullName ||
                    educator?.name ||
                    '-';
                const orgName = educator?.organization?.name || educator?.organization?.shortName;
                const logo = educator?.organization?.logoUrl;
                const logoUrl = logo
                    ? logo.startsWith('http')
                        ? logo
                        : `${AppConstants.contentRootUrl}${logo}`
                    : null;
                const provinceName = record.province?.name;

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {logoUrl ? (
                            <Avatar size={32} shape="circle" src={logoUrl} style={{ flexShrink: 0 }} />
                        ) : (
                            <div
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: '#f1f5f9',
                                    border: '1px solid #e2e8f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '11px',
                                    color: '#64748b',
                                    fontWeight: 'bold',
                                    flexShrink: 0,
                                }}
                            >
                                {orgName ? orgName.substring(0, 2).toUpperCase() : 'G'}
                            </div>
                        )}
                        <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div
                                style={{
                                    fontWeight: '600',
                                    fontSize: '13px',
                                    color: '#1e293b',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                }}
                                title={orgName || 'Tổ chức'}
                            >
                                {orgName || 'Tổ chức'}
                            </div>
                            <div
                                style={{
                                    fontSize: '12px',
                                    color: '#64748b',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                }}
                                title={name}
                            >
                                {name}
                            </div>
                            {provinceName && (
                                <span
                                    style={{
                                        fontSize: '11px',
                                        color: '#94a3b8',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        marginTop: '1px',
                                    }}
                                >
                                    📍 {provinceName}
                                </span>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            title: 'Thời gian',
            width: '150px',
            render: (_, record) => {
                if (record.type === 1) {
                    if (!record.date) return '';
                    const eventDate = dayjs(record.date);
                    const isPast = eventDate.isBefore(dayjs(), 'day');
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '13px' }}>{eventDate.format('DD/MM/YYYY')}</span>
                            {isPast ? (
                                <Tag color="default" style={{ width: 'fit-content', margin: 0 }}>
                                    Đã diễn ra
                                </Tag>
                            ) : (
                                <Tag color="processing" style={{ width: 'fit-content', margin: 0 }}>
                                    Sắp diễn ra
                                </Tag>
                            )}
                        </div>
                    );
                }

                if (!record.endDate) return '';
                const deadline = dayjs(record.endDate);
                const isExpired = deadline.isBefore(dayjs(), 'day');
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '13px' }}>Hạn chót: {deadline.format('DD/MM/YYYY')}</span>
                        {isExpired ? (
                            <Tag color="error" style={{ width: 'fit-content', margin: 0 }}>
                                Hết hạn
                            </Tag>
                        ) : (
                            <Tag color="success" style={{ width: 'fit-content', margin: 0 }}>
                                Còn hạn
                            </Tag>
                        )}
                    </div>
                );
            },
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            width: '150px',
            align: 'center',
            render: (status, record) => {
                if (isEducator && status !== 1 && status !== 0) {
                    const tagColor = status === 1 ? 'success' : status === 0 ? 'warning' : 'error';
                    const tagLabel = status === 1 ? 'Hoạt động' : status === 0 ? 'Ẩn' : 'Khóa';
                    return (
                        <Tag color={tagColor} style={{ margin: 0 }}>
                            {tagLabel}
                        </Tag>
                    );
                }

                const options = isEducator
                    ? [
                          { value: 1, label: <span style={{ color: '#00A648' }}>● Hoạt động</span> },
                          { value: 0, label: <span style={{ color: '#faad14' }}>● Ẩn</span> },
                      ]
                    : [
                          { value: 1, label: <span style={{ color: '#00A648' }}>● Hoạt động</span> },
                          { value: 0, label: <span style={{ color: '#faad14' }}>● Ẩn</span> },
                          { value: -1, label: <span style={{ color: '#ff4d4f' }}>● Khóa</span> },
                      ];

                return (
                    <Select
                        value={status}
                        style={{ width: 130 }}
                        onChange={(newStatus) => handleStatusChange(record.id, newStatus)}
                        options={options}
                    />
                );
            },
        },
        mixinFuncs.renderActionColumn(
            {
                edit: true,
                delete: isEducator ? () => mixinFuncs.hasPermission([apiConfig.job.delete.permissionCode]) : false,
            },
            { width: '100px', title: labels.action },
        ),
    ];

    const searchFields = [
        {
            key: 'title',
            placeholder: labels.name,
            colSpan: 6,
        },
        {
            key: 'type',
            placeholder: 'Chọn loại cơ hội',
            type: FieldTypes.SELECT,
            options: [
                { value: 1, label: 'Sự kiện' },
                { value: 2, label: 'Tuyển dụng' },
                { value: 3, label: 'Mạng lưới tài năng' },
            ],
            colSpan: 5,
        },
        {
            key: 'status',
            placeholder: 'Chọn trạng thái',
            type: FieldTypes.SELECT,
            options: isEducator
                ? [
                      { value: 1, label: 'Hoạt động' },
                      { value: 0, label: 'Ẩn' },
                  ]
                : [
                      { value: 1, label: 'Hoạt động' },
                      { value: 0, label: 'Ẩn' },
                      { value: -1, label: 'Khóa' },
                  ],
            colSpan: 5,
        },
    ];

    return (
        <PageWrapper routes={[{ breadcrumbName: labels.job }]}>
            <ListPage
                searchForm={mixinFuncs.renderSearchForm({
                    fields: searchFields,
                    initialValues: queryFilter,
                })}
                actionBar={isEducator ? mixinFuncs.renderActionBar() : null}
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

            <Modal
                title="Khóa tin tuyển dụng"
                open={isLockModalVisible}
                onOk={handleLockSubmit}
                onCancel={() => {
                    setIsLockModalVisible(false);
                    setNoticeText('');
                    setCurrentRecordId(null);
                }}
                okText="Xác nhận"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
            >
                <div style={{ marginBottom: 8 }}>Thông báo (tùy chọn):</div>
                <Input.TextArea
                    rows={4}
                    placeholder="Nhập lý do khóa..."
                    value={noticeText}
                    onChange={(e) => setNoticeText(e.target.value)}
                />
            </Modal>
        </PageWrapper>
    );
};

export default JobListPage;
