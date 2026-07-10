import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Tooltip } from 'antd';
import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import UnderlineExtension from '@tiptap/extension-underline';
import ImageExtension from '@tiptap/extension-image';
import { Typography } from '@tiptap/extension-typography';
import { Highlight } from '@tiptap/extension-highlight';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import { Node, mergeAttributes } from '@tiptap/core';

import TipTapJsonRenderer from './TipTapJsonRenderer';
import TableOfContents from './TableOfContents';
import './BlogDesigner.scss';

// ─────────────────────────────────────────────────────────────
// 1. TipTap Custom Extensions  (Callout, YouTube, Step, Section)
// ─────────────────────────────────────────────────────────────

// — Callout —
const CalloutNodeView = ({ node, updateAttributes, deleteNode }) => {
    const icon = node.attrs.icon || '💡';
    const emojis = ['💡', 'ℹ️', '⚠️', '🔥', '📢', '📝', '🎯', '🚀', '🌟', '💻', '✅', '❌'];
    const [showPicker, setShowPicker] = useState(false);
    const pickerRef = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false);
        };
        if (showPicker) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showPicker]);

    return (
        <NodeViewWrapper className="bd-callout-node">
            <div className="bd-callout-icon" contentEditable={false} onClick={() => setShowPicker(!showPicker)}>
                {icon}
                {showPicker && (
                    <div className="bd-emoji-picker" ref={pickerRef}>
                        {emojis.map((e) => (
                            <button
                                key={e}
                                type="button"
                                className="bd-emoji-btn"
                                onClick={() => {
                                    updateAttributes({ icon: e });
                                    setShowPicker(false);
                                }}
                            >
                                {e}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <NodeViewContent className="bd-callout-content" />
            <button type="button" className="bd-node-delete" onClick={deleteNode} contentEditable={false}>
                ✕
            </button>
        </NodeViewWrapper>
    );
};

const CalloutExtension = Node.create({
    name: 'callout',
    group: 'block',
    content: 'block+',
    defining: true,
    addAttributes: () => ({ icon: { default: '💡' } }),
    parseHTML: () => [{ tag: 'callout-block', getAttrs: (el) => ({ icon: el.getAttribute('icon') || '💡' }) }],
    renderHTML: ({ HTMLAttributes }) => ['callout-block', mergeAttributes(HTMLAttributes), 0],
    addNodeView: () => ReactNodeViewRenderer(CalloutNodeView),
});

// — YouTube —
const YoutubeNodeView = ({ node, updateAttributes, deleteNode }) => {
    const videoId = node.attrs.id || '';
    const [inputValue, setInputValue] = useState(videoId);
    const [isEditing, setIsEditing] = useState(!videoId);

    const handleSave = () => {
        let id = inputValue.trim();
        const m = id.match(/(?:youtu\.be\/|v\/|embed\/|watch\?v=|&v=)([^#&?]{11})/);
        if (m) id = m[1];
        updateAttributes({ id });
        setIsEditing(false);
    };

    return (
        <NodeViewWrapper className="bd-youtube-node" contentEditable={false}>
            {isEditing ? (
                <div className="bd-youtube-setup">
                    <span className="bd-yt-icon">📺</span>
                    <p className="bd-yt-label">Nhúng Video YouTube</p>
                    <div className="bd-yt-row">
                        <input
                            className="bd-yt-input"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Dán URL hoặc Video ID..."
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        />
                        <button type="button" className="bd-yt-btn" onClick={handleSave}>
                            Chèn
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bd-youtube-player">
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title="YouTube"
                        frameBorder="0"
                        allowFullScreen
                    />
                    <div className="bd-youtube-overlay">
                        <button type="button" className="bd-yt-change" onClick={() => setIsEditing(true)}>
                            ✏️ Đổi video
                        </button>
                    </div>
                </div>
            )}
            <button type="button" className="bd-node-delete" onClick={deleteNode} contentEditable={false}>
                ✕
            </button>
        </NodeViewWrapper>
    );
};

const YoutubeExtension = Node.create({
    name: 'youtube',
    group: 'block',
    selectable: true,
    draggable: true,
    atom: true,
    addAttributes: () => ({ id: { default: '' } }),
    parseHTML: () => [{ tag: 'youtube-block', getAttrs: (el) => ({ id: el.getAttribute('id') || '' }) }],
    renderHTML: ({ HTMLAttributes }) => ['youtube-block', mergeAttributes(HTMLAttributes)],
    addNodeView: () => ReactNodeViewRenderer(YoutubeNodeView),
});

// — Step —
const StepNodeView = ({ node, deleteNode }) => {
    const num = node.attrs.number || 1;
    return (
        <NodeViewWrapper className="bd-step-node">
            <div className="bd-step-badge" contentEditable={false}>
                {num}
            </div>
            <NodeViewContent className="bd-step-content" />
            <button type="button" className="bd-node-delete" onClick={deleteNode} contentEditable={false}>
                ✕
            </button>
        </NodeViewWrapper>
    );
};

const StepExtension = Node.create({
    name: 'step',
    group: 'block',
    content: 'block+',
    defining: true,
    addAttributes: () => ({ number: { default: 1 } }),
    parseHTML: () => [
        { tag: 'step-block', getAttrs: (el) => ({ number: parseInt(el.getAttribute('number') || '1') }) },
    ],
    renderHTML: ({ HTMLAttributes }) => ['step-block', mergeAttributes(HTMLAttributes), 0],
    addNodeView: () => ReactNodeViewRenderer(StepNodeView),
});

// — Section —
const SectionNodeView = ({ node, updateAttributes, deleteNode }) => {
    const icon = node.attrs.icon || '📌';
    const title = node.attrs.title || '';
    return (
        <NodeViewWrapper className="bd-section-node">
            <div className="bd-section-header" contentEditable={false}>
                <span className="bd-section-icon">{icon}</span>
                <input
                    className="bd-section-title-input"
                    value={title}
                    onChange={(e) => updateAttributes({ title: e.target.value })}
                    placeholder="Tiêu đề mục..."
                />
                <button type="button" className="bd-node-delete" onClick={deleteNode}>
                    ✕
                </button>
            </div>
            <NodeViewContent className="bd-section-content" />
        </NodeViewWrapper>
    );
};

const SectionExtension = Node.create({
    name: 'section',
    group: 'block',
    content: 'block+',
    defining: true,
    addAttributes: () => ({
        icon: { default: '📌' },
        title: { default: '' },
    }),
    parseHTML: () => [
        {
            tag: 'section-block',
            getAttrs: (el) => ({ icon: el.getAttribute('icon') || '📌', title: el.getAttribute('title') || '' }),
        },
    ],
    renderHTML: ({ HTMLAttributes }) => ['section-block', mergeAttributes(HTMLAttributes), 0],
    addNodeView: () => ReactNodeViewRenderer(SectionNodeView),
});

// ─────────────────────────────────────────────────────────────
// 2. Serialize TipTap JSON → store as JSON string
// ─────────────────────────────────────────────────────────────
function serializeContent(editor) {
    if (!editor) return '';
    return JSON.stringify(editor.getJSON());
}

function parseInitialContent(raw) {
    if (!raw) return '';
    // If it's already a TipTap JSON string
    if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
                return JSON.parse(trimmed);
            } catch (_) {
                /* fall through */
            }
        }
    }
    // If it's already an object
    if (typeof raw === 'object') return raw;
    return '';
}

// ─────────────────────────────────────────────────────────────
// 3. Toolbar Icon SVGs
// ─────────────────────────────────────────────────────────────
const Icons = {
    Bold: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 4h8a4 4 0 010 8H6z" />
            <path d="M6 12h9a4 4 0 010 8H6z" />
        </svg>
    ),
    Italic: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11 5h6M7 19h6M14.5 5l-5 14" />
        </svg>
    ),
    Underline: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 3v7a6 6 0 0012 0V3" />
            <line x1="4" y1="21" x2="20" y2="21" />
        </svg>
    ),
    Strike: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="4" y1="12" x2="20" y2="12" />
            <path d="M8 5h8a4 4 0 011 7.9M16 19H8a4 4 0 01-.9-7.9" />
        </svg>
    ),
    Code: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
        </svg>
    ),
    Link: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
        </svg>
    ),
    Highlight: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l-6 6v3h3l6-6" />
            <path d="M22 4.73l-2.73-2.73a1 1 0 00-1.41 0L11 9l5 5 7.71-7.71a1 1 0 000-1.56z" />
        </svg>
    ),
    H1: () => <span style={{ fontWeight: 700, fontSize: 13 }}>H1</span>,
    H2: () => <span style={{ fontWeight: 700, fontSize: 13 }}>H2</span>,
    H3: () => <span style={{ fontWeight: 700, fontSize: 13 }}>H3</span>,
    UL: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="9" y1="6" x2="20" y2="6" />
            <line x1="9" y1="12" x2="20" y2="12" />
            <line x1="9" y1="18" x2="20" y2="18" />
            <circle cx="4" cy="6" r="1" fill="currentColor" />
            <circle cx="4" cy="12" r="1" fill="currentColor" />
            <circle cx="4" cy="18" r="1" fill="currentColor" />
        </svg>
    ),
    OL: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="10" y1="12" x2="21" y2="12" />
            <line x1="10" y1="18" x2="21" y2="18" />
            <path d="M4 6h1v4" />
            <path d="M4 10h2" />
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
        </svg>
    ),
    Quote: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1zm12 0c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
        </svg>
    ),
    Image: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
        </svg>
    ),
    HR: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    ),
    Undo: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 101.85-4.3L1 10" />
        </svg>
    ),
    Redo: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 11-1.85-4.3L23 10" />
        </svg>
    ),
    Eye: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ),
    Chapter: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
            <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
        </svg>
    ),
};

// ─────────────────────────────────────────────────────────────
// 4. Block Palette items
// ─────────────────────────────────────────────────────────────
const BLOCK_PALETTE = [
    { type: 'h2', label: 'Tiêu đề 2', icon: 'H2', desc: 'Tiêu đề mục lớn' },
    { type: 'h3', label: 'Tiêu đề 3', icon: 'H3', desc: 'Tiêu đề mục nhỏ' },
    { type: 'paragraph', label: 'Đoạn văn', icon: '¶', desc: 'Văn bản thường' },
    { type: 'bulletList', label: 'Danh sách •', icon: '•', desc: 'Bullet list' },
    { type: 'orderedList', label: 'Danh sách 1.', icon: '1.', desc: 'Ordered list' },
    { type: 'blockquote', label: 'Trích dẫn', icon: '❝', desc: 'Blockquote' },
    { type: 'codeBlock', label: 'Code Block', icon: '</>', desc: 'Khối code' },
    { type: 'callout', label: 'Callout', icon: '💡', desc: 'Hộp chú ý' },
    { type: 'step', label: 'Bước thực hiện', icon: '①', desc: 'Numbered step' },
    { type: 'section', label: 'Mục nội dung', icon: '📌', desc: 'Section có tiêu đề' },
    { type: 'image', label: 'Hình ảnh', icon: '🖼', desc: 'Chèn ảnh từ URL' },
    { type: 'youtube', label: 'Video YouTube', icon: '▶', desc: 'Nhúng YouTube' },
    { type: 'hr', label: 'Đường kẻ ngang', icon: '─', desc: 'Horizontal rule' },
];

// ─────────────────────────────────────────────────────────────
// 5. Slash Command Menu Component
// ─────────────────────────────────────────────────────────────
function SlashMenu({ visible, position, onSelect, onClose }) {
    const [query, setQuery] = useState('');
    const menuRef = useRef(null);

    const filtered = BLOCK_PALETTE.filter(
        (b) =>
            b.label.toLowerCase().includes(query.toLowerCase()) || b.desc.toLowerCase().includes(query.toLowerCase()),
    );

    useEffect(() => {
        if (!visible) {
            setQuery('');
            return;
        }
        const handler = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [visible, onClose]);

    if (!visible) return null;

    return (
        <div
            ref={menuRef}
            className="bd-slash-menu"
            style={{ top: position.top, left: position.left }}
            onMouseDown={(e) => e.preventDefault()}
        >
            <div className="bd-slash-header">
                <span className="bd-slash-title">⌨️ Chèn khối nội dung</span>
                <input
                    className="bd-slash-search"
                    placeholder="Tìm loại block..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoFocus
                />
            </div>
            <div className="bd-slash-list">
                {filtered.map((b) => (
                    <button key={b.type} type="button" className="bd-slash-item" onClick={() => onSelect(b.type)}>
                        <span className="bd-slash-item-icon">{b.icon}</span>
                        <span className="bd-slash-item-info">
                            <span className="bd-slash-item-label">{b.label}</span>
                            <span className="bd-slash-item-desc">{b.desc}</span>
                        </span>
                    </button>
                ))}
                {filtered.length === 0 && <div className="bd-slash-empty">Không tìm thấy block</div>}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// 6. Chapter Manager Panel
// ─────────────────────────────────────────────────────────────
function ChapterManager({
    chapters,
    activeChapterIndex,
    onSelectChapter,
    onAddChapter,
    onDeleteChapter,
    onRenameChapter,
}) {
    const [editingIdx, setEditingIdx] = useState(null);
    const [editVal, setEditVal] = useState('');

    const startEdit = (idx, current) => {
        setEditingIdx(idx);
        setEditVal(current);
    };

    const commitEdit = (idx) => {
        onRenameChapter(idx, editVal);
        setEditingIdx(null);
    };

    return (
        <div className="bd-chapter-panel">
            <div className="bd-chapter-header">
                <Icons.Chapter />
                <span>Mục lục</span>
            </div>
            <div className="bd-chapter-list">
                {chapters.map((ch, idx) => (
                    <div key={idx} className={`bd-chapter-item${idx === activeChapterIndex ? ' active' : ''}`}>
                        {editingIdx === idx ? (
                            <input
                                className="bd-chapter-edit-input"
                                value={editVal}
                                autoFocus
                                onChange={(e) => setEditVal(e.target.value)}
                                onBlur={() => commitEdit(idx)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') commitEdit(idx);
                                    if (e.key === 'Escape') setEditingIdx(null);
                                }}
                            />
                        ) : (
                            <>
                                <button type="button" className="bd-chapter-name" onClick={() => onSelectChapter(idx)}>
                                    <span className="bd-chapter-num">{idx + 1}</span>
                                    <span className="bd-chapter-title">{ch.title || `Phần ${idx + 1}`}</span>
                                </button>
                                <div className="bd-chapter-actions">
                                    <button
                                        type="button"
                                        className="bd-chapter-action-btn"
                                        title="Đổi tên"
                                        onClick={() => startEdit(idx, ch.title)}
                                    >
                                        ✏️
                                    </button>
                                    {chapters.length > 1 && (
                                        <button
                                            type="button"
                                            className="bd-chapter-action-btn danger"
                                            title="Xóa"
                                            onClick={() => onDeleteChapter(idx)}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
            <button type="button" className="bd-chapter-add-btn" onClick={onAddChapter}>
                + Thêm Chapter
            </button>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// 7. Fullscreen Preview Modal
// ─────────────────────────────────────────────────────────────
function PreviewModal({ open, onClose, blog, chapters }) {
    const [tocActiveId, setTocActiveId] = useState('');

    const getImageUrl = (img) => {
        if (!img) return null;
        if (img.startsWith('http') || img.startsWith('data:')) return img;
        return img;
    };

    useEffect(() => {
        if (!open) return;
        setTocActiveId('');
    }, [open]);

    // Theo dõi heading khi scroll (toàn bộ nội dung)
    useEffect(() => {
        if (!open) return;
        const headings = document.querySelectorAll(
            '.bd-preview-article h1, .bd-preview-article h2, .bd-preview-article h3',
        );
        const observer = new IntersectionObserver(
            (entries) =>
                entries.forEach((e) => {
                    if (e.isIntersecting) setTocActiveId(e.target.id);
                }),
            { rootMargin: '0px 0px -60% 0px', threshold: 0.1 },
        );
        headings.forEach((el) => observer.observe(el));
        return () => headings.forEach((el) => observer.unobserve(el));
    }, [open]);

    // Gom nội dung để hiển thị liên tục
    const allContents =
        chapters && chapters.length > 0 ? chapters : [{ title: blog?.name || '', content: blog?.content || '' }];

    // Dùng nội dung phần đầu cho TOC (hoặc gom nếu cần)
    const tocContent = allContents.map((c) => c.content).join(' ');

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width="100vw"
            style={{ top: 0, padding: 0, maxWidth: '100vw' }}
            styles={{ body: { padding: 0, height: '100vh', overflow: 'hidden', background: '#f8fafc' } }}
            className="bd-preview-modal"
            destroyOnClose
        >
            {/* Preview Nav Bar */}
            <div className="bd-preview-navbar">
                <div className="bd-preview-navbar-inner">
                    <div className="bd-preview-brand">
                        <span className="bd-preview-badge">PREVIEW</span>
                        <span className="bd-preview-title">{blog?.name || 'Blog Preview'}</span>
                    </div>
                    <button type="button" className="bd-preview-close" onClick={onClose}>
                        ✕ Đóng xem trước
                    </button>
                </div>
            </div>

            {/* Reading Progress Bar */}
            <div className="bd-preview-progress-wrap">
                <div className="bd-preview-progress-bar" id="bd-progress-bar" />
            </div>

            {/* Main layout */}
            <div
                className="bd-preview-layout"
                onScroll={(e) => {
                    const el = e.currentTarget;
                    const scrolled = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
                    const bar = document.getElementById('bd-progress-bar');
                    if (bar) bar.style.width = `${scrolled}%`;
                }}
            >
                {/* TOC Sidebar */}
                <aside className="bd-preview-toc">
                    <div className="bd-preview-toc-inner">
                        <p className="bd-preview-toc-title">📋 Mục lục</p>
                        <TableOfContents content={tocContent} activeId={tocActiveId} />
                    </div>
                </aside>

                {/* Article */}
                <article className="bd-preview-article">
                    {/* Blog header */}
                    {blog?.image && (
                        <div className="bd-preview-cover">
                            <img src={getImageUrl(blog.image)} alt={blog.name} />
                        </div>
                    )}
                    <div className="bd-preview-article-meta">
                        {blog?.category && <span className="bd-preview-category">{blog.category}</span>}
                        <h1 className="bd-preview-h1">{blog?.name || 'Tiêu đề bài viết'}</h1>
                        {blog?.subject && <p className="bd-preview-subject">{blog.subject}</p>}
                        <div className="bd-preview-author-row">
                            <div className="bd-preview-avatar">{(blog?.authorName || 'A').charAt(0)}</div>
                            <div>
                                <span className="bd-preview-author-name">{blog?.authorName || 'Tác giả'}</span>
                                <span className="bd-preview-date">{new Date().toLocaleDateString('vi-VN')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Render toàn bộ các phần liên tục */}
                    {allContents.map((ch, idx) => (
                        <div key={idx} className="bd-preview-section">
                            {/* Tiêu đề phần (nếu có nhiều phần) */}
                            {allContents.length > 1 && (
                                <div className="bd-preview-section-header">
                                    <span className="bd-preview-section-title">{ch.title || `Phần ${idx + 1}`}</span>
                                </div>
                            )}
                            <div className="bd-preview-content">
                                <TipTapJsonRenderer content={ch.content || ''} />
                            </div>
                            {/* Đường phân cách giữa các phần */}
                            {allContents.length > 1 && idx < allContents.length - 1 && (
                                <hr className="bd-preview-section-divider" />
                            )}
                        </div>
                    ))}
                </article>

                {/* Right sidebar */}
                <aside className="bd-preview-right">
                    <div className="bd-preview-widget">
                        <p className="bd-preview-widget-title">🔖 Thông tin bài viết</p>
                        <div className="bd-preview-widget-body">
                            {chapters && chapters.length > 1 && (
                                <div className="bd-preview-stat">
                                    <span>Số phần</span>
                                    <strong>{chapters.length}</strong>
                                </div>
                            )}
                            {blog?.category && (
                                <div className="bd-preview-stat">
                                    <span>Danh mục</span>
                                    <strong>{blog.category}</strong>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </Modal>
    );
}

// ─────────────────────────────────────────────────────────────
// 8. Main BlogDesigner Component
// ─────────────────────────────────────────────────────────────

const DEFAULT_CHAPTER = { title: 'Phần 1', content: '' };

export default function BlogDesigner({
    initialContent = '',
    onChange,
    // meta passed from BlogForm for preview
    blogMeta,
}) {
    // ── Chapters state ──
    const [chapters, setChapters] = useState(() => {
        // Try to parse initialContent as array of chapters
        if (initialContent) {
            const parsed = parseInitialContent(initialContent);
            if (Array.isArray(parsed?.chapters)) return parsed.chapters;
        }
        return [{ ...DEFAULT_CHAPTER }];
    });
    const [activeChapterIndex, setActiveChapterIndex] = useState(0);

    // ── UI state ──
    const [previewOpen, setPreviewOpen] = useState(false);
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [imageUrlInput, setImageUrlInput] = useState('');
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [linkUrlInput, setLinkUrlInput] = useState('');
    const [slashVisible, setSlashVisible] = useState(false);
    const [slashPos, setSlashPos] = useState({ top: 0, left: 0 });
    const [paletteOpen, setPaletteOpen] = useState(false);

    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    // ── Chapter helpers ──
    const activeChapter = chapters[activeChapterIndex] || chapters[0];

    const updateChapterContent = useCallback(
        (content) => {
            setChapters((prev) => {
                const next = [...prev];
                next[activeChapterIndex] = { ...next[activeChapterIndex], content };
                return next;
            });
        },
        [activeChapterIndex],
    );

    const notifyChange = useCallback((updatedChapters) => {
        if (!onChangeRef.current) return;
        const payload = JSON.stringify({ chapters: updatedChapters });
        onChangeRef.current({ content: payload });
    }, []);

    // ── TipTap Editor ──
    const editor = useEditor({
        extensions: [
            StarterKit.configure({ horizontalRule: false }),
            UnderlineExtension,
            LinkExtension.configure({ openOnClick: false }),
            Typography,
            Highlight.configure({ multicolor: true }),
            HorizontalRule,
            ImageExtension,
            CalloutExtension,
            YoutubeExtension,
            StepExtension,
            SectionExtension,
        ],
        content: parseInitialContent(activeChapter.content) || '<p></p>',
        onUpdate({ editor: ed }) {
            const json = serializeContent(ed);
            updateChapterContent(json);
            setChapters((prev) => {
                const next = [...prev];
                next[activeChapterIndex] = { ...next[activeChapterIndex], content: json };
                notifyChange(next);
                return next;
            });
        },
        onSelectionUpdate({ editor: ed }) {
            if (!ed?.state?.selection) return;
            const { from, to, empty } = ed.state.selection;
            if (empty || !ed.view?.focused) return;
            // Selection-based bubble menu handled via CSS/library
        },
    });

    // Switch editor content when changing chapters
    useEffect(() => {
        if (!editor) return;
        const chContent = chapters[activeChapterIndex]?.content;
        const parsed = parseInitialContent(chContent) || '<p></p>';
        editor.commands.setContent(parsed, false);
    }, [activeChapterIndex]); // eslint-disable-line

    // Slash command detection
    const handleKeyUp = useCallback(() => {
        if (!editor || !editor.state?.selection) return;
        const { $from } = editor.state.selection;
        const parent = $from.parent;
        if (parent.type.name === 'paragraph' && parent.textContent === '/') {
            const coords = editor.view.coordsAtPos($from.pos);
            const rect = editor.view.dom.getBoundingClientRect();
            setSlashPos({ top: coords.bottom - rect.top + 8, left: coords.left - rect.left });
            setSlashVisible(true);
        } else {
            setSlashVisible(false);
        }
    }, [editor]);

    const handleKeyDown = useCallback(
        (e) => {
            if (slashVisible && e.key === 'Escape') {
                setSlashVisible(false);
                e.preventDefault();
            }
        },
        [slashVisible],
    );

    // Insert block from slash menu
    const insertBlock = useCallback(
        (type) => {
            setSlashVisible(false);
            if (!editor) return;
            // Delete the "/" character
            const { from } = editor.state.selection;
            editor.commands.deleteRange({ from: from - 1, to: from });

            switch (type) {
                            case 'h2':
                                editor.commands.setNode('heading', { level: 2 });
                                break;
                            case 'h3':
                                editor.commands.setNode('heading', { level: 3 });
                                break;
                            case 'paragraph':
                                editor.commands.setNode('paragraph');
                                break;
                            case 'bulletList':
                                editor.commands.toggleBulletList();
                                break;
                            case 'orderedList':
                                editor.commands.toggleOrderedList();
                                break;
                            case 'blockquote':
                                editor.commands.toggleBlockquote();
                                break;
                            case 'codeBlock':
                                editor.commands.toggleCodeBlock();
                                break;
                            case 'hr':
                                editor.commands.insertContent({ type: 'horizontalRule' });
                                break;
                            case 'callout':
                                editor.commands.insertContent({
                                    type: 'callout',
                                    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Nhập nội dung lưu ý...' }] }],
                                });
                                break;
                            case 'step': {
                                const stepNum = editor.state.doc.content.content.filter((n) => n.type.name === 'step').length + 1;
                                editor.commands.insertContent({
                                    type: 'step',
                                    attrs: { number: stepNum },
                                    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Mô tả bước thực hiện...' }] }],
                                });
                                break;
                            }
                            case 'section':
                                editor.commands.insertContent({
                                    type: 'section',
                                    attrs: { icon: '📌', title: 'Tên mục...' },
                                    content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Nội dung mục...' }] }],
                                });
                                break;
                            case 'image':
                                setImageModalOpen(true);
                                break;
                            case 'youtube':
                                editor.commands.insertContent({ type: 'youtube', attrs: { id: '' } });
                                break;
                            default:
                                break;
            }
            editor.commands.focus();
        },
        [editor],
    );

    // Toolbar marks
    const activeMarks = {
        bold: editor?.isActive('bold'),
        italic: editor?.isActive('italic'),
        underline: editor?.isActive('underline'),
        strike: editor?.isActive('strike'),
        code: editor?.isActive('code'),
        link: editor?.isActive('link'),
        highlight: editor?.isActive('highlight'),
        h1: editor?.isActive('heading', { level: 1 }),
        h2: editor?.isActive('heading', { level: 2 }),
        h3: editor?.isActive('heading', { level: 3 }),
        bulletList: editor?.isActive('bulletList'),
        orderedList: editor?.isActive('orderedList'),
        blockquote: editor?.isActive('blockquote'),
        codeBlock: editor?.isActive('codeBlock'),
    };

    // Link modal
    const openLinkModal = () => {
        setLinkUrlInput(editor?.getAttributes('link').href || '');
        setLinkModalOpen(true);
    };
    const confirmLink = () => {
        setLinkModalOpen(false);
        if (linkUrlInput.trim()) editor?.commands.setLink({ href: linkUrlInput });
        else editor?.commands.unsetLink();
        editor?.commands.focus();
    };

    // Image modal
    const confirmImage = () => {
        setImageModalOpen(false);
        if (imageUrlInput.trim()) editor?.commands.setImage({ src: imageUrlInput });
        setImageUrlInput('');
        editor?.commands.focus();
    };

    // Chapter management
    const handleAddChapter = () => {
        const newChapters = [...chapters, { title: `Phần ${chapters.length + 1}`, content: '' }];
        setChapters(newChapters);
        setActiveChapterIndex(newChapters.length - 1);
        notifyChange(newChapters);
    };

    const handleDeleteChapter = (idx) => {
        const newChapters = chapters.filter((_, i) => i !== idx);
        const newIdx = Math.min(activeChapterIndex, newChapters.length - 1);
        setChapters(newChapters);
        setActiveChapterIndex(newIdx);
        notifyChange(newChapters);
    };

    const handleRenameChapter = (idx, title) => {
        const newChapters = [...chapters];
        newChapters[idx] = { ...newChapters[idx], title };
        setChapters(newChapters);
        notifyChange(newChapters);
    };

    const handleSelectChapter = (idx) => {
        setActiveChapterIndex(idx);
    };

    // ── Toolbar button helper ──
    const TB = ({ onClick, active, title, children, disabled }) => (
        <Tooltip title={title} mouseEnterDelay={0.6}>
            <button
                type="button"
                className={`bd-tb-btn${active ? ' active' : ''}${disabled ? ' disabled' : ''}`}
                onMouseDown={(e) => {
                    e.preventDefault();
                    if (!disabled) onClick();
                }}
                disabled={disabled}
            >
                {children}
            </button>
        </Tooltip>
    );

    const ToolbarSep = () => <span className="bd-tb-sep" />;

    return (
        <div className="blog-designer">
            {/* ── TOP TOOLBAR ── */}
            <div className="bd-toolbar">
                <div className="bd-toolbar-left">
                    {/* Group 1: Headings */}
                    <TB
                        title="Heading 1"
                        active={activeMarks.h1}
                        onClick={() => editor?.commands.toggleHeading({ level: 1 })}
                    >
                        <Icons.H1 />
                    </TB>
                    <TB
                        title="Heading 2"
                        active={activeMarks.h2}
                        onClick={() => editor?.commands.toggleHeading({ level: 2 })}
                    >
                        <Icons.H2 />
                    </TB>
                    <TB
                        title="Heading 3"
                        active={activeMarks.h3}
                        onClick={() => editor?.commands.toggleHeading({ level: 3 })}
                    >
                        <Icons.H3 />
                    </TB>

                    <ToolbarSep />

                    {/* Group 2: Text Marks */}
                    <TB title="Bold (Ctrl+B)" active={activeMarks.bold} onClick={() => editor?.commands.toggleBold()}>
                        <Icons.Bold />
                    </TB>
                    <TB
                        title="Italic (Ctrl+I)"
                        active={activeMarks.italic}
                        onClick={() => editor?.commands.toggleItalic()}
                    >
                        <Icons.Italic />
                    </TB>
                    <TB
                        title="Underline (Ctrl+U)"
                        active={activeMarks.underline}
                        onClick={() => editor?.commands.toggleUnderline()}
                    >
                        <Icons.Underline />
                    </TB>
                    <TB
                        title="Strikethrough"
                        active={activeMarks.strike}
                        onClick={() => editor?.commands.toggleStrike()}
                    >
                        <Icons.Strike />
                    </TB>
                    <TB
                        title="Highlight"
                        active={activeMarks.highlight}
                        onClick={() => editor?.commands.toggleHighlight()}
                    >
                        <Icons.Highlight />
                    </TB>
                    <TB title="Link" active={activeMarks.link} onClick={openLinkModal}>
                        <Icons.Link />
                    </TB>

                    <ToolbarSep />

                    {/* Group 3: Lists & Structure */}
                    <TB
                        title="Bullet List"
                        active={activeMarks.bulletList}
                        onClick={() => editor?.commands.toggleBulletList()}
                    >
                        <Icons.UL />
                    </TB>
                    <TB
                        title="Ordered List"
                        active={activeMarks.orderedList}
                        onClick={() => editor?.commands.toggleOrderedList()}
                    >
                        <Icons.OL />
                    </TB>
                    <TB
                        title="Blockquote"
                        active={activeMarks.blockquote}
                        onClick={() => editor?.commands.toggleBlockquote()}
                    >
                        <Icons.Quote />
                    </TB>
                    <TB
                        title="Code Block"
                        active={activeMarks.codeBlock}
                        onClick={() => editor?.commands.toggleCodeBlock()}
                    >
                        <Icons.Code />
                    </TB>
                    <TB title="Inline Code" active={activeMarks.code} onClick={() => editor?.commands.toggleCode()}>
                        <Icons.Code />
                    </TB>

                    <ToolbarSep />

                    {/* Group 4: Media */}
                    <TB title="Chèn ảnh" onClick={() => setImageModalOpen(true)}>
                        <Icons.Image />
                    </TB>
                    <TB title="Đường kẻ ngang" onClick={() => editor?.commands.setHorizontalRule()}>
                        <Icons.HR />
                    </TB>

                    <ToolbarSep />

                    {/* Group 5: History */}
                    <TB title="Undo (Ctrl+Z)" onClick={() => editor?.commands.undo()} disabled={!editor?.can().undo()}>
                        <Icons.Undo />
                    </TB>
                    <TB title="Redo (Ctrl+Y)" onClick={() => editor?.commands.redo()} disabled={!editor?.can().redo()}>
                        <Icons.Redo />
                    </TB>
                </div>

                <div className="bd-toolbar-right">
                    {/* Word count badge */}
                    {editor && (
                        <span className="bd-word-count">{editor.storage?.characterCount?.words?.() ?? 0} từ</span>
                    )}

                    <div className="bd-slash-hint">
                        <span className="bd-slash-key">/</span>
                        <span>block</span>
                    </div>

                    {/* Toggle Block Palette */}
                    <button
                        type="button"
                        className={`bd-palette-toggle-btn${paletteOpen ? ' active' : ''}`}
                        onClick={() => setPaletteOpen((o) => !o)}
                        title="Blocks"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <rect x="3" y="3" width="7" height="7" rx="1" />
                            <rect x="14" y="3" width="7" height="7" rx="1" />
                            <rect x="3" y="14" width="7" height="7" rx="1" />
                            <rect x="14" y="14" width="7" height="7" rx="1" />
                        </svg>
                        Blocks
                    </button>

                    <button type="button" className="bd-preview-btn" onClick={() => setPreviewOpen(true)}>
                        <Icons.Eye />
                        Xem trước
                    </button>
                </div>
            </div>

            {/* ── EDITOR BODY ── */}
            <div className="bd-editor-body">
                {/* Chapter sidebar */}
                <ChapterManager
                    chapters={chapters}
                    activeChapterIndex={activeChapterIndex}
                    onSelectChapter={handleSelectChapter}
                    onAddChapter={handleAddChapter}
                    onDeleteChapter={handleDeleteChapter}
                    onRenameChapter={handleRenameChapter}
                />

                {/* Editor canvas */}
                <div className="bd-editor-canvas">
                    <div className="bd-chapter-label">
                        <span className="bd-chapter-pill">
                            Phần {activeChapterIndex + 1}: {activeChapter.title || `Phần ${activeChapterIndex + 1}`}
                        </span>
                    </div>

                    <div className="bd-tiptap-wrap" onKeyUp={handleKeyUp} onKeyDown={handleKeyDown}>
                        {editor && (
                            <SlashMenu
                                visible={slashVisible}
                                position={slashPos}
                                onSelect={insertBlock}
                                onClose={() => setSlashVisible(false)}
                            />
                        )}
                        <EditorContent editor={editor} className="bd-editor-content" />
                    </div>

                    {/* Word count footer */}
                    <div className="bd-editor-footer">
                        <span>{editor?.storage?.characterCount?.characters?.() ?? 0} ký tự</span>
                        <span className="bd-footer-hint">
                            Gõ <kbd>/</kbd> để chèn block đặc biệt
                        </span>
                    </div>
                </div>

                {/* Block palette sidebar — toggleable */}
                <div className={`bd-block-palette${paletteOpen ? ' bd-block-palette--open' : ''}`}>
                    <div className="bd-palette-header">
                        <p className="bd-palette-title">⊞ Blocks</p>
                        <button
                            type="button"
                            className="bd-palette-close-btn"
                            onClick={() => setPaletteOpen(false)}
                            title="Đóng"
                        >
                            ✕
                        </button>
                    </div>
                    {BLOCK_PALETTE.map((b) => (
                        <Tooltip key={b.type} title={b.desc} placement="left" mouseEnterDelay={0.4}>
                            <button
                                type="button"
                                className="bd-palette-item"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    insertBlock(b.type);
                                }}
                            >
                                <span className="bd-palette-icon">{b.icon}</span>
                                <span className="bd-palette-label">{b.label}</span>
                            </button>
                        </Tooltip>
                    ))}
                </div>
            </div>

            {/* ── Modals ── */}
            <Modal
                title="🔗 Chèn đường liên kết"
                open={linkModalOpen}
                onOk={confirmLink}
                onCancel={() => setLinkModalOpen(false)}
                okText="Xác nhận"
                cancelText="Huỷ"
                className="bd-modal"
            >
                <input
                    className="bd-modal-input"
                    placeholder="https://example.com"
                    value={linkUrlInput}
                    onChange={(e) => setLinkUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && confirmLink()}
                    autoFocus
                />
            </Modal>

            <Modal
                title="🖼 Chèn hình ảnh từ URL"
                open={imageModalOpen}
                onOk={confirmImage}
                onCancel={() => {
                    setImageModalOpen(false);
                    setImageUrlInput('');
                }}
                okText="Chèn ảnh"
                cancelText="Huỷ"
                className="bd-modal"
            >
                <input
                    className="bd-modal-input"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && confirmImage()}
                    autoFocus
                />
                {imageUrlInput && (
                    <div className="bd-modal-preview">
                        <img
                            src={imageUrlInput}
                            alt="preview"
                            onError={(e) => {
                                e.target.style.opacity = 0;
                            }}
                        />
                    </div>
                )}
            </Modal>

            {/* ── Fullscreen Preview Modal ── */}
            <PreviewModal
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                blog={blogMeta}
                chapters={chapters}
            />
        </div>
    );
}
