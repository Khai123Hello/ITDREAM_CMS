import React, { useState } from 'react';
import { Empty, Tag, Button, Drawer, Modal, Input, Space, Divider } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import useListBase from '@hooks/useListBase';
import useTranslate from '@hooks/useTranslate';
import useFetch from '@hooks/useFetch';
import useNotification from '@hooks/useNotification';

import { DEFAULT_TABLE_ITEM_SIZE, AppConstants } from '@constants';
import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';

import BaseTable from '@components/common/table/BaseTable';
import ListPage from '@components/common/layout/ListPage';
import PageWrapper from '@components/common/layout/PageWrapper';

const { TextArea } = Input;

const STATUS_PENDING = 0;

const BlogModerationListPage = () => {
    const translate = useTranslate();
    const notificationApi = useNotification();

    // Drawer state
    const [previewRecord, setPreviewRecord] = useState(null);
    const [isDrawerVisible, setIsDrawerVisible] = useState(false);

    // Reject state
    const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
    const [noticeText, setNoticeText] = useState('');

    const { execute: executeApprove, loading: approveLoading } = useFetch(apiConfig.blog.approve);
    const { execute: executeReject, loading: rejectLoading } = useFetch(apiConfig.blog.reject);

    const labels = {
        name: translate.formatMessage(commonMessage.name),
        noData: translate.formatMessage(commonMessage.noData),
        action: translate.formatMessage(commonMessage.action),
        blog: 'Blog chờ duyệt',
    };

    const { data, mixinFuncs, queryFilter, loading, pagination } = useListBase({
        apiConfig: {
            getList: apiConfig.blog.getList,
            delete: apiConfig.blog.delete,
        },
        options: {
            objectName: labels.blog,
            pageSize: DEFAULT_TABLE_ITEM_SIZE,
        },
        override: (funcs) => {
            funcs.getCreateLink = () => null;
            funcs.getItemDetailLink = () => null;

            // Enforce status = 0 (Pending) in parameters
            const originalPrepareGetListParams = funcs.prepareGetListParams;
            funcs.prepareGetListParams = (filter) => {
                const params = originalPrepareGetListParams(filter);
                return { ...params, status: STATUS_PENDING };
            };
        },
    });

    const openPreview = (record) => {
        setPreviewRecord(record);
        setIsDrawerVisible(true);
    };

    const closePreview = () => {
        setIsDrawerVisible(false);
        setPreviewRecord(null);
    };

    const handleApprove = (id) => {
        executeApprove({
            data: { id },
            onCompleted: (response) => {
                if (response.result === true) {
                    notificationApi({
                        type: 'success',
                        message: 'Phê duyệt bài viết thành công',
                    });
                    closePreview();
                    mixinFuncs.getList();
                } else {
                    notificationApi({
                        type: 'error',
                        message: response.message || 'Phê duyệt bài viết thất bại',
                    });
                }
            },
            onError: (error) => {
                notificationApi({
                    type: 'error',
                    message: error.message || 'Có lỗi xảy ra',
                });
            },
        });
    };

    const handleRejectClick = () => {
        setNoticeText('');
        setIsRejectModalVisible(true);
    };

    const handleRejectSubmit = () => {
        if (!previewRecord) return;
        executeReject({
            data: {
                id: previewRecord.id,
                notice: noticeText.trim() || 'Không đạt yêu cầu',
            },
            onCompleted: (response) => {
                if (response.result === true) {
                    notificationApi({
                        type: 'success',
                        message: 'Từ chối bài viết thành công',
                    });
                    setIsRejectModalVisible(false);
                    closePreview();
                    mixinFuncs.getList();
                } else {
                    notificationApi({
                        type: 'error',
                        message: response.message || 'Từ chối bài viết thất bại',
                    });
                }
            },
            onError: (error) => {
                notificationApi({
                    type: 'error',
                    message: error.message || 'Có lỗi xảy ra',
                });
            },
        });
    };

    const columns = [
        {
            title: '#',
            width: '60px',
            align: 'center',
            render: (_, record, index) => {
                return (pagination.current - 1) * pagination.pageSize + index + 1;
            },
        },
        {
            title: 'Hình ảnh',
            dataIndex: 'image',
            width: '100px',
            align: 'center',
            render: (image) => {
                const imageUrl = image
                    ? image.startsWith('http')
                        ? image
                        : `${AppConstants.contentRootUrl}${image}`
                    : null;
                return imageUrl ? (
                    <img
                        src={imageUrl}
                        alt="thumbnail"
                        style={{ width: '60px', height: '36px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                ) : (
                    <div
                        style={{
                            width: '60px',
                            height: '36px',
                            background: '#f5f5f5',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            color: '#999',
                            fontSize: '11px',
                        }}
                    >
                        No image
                    </div>
                );
            },
        },
        {
            title: 'Tiêu đề',
            dataIndex: 'name',
            width: '300px',
        },
        {
            title: 'Chủ đề',
            dataIndex: 'subject',
            width: '250px',
        },
        {
            title: 'Danh mục',
            dataIndex: ['category', 'name'],
            width: '150px',
            render: (_, record) => record.category?.name || '-',
        },
        {
            title: 'Người viết',
            width: '180px',
            render: (_, record) => record.educator?.account?.fullName || record.educator?.profileAccountDto?.fullName || record.author || '-',
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdDate',
            width: '150px',
            render: (date) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'),
        },
        {
            title: labels.action,
            width: '120px',
            align: 'center',
            render: (_, record) => (
                <Space size="middle">
                    <Button
                        type="primary"
                        ghost
                        icon={<EyeOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            openPreview(record);
                        }}
                        title="Xem chi tiết & duyệt"
                    >
                        Xem & Duyệt
                    </Button>
                </Space>
            ),
        },
    ];

    const searchFields = [
        {
            key: 'name',
            placeholder: 'Tìm kiếm tiêu đề',
        },
    ];

    const breadcrumbs = [
        { breadcrumbName: translate.formatMessage(commonMessage.home) },
        { breadcrumbName: 'Duyệt bài viết' },
    ];

    const previewImageUrl = previewRecord?.image
        ? previewRecord.image.startsWith('http')
            ? previewRecord.image
            : `${AppConstants.contentRootUrl}${previewRecord.image}`
        : null;

    return (
        <PageWrapper routes={breadcrumbs}>
            <ListPage
                searchForm={mixinFuncs.renderSearchForm({
                    fields: searchFields,
                    initialValues: queryFilter,
                })}
                actionBar={null}
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

            {/* Quick Preview Drawer */}
            <Drawer
                title="Xem trước & Duyệt bài viết"
                placement="right"
                width={720}
                onClose={closePreview}
                visible={isDrawerVisible}
                bodyStyle={{ paddingBottom: 80 }}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <Button onClick={closePreview}>Đóng</Button>
                        <Button
                            danger
                            icon={<CloseCircleOutlined />}
                            onClick={handleRejectClick}
                            loading={rejectLoading}
                        >
                            Từ chối
                        </Button>
                        <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={() => handleApprove(previewRecord?.id)}
                            loading={approveLoading}
                        >
                            Phê duyệt
                        </Button>
                    </div>
                }
            >
                {previewRecord && (
                    <div>
                        <h2>{previewRecord.name}</h2>
                        <div style={{ color: '#8c8c8c', marginBottom: '16px', fontSize: '13px' }}>
                            <span>
                                Tác giả:{' '}
                                <strong>
                                    {previewRecord.educator?.account?.fullName || previewRecord.educator?.profileAccountDto?.fullName || previewRecord.author || '-'}
                                </strong>
                            </span>
                            <Divider type="vertical" />
                            <span>
                                Danh mục: <strong>{previewRecord.category?.name || '-'}</strong>
                            </span>
                            <Divider type="vertical" />
                            <span>
                                Ngày tạo: <strong>{dayjs(previewRecord.createdDate).format('DD/MM/YYYY HH:mm')}</strong>
                            </span>
                        </div>

                        {previewImageUrl && (
                            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                                <img
                                    src={previewImageUrl}
                                    alt="banner"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '300px',
                                        objectFit: 'cover',
                                        borderRadius: '8px',
                                    }}
                                />
                            </div>
                        )}

                        <div
                            style={{
                                background: '#fafafa',
                                padding: '12px 16px',
                                borderRadius: '6px',
                                marginBottom: '20px',
                                borderLeft: '4px solid #1890ff',
                            }}
                        >
                            <strong>Tóm tắt (Subject):</strong>
                            <p style={{ margin: '4px 0 0 0', color: '#595959' }}>
                                {previewRecord.subject || 'Không có tóm tắt'}
                            </p>
                        </div>

                        <Divider />

                        <div
                            className="blog-content-preview"
                            style={{ fontSize: '15px', lineHeight: '1.6', color: '#262626' }}
                            dangerouslySetInnerHTML={{ __html: previewRecord.content }}
                        />
                    </div>
                )}
            </Drawer>

            {/* Reject Reason Modal */}
            <Modal
                title="Lý do từ chối bài viết"
                visible={isRejectModalVisible}
                onOk={handleRejectSubmit}
                confirmLoading={rejectLoading}
                onCancel={() => setIsRejectModalVisible(false)}
                okText="Xác nhận từ chối"
                cancelText="Hủy"
            >
                <div style={{ marginBottom: '8px' }}>Vui lòng nhập lý do từ chối bài viết này:</div>
                <TextArea
                    rows={4}
                    value={noticeText}
                    onChange={(e) => setNoticeText(e.target.value)}
                    placeholder="Lý do từ chối..."
                />
            </Modal>
        </PageWrapper>
    );
};

export default BlogModerationListPage;
