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
        <div
            style={{
                maxWidth: '900px',
                margin: '0 auto',
                background: '#f5f7fa',
                minHeight: '100vh',
                padding: '24px',
            }}
        >
            {/* Header Section */}
            <Card
                bordered={false}
                style={{
                    marginBottom: 24,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
            >
                <div style={{ marginBottom: 16 }}>
                    <h1
                        style={{
                            fontSize: 28,
                            fontWeight: 700,
                            marginBottom: 16,
                            color: '#1a1a1a',
                            lineHeight: 1.3,
                        }}
                    >
                        {data.title || 'Chưa có tiêu đề'}
                    </h1>

                    {/* Render plain description (short description) */}
                    {data.description && (
                        <p
                            style={{
                                fontSize: 16,
                                color: '#666',
                                lineHeight: 1.6,
                                fontStyle: 'italic',
                                marginBottom: 16,
                            }}
                        >
                            {data.description}
                        </p>
                    )}

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

                        {(data.totalEstimatedTime || data.duration) && (
                            <Tag
                                icon={<ClockCircleOutlined />}
                                color="green"
                                style={{
                                    padding: '4px 12px',
                                    fontSize: 14,
                                }}
                            >
                                {data.totalEstimatedTime || data.duration}
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
                {(data.imagePath || data.thumbnail) && (
                    <div style={{ marginTop: 24 }}>
                        <img
                            src={
                                (data.imagePath || data.thumbnail).startsWith('http')
                                    ? data.imagePath || data.thumbnail
                                    : `${AppConstants.contentRootUrl}${data.imagePath || data.thumbnail}`
                            }
                            alt="Course preview"
                            style={{
                                width: '100%',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            }}
                        />
                    </div>
                )}
            </Card>

            {/* Overview Section */}
            {(() => {
                const parseOverview = (overviewInput) => {
                    if (!overviewInput) return null;
                    if (typeof overviewInput === 'object') return overviewInput;
                    try {
                        const parsed = JSON.parse(overviewInput);
                        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                            return {
                                hero: {
                                    title: 'Tại sao nên hoàn thành bài mô phỏng công việc này?',
                                    description: parsed.introduction || parsed.hero?.description || '',
                                    badges: Array.isArray(parsed.bager)
                                        ? parsed.bager
                                        : Array.isArray(parsed.barger)
                                            ? parsed.barger
                                            : parsed.hero?.badges || [],
                                    button: '',
                                    skills: Array.isArray(parsed.skills) ? parsed.skills : [],
                                },
                                intro: {
                                    content: parsed.content || parsed.intro?.content || '',
                                },
                                howItWorks: {
                                    title: 'Video',
                                    items: [],
                                },
                            };
                        }
                    } catch (e) {
                        console.error('Error parsing overview JSON:', e);
                    }
                    return {
                        hero: {
                            title: 'Tại sao nên hoàn thành bài mô phỏng công việc này?',
                            description: '',
                            badges: [],
                            button: '',
                            skills: [],
                        },
                        intro: {
                            content: overviewInput,
                        },
                        howItWorks: {
                            title: 'Video',
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
                                <h1
                                    style={{
                                        fontSize: '32px',
                                        fontWeight: '700',
                                        color: '#1f2937',
                                        marginBottom: '16px',
                                        lineHeight: '1.2',
                                    }}
                                >
                                    {overview.hero.title}
                                </h1>
                                {overview.hero.description && (
                                    <div
                                        className="ql-editor preview-content"
                                        style={{
                                            padding: 0,
                                            fontSize: '15px',
                                            lineHeight: '1.6',
                                            color: '#4b5563',
                                            marginBottom: '20px',
                                        }}
                                        dangerouslySetInnerHTML={{ __html: overview.hero.description }}
                                    />
                                )}
                                {overview.hero.badges && overview.hero.badges.length > 0 && (
                                    <div
                                        style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}
                                    >
                                        {overview.hero.badges.map((badge, idx) => (
                                            <span
                                                key={idx}
                                                style={{
                                                    background: '#fef9c3',
                                                    color: '#ca8a04',
                                                    border: '1px solid #fef08a',
                                                    fontWeight: '600',
                                                    padding: '6px 12px',
                                                    borderRadius: '20px',
                                                    fontSize: '13px',
                                                }}
                                            >
                                                {badge}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {overview.hero.skills && overview.hero.skills.length > 0 && (
                                    <div style={{ marginTop: '16px', marginBottom: '24px' }}>
                                        <div
                                            style={{
                                                fontSize: '14px',
                                                fontWeight: '700',
                                                color: '#374151',
                                                marginBottom: '8px',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                            }}
                                        >
                                            Kỹ năng bạn sẽ thực hành
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                            {overview.hero.skills.map((skill, idx) => (
                                                <span
                                                    key={idx}
                                                    style={{
                                                        background: '#f3f4f6',
                                                        color: '#4b5563',
                                                        border: '1px solid #e5e7eb',
                                                        fontWeight: '500',
                                                        padding: '4px 10px',
                                                        borderRadius: '6px',
                                                        fontSize: '12.5px',
                                                    }}
                                                >
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {overview.hero.button && (
                                    <div
                                        style={{
                                            display: 'inline-block',
                                            border: '1px solid #1677ff',
                                            color: '#1677ff',
                                            padding: '10px 20px',
                                            borderRadius: '8px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s',
                                        }}
                                    >
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

                        {/* VIDEO SECTION */}
                        {data.videoPath && (
                            <div>
                                <h2
                                    style={{
                                        fontSize: '24px',
                                        fontWeight: '600',
                                        color: '#1f2937',
                                        marginBottom: '24px',
                                    }}
                                >
                                    Video
                                </h2>
                                <div
                                    style={{
                                        position: 'relative',
                                        width: '100%',
                                        borderRadius: 12,
                                        overflow: 'hidden',
                                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                                    }}
                                >
                                    <video controls style={{ width: '100%', display: 'block' }}>
                                        <source
                                            src={
                                                data.videoPath.startsWith('http')
                                                    ? data.videoPath
                                                    : `${AppConstants.contentRootUrl}${data.videoPath}`
                                            }
                                        />
                                        Trình duyệt của bạn không hỗ trợ phát video.
                                    </video>
                                </div>
                            </div>
                        )}
                    </Card>
                );
            })()}

            {/* Debug Info (Optional - remove in production) */}
            <Card
                bordered={false}
                title={<span style={{ fontSize: 14, color: '#999' }}>📋 JSON Output (Debug)</span>}
                style={{
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
            >
                <pre
                    style={{
                        background: '#f5f5f5',
                        padding: 16,
                        borderRadius: 6,
                        fontSize: 12,
                        overflow: 'auto',
                        maxHeight: 300,
                        margin: 0,
                        border: '1px solid #e8e8e8',
                    }}
                >
                    {JSON.stringify(
                        {
                            title: data.title,
                            categoryId: data.categoryId || data.specialization?.value,
                            level: typeof data.level === 'object' ? data.level.value : data.level,
                            duration: data.totalEstimatedTime || data.duration,
                            description: data.description || '',
                            overview: JSON.stringify(data.overviewData || data.overview),
                            thumbnail: data.imagePath || data.thumbnail || null,
                            videoPath: data.videoPath || null,
                        },
                        null,
                        2,
                    )}
                </pre>
            </Card>
        </div>
    );
};

export default SimulationPreview;
