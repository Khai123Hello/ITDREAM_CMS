import React from 'react';
import { Card, Space, Tag, Divider } from 'antd';
import { ClockCircleOutlined, BookOutlined, TrophyOutlined } from '@ant-design/icons';
import { AppConstants } from '@constants';
import 'react-quill/dist/quill.snow.css';
import './SimulationPreview.css';

const SimulationPreview = ({ data }) => {
    if (!data) {
        return (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#999' }}>
                <p>Không có dữ liệu để hiển thị</p>
            </div>
        );
    }

    return (
        <div style={{ 
            maxWidth: '900px', 
            margin: '0 auto',
            background: '#f5f7fa',
            minHeight: '100vh',
            padding: '24px',
        }}>
            {/* Header Section */}
            <Card 
                bordered={false}
                style={{ 
                    marginBottom: 24,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
            >
                <div style={{ marginBottom: 16 }}>
                    <h1 style={{ 
                        fontSize: 28, 
                        fontWeight: 700, 
                        marginBottom: 16,
                        color: '#1a1a1a',
                        lineHeight: 1.3,
                    }}>
                        {data.title || 'Chưa có tiêu đề'}
                    </h1>
                    
                    <Space size={[8, 16]} wrap>
                        {data.level && (
                            <Tag 
                                icon={<TrophyOutlined />}
                                color="blue" 
                                style={{ 
                                    padding: '4px 12px',
                                    fontSize: 14,
                                }}
                            >
                                Level {data.level.label || data.level}
                            </Tag>
                        )}
                        
                        {data.totalEstimatedTime && (
                            <Tag 
                                icon={<ClockCircleOutlined />}
                                color="green"
                                style={{ 
                                    padding: '4px 12px',
                                    fontSize: 14,
                                }}
                            >
                                {data.totalEstimatedTime}
                            </Tag>
                        )}
                        
                        {data.specialization && (
                            <Tag 
                                icon={<BookOutlined />}
                                color="orange"
                                style={{ 
                                    padding: '4px 12px',
                                    fontSize: 14,
                                }}
                            >
                                {data.specialization.label}
                            </Tag>
                        )}
                    </Space>
                </div>

                {/* Featured Image */}
                {data.imagePath && (
                    <div style={{ marginTop: 24 }}>
                        <img
                            src={`${AppConstants.contentRootUrl}${data.imagePath}`}
                            alt="Course preview"
                            style={{ 
                                width: '100%', 
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            }}
                        />
                    </div>
                )}

                {/* Video */}
                {data.videoPath && (
                    <div style={{ marginTop: 16 }}>
                        <div style={{
                            background: '#f0f0f0',
                            padding: '12px 16px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}>
                            <span style={{ fontSize: 20 }}>🎬</span>
                            <span style={{ color: '#666', fontSize: 14 }}>
                                Video: {data.videoPath}
                            </span>
                        </div>
                    </div>
                )}
            </Card>

            {/* Description Section */}
            {(data.descriptionTitle || data.descriptionContent) && (
                <Card 
                    bordered={false}
                    style={{ 
                        marginBottom: 24,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}
                >
                    <div style={{ 
                        borderLeft: '4px solid #1890ff',
                        paddingLeft: 16,
                        marginBottom: 16,
                    }}>
                        <h2 style={{ 
                            fontSize: 22,
                            fontWeight: 600,
                            margin: 0,
                            color: '#1890ff',
                        }}>
                            {data.descriptionTitle || 'Mô tả khóa học'}
                        </h2>
                    </div>
                    
                    {data.descriptionContent && data.descriptionContent !== '<p><br></p>' ? (
                        <div 
                            className="ql-editor preview-content" 
                            style={{ 
                                padding: 0,
                                fontSize: 15,
                                lineHeight: 1.8,
                                color: '#333',
                            }}
                            dangerouslySetInnerHTML={{ __html: data.descriptionContent }}
                        />
                    ) : (
                        <p style={{ color: '#999', fontStyle: 'italic' }}>
                            Chưa có nội dung mô tả
                        </p>
                    )}
                </Card>
            )}

            {/* Overview Section */}
            {(data.overviewTitle || data.overviewContent) && (
                <Card 
                    bordered={false}
                    style={{ 
                        marginBottom: 24,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}
                >
                    <div style={{ 
                        borderLeft: '4px solid #52c41a',
                        paddingLeft: 16,
                        marginBottom: 16,
                    }}>
                        <h2 style={{ 
                            fontSize: 22,
                            fontWeight: 600,
                            margin: 0,
                            color: '#52c41a',
                        }}>
                            {data.overviewTitle || 'Tổng quan khóa học'}
                        </h2>
                    </div>
                    
                    {data.overviewContent && data.overviewContent !== '<p><br></p>' ? (
                        <div 
                            className="ql-editor preview-content" 
                            style={{ 
                                padding: 0,
                                fontSize: 15,
                                lineHeight: 1.8,
                                color: '#333',
                            }}
                            dangerouslySetInnerHTML={{ __html: data.overviewContent }}
                        />
                    ) : (
                        <p style={{ color: '#999', fontStyle: 'italic' }}>
                            Chưa có nội dung tổng quan
                        </p>
                    )}
                </Card>
            )}

            {/* Debug Info (Optional - remove in production) */}
            <Card 
                bordered={false}
                title={
                    <span style={{ fontSize: 14, color: '#999' }}>
                        📋 JSON Output (Debug)
                    </span>
                }
                style={{ 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
            >
                <pre style={{ 
                    background: '#f5f5f5', 
                    padding: 16, 
                    borderRadius: 6, 
                    fontSize: 12,
                    overflow: 'auto',
                    maxHeight: 300,
                    margin: 0,
                    border: '1px solid #e8e8e8',
                }}>
                    {JSON.stringify({
                        title: data.title,
                        specializationId: data.specialization?.value,
                        level: typeof data.level === 'object' ? data.level.value : data.level,
                        totalEstimatedTime: data.totalEstimatedTime,
                        description: JSON.stringify({
                            title: data.descriptionTitle || '',
                            content: data.descriptionContent || '',
                        }),
                        overview: JSON.stringify([{
                            title: data.overviewTitle || '',
                            content: data.overviewContent || '',
                        }]),
                        imagePath: data.imagePath || null,
                        videoPath: data.videoPath || null,
                    }, null, 2)}
                </pre>
            </Card>


        </div>
    );
};

export default SimulationPreview;