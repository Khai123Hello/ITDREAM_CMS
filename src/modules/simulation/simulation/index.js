import React, { useState } from 'react';
import { Empty, Tag, Button, Modal, Input } from 'antd';
import { AppstoreOutlined, UnorderedListOutlined, CheckCircleOutlined, DeleteOutlined, CloseCircleOutlined, BellOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useListBase from '@hooks/useListBase';
import useFetch from '@hooks/useFetch';
import useTranslate from '@hooks/useTranslate';
import useNotification from '@hooks/useNotification';
import { AppConstants, DEFAULT_TABLE_ITEM_SIZE } from '@constants';
import apiConfig from '@constants/apiConfig';
import { FieldTypes } from '@constants/formConfig';
import { simulationStatusOptions, levelOptions } from '@constants/masterData';
import { commonMessage } from '@locales/intl';
import AvatarField from '@components/common/form/AvatarField';
import BaseTable from '@components/common/table/BaseTable';
import ListPage from '@components/common/layout/ListPage';
import PageWrapper from '@components/common/layout/PageWrapper';
import { UserTypes } from '@constants';
import { getData } from '@utils/localStorage';
import { storageKeys } from '@constants';
import { calculateIndex } from '@utils';

const { TextArea } = Input;

// Định nghĩa các status constants
const STATUS_ACTIVE = 1;
const STATUS_PENDING = 0;
const STATUS_WAITING_APPROVE = 2;
const STATUS_WAITING_APPROVE_DELETE = 3;
const STATUS_LOCK = -1;
const STATUS_REJECT = -2;

const SimulationListPage = ({ pageOptions }) => {
    const translate = useTranslate();
    const navigate = useNavigate();
    const notificationApi = useNotification();
    
    // State cho Modal - chỉ còn Reject
    const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
    const [currentRecordId, setCurrentRecordId] = useState(null);
    const [noticeText, setNoticeText] = useState('');
    
    // State cho Modal xem thông báo
    const [isNoticeModalVisible, setIsNoticeModalVisible] = useState(false);
    const [currentNotice, setCurrentNotice] = useState('');

    // Tự động phát hiện user type
    const userType = getData(storageKeys.USER_TYPE);
    const isEducator = userType === UserTypes.EDUCATOR;

    const formattedStatusOptions = translate.formatKeys(simulationStatusOptions, ['label']);
    const formattedLevelOptions = translate.formatKeys(levelOptions, ['label']);

    const statusMap = Object.fromEntries(formattedStatusOptions.map(item => [item.value, item]));
    const levelMap = Object.fromEntries(formattedLevelOptions.map(item => [item.value, item]));

    const labels = {
        title: translate.formatMessage(commonMessage.title),
        specialization: translate.formatMessage(commonMessage.specialization),
        educator: translate.formatMessage(commonMessage.educator),
        level: translate.formatMessage(commonMessage.level),
        status: translate.formatMessage(commonMessage.status),
        noData: translate.formatMessage(commonMessage.noData),
        image: translate.formatMessage(commonMessage.image),
        simulation: translate.formatMessage(commonMessage.simulation),
        action: translate.formatMessage(commonMessage.action),
        task: translate.formatMessage(commonMessage.task),
    };

    const statusValues = formattedStatusOptions.map(item => ({ value: item.value, label: item.label }));
    const levelValues = formattedLevelOptions.map(item => ({ value: item.value, label: item.label }));

    // Khởi tạo hooks
    const { execute: executeApprove } = useFetch(apiConfig.simulation.approve);
    const { execute: executeApproveDelete } = useFetch(apiConfig.simulation.approveDelete);
    const { execute: executeReject } = useFetch(apiConfig.simulation.reject);
    const { execute: executeRejectDelete } = useFetch(apiConfig.simulation.rejectDelete);
    const { execute: executeRequestDelete } = useFetch(apiConfig.simulation.requestDelete);
    const { execute: executeEducatorDelete } = useFetch(apiConfig.simulation.educatorDelete);

    // Hàm mở modal xem thông báo
    const showNoticeModal = (notice) => {
        setCurrentNotice(notice);
        setIsNoticeModalVisible(true);
    };

    // Cấu hình API theo role
    const apiConfiguration = isEducator
        ? {
            create: apiConfig.simulation.create,
            getList: apiConfig.simulation.getListForEducator,
            update: apiConfig.simulation.update,
            changeStatus: apiConfig.simulation.approve,
            requestDelete: apiConfig.simulation.requestDelete,
            educatorDelete: apiConfig.simulation.educatorDelete,
        }
        : {
            getList: apiConfig.simulation.getList,
            changeStatus: null,
            approve: apiConfig.simulation.approve,
            approveDelete: apiConfig.simulation.approveDelete,
            reject: apiConfig.simulation.reject,
            rejectDelete: apiConfig.simulation.rejectDelete,
        };

    const { data, mixinFuncs, queryFilter, loading, pagination, setData, setLoading } = useListBase({
        apiConfig: apiConfiguration,
        options: {
            objectName: labels.simulation,
            pageSize: DEFAULT_TABLE_ITEM_SIZE,
        },
        override: (funcs) => {
            // ============ COMMON HELPER FUNCTIONS ============
            /**
             * Xử lý kết quả API chung cho các action
             * @param {Object} response - Response từ API
             * @param {string} successMessage - Message khi thành công
             * @param {string} errorMessage - Message khi thất bại
             * @param {Function} onSuccess - Callback khi thành công
             */
            const handleApiResponse = (response, successMessage, errorMessage, onSuccess) => {
                // Log để debug
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

            /**
             * Xử lý lỗi API chung
             * @param {Object} error - Error object
             * @param {string} defaultMessage - Message mặc định khi không có message từ API
             */
            const handleApiError = (error, defaultMessage) => {
                // Log toàn bộ error để debug
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

            /**
             * Reset state sau khi hoàn thành action
             */
            const resetModalState = () => {
                setLoading(false);
                setCurrentRecordId(null);
                setNoticeText('');
            };

            // ============ ADMIN FUNCTIONS ============
            if (!isEducator) {
                // Mở modal để nhập notice khi Reject
                funcs.showRejectModal = (id) => {
                    setCurrentRecordId(id);
                    setNoticeText('');
                    setIsRejectModalVisible(true);
                };

                /**
                 * Xử lý phê duyệt simulation - KHÔNG CẦN MODAL
                 */
                funcs.handleApprove = (id) => {
                    if (!apiConfig.simulation.approve || !id) return;

                    Modal.confirm({
                        title: 'Xác nhận phê duyệt',
                        content: `Bạn có chắc chắn muốn phê duyệt ${labels.simulation} này?`,
                        okText: 'Xác nhận',
                        cancelText: 'Hủy',
                        onOk: () => {
                            setLoading(true);

                            executeApprove({
                                data: {
                                    id: id,
                                    notice: ' ',
                                },
                                onCompleted: (response) => {
                                    handleApiResponse(
                                        response,
                                        `Phê duyệt ${labels.simulation} thành công`,
                                        `Phê duyệt ${labels.simulation} thất bại`,
                                        () => mixinFuncs.getList(),
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

                /**
                 * Xử lý từ chối simulation
                 */
                funcs.handleReject = () => {
                    if (!apiConfig.simulation.reject || !currentRecordId) return;

                    setLoading(true);
                    setIsRejectModalVisible(false);

                    executeReject({
                        data: {
                            id: currentRecordId,
                            notice: noticeText.trim() || ' ',
                        },
                        onCompleted: (response) => {
                            handleApiResponse(
                                response,
                                `Từ chối ${labels.simulation} thành công`,
                                `Từ chối ${labels.simulation} thất bại`,
                                () => mixinFuncs.getList(),
                            );
                            resetModalState();
                        },
                        onError: (error) => {
                            handleApiError(error, 'Có lỗi xảy ra khi từ chối');
                            resetModalState();
                        },
                    });
                };

                /**
                 * Xử lý phê duyệt xóa simulation (KHÔNG CẦN NOTICE)
                 */
                funcs.handleApproveDelete = (id) => {
                    if (!apiConfig.simulation.approveDelete || !id) return;

                    Modal.confirm({
                        title: 'Xác nhận phê duyệt xóa',
                        content: `Bạn có chắc chắn muốn phê duyệt xóa ${labels.simulation} này?`,
                        okText: 'Xác nhận',
                        cancelText: 'Hủy',
                        okButtonProps: { danger: true },
                        onOk: () => {
                            setLoading(true);

                            executeApproveDelete({
                                pathParams: { id },
                                onCompleted: (response) => {
                                    handleApiResponse(
                                        response,
                                        `Phê duyệt xoá ${labels.simulation} thành công`,
                                        `Phê duyệt xoá ${labels.simulation} thất bại`,
                                        () => mixinFuncs.getList(),
                                    );
                                    setLoading(false);
                                },
                                onError: (error) => {
                                    handleApiError(error, 'Có lỗi xảy ra khi phê duyệt xoá');
                                    setLoading(false);
                                },
                            });
                        },
                    });
                };

                /**
                 * Xử lý từ chối xóa simulation (KHÔNG CẦN NOTICE)
                 */
                funcs.handleRejectDelete = (id) => {
                    if (!apiConfig.simulation.rejectDelete) return;

                    Modal.confirm({
                        title: 'Xác nhận từ chối xóa',
                        content: `Bạn có chắc chắn muốn từ chối yêu cầu xóa ${labels.simulation} này?`,
                        okText: 'Xác nhận',
                        cancelText: 'Hủy',
                        onOk: () => {
                            setLoading(true);

                            executeRejectDelete({
                                pathParams: { id },
                                onCompleted: (response) => {
                                    handleApiResponse(
                                        response,
                                        `Từ chối xoá ${labels.simulation} thành công`,
                                        `Từ chối xoá ${labels.simulation} thất bại`,
                                        () => {
                                            // Cập nhật status về trạng thái "Hoạt động"
                                            setData((prevData) =>
                                                prevData.map((item) =>
                                                    item.id === id ? { ...item, status: STATUS_ACTIVE } : item,
                                                ),
                                            );
                                        },
                                    );
                                    setLoading(false);
                                },
                                onError: (error) => {
                                    handleApiError(error, 'Có lỗi xảy ra khi từ chối xoá');
                                    setLoading(false);
                                },
                            });
                        },
                    });
                };
            }

            // ============ EDUCATOR FUNCTIONS ============
            if (isEducator) {
                /**
                 * Xử lý yêu cầu xóa simulation
                 */
                funcs.handleRequestDelete = (id) => {
                    if (!apiConfig.simulation.requestDelete) return;

                    setLoading(true);

                    // Log để debug
                    console.log('=== Request Delete Config ===');
                    console.log('API Config:', apiConfig.simulation.requestDelete);
                    console.log('ID:', id);
                    console.log('============================');

                    executeRequestDelete({
                        pathParams: { id },
                        onCompleted: (response) => {
                            handleApiResponse(
                                response,
                                `Yêu cầu xoá ${labels.simulation} thành công`,
                                `Yêu cầu xoá ${labels.simulation} thất bại`,
                                () => {
                                    // Cập nhật status thành WAITING_APPROVE_DELETE
                                    setData((prevData) =>
                                        prevData.map((item) =>
                                            item.id === id ? { ...item, status: STATUS_WAITING_APPROVE_DELETE } : item,
                                        ),
                                    );
                                },
                            );
                            setLoading(false);
                        },
                        onError: (error) => {
                            handleApiError(error, 'Có lỗi xảy ra khi yêu cầu xoá');
                            setLoading(false);
                        },
                    });
                };

                /**
                 * Xóa trực tiếp simulation cho Educator (chỉ khi status = WAITING_APPROVE)
                 * Sử dụng API educator-delete
                 */
                funcs.handleEducatorDelete = (id) => {
                    if (!apiConfig.simulation.educatorDelete) return;

                    Modal.confirm({
                        title: 'Xác nhận xóa',
                        content: `Bạn có chắc chắn muốn xóa ${labels.simulation} này?`,
                        okText: 'Xóa',
                        cancelText: 'Hủy',
                        okButtonProps: { danger: true },
                        onOk: () => {
                            setLoading(true);

                            console.log('=== Educator Delete Config ===');
                            console.log('API Config:', apiConfig.simulation.educatorDelete);
                            console.log('ID:', id);
                            console.log('==============================');

                            executeEducatorDelete({
                                pathParams: { id },
                                onCompleted: (response) => {
                                    handleApiResponse(
                                        response,
                                        `Xóa ${labels.simulation} thành công`,
                                        `Xóa ${labels.simulation} thất bại`,
                                        () => {
                                            // Xóa item khỏi danh sách
                                            setData((prevData) => prevData.filter((item) => item.id !== id));
                                        },
                                    );
                                    setLoading(false);
                                },
                                onError: (error) => {
                                    handleApiError(error, 'Có lỗi xảy ra khi xóa');
                                    setLoading(false);
                                },
                            });
                        },
                    });
                };
            }

            // ============ ACTION COLUMN BUTTONS ============
            const originalActionColumnButtons = funcs.actionColumnButtons;
            funcs.actionColumnButtons = (additionalButtons = {}) => {
                const buttons = {
                    ...originalActionColumnButtons(additionalButtons),
                    // Nút Task
                    task: ({ id }) => (
                        <Button
                            type="link"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/simulation/${id}/task`);
                            }}
                            title={labels.task}
                        >
                            <AppstoreOutlined />
                        </Button>
                    ),
                    // Nút xem thông báo - hiển thị khi có notice
                    viewNotice: ({ notice }) =>
                        notice && notice.trim() ? (
                            <Button
                                type="link"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    showNoticeModal(notice);
                                }}
                                title="Xem thông báo"
                            >
                                <BellOutlined />
                            </Button>
                        ) : null,
                };

                if (isEducator) {
                    // Nút Educator Delete - Hiển thị khi status = WAITING_APPROVE
                    buttons.educatorDelete = ({ id, status, buttonProps }) =>
                        status === STATUS_WAITING_APPROVE ? (
                            <Button
                                type="link"
                                danger
                                onClick={(e) => {
                                    e.stopPropagation();
                                    funcs.handleEducatorDelete(id);
                                }}
                                title="Xóa"
                                {...buttonProps}
                            >
                                <DeleteOutlined />
                            </Button>
                        ) : null;

                    // Nút Request Delete cho Educator - Hiển thị khi status KHÁC WAITING_APPROVE và WAITING_APPROVE_DELETE
                    buttons.requestDelete = ({ id, status, buttonProps }) =>
                        status !== STATUS_WAITING_APPROVE && status !== STATUS_WAITING_APPROVE_DELETE ? (
                            <Button
                                type="link"
                                danger
                                onClick={(e) => {
                                    e.stopPropagation();
                                    funcs.handleRequestDelete(id);
                                }}
                                title="Yêu cầu xoá"
                                {...buttonProps}
                            >
                                <DeleteOutlined />
                            </Button>
                        ) : null;
                } else {
                    // Nút Approve cho Admin - không cần modal
                    buttons.approve = ({ id, status, buttonProps }) =>
                        status === STATUS_WAITING_APPROVE ? (
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
                        ) : null;

                    // Nút Reject cho Admin
                    buttons.reject = ({ id, status, buttonProps }) =>
                        status === STATUS_WAITING_APPROVE ? (
                            <Button
                                type="link"
                                danger
                                onClick={(e) => {
                                    e.stopPropagation();
                                    funcs.showRejectModal(id);
                                }}
                                title="Từ chối"
                                {...buttonProps}
                            >
                                <CloseCircleOutlined />
                            </Button>
                        ) : null;

                    // Nút Approve Delete cho Admin
                    buttons.approveDelete = ({ id, status, buttonProps }) =>
                        status === STATUS_WAITING_APPROVE_DELETE ? (
                            <Button
                                type="link"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    funcs.handleApproveDelete(id);
                                }}
                                title="Phê duyệt xoá"
                                {...buttonProps}
                            >
                                <CheckCircleOutlined />
                            </Button>
                        ) : null;

                    // Nút Reject Delete cho Admin
                    buttons.rejectDelete = ({ id, status, buttonProps }) =>
                        status === STATUS_WAITING_APPROVE_DELETE ? (
                            <Button
                                type="link"
                                danger
                                onClick={(e) => {
                                    e.stopPropagation();
                                    funcs.handleRejectDelete(id);
                                }}
                                title="Từ chối xoá"
                                {...buttonProps}
                            >
                                <CloseCircleOutlined />
                            </Button>
                        ) : null;
                }

                return buttons;
            };

            // Render Status Column
            funcs.renderStatusColumn = (columnsProps) => ({
                title: labels.status,
                dataIndex: 'status',
                align: 'center',
                ...columnsProps,
                render: (status) => {
                    const item = statusMap[status] || {};
                    return (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Tag color={item.color}>{item.label}</Tag>
                        </div>
                    );
                },
            });
        },
    });

    // ============ TABLE COLUMNS ============
    const columns = [
        {
            title: '#',
            width: '40px',
            align: 'center',
            render: (_, __, index) => calculateIndex(index, pagination, queryFilter),
        },
        {
            title: labels.image,
            dataIndex: 'imagePath',
            align: 'center',
            width: '100px',
            render: (imagePath) => (
                <AvatarField
                    icon={<UnorderedListOutlined />}
                    src={imagePath ? `${AppConstants.contentRootUrl}${imagePath}` : null}
                    shape="square"
                />
            ),
        },
        {
            title: labels.title,
            dataIndex: 'title',
            render: (text, record) => (
                <Button
                    type="link"
                    style={{ padding: 0 }}
                    onClick={(e) => {
                        e.stopPropagation(); // tránh trigger row click
                        navigate(`/simulation/${record.id}`);
                    }}
                >
                    {text}
                </Button>
            ),
        },

        // Hiển thị specialization cho Admin
        ...(isEducator
            ? []
            : [
                {
                    title: labels.specialization,
                    dataIndex: ['specialization', 'name'],
                    align: 'center',
                    width: '150px',
                },
            ]),
        mixinFuncs.renderStatusColumn({ width: '120px' }),
        mixinFuncs.renderActionColumn(
            isEducator
                ? {
                    viewNotice: (dataRow) => dataRow.notice && dataRow.notice.trim(),
                    edit: (dataRow) => dataRow.status !== STATUS_WAITING_APPROVE_DELETE && mixinFuncs.hasPermission([apiConfig.simulation.update.permissionCode]),
                    task: () => mixinFuncs.hasPermission([apiConfig.task.educatorList.permissionCode]),
                    educatorDelete: (dataRow) =>
                        dataRow.status === STATUS_WAITING_APPROVE &&
                          mixinFuncs.hasPermission([apiConfig.simulation.educatorDelete.permissionCode]),
                    requestDelete: (dataRow) =>
                        dataRow.status !== STATUS_WAITING_APPROVE &&
                          dataRow.status !== STATUS_WAITING_APPROVE_DELETE &&
                          mixinFuncs.hasPermission([apiConfig.simulation.requestDelete.permissionCode]),
                }
                : {
                    viewNotice: (dataRow) => dataRow.notice && dataRow.notice.trim(),
                    edit: () => mixinFuncs.hasPermission([apiConfig.simulation.update.permissionCode]),
                    task: () => mixinFuncs.hasPermission([apiConfig.task.getList.permissionCode]),
                    approve: (dataRow) => dataRow.status === STATUS_WAITING_APPROVE,
                    reject: (dataRow) => dataRow.status === STATUS_WAITING_APPROVE,
                    approveDelete: (dataRow) => dataRow.status === STATUS_WAITING_APPROVE_DELETE,
                    rejectDelete: (dataRow) => dataRow.status === STATUS_WAITING_APPROVE_DELETE,
                },
            { width: '237px', title: labels.action },
        ),
    ];

    // ============ SEARCH FIELDS ============
    const searchFields = [
        {
            key: 'title',
            placeholder: labels.title,
        },
        {
            key: 'level',
            placeholder: labels.level,
            type: FieldTypes.SELECT,
            options: levelValues,
        },
        {
            key: 'status',
            placeholder: labels.status,
            type: FieldTypes.SELECT,
            options: statusValues,
        },
    ];

    // ============ RENDER ============
    return (
        <PageWrapper routes={pageOptions.renderBreadcrumbs(commonMessage, translate)}>
            <ListPage
                searchForm={mixinFuncs.renderSearchForm({ fields: searchFields, initialValues: queryFilter })}
                actionBar={isEducator ? mixinFuncs.renderActionBar() : null}
                baseTable={
                    <BaseTable
                        columns={columns}
                        dataSource={data}
                        loading={loading}
                        rowKey={(record) => record.id}
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

            {/* Modal Từ chối */}
            <Modal
                title="Từ chối đăng"
                open={isRejectModalVisible}
                onOk={mixinFuncs.handleReject}
                onCancel={() => {
                    setIsRejectModalVisible(false);
                    setNoticeText('');
                    setCurrentRecordId(null);
                }}
                okText="Xác nhận"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
            >
                <div style={{ marginBottom: 8 }}>Thông báo (tùy chọn):</div>
                <TextArea
                    rows={4}
                    placeholder="Nhập lý do từ chối..."
                    value={noticeText}
                    onChange={(e) => setNoticeText(e.target.value)}
                />
            </Modal>

            {/* Modal Xem thông báo */}
            <Modal
                title="Thông báo từ chối duyệt của Quản trị viên"
                open={isNoticeModalVisible}
                onCancel={() => {
                    setIsNoticeModalVisible(false);
                    setCurrentNotice('');
                }}
                footer={[
                    <Button key="close" type="primary" onClick={() => {
                        setIsNoticeModalVisible(false);
                        setCurrentNotice('');
                    }}>
                        Đóng
                    </Button>,
                ]}
            >
                <div style={{ padding: '12px 0', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                    {currentNotice || 'Không có thông báo'}
                </div>
            </Modal>
        </PageWrapper>
    );
};

export default SimulationListPage;