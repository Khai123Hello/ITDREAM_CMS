import React, { useMemo, useState, useEffect } from 'react';
import { Empty, Spin } from 'antd';
import useFetch from '@hooks/useFetch';
import { storageKeys, UserTypes } from '@constants';
import apiConfig from '@constants/apiConfig';
import { getData } from '@utils/localStorage';
import styles from './SimulationTaskPanel.module.scss';

// ─────────────────────────────────────────
// Helpers: detect content type
// ─────────────────────────────────────────
function detectContentType(content) {
    if (!content || typeof content !== 'string') return 'empty';
    const trimmed = content.trim();
    if (trimmed.startsWith('[')) {
        try {
            const p = JSON.parse(trimmed);
            if (Array.isArray(p)) return 'blocks';
        } catch (e) {
            // ignore
        }
    }
    if (/^#{1,3}\s|^\*\s|\*\*/m.test(trimmed)) return 'markdown';
    return 'text';
}

// ─────────────────────────────────────────
// Renderer: plain text
// ─────────────────────────────────────────
function PlainTextContent({ text }) {
    return (
        <div className={styles.plainText}>
            {text.split('\n\n').map((para, i) => (
                <p key={i}>{para.trim()}</p>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────
// Renderer: markdown
// ─────────────────────────────────────────
function parseInline(text) {
    return text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

function MarkdownContent({ text }) {
    const lines = text.split('\n');
    const elements = [];
    let listItems = [];
    let key = 0;

    const flushList = () => {
        if (listItems.length) {
            elements.push(
                <ul key={key++} className={styles.mdList}>
                    {listItems.map((li, i) => (
                        <li key={i} dangerouslySetInnerHTML={{ __html: parseInline(li) }} />
                    ))}
                </ul>,
            );
            listItems = [];
        }
    };

    lines.forEach((line) => {
        const h3 = line.match(/^###\s+(.+)/);
        const h2 = line.match(/^##\s+(.+)/);
        const h1 = line.match(/^#\s+(.+)/);
        const li = line.match(/^\*\s+(.+)/);
        const blank = line.trim() === '';

        if (h1) {
            flushList();
            elements.push(
                <h2 key={key++} className={styles.mdH1}>
                    {h1[1]}
                </h2>,
            );
            return;
        }
        if (h2) {
            flushList();
            elements.push(
                <h2 key={key++} className={styles.mdH2}>
                    {h2[1]}
                </h2>,
            );
            return;
        }
        if (h3) {
            flushList();
            elements.push(
                <h3 key={key++} className={styles.mdH3}>
                    {h3[1]}
                </h3>,
            );
            return;
        }
        if (li) {
            listItems.push(li[1]);
            return;
        }
        if (blank) {
            flushList();
            return;
        }
        flushList();
        elements.push(
            <p key={key++} className={styles.mdPara} dangerouslySetInnerHTML={{ __html: parseInline(line) }} />,
        );
    });
    flushList();
    return <div className={styles.markdownContent}>{elements}</div>;
}

// ─────────────────────────────────────────
// Renderer: JSON blocks
// ─────────────────────────────────────────
function BlocksContent({ blocksJson }) {
    const blocks = useMemo(() => {
        try {
            return JSON.parse(blocksJson);
        } catch {
            return [];
        }
    }, [ blocksJson ]);

    return (
        <div className={styles.blocksContent}>
            {blocks.map((block, idx) => (
                <BlockItem key={idx} block={block} idx={idx} allBlocks={blocks} />
            ))}
        </div>
    );
}

function BlockItem({ block, idx, allBlocks }) {
    switch (block.type) {
        case 'meta':
            return (
                <div className={styles.blockMeta}>
                    <span className={styles.blockMetaVal}>{block.duration}</span>
                    <span className={styles.blockMetaDot}>·</span>
                    <span className={styles.blockMetaVal}>{block.level}</span>
                </div>
            );
        case 'section':
            return (
                <div className={styles.blockSection}>
                    <div className={styles.blockSectionHeader}>
                        <span className={styles.blockSectionIcon}>{block.icon}</span>
                        <span className={styles.blockSectionTitle}>{block.title}</span>
                    </div>
                    <ul className={styles.blockSectionList}>
                        {(block.bullets || []).filter(Boolean).map((b, i) => (
                            <li key={i}>{b}</li>
                        ))}
                    </ul>
                </div>
            );
        case 'text':
            return <p className={styles.blockText}>{block.content}</p>;
        case 'h1':
            return <h2 className={styles.blockH1}>{block.content}</h2>;
        case 'h2':
            return <h3 className={styles.blockH2}>{block.content}</h3>;
        case 'h3':
            return <h4 className={styles.blockH3}>{block.content}</h4>;
        case 'bullet':
            return (
                <div className={styles.blockBulletWrap}>
                    <span className={styles.blockBulletDot}>•</span>
                    <span className={styles.blockBulletText}>{block.content}</span>
                </div>
            );
        case 'numbered': {
            const num = allBlocks.filter((b, i) => b.type === 'numbered' && i <= idx).length;
            return (
                <div className={styles.blockBulletWrap}>
                    <span className={styles.blockNumLabel}>{num}.</span>
                    <span className={styles.blockBulletText}>{block.content}</span>
                </div>
            );
        }
        case 'divider':
            return <hr className={styles.blockDivider} />;
        case 'callout':
            return (
                <div className={styles.blockCallout}>
                    <span className={styles.blockCalloutIcon}>{block.icon}</span>
                    <span className={styles.blockCalloutText}>{block.content}</span>
                </div>
            );
        case 'code':
            return (
                <div className={styles.blockCode}>
                    <pre>{block.content}</pre>
                </div>
            );
        case 'step':
            return (
                <div className={styles.blockStep}>
                    <span className={styles.blockStepLabel}>{block.label}:</span>
                    <span className={styles.blockStepBody}>{block.body}</span>
                </div>
            );
        default:
            return null;
    }
}

// ─────────────────────────────────────────
// Smart content renderer
// ─────────────────────────────────────────
function ContentRenderer({ content }) {
    const type = useMemo(() => detectContentType(content), [ content ]);
    if (type === 'empty') return <p className={styles.emptyContent}>Không có nội dung.</p>;
    if (type === 'blocks') return <BlocksContent blocksJson={content} />;
    if (type === 'markdown') return <MarkdownContent text={content} />;
    return <PlainTextContent text={content} />;
}

// ─────────────────────────────────────────
// Main component
// ─────────────────────────────────────────
const SimulationTaskPanel = ({ simulationId }) => {
    const userType = getData(storageKeys.USER_TYPE);
    const isEducator = userType === UserTypes.EDUCATOR;

    const {
        data: tasks,
        loading: loadingTasks,
        execute: fetchTasks,
    } = useFetch(isEducator ? apiConfig.task.listByEducator : apiConfig.task.getList, {
        immediate: false,
        mappingData: (res) => res.data?.content || [],
    });

    useEffect(() => {
        if (simulationId && simulationId !== 'create') {
            fetchTasks({
                params: { simulationId, size: 1000 },
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [simulationId]);

    // Parent tasks (kind=1)
    const parentTasks = useMemo(
        () => (tasks || []).filter((t) => t.kind === 1).sort((a, b) => (a.orderInParent ?? 0) - (b.orderInParent ?? 0)),
        [ tasks ],
    );

    const [ activeParentId, setActiveParentId ] = useState(null);

    // Set first parent active once tasks loaded
    useEffect(() => {
        if (parentTasks.length > 0) {
            setActiveParentId(parentTasks[0].id);
        } else {
            setActiveParentId(null);
        }
    }, [ parentTasks ]);

    const handleSelectParent = (parentId) => {
        setActiveParentId(parentId);
    };

    if (!simulationId || simulationId === 'create') {
        return (
            <div style={{ padding: '32px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #e8e4dc', color: '#8a877f' }}>
                Vui lòng lưu thông tin bài mô phỏng trước để hiển thị danh sách nhiệm vụ.
            </div>
        );
    }

    if (loadingTasks) {
        return (
            <div style={{ padding: '60px 0', textAlign: 'center' }}>
                <Spin tip="Đang tải danh sách nhiệm vụ..." />
            </div>
        );
    }

    if (!parentTasks.length) {
        return (
            <div style={{ padding: '48px 0', background: '#fff', borderRadius: '12px', border: '1px solid #e8e4dc' }}>
                <Empty description="Chưa có nhiệm vụ nào trong bài mô phỏng này." />
            </div>
        );
    }

    return (
        <div className={styles.panel}>
            {/* ── SIDEBAR (task cha) ── */}
            <aside className={styles.sidebar}>
                {parentTasks.map((task, index) => {
                    const isActive = task.id === activeParentId;
                    const isLast = index === parentTasks.length - 1;
                    return (
                        <div key={task.id} className={styles.sidebarRow}>
                            {/* Timeline column */}
                            <div className={styles.sidebarTimeline}>
                                <button
                                    className={`${styles.sidebarCircle} ${isActive ? styles.sidebarCircleActive : ''}`}
                                    onClick={() => handleSelectParent(task.id)}
                                    aria-label={`Task ${index + 1}`}
                                >
                                    {index + 1}
                                </button>
                                {!isLast && <div className={styles.sidebarConnector} />}
                            </div>

                            {/* Content column */}
                            <button
                                className={`${styles.sidebarContentBtn}`}
                                onClick={() => handleSelectParent(task.id)}
                            >
                                <span className={`${styles.sidebarTitle} ${isActive ? styles.sidebarTitleActive : ''}`}>
                                    {task.title || task.name}
                                </span>
                                {task.description && (
                                    <span className={styles.sidebarDesc}>
                                        {task.description.length > 50
                                            ? `${task.description.slice(0, 50)}…`
                                            : task.description}
                                    </span>
                                )}
                                {task.estimatedTime && (
                                    <span className={styles.sidebarTime}>
                                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                                            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
                                            <path
                                                d="M7 4v3.5l2 1.5"
                                                stroke="currentColor"
                                                strokeWidth="1.2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        {task.estimatedTime}
                                    </span>
                                )}
                            </button>
                        </div>
                    );
                })}
            </aside>

            {/* ── DETAIL (Task chính) ── */}
            <div className={styles.detail}>
                {(() => {
                    const parent = parentTasks.find((p) => p.id === activeParentId);
                    return parent ? (
                        <div className={styles.detailContent}>
                            <h1 className={styles.detailTitle}>{parent.title || parent.name}</h1>
                            {parent.description && <p className={styles.detailDescription}>{parent.description}</p>}
                            <ContentRenderer content={parent.content} />
                        </div>
                    ) : (
                        <div className={styles.noTask}>Chọn một nhiệm vụ để xem nội dung.</div>
                    );
                })()}
            </div>
        </div>
    );
};

export default SimulationTaskPanel;
