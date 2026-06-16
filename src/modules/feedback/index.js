import React, { useEffect, useState } from 'react';
import { Empty, Avatar, Rate, Card, Row, Col, Progress, Statistic } from 'antd';
import dayjs from 'dayjs';

import useListBase from '@hooks/useListBase';
import useTranslate from '@hooks/useTranslate';
import useFetch from '@hooks/useFetch';
import useQueryParams from '@hooks/useQueryParams';

import { DEFAULT_TABLE_ITEM_SIZE, AppConstants } from '@constants';
import { FieldTypes } from '@constants/formConfig';
import apiConfig from '@constants/apiConfig';
import { commonMessage } from '@locales/intl';

import BaseTable from '@components/common/table/BaseTable';
import ListPage from '@components/common/layout/ListPage';
import PageWrapper from '@components/common/layout/PageWrapper';

const FeedbackListPage = () => {
    const translate = useTranslate();
    const { params: queryParams, deserializeParams } = useQueryParams();
    const [simulations, setSimulations] = useState([]);

    const labels = {
        student: 'Học viên',
        simulation: 'Bài mô phỏng',
        star: 'Đánh giá',
        content: 'Nhận xét',
        createdDate: 'Ngày đánh giá',
        action: translate.formatMessage(commonMessage.action),
        feedback: 'Đánh giá',
        noData: translate.formatMessage(commonMessage.noData),
    };

    const { execute: executeGetSimulations } = useFetch(apiConfig.simulation.getList);

    const { data, mixinFuncs, loading, pagination, queryFilter, setData, setPagination, setLoading } = useListBase({
        apiConfig: {
            getList: apiConfig.feedback.list,
            delete: apiConfig.feedback.delete,
        },
        options: {
            objectName: labels.feedback,
            pageSize: DEFAULT_TABLE_ITEM_SIZE,
        },
        override: (funcs) => {
            funcs.getCreateLink = () => null;
            funcs.getItemDetailLink = () => null;

            // Override handleFetchList to prevent fetching feedbacks without simulationId
            funcs.handleFetchList = (params) => {
                if (!params.simulationId) {
                    setData([]);
                    setPagination((p) => ({ ...p, total: 0 }));
                    return;
                }
                setLoading(true);
                funcs.executeGetList({
                    params,
                    onCompleted: (response) => {
                        funcs.onCompletedGetList(response);
                        setLoading(false);
                    },
                    onError: (error) => {
                        funcs.handleGetListError(error);
                        setLoading(false);
                    },
                });
            };
        },
    });

    useEffect(() => {
        executeGetSimulations({
            params: { page: 0, size: 100 },
            onCompleted: (res) => {
                const fetchedSims = res.data?.content || [];
                setSimulations(fetchedSims);
                const currentFilter = deserializeParams(queryParams);
                if (!currentFilter.simulationId && fetchedSims.length > 0) {
                    mixinFuncs.changeFilter({ ...currentFilter, simulationId: fetchedSims[0].id });
                }
            },
        });
    }, []);

    // Calculate dynamic stats
    const totalCount = pagination.total || data?.length || 0;
    const currentListCount = data?.length || 0;
    const avgRating =
        currentListCount > 0
            ? (data.reduce((sum, item) => sum + (item.star || 0), 0) / currentListCount).toFixed(1)
            : '0.0';

    const starCounts = [0, 0, 0, 0, 0];
    data?.forEach((item) => {
        if (item.star >= 1 && item.star <= 5) {
            starCounts[item.star - 1]++;
        }
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
            title: labels.student,
            width: '200px',
            render: (_, record) => {
                const account = record.student?.account || {};
                const fullName = account.fullName || '-';
                const username = account.username ? `(${account.username})` : '';
                const avatar = account.avatar;
                const fullUrl = avatar
                    ? avatar.startsWith('http')
                        ? avatar
                        : `${AppConstants.contentRootUrl}${avatar}`
                    : null;
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Avatar src={fullUrl} size={32} />
                        <div>
                            <div style={{ fontWeight: '500' }}>{fullName}</div>
                            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>{username}</div>
                        </div>
                    </div>
                );
            },
        },
        {
            title: labels.star,
            dataIndex: 'star',
            width: '150px',
            render: (star) => <Rate disabled defaultValue={star} style={{ fontSize: '14px' }} />,
        },
        {
            title: labels.content,
            dataIndex: 'content',
            render: (text) => text || '-',
        },
        {
            title: labels.createdDate,
            dataIndex: 'createdDate',
            width: '180px',
            render: (date) => (date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-'),
        },
        mixinFuncs.renderActionColumn(
            {
                edit: false,
                delete: () => mixinFuncs.hasPermission([apiConfig.feedback.delete.permissionCode]),
            },
            { width: '100px', title: labels.action, align: 'center' },
        ),
    ];

    const searchFields = [
        {
            key: 'simulationId',
            type: FieldTypes.SELECT,
            options: simulations.map((s) => ({ label: s.name || s.title, value: s.id })),
            placeholder: 'Chọn bài mô phỏng',
            submitOnChanged: true,
            colSpan: 8,
        },
    ];

    const breadcrumbs = [
        { breadcrumbName: translate.formatMessage(commonMessage.home) },
        { breadcrumbName: labels.feedback },
    ];

    return (
        <PageWrapper routes={breadcrumbs}>
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} md={8}>
                    <Card style={{ height: '100%', borderRadius: '12px' }} bodyStyle={{ padding: '24px' }}>
                        <Statistic
                            title="Điểm Đánh Giá Trung Bình"
                            value={avgRating}
                            precision={1}
                            suffix="/ 5.0"
                            valueStyle={{ color: '#fa8c16', fontSize: '32px', fontWeight: 'bold' }}
                        />
                        <Rate
                            disabled
                            allowHalf
                            value={parseFloat(avgRating)}
                            style={{ marginTop: '8px', fontSize: '18px' }}
                        />
                        <div style={{ marginTop: '8px', color: '#8c8c8c', fontSize: '12px' }}>
                            Tính trên các đánh giá của trang hiện tại
                        </div>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card style={{ height: '100%', borderRadius: '12px' }} bodyStyle={{ padding: '24px' }}>
                        <Statistic
                            title="Tổng Số Đánh Giá"
                            value={totalCount}
                            valueStyle={{ fontSize: '32px', fontWeight: 'bold' }}
                        />
                        <div style={{ marginTop: '16px', color: '#52c41a', fontWeight: '500' }}>
                            Bài mô phỏng đang chọn
                        </div>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card style={{ height: '100%', borderRadius: '12px' }} bodyStyle={{ padding: '16px 24px' }}>
                        <h4 style={{ margin: '0 0 12px 0', color: '#8c8c8c', fontSize: '14px', fontWeight: 'normal' }}>
                            Phân Bổ Sao (Đánh giá)
                        </h4>
                        {[5, 4, 3, 2, 1].map((star) => {
                            const count = starCounts[star - 1] || 0;
                            const percent = currentListCount > 0 ? Math.round((count / currentListCount) * 100) : 0;
                            return (
                                <Row key={star} align="middle" gutter={8} style={{ marginBottom: '4px' }}>
                                    <Col span={3} style={{ fontSize: '12px' }}>
                                        {star} ★
                                    </Col>
                                    <Col span={17}>
                                        <Progress
                                            percent={percent}
                                            showInfo={false}
                                            strokeColor="#fa8c16"
                                            size="small"
                                        />
                                    </Col>
                                    <Col span={4} style={{ fontSize: '12px', textAlign: 'right', color: '#8c8c8c' }}>
                                        {count}
                                    </Col>
                                </Row>
                            );
                        })}
                    </Card>
                </Col>
            </Row>

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
        </PageWrapper>
    );
};

export default FeedbackListPage;
