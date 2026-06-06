import React from 'react';
import { Empty, Tag, Button, Card, Row, Col, Avatar, Modal, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { FileSearchOutlined, UserOutlined, CheckCircleOutlined } from '@ant-design/icons';

import useListBase from '@hooks/useListBase';
import useTranslate from '@hooks/useTranslate';
import useFetch from '@hooks/useFetch';

import { AppConstants, DEFAULT_TABLE_ITEM_SIZE } from '@constants';
import apiConfig from '@constants/apiConfig';
import { FieldTypes } from '@constants/formConfig';
import { commonMessage } from '@locales/intl';
import { simulationStatusOptions, levelOptions } from '@constants/masterData';

import BaseTable from '@components/common/table/BaseTable';
import ListPage from '@components/common/layout/ListPage';
import PageWrapper from '@components/common/layout/PageWrapper';

import { calculateIndex, getColumnWidth } from '@utils';

const SimulationReviewListPage = ({ pageOptions }) => {
    const translate = useTranslate();
    const navigate = useNavigate();
    const [selectedSimulation, setSelectedSimulation] = React.useState(null);
    const [showStudentModal, setShowStudentModal] = React.useState(false);

    const labels = {
        title: 'Tên bài mô phỏng',
        educator: 'Khoa chuyên môn',
        specialization: 'Chuyên ngành',
        level: 'Cấp độ',
        participantQuantity: 'Số học viên',
        avgRating: 'Đánh giá TB',
        status: translate.formatMessage(commonMessage.status),
        noData: translate.formatMessage(commonMessage.noData),
        review: 'Xem học viên',
        studentList: 'Danh sách học viên đã hoàn thành',
    };


    // const formattedStatusOptions = translate.formatKeys(simulationStatusOptions, ['label']);
    const formattedLevelOptions = translate.formatKeys(levelOptions, ['label']);
    
    // const statusMap = Object.fromEntries(formattedStatusOptions.map(item => [item.value, item]));
    const levelMap = Object.fromEntries(formattedLevelOptions.map(item => [item.value, item]));
    // const levelMap = {
    //     1: { label: 'Cơ bản', color: 'blue' },
    //     2: { label: 'Trung bình', color: 'orange' },
    //     3: { label: 'Nâng cao', color: 'red' },
    // };

    // const statusMap = {
    //     1: { label: 'Hoạt động', color: 'green' },
    //     2: { label: 'Nháp', color: 'default' },
    //     3: { label: 'Khóa', color: 'red' },
    // };

    const { data, mixinFuncs, queryFilter, loading, pagination } = useListBase({
        apiConfig: {
            getList: apiConfig.simulation.getListForEducator,
        },
        options: {
            objectName: 'simulation',
            pageSize: DEFAULT_TABLE_ITEM_SIZE,
        },
    });

    // Fetch danh sách student khi mở modal
    const { data: students, loading: loadingStudents, execute: fetchStudents } = useFetch(
        apiConfig.simulation.studentComplete,
        {
            immediate: false,
            mappingData: (res) => res.data?.content || [],
        },
    );

    const handleViewStudents = (simulation) => {
        setSelectedSimulation(simulation);
        fetchStudents({
            params: { simulationId: simulation.id },
            onCompleted: () => {
                setShowStudentModal(true);
            },
        });
    };

    const columns = [
        {
            title: '#',
            width: '40px',
            align: 'center',
            render: (_, __, index) => calculateIndex(index, pagination, queryFilter),
        },
        {
            title: labels.title,
            dataIndex: 'title',
            width: getColumnWidth({ data, dataIndex: 'title', ratio: 8 }),
        },
        // {
        //     title: labels.educator,
        //     dataIndex: ['educator', 'account', 'fullName'],
        //     width: getColumnWidth({ data, dataIndex: 'educator.account.fullName', ratio: 10 }),
        // },
        // {
        //     title: labels.specialization,
        //     dataIndex: ['specialization', 'name'],
        //     width: getColumnWidth({ data, dataIndex: 'specialization.name', ratio: 10 }),
        // },
        {
            title: labels.level,
            dataIndex: 'level',
            align: 'center',
            width: '120px',
            render: (level) => {
                const item = levelMap[level] || {};
                return <Tag color={item.color}>{item.label}</Tag>;
            },
        },
        {
            title: labels.participantQuantity,
            dataIndex: 'participantQuantity',
            align: 'center',
            width: '120px',
        },
        {
            title: labels.avgRating,
            dataIndex: 'avgRating',
            align: 'center',
            width: '100px',
            render: (rating) => rating ? rating.toFixed(1) : '0.0',
        },
        // {
        //     title: labels.status,
        //     dataIndex: 'status',
        //     align: 'center',
        //     width: '120px',
        //     render: (status) => {
        //         const item = statusMap[status] || {};
        //         return <Tag color={item.color}>{item.label}</Tag>;
        //     },
        // },
        {
            title: labels.review,
            align: 'center',
            width: '140px',
            render: (_, record) => (
                <Button
                    type="primary"
                    icon={<FileSearchOutlined />}
                    onClick={() => handleViewStudents(record)}
                >
                    Xem học viên
                </Button>
            ),
        },
    ];

    const searchFields = [
        { key: 'title', placeholder: labels.title },
        { key: 'educatorName', placeholder: labels.educator },
    ];

    return (
        <PageWrapper routes={pageOptions.renderBreadcrumbs(commonMessage, translate)}>
            <ListPage
                searchForm={mixinFuncs.renderSearchForm({
                    fields: searchFields,
                    initialValues: queryFilter,
                })}
                baseTable={
                    <BaseTable
                        onChange={mixinFuncs.changePagination}
                        columns={columns}
                        dataSource={data}
                        loading={loading}
                        rowKey={record => record.id}
                        pagination={pagination}
                        locale={{
                            emptyText: <Empty description={labels.noData} />,
                        }}
                    />
                }
            />

            {/* Modal hiển thị danh sách student */}
            <Modal
                title={`${labels.studentList}: ${selectedSimulation?.title || ''}`}
                open={showStudentModal}
                onCancel={() => setShowStudentModal(false)}
                footer={null}
                width={900}
            >
                <Spin spinning={loadingStudents}>
                    {students && students.length > 0 ? (
                        <Row gutter={[16, 16]}>
                            {students.map((student) => (
                                <Col span={24} key={student.profileAccountDto.username}>
                                    <Card
                                        hoverable
                                        onClick={() => {
                                            setShowStudentModal(false);
                                            navigate(`/student-review-detail/${selectedSimulation.id}/${student.profileAccountDto.username}`);
                                        }}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <Card.Meta
                                            avatar={
                                                <Avatar
                                                    size={64}
                                                    icon={<UserOutlined />}
                                                    src={
                                                        student.profileAccountDto.avatar
                                                            ? `${AppConstants.contentRootUrl}${student.profileAccountDto.avatar}`
                                                            : null
                                                    }
                                                />
                                            }
                                            title={
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span>{student.profileAccountDto.fullName}</span>
                                                    <Tag color={student.isReviewed ? 'green' : 'orange'} icon={student.isReviewed ? <CheckCircleOutlined /> : null}>
                                                        {student.isReviewed ? 'Đã chấm' : 'Chưa chấm'}
                                                    </Tag>
                                                </div>
                                            }
                                            description={
                                                <div>
                                                    <div><strong>Username:</strong> {student.profileAccountDto.username}</div>
                                                    <div><strong>Email:</strong> {student.profileAccountDto.email || '-'}</div>
                                                    <div><strong>Phone:</strong> {student.profileAccountDto.phone || '-'}</div>
                                                </div>
                                            }
                                        />
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    ) : (
                        <Empty description="Chưa có học viên hoàn thành" />
                    )}
                </Spin>
            </Modal>
        </PageWrapper>
    );
};

export default SimulationReviewListPage;