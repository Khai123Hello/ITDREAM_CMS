import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Empty, Tag, Button, Modal, Input } from 'antd';
import { CloseCircleOutlined, BellOutlined } from '@ant-design/icons';

import useListBase from '@hooks/useListBase';
import useTranslate from '@hooks/useTranslate';
import useFetch from '@hooks/useFetch';
import useNotification from '@hooks/useNotification';

import { DEFAULT_TABLE_ITEM_SIZE, AppConstants, UserTypes, storageKeys } from '@constants';
import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';

import BaseTable from '@components/common/table/BaseTable';
import ListPage from '@components/common/layout/ListPage';
import PageWrapper from '@components/common/layout/PageWrapper';
import { getData } from '@utils/localStorage';

const { TextArea } = Input;

// Status constants
const STATUS_ACTIVE = 1;
const STATUS_PENDING = 0;
const STATUS_REJECT = -2;

const BlogListPage = ({ pageOptions = {} }) => {
    const translate = useTranslate();
    const navigate = useNavigate();
    const notificationApi = useNotification();

    // Rejection state
    const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
    const [currentRecordId, setCurrentRecordId] = useState(null);
    const [noticeText, setNoticeText] = useState('');

    // Rejection reason viewing state
    const [isNoticeModalVisible, setIsNoticeModalVisible] = useState(false);
    const [currentNotice, setCurrentNotice] = useState('');

    // Role check
    const userType = getData(storageKeys.USER_TYPE);
    const isEducator = userType === UserTypes.EDUCATOR;

    const labels = {
        name: translate.formatMessage(commonMessage.name),
        noData: translate.formatMessage(commonMessage.noData),
        action: translate.formatMessage(commonMessage.action),
        blog: 'Blog',
    };

    const { execute: executeReject, loading: rejectLoading } = useFetch(apiConfig.blog.reject);

    const showNoticeModal = (notice) => {
        setCurrentNotice(notice);
        setIsNoticeModalVisible(true);
    };

    const showRejectModal = (id) => {
        setCurrentRecordId(id);
        setNoticeText('');
        setIsRejectModalVisible(true);
    };

    const handleRejectSubmit = () => {
        if (!currentRecordId) return;

        executeReject({
            data: {
                id: currentRecordId,
                notice: noticeText.trim() || ' ',
            },
            onCompleted: (response) => {
                if (response.result === true) {
                    notificationApi({
                        type: 'success',
                        message: 'Từ chối bài viết thành công',
                    });
                    setIsRejectModalVisible(false);
                    setCurrentRecordId(null);
                    setNoticeText('');
                    mixinFuncs.getList(); // Reload the list
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

    // Configure APIs depending on role
    const apiConfiguration = isEducator
        ? {
            getList: apiConfig.blog.educatorList,
            getById: apiConfig.blog.educatorGet,
            create: apiConfig.blog.create,
            update: apiConfig.blog.update,
            delete: apiConfig.blog.delete,
        }
        : {
            getList: apiConfig.blog.getList,
            getById: apiConfig.blog.getById,
            create: apiConfig.blog.create,
            update: apiConfig.blog.update,
            delete: apiConfig.blog.delete,
            reject: apiConfig.blog.reject,
        };

    const { data, mixinFuncs, queryFilter, loading, pagination } = useListBase({
        apiConfig: apiConfiguration,
        options: {
            objectName: labels.blog,
            pageSize: DEFAULT_TABLE_ITEM_SIZE,
        },
        override: (funcs) => {
            funcs.getCreateLink = () => {
                return '/blog/create';
            };

            funcs.getItemDetailLink = (record) => {
                return `/blog/${record.id}`;
            };

            funcs.additionalActionColumnButtons = () => ({
                reject: ({ id, status }) => {
                    // Only Admin can reject, and only if status is pending (0)
                    if (isEducator || status !== STATUS_PENDING) return null;
                    return (
                        <Button
                            type="link"
                            danger
                            onClick={(e) => {
                                e.stopPropagation();
                                showRejectModal(id);
                            }}
                            title="Từ chối"
                            style={{ padding: 0 }}
                        >
                            <CloseCircleOutlined />
                        </Button>
                    );
                },
                viewNotice: ({ notice, status }) => {
                    // Show notice button if there is a reject notice
                    if (status === STATUS_REJECT && notice && notice.trim()) {
                        return (
                            <Button
                                type="link"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    showNoticeModal(notice);
                                }}
                                title="Xem lý do từ chối"
                                style={{ padding: 0 }}
                            >
                                <BellOutlined />
                            </Button>
                        );
                    }
                    return null;
                },
            });
        },
    });

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
            width: '250px',
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
            width: '150px',
            render: (_, record) => record.educator?.account?.fullName || record.educator?.profileAccountDto?.fullName || record.author || '-',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            width: '130px',
            render: (status) => {
                let color = 'gold';
                let text = 'Chờ duyệt';
                if (status === STATUS_ACTIVE) {
                    color = 'green';
                    text = 'Hoạt động';
                } else if (status === STATUS_REJECT) {
                    color = 'red';
                    text = 'Bị từ chối';
                }
                return <Tag color={color}>{text}</Tag>;
            },
        },
        mixinFuncs.renderActionColumn(
            {
                edit: () => mixinFuncs.hasPermission([apiConfig.blog.update.permissionCode]),
                reject: false,
                viewNotice: true,
                delete: () => mixinFuncs.hasPermission([apiConfig.blog.delete.permissionCode]),
            },
            { width: '150px', title: labels.action },
        ),
    ];

    const searchFields = [
        {
            key: 'name',
            placeholder: 'Tìm kiếm tiêu đề',
        },
    ];

    const breadcrumbs = pageOptions.renderBreadcrumbs
        ? pageOptions.renderBreadcrumbs(commonMessage, translate)
        : [{ breadcrumbName: translate.formatMessage(commonMessage.home) }, { breadcrumbName: labels.blog }];

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
                        dataSource={data}
                        loading={loading}
                        rowKey={(record) => record.id}
                        pagination={pagination}
                        locale={{ emptyText: <Empty description={labels.noData} /> }}
                    />
                }
            />

            {/* Modal từ chối bài viết */}
            <Modal
                title="Từ chối bài viết"
                open={isRejectModalVisible}
                onOk={handleRejectSubmit}
                onCancel={() => {
                    setIsRejectModalVisible(false);
                    setCurrentRecordId(null);
                    setNoticeText('');
                }}
                okText="Xác nhận từ chối"
                cancelText="Hủy"
                okButtonProps={{ danger: true, loading: rejectLoading }}
            >
                <div style={{ marginBottom: 12 }}>Nhập lý do từ chối bài viết này:</div>
                <TextArea
                    rows={4}
                    value={noticeText}
                    onChange={(e) => setNoticeText(e.target.value)}
                    placeholder="Lý do từ chối bài viết..."
                />
            </Modal>

            {/* Modal xem lý do từ chối */}
            <Modal
                title="Lý do từ chối"
                open={isNoticeModalVisible}
                onOk={() => setIsNoticeModalVisible(false)}
                onCancel={() => setIsNoticeModalVisible(false)}
                footer={[
                    <Button key="close" type="primary" onClick={() => setIsNoticeModalVisible(false)}>
                        Đóng
                    </Button>,
                ]}
            >
                <div
                    style={{
                        padding: '12px',
                        background: '#fff2f0',
                        border: '1px solid #ffccc7',
                        borderRadius: '4px',
                        color: '#ff4d4f',
                        minHeight: '80px',
                        whiteSpace: 'pre-wrap',
                    }}
                >
                    {currentNotice}
                </div>
            </Modal>
        </PageWrapper>
    );
};

export default BlogListPage;
