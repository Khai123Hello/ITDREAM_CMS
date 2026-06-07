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
                            src={data.imagePath.startsWith('http') ? data.imagePath : `${AppConstants.contentRootUrl}${data.imagePath}`}
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
                            {data.descriptionTitle || 'Mô tả'}
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
            {(() => {
                const parseOverview = (overviewInput) => {
                    if (!overviewInput) return null;
                    if (typeof overviewInput === 'object') return overviewInput;
                    try {
                        const parsed = JSON.parse(overviewInput);
                        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && (parsed.hero || parsed.intro || parsed.howItWorks)) {
                            return parsed;
                        }
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            const title = parsed[0].title || '';
                            const content = parsed[0].content || '';
                            return {
                                hero: {
                                    title: title || 'Tại sau nên hoàn thành bài mô phỏng công việc này?',
                                    description: content ? content.replace(/<[^>]*>/g, '').substring(0, 200) : '',
                                    badges: [],
                                    button: 'Xem tất cả',
                                },
                                intro: {
                                    content: content,
                                },
                                howItWorks: {
                                    title: 'Cách thức hoạt động',
                                    items: [],
                                },
                            };
                        }
                        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                            return {
                                hero: {
                                    title: parsed.title || 'Tại sau nên hoàn thành bài mô phỏng công việc này?',
                                    description: parsed.content ? parsed.content.replace(/<[^>]*>/g, '').substring(0, 200) : '',
                                    badges: [],
                                    button: 'Xem tất cả',
                                },
                                intro: {
                                    content: parsed.content || '',
                                },
                                howItWorks: {
                                    title: 'Cách thức hoạt động',
                                    items: [],
                                },
                            };
                        }
                    } catch (e) {
                        console.error('Error parsing overview JSON:', e);
                    }
                    return {
                        hero: {
                            title: 'Tại sau nên hoàn thành bài mô phỏng công việc này?',
                            description: '',
                            badges: [],
                            button: 'Xem tất cả',
                        },
                        intro: {
                            content: overviewInput,
                        },
                        howItWorks: {
                            title: 'Cách thức hoạt động',
                            items: [],
                        },
                    };
                };

                const overview = parseOverview(data.overviewData || data.overview);
                if (!overview) return null;
                
                const hasHero = overview.hero?.title || overview.hero?.description || overview.hero?.badges?.length > 0;
                const hasIntro = overview.intro?.content;
                const hasHowItWorks = overview.howItWorks?.items?.length > 0;
                
                if (!hasHero && !hasIntro && !hasHowItWorks) {
                    return (
                        <Card bordered={false} style={{ marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                            <p style={{ color: '#999', fontStyle: 'italic' }}>Chưa có nội dung tổng quan</p>
                        </Card>
                    );
                }

                const isImageLink = (icon) => {
                    if (!icon || typeof icon !== 'string') return false;
                    const cleanIcon = icon.trim();
                    return cleanIcon.startsWith('http://') || cleanIcon.startsWith('https://') || cleanIcon.startsWith('/') || cleanIcon.startsWith('./');
                };

                return (
                    <Card 
                        bordered={false} 
                        style={{ 
                            marginBottom: 24, 
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            padding: '12px 24px',
                            background: '#ffffff',
                            borderRadius: '12px',
                        }}
                    >
                        {/* HERO SECTION */}
                        {hasHero && (
                            <div style={{ marginBottom: 32 }}>
                                <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937', marginBottom: '16px', lineHeight: '1.2' }}>
                                    {overview.hero.title}
                                </h1>
                                {overview.hero.description && (
                                    <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#4b5563', marginBottom: '20px' }}>
                                        {overview.hero.description}
                                    </p>
                                )}
                                {overview.hero.badges && overview.hero.badges.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                                        {overview.hero.badges.map((badge, idx) => (
                                            <span key={idx} style={{ background: '#e0f2fe', color: '#0369a1', fontWeight: '600', padding: '6px 12px', borderRadius: '20px', fontSize: '13px' }}>
                                                {badge}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {overview.hero.button && (
                                    <div style={{ display: 'inline-block', border: '1px solid #1677ff', color: '#1677ff', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' }}>
                                        {overview.hero.button}
                                    </div>
                                )}
                            </div>
                        )}

                        {hasHero && (hasIntro || hasHowItWorks) && <Divider style={{ margin: '24px 0' }} />}

                        {/* INTRO SECTION */}
                        {hasIntro && (
                            <div style={{ marginBottom: 32 }}>
                                <div 
                                    className="ql-editor preview-content" 
                                    style={{ 
                                        padding: 0,
                                        fontSize: '15px',
                                        lineHeight: '1.8',
                                        color: '#4b5563',
                                    }}
                                    dangerouslySetInnerHTML={{ __html: overview.intro.content }}
                                />
                            </div>
                        )}

                        {hasIntro && hasHowItWorks && <Divider style={{ margin: '24px 0' }} />}

                        {/* HOW IT WORKS SECTION */}
                        {hasHowItWorks && (
                            <div>
                                <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937', marginBottom: '24px' }}>
                                    {overview.howItWorks.title || 'Cách thức hoạt động'}
                                </h2>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {overview.howItWorks.items.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '20px', padding: '20px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                                            <div style={{ 
                                                width: '56px', 
                                                height: '56px', 
                                                borderRadius: '50%', 
                                                background: '#1677ff', 
                                                color: 'white', 
                                                display: 'flex', 
                                                justifyContent: 'center', 
                                                alignItems: 'center', 
                                                fontSize: '24px', 
                                                flexShrink: 0,
                                                overflow: 'hidden',
                                            }}>
                                                {isImageLink(item.icon) ? (
                                                    <img 
                                                        src={item.icon.startsWith('/') && !item.icon.startsWith('//') ? `${AppConstants.contentRootUrl}${item.icon}` : item.icon} 
                                                        alt="step-icon" 
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                    />
                                                ) : (
                                                    item.icon || '💡'
                                                )}
                                            </div>
                                            <div style={{ flex: 1, fontSize: '15px', lineHeight: '1.6', color: '#4b5563', display: 'flex', alignItems: 'center' }}>
                                                {item.text}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Card>
                );
            })()}

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
                        overview: JSON.stringify(data.overviewData || data.overview),
                        imagePath: data.imagePath || null,
                        videoPath: data.videoPath || null,
                    }, null, 2)}
                </pre>
            </Card>


        </div>
    );
};

export default SimulationPreview;