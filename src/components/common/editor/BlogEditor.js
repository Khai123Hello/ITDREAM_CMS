import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Popover, Input, Tooltip } from 'antd';
import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import UnderlineExtension from '@tiptap/extension-underline';
import ImageExtension from '@tiptap/extension-image';
import { Typography } from '@tiptap/extension-typography';
import { Highlight } from '@tiptap/extension-highlight';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import { Node, mergeAttributes } from '@tiptap/core';

import {
    BoldOutlined,
    ItalicOutlined,
    UnderlineOutlined,
    StrikethroughOutlined,
    LinkOutlined,
    UnorderedListOutlined,
    OrderedListOutlined,
    PictureOutlined,
    YoutubeOutlined,
    CodeOutlined,
    EditOutlined,
    ColumnWidthOutlined,
    EyeOutlined,
} from '@ant-design/icons';

import { markdocToHtml, tipTapToMarkdoc } from '@utils/markdocBlockConverter';
import TipTapJsonRenderer from './TipTapJsonRenderer';
import TableOfContents from './TableOfContents';
import './BlogEditor.scss';

// ---------------------------------------------------------------------------
// 1. Custom TipTap Extensions
// ---------------------------------------------------------------------------

// Custom Callout Block
const CalloutNodeView = ({ node, updateAttributes, deleteNode }) => {
    const icon = node.attrs.icon || '💡';
    const [tempIcon, setTempIcon] = useState(icon);
    const [visible, setVisible] = useState(false);

    const emojis = ['💡', 'ℹ️', '⚠️', '🔥', '📢', '📝', '🎯', '🚀', '🌟', '💻'];

    const handleSelectEmoji = (emoji) => {
        updateAttributes({ icon: emoji });
        setVisible(false);
    };

    const popoverContent = (
        <div className="blog-callout-emoji-picker" contentEditable={false}>
            <div className="emoji-grid">
                {emojis.map((emoji) => (
                    <button
                        key={emoji}
                        type="button"
                        onClick={() => handleSelectEmoji(emoji)}
                        className="emoji-btn"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                <Input
                    value={tempIcon}
                    onChange={(e) => setTempIcon(e.target.value)}
                    placeholder="Custom..."
                    size="small"
                    style={{ flex: 1 }}
                />
                <Button 
                    size="small" 
                    type="primary" 
                    onClick={() => {
                        updateAttributes({ icon: tempIcon || '💡' });
                        setVisible(false);
                    }}
                >
                    OK
                </Button>
            </div>
        </div>
    );

    return (
        <NodeViewWrapper className="blog-editor-callout-node">
            <Popover
                content={popoverContent}
                title="Chọn biểu tượng"
                trigger="click"
                open={visible}
                onOpenChange={setVisible}
                placement="bottomLeft"
                getPopupContainer={(triggerNode) => triggerNode.parentNode}
            >
                <div className="callout-icon-wrapper" contentEditable={false} style={{ cursor: 'pointer' }}>
                    {icon}
                </div>
            </Popover>
            <NodeViewContent className="callout-content-wrapper" />
            <button
                type="button"
                className="blog-node-delete-btn"
                onClick={deleteNode}
                contentEditable={false}
                title="Xóa hộp ghi chú"
            >
                ×
            </button>
        </NodeViewWrapper>
    );
};

const CalloutExtension = Node.create({
    name: 'callout',
    group: 'block',
    content: 'block+',
    defining: true,
    addAttributes() {
        return {
            icon: { default: '💡' },
        };
    },
    parseHTML() {
        return [
            {
                tag: 'callout-block',
                getAttrs: (el) => ({
                    icon: el.getAttribute('icon') || '💡',
                }),
            },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return ['callout-block', mergeAttributes(HTMLAttributes), 0];
    },
    addNodeView() {
        return ReactNodeViewRenderer(CalloutNodeView);
    },
});

// Custom YouTube Block
const YoutubeNodeView = ({ node, updateAttributes, deleteNode }) => {
    const videoId = node.attrs.id || '';
    const [inputValue, setInputValue] = useState(videoId);
    const [isEditing, setIsEditing] = useState(!videoId);

    const handleSave = () => {
        let extractedId = inputValue.trim();
        // Regex to extract video id from full youtube URL
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = extractedId.match(regExp);
        if (match && match[2].length === 11) {
            extractedId = match[2];
        }
        updateAttributes({ id: extractedId });
        setIsEditing(false);
    };

    return (
        <NodeViewWrapper className="blog-editor-youtube-node" contentEditable={false}>
            <div className="youtube-node-body">
                {isEditing ? (
                    <div className="youtube-setup-panel">
                        <span className="panel-icon">📺</span>
                        <h4 className="panel-title">Nhúng Video YouTube</h4>
                        <div className="panel-input-row">
                            <Input
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Nhập YouTube Video ID hoặc URL liên kết..."
                                onPressEnter={handleSave}
                                size="small"
                                style={{ flex: 1 }}
                            />
                            <Button size="small" type="primary" onClick={handleSave}>
                                Chèn
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="youtube-player-container">
                        <iframe
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title="YouTube Preview"
                            frameBorder="0"
                            allowFullScreen
                        ></iframe>
                        <div className="youtube-hover-overlay">
                            <Button 
                                size="small" 
                                onClick={() => setIsEditing(true)}
                                icon={<EditOutlined />}
                            >
                                Đổi video
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            <button
                type="button"
                className="blog-node-delete-btn"
                onClick={deleteNode}
                contentEditable={false}
                title="Xóa video nhúng"
            >
                ×
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
    addAttributes() {
        return {
            id: { default: '' },
        };
    },
    parseHTML() {
        return [
            {
                tag: 'youtube-block',
                getAttrs: (el) => ({
                    id: el.getAttribute('id') || '',
                }),
            },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return ['youtube-block', mergeAttributes(HTMLAttributes)];
    },
    addNodeView() {
        return ReactNodeViewRenderer(YoutubeNodeView);
    },
});

// ---------------------------------------------------------------------------
// 2. Main BlogEditor Component
// ---------------------------------------------------------------------------

export default function BlogEditor({
    initialTitle = '',
    initialDescription = '',
    initialContent = '',
    onChange,
    onTitleChange,
    onDescriptionChange,
}) {
    const [title, setTitle] = useState(initialTitle);
    const [description, setDescription] = useState(initialDescription);
    const [content, setContent] = useState('');
    const [viewMode, setViewMode] = useState('edit'); // 'edit' | 'split' | 'preview'

    // Custom bubble menu state
    const [bubbleMenuVisible, setBubbleMenuVisible] = useState(false);
    const [bubbleMenuPosition, setBubbleMenuPosition] = useState({ top: 0, left: 0 });

    // Form modals
    const [linkModalVisible, setLinkModalVisible] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [imageUrl, setImageUrl] = useState('');

    // Slash menu state
    const [slashMenuVisible, setSlashMenuVisible] = useState(false);
    const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });

    const contentRef = useRef(initialContent);
    const titleRef = useRef(initialTitle);
    const descriptionRef = useRef(initialDescription);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    // Setup TipTap Editor
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                horizontalRule: false,
            }),
            UnderlineExtension,
            LinkExtension.configure({
                openOnClick: false,
            }),
            Typography,
            Highlight.configure({ multicolor: true }),
            HorizontalRule,
            ImageExtension,
            CalloutExtension,
            YoutubeExtension,
        ],
        content: markdocToHtml(initialContent),
        onUpdate({ editor: ed }) {
            const markdocStr = tipTapToMarkdoc(ed.getJSON());
            contentRef.current = markdocStr;
            setContent(markdocStr);
            if (onChangeRef.current) {
                onChangeRef.current({ content: markdocStr });
            }
        },
        onSelectionUpdate({ editor: ed }) {
            const { state, view } = ed;
            const { selection } = state;
            const { empty, from, to } = selection;

            if (empty || !view.focused) {
                setBubbleMenuVisible(false);
                return;
            }

            try {
                const startCoords = view.coordsAtPos(from);
                const endCoords = view.coordsAtPos(to);
                const editorDom = view.dom;
                const rect = editorDom.getBoundingClientRect();

                const left = (startCoords.left + endCoords.left) / 2 - rect.left;
                const top = startCoords.top - rect.top + editorDom.scrollTop - 45;

                setBubbleMenuPosition({ top, left });
                setBubbleMenuVisible(true);
            } catch (err) {
                setBubbleMenuVisible(false);
            }
        },
        onBlur() {
            setTimeout(() => {
                setBubbleMenuVisible(false);
            }, 250);
        },
    });

    const lastSentContentRef = useRef(initialContent);

    // Sync content changes from external
    useEffect(() => {
        if (editor && initialContent !== undefined && initialContent !== lastSentContentRef.current) {
            editor.commands.setContent(markdocToHtml(initialContent));
            contentRef.current = initialContent;
            setContent(initialContent);
            lastSentContentRef.current = initialContent;
        }
    }, [editor, initialContent]);

    // Sync title/desc changes from external
    useEffect(() => {
        setTitle(initialTitle || '');
        titleRef.current = initialTitle || '';
    }, [initialTitle]);

    useEffect(() => {
        setDescription(initialDescription || '');
        descriptionRef.current = initialDescription || '';
    }, [initialDescription]);

    // Triggers slash menu `/` detection
    const handleEditorKeyDown = (e) => {
        if (!editor) return;

        if (slashMenuVisible) {
            if (e.key === 'Escape') {
                setSlashMenuVisible(false);
                e.preventDefault();
            }
        }
    };

    const handleEditorKeyUp = () => {
        if (!editor) return;

        const { state } = editor;
        const { selection } = state;
        const { $from } = selection;
        const parent = $from.parent;

        if (parent.type.name === 'paragraph' && parent.textContent === '/') {
            const coords = editor.view.coordsAtPos($from.pos);
            const editorDom = editor.view.dom;
            const rect = editorDom.getBoundingClientRect();
            
            setSlashMenuPosition({
                top: coords.bottom - rect.top + editorDom.scrollTop + 8,
                left: coords.left - rect.left,
            });
            setSlashMenuVisible(true);
        } else {
            setSlashMenuVisible(false);
        }
    };

    const handleTitleChangeLocal = (val) => {
        setTitle(val);
        titleRef.current = val;
        if (onTitleChange) onTitleChange(val);
    };

    const handleDescChangeLocal = (val) => {
        setDescription(val);
        descriptionRef.current = val;
        if (onDescriptionChange) onDescriptionChange(val);
    };

    // Slash menu block selection handler
    const selectBlock = (type) => {
        setSlashMenuVisible(false);
        if (!editor) return;

        // Delete the "/" typed
        editor.commands.deleteRange({
            from: editor.state.selection.$from.pos - 1,
            to: editor.state.selection.$from.pos,
        });

        // Insert new block depending on type
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
                                content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Nhập nội dung lưu ý của bạn ở đây...' }] }],
                            });
                            break;
                        case 'youtube':
                            editor.commands.insertContent({
                                type: 'youtube',
                                attrs: { id: '' },
                            });
                            break;
                        case 'image':
                            setImageModalVisible(true);
                            break;
                        default:
                            break;
        }
        editor.commands.focus();
    };

    const toggleBold = () => editor?.commands.toggleBold();
    const toggleItalic = () => editor?.commands.toggleItalic();
    const toggleUnderline = () => editor?.commands.toggleUnderline();
    const toggleStrike = () => editor?.commands.toggleStrike();
    const toggleCode = () => editor?.commands.toggleCode();

    const openLinkModal = () => {
        if (!editor) return;
        const previousUrl = editor.getAttributes('link').href || '';
        setLinkUrl(previousUrl);
        setLinkModalVisible(true);
    };

    const handleSaveLink = () => {
        setLinkModalVisible(false);
        if (linkUrl.trim()) {
            editor.commands.setLink({ href: linkUrl });
        } else {
            editor.commands.unsetLink();
        }
        editor.commands.focus();
    };

    const handleSaveImage = () => {
        setImageModalVisible(false);
        if (imageUrl.trim()) {
            editor.commands.setImage({ src: imageUrl });
        }
        setImageUrl('');
        editor.commands.focus();
    };

    const wordCount = content.replace(/[#*_{}[\]()|]/g, '').trim().split(/\s+/).filter(Boolean).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    const slashItems = [
        { key: 'h2', label: 'Tiêu đề lớn (H2)', desc: 'Chèn đề mục chính', icon: 'H2' },
        { key: 'h3', label: 'Tiêu đề phụ (H3)', desc: 'Chèn đề mục phụ', icon: 'H3' },
        { key: 'paragraph', label: 'Đoạn văn', desc: 'Viết nội dung văn bản thường', icon: '¶' },
        { key: 'bulletList', label: 'Danh sách dấu tròn', desc: 'Chèn danh sách không thứ tự', icon: '•' },
        { key: 'orderedList', label: 'Danh sách số', desc: 'Chèn danh sách có số', icon: '1.' },
        { key: 'blockquote', label: 'Đoạn trích dẫn', desc: 'Trích dẫn câu nói nổi tiếng', icon: '“' },
        { key: 'codeBlock', label: 'Khối mã nguồn', desc: 'Khối viết code có màu cú pháp', icon: '</>' },
        { key: 'callout', label: 'Hộp lưu ý (Callout)', desc: 'Tạo hộp nổi bật có biểu tượng', icon: '💡' },
        { key: 'youtube', label: 'Video YouTube', desc: 'Nhúng video từ YouTube', icon: '📺' },
        { key: 'image', label: 'Hình ảnh', desc: 'Chèn ảnh qua liên kết URL', icon: '🖼️' },
        { key: 'hr', label: 'Đường gạch ngang', desc: 'Ngăn cách các phần nội dung', icon: '—' },
    ];

    return (
        <div className={`blog-editor-wrapper view-mode-${viewMode}`}>
            {/* Header Toolbar */}
            <div className="blog-editor-header-toolbar">
                <div className="toolbar-left-group">
                    <span className="editor-badge">CMS Blog Writer v2.0</span>
                </div>
                <div className="toolbar-center-modes">
                    <button
                        type="button"
                        onClick={() => setViewMode('edit')}
                        className={`mode-tab-btn ${viewMode === 'edit' ? 'active' : ''}`}
                    >
                        <EditOutlined /> Soạn thảo
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('split')}
                        className={`mode-tab-btn ${viewMode === 'split' ? 'active' : ''}`}
                    >
                        <ColumnWidthOutlined /> Chia đôi màn hình
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewMode('preview')}
                        className={`mode-tab-btn ${viewMode === 'preview' ? 'active' : ''}`}
                    >
                        <EyeOutlined /> Trang xem trước
                    </button>
                </div>
                <div className="toolbar-right-actions">
                    <span className="word-count-indicator">{wordCount} từ ({readingTime} phút đọc)</span>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="blog-editor-workspace">
                
                {/* Editor Area */}
                {(viewMode === 'edit' || viewMode === 'split') && (
                    <div className="blog-editor-write-panel">
                        {editor && (
                            <div className="blog-editor-action-bar">
                                <div className="action-bar-group">
                                    <Tooltip title="Chữ đậm (Ctrl+B)">
                                        <button
                                            type="button"
                                            onClick={toggleBold}
                                            className={`action-btn ${editor.isActive('bold') ? 'active' : ''}`}
                                        >
                                            <BoldOutlined />
                                        </button>
                                    </Tooltip>
                                    <Tooltip title="Chữ nghiêng (Ctrl+I)">
                                        <button
                                            type="button"
                                            onClick={toggleItalic}
                                            className={`action-btn ${editor.isActive('italic') ? 'active' : ''}`}
                                        >
                                            <ItalicOutlined />
                                        </button>
                                    </Tooltip>
                                    <Tooltip title="Gạch chân (Ctrl+U)">
                                        <button
                                            type="button"
                                            onClick={toggleUnderline}
                                            className={`action-btn ${editor.isActive('underline') ? 'active' : ''}`}
                                        >
                                            <UnderlineOutlined />
                                        </button>
                                    </Tooltip>
                                    <Tooltip title="Gạch ngang">
                                        <button
                                            type="button"
                                            onClick={toggleStrike}
                                            className={`action-btn ${editor.isActive('strike') ? 'active' : ''}`}
                                        >
                                            <StrikethroughOutlined />
                                        </button>
                                    </Tooltip>
                                    <Tooltip title="Khối Code nhỏ">
                                        <button
                                            type="button"
                                            onClick={toggleCode}
                                            className={`action-btn ${editor.isActive('code') ? 'active' : ''}`}
                                        >
                                            <CodeOutlined />
                                        </button>
                                    </Tooltip>
                                    <Tooltip title="Liên kết URL">
                                        <button
                                            type="button"
                                            onClick={openLinkModal}
                                            className={`action-btn ${editor.isActive('link') ? 'active' : ''}`}
                                        >
                                            <LinkOutlined />
                                        </button>
                                    </Tooltip>
                                </div>

                                <div className="bar-divider" />

                                <div className="action-bar-group">
                                    <Tooltip title="Tiêu đề H2">
                                        <button
                                            type="button"
                                            onClick={() => editor.commands.toggleHeading({ level: 2 })}
                                            className={`action-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
                                        >
                                            H2
                                        </button>
                                    </Tooltip>
                                    <Tooltip title="Tiêu đề H3">
                                        <button
                                            type="button"
                                            onClick={() => editor.commands.toggleHeading({ level: 3 })}
                                            className={`action-btn ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
                                        >
                                            H3
                                        </button>
                                    </Tooltip>
                                    <Tooltip title="Danh sách tròn">
                                        <button
                                            type="button"
                                            onClick={() => editor.commands.toggleBulletList()}
                                            className={`action-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
                                        >
                                            <UnorderedListOutlined />
                                        </button>
                                    </Tooltip>
                                    <Tooltip title="Danh sách số">
                                        <button
                                            type="button"
                                            onClick={() => editor.commands.toggleOrderedList()}
                                            className={`action-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
                                        >
                                            <OrderedListOutlined />
                                        </button>
                                    </Tooltip>
                                </div>

                                <div className="bar-divider" />

                                <div className="action-bar-group">
                                    <Tooltip title="Hộp Callout lưu ý">
                                        <button
                                            type="button"
                                            onClick={() => selectBlock('callout')}
                                            className="action-btn"
                                        >
                                            💡
                                        </button>
                                    </Tooltip>
                                    <Tooltip title="Nhúng Video YouTube">
                                        <button
                                            type="button"
                                            onClick={() => selectBlock('youtube')}
                                            className="action-btn"
                                        >
                                            <YoutubeOutlined />
                                        </button>
                                    </Tooltip>
                                    <Tooltip title="Chèn Hình ảnh URL">
                                        <button
                                            type="button"
                                            onClick={() => selectBlock('image')}
                                            className="action-btn"
                                        >
                                            <PictureOutlined />
                                        </button>
                                    </Tooltip>
                                </div>
                            </div>
                        )}

                        {/* Editor Canvas */}
                        <div className="blog-editor-canvas">
                            <div className="canvas-header-zone">
                                <input
                                    type="text"
                                    className="canvas-title-input"
                                    value={title}
                                    onChange={(e) => handleTitleChangeLocal(e.target.value)}
                                    placeholder="Nhập tiêu đề bài viết Blog..."
                                />
                                <textarea
                                    className="canvas-desc-textarea"
                                    value={description}
                                    onChange={(e) => handleDescChangeLocal(e.target.value)}
                                    placeholder="Nhập mô tả ngắn hoặc tóm tắt chủ đề của Blog bài viết này..."
                                    rows={2}
                                />
                            </div>

                            <div className="canvas-body-editor-wrap">
                                <EditorContent
                                    editor={editor}
                                    onKeyDown={handleEditorKeyDown}
                                    onKeyUp={handleEditorKeyUp}
                                />

                                {/* Floating Bubble Menu */}
                                {editor && bubbleMenuVisible && (
                                    <div
                                        className="blog-editor-bubble-menu"
                                        style={{
                                            position: 'absolute',
                                            top: bubbleMenuPosition.top,
                                            left: bubbleMenuPosition.left,
                                            transform: 'translateX(-50%)',
                                            zIndex: 999,
                                        }}
                                        onMouseDown={(e) => e.preventDefault()}
                                    >
                                        <button
                                            type="button"
                                            onClick={toggleBold}
                                            className={`bubble-btn ${editor.isActive('bold') ? 'active' : ''}`}
                                        >
                                            B
                                        </button>
                                        <button
                                            type="button"
                                            onClick={toggleItalic}
                                            className={`bubble-btn ${editor.isActive('italic') ? 'active' : ''}`}
                                        >
                                            I
                                        </button>
                                        <button
                                            type="button"
                                            onClick={toggleUnderline}
                                            className={`bubble-btn ${editor.isActive('underline') ? 'active' : ''}`}
                                        >
                                            U
                                        </button>
                                        <button
                                            type="button"
                                            onClick={toggleStrike}
                                            className={`bubble-btn ${editor.isActive('strike') ? 'active' : ''}`}
                                        >
                                            S
                                        </button>
                                        <button
                                            type="button"
                                            onClick={openLinkModal}
                                            className={`bubble-btn ${editor.isActive('link') ? 'active' : ''}`}
                                        >
                                            Link
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => editor.commands.toggleHighlight({ color: '#ffec3d' })}
                                            className={`bubble-btn ${editor.isActive('highlight') ? 'active' : ''}`}
                                        >
                                            Highlight
                                        </button>
                                    </div>
                                )}

                                {/* Slash Menu */}
                                {slashMenuVisible && (
                                    <div
                                        className="blog-editor-slash-menu"
                                        style={{
                                            position: 'absolute',
                                            top: slashMenuPosition.top,
                                            left: slashMenuPosition.left,
                                            zIndex: 1000,
                                        }}
                                    >
                                        <div className="slash-menu-header">LỆNH CHÈN NHANH (SLASH COMMANDS)</div>
                                        <div className="slash-menu-list">
                                            {slashItems.map((item) => (
                                                <button
                                                    key={item.key}
                                                    type="button"
                                                    className="slash-menu-item"
                                                    onClick={() => selectBlock(item.key)}
                                                >
                                                    <span className="item-icon-symbol">{item.icon}</span>
                                                    <div className="item-details">
                                                        <span className="item-label">{item.label}</span>
                                                        <span className="item-desc">{item.desc}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Live Preview Panel */}
                {(viewMode === 'preview' || viewMode === 'split') && (
                    <div className="blog-editor-preview-panel">
                        <div className="preview-panel-header">
                            <span className="panel-title">MÔ PHỎNG HIỂN THỊ TRANG WEB BÀI VIẾT (PUBLIC BLOG VIEW)</span>
                        </div>
                        
                        <div className="public-blog-template-wrapper">
                            <div className="public-blog-layout">
                                <div className="blog-sidebar-left">
                                    <TableOfContents content={content} />
                                </div>

                                <article className="blog-main-article-card">
                                    <header className="article-preview-header">
                                        <div className="article-meta-badge-row">
                                            <span className="category-meta-badge">Blog Thế giới lập trình</span>
                                            <span className="reading-time-badge">⏱️ {readingTime} phút đọc</span>
                                        </div>
                                        <h1 className="article-preview-title">
                                            {title || 'Tiêu đề bài viết Blog'}
                                        </h1>
                                        <p className="article-preview-summary">
                                            {description || 'Chủ đề và mô tả tóm tắt ngắn gọn bài viết.'}
                                        </p>
                                        <div className="article-preview-author-meta">
                                            <div className="author-avatar-simple">A</div>
                                            <div className="author-text-info">
                                                <span className="author-fullname">Tác giả biên soạn</span>
                                                <span className="publish-date-simple">Ngày đăng: 01/07/2026</span>
                                            </div>
                                        </div>
                                    </header>

                                    <hr className="header-article-separator" />

                                    <section className="article-body-editor">
                                        <TipTapJsonRenderer content={content} />
                                    </section>

                                    <footer className="article-preview-footer">
                                        <div className="newsletter-box-simulation">
                                            <h4>Đăng ký nhận bài viết mới nhất</h4>
                                            <p>Nhận các bài viết chia sẻ kiến thức lập trình chất lượng cao trực tiếp vào hộp thư của bạn hằng tuần.</p>
                                            <div className="newsletter-form-simulation">
                                                <Input disabled placeholder="Nhập email của bạn..." style={{ flex: 1 }} />
                                                <Button type="primary" disabled>Đăng ký</Button>
                                            </div>
                                        </div>
                                    </footer>
                                </article>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <Modal
                title="Chần liên kết URL"
                open={linkModalVisible}
                onOk={handleSaveLink}
                onCancel={() => setLinkModalVisible(false)}
                okText="Xác nhận"
                cancelText="Hủy"
                destroyOnClose
            >
                <div style={{ marginBottom: 8 }}>Nhập địa chỉ URL liên kết (Ví dụ: https://google.com):</div>
                <Input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                    onPressEnter={handleSaveLink}
                />
            </Modal>

            <Modal
                title="Chèn hình ảnh qua liên kết URL"
                open={imageModalVisible}
                onOk={handleSaveImage}
                onCancel={() => setImageModalVisible(false)}
                okText="Xác nhận"
                cancelText="Hủy"
                destroyOnClose
            >
                <div style={{ marginBottom: 8 }}>Nhập địa chỉ URL hình ảnh công khai:</div>
                <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    onPressEnter={handleSaveImage}
                />
            </Modal>
        </div>
    );
}
