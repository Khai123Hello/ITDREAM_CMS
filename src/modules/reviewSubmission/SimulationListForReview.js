import React from 'react';
import { Empty, Tag, Button } from 'antd';
import {
    UnorderedListOutlined,
    ClockCircleOutlined,
    SolutionOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useListBase from '@hooks/useListBase';
import useTranslate from '@hooks/useTranslate';
import { AppConstants, DEFAULT_TABLE_ITEM_SIZE } from '@constants';
import apiConfig from '@constants/apiConfig';
import { FieldTypes } from '@constants/formConfig';
import { simulationStatusOptions, levelOptions } from '@constants/masterData';
import { commonMessage } from '@locales/intl';
import AvatarField from '@components/common/form/AvatarField';
import BaseTable from '@components/common/table/BaseTable';
import ListPage from '@components/common/layout/ListPage';
import { calculateIndex } from '@utils';

const SimulationListForReview = () => {
    const translate = useTranslate();
    const navigate = useNavigate();

    const formattedStatusOptions = translate.formatKeys(simulationStatusOptions, ['label']);
    const formattedLevelOptions = translate.formatKeys(levelOptions, ['label']);

    const statusMap = Object.fromEntries(formattedStatusOptions.map((item) => [item.value, item]));
    const levelMap = Object.fromEntries(formattedLevelOptions.map((item) => [item.value, item]));

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

    const statusValues = formattedStatusOptions.map((item) => ({ value: item.value, label: item.label }));
    const levelValues = formattedLevelOptions.map((item) => ({ value: item.value, label: item.label }));

    // Chỉ lấy API danh sách
    const apiConfiguration = {
        getList: apiConfig.simulation.getListForEducator,
    };

    const { data, mixinFuncs, queryFilter, loading, pagination } = useListBase({
        apiConfig: apiConfiguration,
        options: {
            objectName: labels.simulation,
            pageSize: DEFAULT_TABLE_ITEM_SIZE,
        },
        override: (funcs) => {
            funcs.actionColumnButtons = () => {
                return {
                    // Nút Nhận xét (chuyển sang lớp 2)
                    review: ({ id }) => (
                        <Button
                            type="link"
                            style={{ padding: 0 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/simulation-review?simulationId=${id}`);
                            }}
                            title="Nhận xét học viên"
                        >
                            <SolutionOutlined />
                        </Button>
                    ),
                };
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

    const columns = [
        {
            title: '#',
            width: '50px',
            align: 'center',
            render: (_, __, index) => calculateIndex(index, pagination, queryFilter),
        },
        {
            title: labels.title,
            dataIndex: 'title',
            render: (text, record) => {
                const imagePath = record.thumbnail || record.imagePath;
                const imageUrl = imagePath
                    ? imagePath.startsWith('http')
                        ? imagePath
                        : `${AppConstants.contentRootUrl}${imagePath}`
                    : null;
                const specName = record.category?.name || record.specialization?.name;
                const levelItem = levelMap[record.level] || {};
                const duration = record.duration || record.totalEstimatedTime;

                return (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '4px 0' }}>
                        <AvatarField
                            size={44}
                            shape="square"
                            icon={<UnorderedListOutlined />}
                            src={imageUrl}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
                            <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px', lineHeight: '1.4' }}>
                                {text}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', rowGap: '4px' }}>
                                {specName && (
                                    <Tag color="default" style={{ margin: 0, fontSize: '11px', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569', borderRadius: '4px' }}>
                                        {specName}
                                    </Tag>
                                )}
                                {levelItem.label && (
                                    <Tag color={levelItem.color || 'blue'} style={{ margin: 0, fontSize: '11px', borderRadius: '4px' }}>
                                        {levelItem.label}
                                    </Tag>
                                )}
                                {duration && (
                                    <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
                                        <ClockCircleOutlined style={{ fontSize: '11px' }} />
                                        {duration}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            },
        },
        mixinFuncs.renderStatusColumn({ width: '120px' }),
        mixinFuncs.renderActionColumn(
            {
                review: () => true,
            },
            { width: '80px', title: labels.action },
        ),
    ];

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

    return (
        <ListPage
            searchForm={mixinFuncs.renderSearchForm({ fields: searchFields, initialValues: queryFilter })}
            actionBar={null}
            baseTable={
                <BaseTable
                    scroll={{ x: false }}
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
    );
};

export default SimulationListForReview;
