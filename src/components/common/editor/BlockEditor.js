import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Button, Card, Popover, Input } from 'antd';
import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import UnderlineExtension from '@tiptap/extension-underline';
import ImageExtension from '@tiptap/extension-image';
import { Typography } from '@tiptap/extension-typography';
import { Highlight } from '@tiptap/extension-highlight';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import { Selection } from '@tiptap/extensions';
import { Node, mergeAttributes } from '@tiptap/core';
import {
    BoldOutlined,
    ItalicOutlined,
    UnderlineOutlined,
    StrikethroughOutlined,
    LinkOutlined,
    UnorderedListOutlined,
    OrderedListOutlined,
    PlusOutlined,
    InfoCircleOutlined,
    QuestionCircleOutlined,
    FileTextOutlined,
    BookOutlined,
    DownOutlined,
    DeleteOutlined,
    HighlightOutlined,
    CheckSquareOutlined,
    MinusOutlined,
    PictureOutlined,
} from '@ant-design/icons';
import { markdocToHtml, tipTapToMarkdoc } from '@utils/markdocBlockConverter';
import './BlockEditor.scss';

// ---------------------------------------------------------------------------
// Custom TipTap Node Definitions
// ---------------------------------------------------------------------------

const CalloutNodeView = ({ node, updateAttributes, deleteNode }) => {
    const icon = node.attrs.icon || '💡';
    const [tempIcon, setTempIcon] = useState(icon);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setTempIcon(icon);
    }, [icon]);

    const popularEmojis = [
        '💡',
        '⚠️',
        '🔥',
        'ℹ️',
        '🚀',
        '🌟',
        '🎯',
        '🎓',
        '🛠️',
        '📝',
        '🔍',
        '💻',
        '🧠',
        '📢',
        '🏆',
        '🔑',
    ];

    const handleEmojiClick = (emoji) => {
        setTempIcon((prev) => prev + emoji);
    };

    const handleClear = () => {
        setTempIcon('');
    };

    const handleSave = () => {
        updateAttributes({ icon: tempIcon || '💡' });
        setVisible(false);
    };

    const popoverContent = (
        <div style={{ width: 200, padding: '4px 0' }} contentEditable={false}>
            <div style={{ marginBottom: 8, display: 'flex', gap: 6 }}>
                <Input
                    value={tempIcon}
                    onChange={(e) => setTempIcon(e.target.value)}
                    placeholder="Biểu tượng..."
                    size="small"
                    style={{ flex: 1 }}
                />
                <Button size="small" onClick={handleClear} danger>
                    Xóa
                </Button>
            </div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 6,
                    marginBottom: 12,
                    maxHeight: 120,
                    overflowY: 'auto',
                    padding: '2px',
                }}
            >
                {popularEmojis.map((emoji) => (
                    <button
                        key={emoji}
                        type="button"
                        onClick={() => handleEmojiClick(emoji)}
                        style={{
                            border: '1px solid #e4e4e4',
                            background: '#fff',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 16,
                            padding: '4px 0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => (e.target.style.background = '#f5f5f5')}
                        onMouseLeave={(e) => (e.target.style.background = '#fff')}
                    >
                        {emoji}
                    </button>
                ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                <Button size="small" onClick={() => setVisible(false)}>
                    Hủy
                </Button>
                <Button size="small" type="primary" onClick={handleSave}>
                    Lưu
                </Button>
            </div>
        </div>
    );

    return (
        <NodeViewWrapper className="tfo-block-callout tiptap-callout-node">
            <Popover
                content={popoverContent}
                title="Chọn biểu tượng"
                trigger="click"
                open={visible}
                onOpenChange={setVisible}
                placement="bottomLeft"
                getPopupContainer={(triggerNode) => triggerNode.parentNode}
            >
                <span
                    className="tfo-block-callout-icon"
                    contentEditable={false}
                    style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                    {icon}
                </span>
            </Popover>
            <NodeViewContent className="tfo-block-callout-text" />
            <button
                type="button"
                className="tfo-block-delete-btn"
                onClick={deleteNode}
                contentEditable={false}
                title="Xóa khối"
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

const StepNodeView = ({ node, updateAttributes, deleteNode }) => {
    const label = node.attrs.label ?? '';
    return (
        <NodeViewWrapper className="tfo-block-step tiptap-step-node">
            <div className="tfo-block-step-badge" contentEditable={false}>
                #
            </div>
            <div className="tfo-block-step-content">
                <input
                    className="tfo-block-step-label-input"
                    value={label}
                    onChange={(e) => updateAttributes({ label: e.target.value })}
                    placeholder="Tên bước..."
                    style={{
                        border: 'none',
                        background: 'transparent',
                        fontWeight: 'bold',
                        color: 'var(--accent)',
                        outline: 'none',
                        padding: 0,
                        width: '100%',
                    }}
                />
                <NodeViewContent className="tfo-block-step-body" />
            </div>
            <button
                type="button"
                className="tfo-block-delete-btn"
                onClick={deleteNode}
                contentEditable={false}
                title="Xóa bước"
            >
                ×
            </button>
        </NodeViewWrapper>
    );
};

const StepExtension = Node.create({
    name: 'step',
    group: 'block',
    content: 'block+',
    defining: true,
    addAttributes() {
        return {
            label: { default: 'Bước 1' },
        };
    },
    parseHTML() {
        return [
            {
                tag: 'step-block',
                getAttrs: (el) => ({
                    label: el.getAttribute('label') || 'Bước 1',
                }),
            },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return ['step-block', mergeAttributes(HTMLAttributes), 0];
    },
    addNodeView() {
        return ReactNodeViewRenderer(StepNodeView);
    },
});

const SectionNodeView = ({ node, updateAttributes, deleteNode }) => {
    const icon = node.attrs.icon || '🎓';
    const title = node.attrs.title ?? '';
    const [tempIcon, setTempIcon] = useState(icon);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setTempIcon(icon);
    }, [icon]);

    const popularEmojis = [
        '🎓',
        '🛠️',
        '💡',
        '📝',
        '🚀',
        '🌟',
        '❓',
        '📢',
        '🏆',
        '🔑',
        '🔍',
        '🎨',
        '💻',
        '📈',
        '📚',
        '✍️',
        '🧠',
        '🎯',
        '🔥',
        '🤝',
    ];

    const handleEmojiClick = (emoji) => {
        setTempIcon((prev) => prev + emoji);
    };

    const handleClear = () => {
        setTempIcon('');
    };

    const handleSave = () => {
        updateAttributes({ icon: tempIcon || '🎓' });
        setVisible(false);
    };

    const popoverContent = (
        <div style={{ width: 220, padding: '4px 0' }} contentEditable={false}>
            <div style={{ marginBottom: 8, display: 'flex', gap: 6 }}>
                <Input
                    value={tempIcon}
                    onChange={(e) => setTempIcon(e.target.value)}
                    placeholder="Biểu tượng..."
                    size="small"
                    style={{ flex: 1 }}
                />
                <Button size="small" onClick={handleClear} danger>
                    Xóa
                </Button>
            </div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: 6,
                    marginBottom: 12,
                    maxHeight: 120,
                    overflowY: 'auto',
                    padding: '2px',
                }}
            >
                {popularEmojis.map((emoji) => (
                    <button
                        key={emoji}
                        type="button"
                        onClick={() => handleEmojiClick(emoji)}
                        style={{
                            border: '1px solid #e4e4e4',
                            background: '#fff',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontSize: 16,
                            padding: '4px 0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => (e.target.style.background = '#f5f5f5')}
                        onMouseLeave={(e) => (e.target.style.background = '#fff')}
                    >
                        {emoji}
                    </button>
                ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                <Button size="small" onClick={() => setVisible(false)}>
                    Hủy
                </Button>
                <Button size="small" type="primary" onClick={handleSave}>
                    Lưu
                </Button>
            </div>
        </div>
    );

    return (
        <NodeViewWrapper className="tfo-block-section tiptap-section-node">
            <div className="tfo-block-section-header">
                <Popover
                    content={popoverContent}
                    title="Chọn biểu tượng"
                    trigger="click"
                    open={visible}
                    onOpenChange={setVisible}
                    placement="bottomLeft"
                    getPopupContainer={(triggerNode) => triggerNode.parentNode}
                >
                    <span className="tfo-block-section-icon" style={{ cursor: 'pointer', userSelect: 'none' }}>
                        {icon}
                    </span>
                </Popover>
                <input
                    className="tfo-block-section-title-input"
                    value={title}
                    onChange={(e) => updateAttributes({ title: e.target.value })}
                    placeholder="Tiêu đề mục lớn..."
                    style={{
                        border: 'none',
                        background: 'transparent',
                        fontWeight: 600,
                        color: 'var(--text)',
                        outline: 'none',
                        padding: 0,
                        flex: 1,
                    }}
                />
            </div>
            <NodeViewContent className="tfo-block-section-content" />
            <button
                type="button"
                className="tfo-block-delete-btn"
                onClick={deleteNode}
                contentEditable={false}
                title="Xóa mục lớn"
            >
                ×
            </button>
        </NodeViewWrapper>
    );
};

const SectionExtension = Node.create({
    name: 'section',
    group: 'block',
    content: 'block+',
    defining: true,
    addAttributes() {
        return {
            icon: { default: '🎓' },
            title: { default: 'Những điều bạn sẽ học' },
        };
    },
    parseHTML() {
        return [
            {
                tag: 'section-block',
                getAttrs: (el) => ({
                    icon: el.getAttribute('icon') || '🎓',
                    title: el.getAttribute('title') || 'Những điều bạn sẽ học',
                }),
            },
        ];
    },
    renderHTML({ HTMLAttributes }) {
        return ['section-block', mergeAttributes(HTMLAttributes), 0];
    },
    addNodeView() {
        return ReactNodeViewRenderer(SectionNodeView);
    },
});

// ---------------------------------------------------------------------------
// Templates config (using Markdoc tags format)
// ---------------------------------------------------------------------------

const TEMPLATES = {
    task: {
        label: 'Giới thiệu',
        description: 'Mẫu nhiệm vụ chuẩn với các mục kiến thức và thực hành.',
        title: 'Nhập tiêu đề giới thiệu ở đây (ví dụ: Giới thiệu về lập trình React)',
        descriptionText:
            'Nhập mô tả ngắn gọn về bài học ở đây (ví dụ: Bài viết giúp học viên làm quen với thư viện ReactJS cơ bản)',
        blocks: () => `{% section icon="🎓" title="Những điều bạn sẽ học" %}
- Nhập nội dung kiến thức thứ nhất (ví dụ: Cách khởi tạo component)
- Nhập nội dung kiến thức thứ hai (ví dụ: Cách truyền props và quản lý state)
{% /section %}

{% section icon="🛠️" title="Những điều bạn sẽ làm" %}
- Nhập hành động thực hành thứ nhất (ví dụ: Cài đặt môi trường Node.js)
- Nhập hành động thực hành thứ hai (ví dụ: Chạy kiểm thử ứng dụng)
{% /section %}`,
    },
    guide: {
        label: 'Hướng dẫn',
        description: 'Mẫu hướng dẫn từng bước chi tiết kèm hình ảnh/video.',
        title: 'Nhập tiêu đề hướng dẫn (ví dụ: Hướng dẫn các bước cấu hình)',
        descriptionText:
            'Nhập hướng dẫn tổng quan (ví dụ: Thực hiện tuần tự các bước dưới đây để hoàn thành cấu hình ứng dụng)',
        blocks: () => `{% step label="Bước 1" %}
Mô tả bước thực hiện thứ nhất ở đây (ví dụ: Tạo file mới có tên App.js trong thư mục src)
{% /step %}

{% step label="Bước 2" %}
Mô tả bước thực hiện thứ hai ở đây (ví dụ: Chạy lệnh \`npm install\` để tải thư viện)
{% /step %}

{% step label="Bước 3" %}
Mô tả bước thực hiện thứ ba ở đây (ví dụ: Viết code cho Component chính và xuất ra ngoài)
{% /step %}

{% step label="Bước 4" %}
Mô tả bước thực hiện thứ tư ở đây (ví dụ: Nhấp vào nút Lưu để lưu lại cấu hình)
{% /step %}

{% step label="Bước 5" %}
Mô tả bước thực hiện thứ năm ở đây (ví dụ: Mở trình duyệt và truy cập vào localhost:3000 để kiểm tra kết quả)
{% /step %}

---

Nhập tóm tắt hoặc lưu ý cuối cùng ở đây (ví dụ: Cuối cùng, hãy nhấn nút nộp bài ở bước tiếp theo!)`,
    },
    reading: {
        label: 'Ví dụ',
        description: 'Mẫu ví dụ thực tế hoặc tài liệu tham khảo chi tiết.',
        title: 'Nhập tiêu đề tài liệu tham khảo hoặc ví dụ (ví dụ: Ví dụ về cấu trúc thư mục dự án)',
        descriptionText:
            'Mô tả tổng quan về ví dụ hoặc tài liệu ở đây (ví dụ: Đọc kỹ phần thông tin nền tảng này trước khi bắt đầu nhiệm vụ)',
        blocks: () => `Nhập đoạn văn bản giới thiệu/bối cảnh ở đây (ví dụ: React là một thư viện Javascript phổ biến để xây dựng giao diện người dùng đơn trang)

Nhập hướng dẫn các bước tiếp theo (ví dụ: Ví dụ này bao gồm ba phần chính cần chú ý:)

1. Nhập mục thứ nhất (ví dụ: Khởi tạo dự án bằng Vite)
2. Nhập mục thứ hai (ví dụ: Tạo component Header và Footer)
3. Nhập mục thứ ba (ví dụ: Chạy ứng dụng trên cổng 5173)

{% callout icon="💡" %}
Nhập lưu ý hoặc thông tin đặc biệt nhấn mạnh ở đây (ví dụ: Hãy đảm bảo rằng bạn đã cài đặt phiên bản Node.js LTS trở lên)
{% /callout %}`,
    },

};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function BlockEditor({
    initialTitle = '',
    initialDescription = '',
    initialContent = '',
    onChange,
    onTitleChange,
    onDescriptionChange,
    onTemplateLoad,
    defaultTemplate = 'task',
    autoLoadTemplate = false,
}) {
    const [title, setTitle] = useState(initialTitle);
    const [description, setDescription] = useState(initialDescription);
    const [content, setContent] = useState('');
    const [showTemplatePicker, setShowTemplatePicker] = useState(false);
    const [template, setTemplate] = useState(defaultTemplate);
    const [linkModalVisible, setLinkModalVisible] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [imageUrl, setImageUrl] = useState('');

    const titleRef = useRef(initialTitle);
    const descriptionRef = useRef(initialDescription);
    const contentRef = useRef('');
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
            Subscript,
            Superscript,
            TaskList,
            TaskItem.configure({ nested: true }),
            HorizontalRule,
            ImageExtension,
            Selection,
            CalloutExtension,
            StepExtension,
            SectionExtension,
        ],
        content: markdocToHtml(initialContent),
        onUpdate({ editor: ed }) {
            const markdocStr = tipTapToMarkdoc(ed.getJSON());
            contentRef.current = markdocStr;
            setContent(markdocStr);
            syncWithParent(titleRef.current, descriptionRef.current, markdocStr);
        },
    });

    const lastSentContentRef = useRef(initialContent);

    // Handle initialContent load & external changes
    useEffect(() => {
        if (editor && initialContent !== undefined && initialContent !== lastSentContentRef.current) {
            editor.commands.setContent(markdocToHtml(initialContent));
            contentRef.current = initialContent;
            setContent(initialContent);
            lastSentContentRef.current = initialContent;
        }
    }, [initialContent, editor]);

    // Synchronize content to parent
    const buildPayload = useCallback((newTitle, newDesc, newContent) => {
        return { title: newTitle, description: newDesc, content: newContent };
    }, []);

    const syncDebounceRef = useRef(null);

    const syncWithParent = useCallback(
        (newTitle, newDesc, newContent) => {
            if (!onChangeRef.current) return;
            if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
            syncDebounceRef.current = setTimeout(() => {
                lastSentContentRef.current = newContent;
                onChangeRef.current(buildPayload(newTitle, newDesc, newContent));
            }, 300);
        },
        [buildPayload],
    );

    const syncWithParentImmediate = useCallback(
        (newTitle, newDesc, newContent) => {
            if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
            if (onChangeRef.current) {
                lastSentContentRef.current = newContent;
                onChangeRef.current(buildPayload(newTitle, newDesc, newContent));
            }
        },
        [buildPayload],
    );

    const buildTemplateSnapshot = (tmplTitle, tmplDesc, tmplContent) => {
        return {
            title: tmplTitle,
            description: tmplDesc,
            content: tmplContent,
        };
    };

    // Auto-load template on mount if editor is empty
    useEffect(() => {
        if (autoLoadTemplate && !initialContent && !initialTitle && TEMPLATES[defaultTemplate] && editor) {
            const tmpl = TEMPLATES[defaultTemplate];
            const tContent = tmpl.blocks();

            // Set refs first to avoid race conditions with TipTap's onUpdate event
            titleRef.current = tmpl.title;
            descriptionRef.current = tmpl.descriptionText;

            if (onTitleChange) onTitleChange(tmpl.title);
            if (onDescriptionChange) onDescriptionChange(tmpl.descriptionText);

            setTitle(tmpl.title);
            setDescription(tmpl.descriptionText);
            setContent(tContent);
            editor.commands.setContent(markdocToHtml(tContent));

            syncWithParentImmediate(tmpl.title, tmpl.descriptionText, tContent);

            if (onTemplateLoad) {
                onTemplateLoad(buildTemplateSnapshot(tmpl.title, tmpl.descriptionText, tContent));
            }
        }
    }, [autoLoadTemplate, defaultTemplate, editor]);

    const handleTitleChange = (val) => {
        titleRef.current = val;
        setTitle(val);
        if (onTitleChange) onTitleChange(val);
        syncWithParentImmediate(val, descriptionRef.current, contentRef.current);
    };

    const handleDescriptionChange = (val) => {
        descriptionRef.current = val;
        setDescription(val);
        if (onDescriptionChange) onDescriptionChange(val);
        syncWithParentImmediate(titleRef.current, val, contentRef.current);
    };

    // Toolbar Command handlers
    const executeCommand = (commandType) => {
        if (!editor) return;

        editor.commands.focus();

        switch (commandType) {
                        case 'bold':
                            editor.chain().focus().toggleBold().run();
                            break;
                        case 'italic':
                            editor.chain().focus().toggleItalic().run();
                            break;
                        case 'underline':
                            editor.chain().focus().toggleUnderline().run();
                            break;
                        case 'strike':
                            editor.chain().focus().toggleStrike().run();
                            break;
                        case 'highlight':
                            editor.chain().focus().toggleHighlight().run();
                            break;
                        case 'subscript':
                            editor.chain().focus().toggleSubscript().run();
                            break;
                        case 'superscript':
                            editor.chain().focus().toggleSuperscript().run();
                            break;
                        case 'taskList':
                            editor.chain().focus().toggleTaskList().run();
                            break;
                        case 'horizontalRule':
                            editor.chain().focus().setHorizontalRule().run();
                            break;
                        case 'link':
                            setLinkUrl(editor.getAttributes('link').href || '');
                            setLinkModalVisible(true);
                            break;
                        case 'image':
                            setImageUrl('');
                            setImageModalVisible(true);
                            break;
                        case 'h1':
                            editor.chain().focus().toggleHeading({ level: 1 }).run();
                            break;
                        case 'h2':
                            editor.chain().focus().toggleHeading({ level: 2 }).run();
                            break;
                        case 'h3':
                            editor.chain().focus().toggleHeading({ level: 3 }).run();
                            break;
                        case 'bullet':
                            editor.chain().focus().toggleBulletList().run();
                            break;
                        case 'ordered':
                            editor.chain().focus().toggleOrderedList().run();
                            break;
                        case 'callout':
                            editor
                                .chain()
                                .focus()
                                .insertContent('<callout-block><p>Nhập nội dung lưu ý của bạn ở đây...</p></callout-block>')
                                .run();
                            break;
                        case 'step':
                            editor
                                .chain()
                                .focus()
                                .insertContent('<step-block label="Bước mới"><p>Nhập mô tả bước ở đây...</p></step-block>')
                                .run();
                            break;
                        case 'section':
                            editor
                                .chain()
                                .focus()
                                .insertContent(
                                    '<section-block icon="🎓" title="Kiến thức đạt được"><ul><li>Kiến thức 1</li></ul></section-block>',
                                )
                                .run();
                            break;

                        default:
                            break;
        }
    };

    const handleLoadTemplate = (key) => {
        if (!TEMPLATES[key] || !editor) return;
        const tmpl = TEMPLATES[key];
        const tContent = tmpl.blocks();

        titleRef.current = tmpl.title;
        descriptionRef.current = tmpl.descriptionText;

        setTemplate(key);
        setTitle(tmpl.title);
        setDescription(tmpl.descriptionText);
        setContent(tContent);
        editor.commands.setContent(markdocToHtml(tContent));

        if (onTitleChange) onTitleChange(tmpl.title);
        if (onDescriptionChange) onDescriptionChange(tmpl.descriptionText);

        setShowTemplatePicker(false);
        syncWithParentImmediate(tmpl.title, tmpl.descriptionText, tContent);

        if (onTemplateLoad) {
            onTemplateLoad(buildTemplateSnapshot(tmpl.title, tmpl.descriptionText, tContent));
        }
    };

    const handleResetToBlank = () => {
        titleRef.current = '';
        descriptionRef.current = '';
        contentRef.current = '';
        setTitle('');
        setDescription('');
        setContent('');
        if (editor) editor.commands.clearContent();

        if (onTitleChange) onTitleChange('');
        if (onDescriptionChange) onDescriptionChange('');

        setShowTemplatePicker(false);
        syncWithParentImmediate('', '', '');
    };

    // Auto-resize title/description fields
    useEffect(() => {
        const titleEl = document.getElementById('be-doc-title');
        const descEl = document.getElementById('be-doc-description');
        if (titleEl) {
            titleEl.style.height = 'auto';
            titleEl.style.height = titleEl.scrollHeight + 'px';
        }
        if (descEl) {
            descEl.style.height = 'auto';
            descEl.style.height = descEl.scrollHeight + 'px';
        }
    }, [title, description]);

    return (
        <div className="block-editor-container">
            {/* Top Toolbar */}
            <div className="editor-toolbar-new">
                {/* Row 1: Text Formatting & Template */}
                <div className="toolbar-row formatting-row">
                    <div
                        className="toolbar-left-group"
                        style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}
                    >
                        <div className="toolbar-group">
                            <button
                                type="button"
                                className={`toolbar-btn ${editor?.isActive('bold') ? 'active' : ''}`}
                                onClick={() => executeCommand('bold')}
                                title="Chữ đậm"
                            >
                                <BoldOutlined />
                            </button>
                            <button
                                type="button"
                                className={`toolbar-btn ${editor?.isActive('italic') ? 'active' : ''}`}
                                onClick={() => executeCommand('italic')}
                                title="Chữ nghiêng"
                            >
                                <ItalicOutlined />
                            </button>
                            <button
                                type="button"
                                className={`toolbar-btn ${editor?.isActive('underline') ? 'active' : ''}`}
                                onClick={() => executeCommand('underline')}
                                title="Chữ gạch chân"
                            >
                                <UnderlineOutlined />
                            </button>
                            <button
                                type="button"
                                className={`toolbar-btn ${editor?.isActive('link') ? 'active' : ''}`}
                                onClick={() => executeCommand('link')}
                                title="Chèn liên kết"
                            >
                                <LinkOutlined />
                            </button>
                            <button
                                type="button"
                                className="toolbar-btn"
                                onClick={() => executeCommand('image')}
                                title="Chèn hình ảnh"
                            >
                                <PictureOutlined />
                            </button>
                        </div>

                        <span className="toolbar-divider" />

                        <div className="toolbar-group">
                            <button
                                type="button"
                                className={`toolbar-btn ${editor?.isActive('heading', { level: 1 }) ? 'active' : ''}`}
                                onClick={() => executeCommand('h1')}
                                title="Tiêu đề 1"
                            >
                                H1
                            </button>
                            <button
                                type="button"
                                className={`toolbar-btn ${editor?.isActive('heading', { level: 2 }) ? 'active' : ''}`}
                                onClick={() => executeCommand('h2')}
                                title="Tiêu đề 2"
                            >
                                H2
                            </button>
                            <button
                                type="button"
                                className={`toolbar-btn ${editor?.isActive('heading', { level: 3 }) ? 'active' : ''}`}
                                onClick={() => executeCommand('h3')}
                                title="Tiêu đề 3"
                            >
                                H3
                            </button>
                        </div>

                        <span className="toolbar-divider" />

                        <div className="toolbar-group">
                            <button
                                type="button"
                                className={`toolbar-btn ${editor?.isActive('bulletList') ? 'active' : ''}`}
                                onClick={() => executeCommand('bullet')}
                                title="Danh sách gạch đầu dòng"
                            >
                                <UnorderedListOutlined />
                            </button>
                            <button
                                type="button"
                                className={`toolbar-btn ${editor?.isActive('orderedList') ? 'active' : ''}`}
                                onClick={() => executeCommand('ordered')}
                                title="Danh sách đánh số"
                            >
                                <OrderedListOutlined />
                            </button>
                            <button
                                type="button"
                                className={`toolbar-btn ${editor?.isActive('taskList') ? 'active' : ''}`}
                                onClick={() => executeCommand('taskList')}
                                title="Danh sách nhiệm vụ (checkbox)"
                            >
                                <CheckSquareOutlined />
                            </button>
                        </div>

                        <span className="toolbar-divider" />

                        <div className="toolbar-group">
                            <button
                                type="button"
                                className={`toolbar-btn ${editor?.isActive('strike') ? 'active' : ''}`}
                                onClick={() => executeCommand('strike')}
                                title="Gạch ngang"
                            >
                                <StrikethroughOutlined />
                            </button>
                            <button
                                type="button"
                                className={`toolbar-btn ${editor?.isActive('highlight') ? 'active' : ''}`}
                                onClick={() => executeCommand('highlight')}
                                title="Tô màu"
                            >
                                <HighlightOutlined />
                            </button>
                            <button
                                type="button"
                                className={`toolbar-btn ${editor?.isActive('subscript') ? 'active' : ''}`}
                                onClick={() => executeCommand('subscript')}
                                title="Chỉ số dưới"
                                style={{ fontFamily: 'serif', fontSize: 14, fontStyle: 'italic' }}
                            >
                                x₂
                            </button>
                            <button
                                type="button"
                                className={`toolbar-btn ${editor?.isActive('superscript') ? 'active' : ''}`}
                                onClick={() => executeCommand('superscript')}
                                title="Chỉ số trên"
                                style={{ fontFamily: 'serif', fontSize: 14, fontStyle: 'italic' }}
                            >
                                x²
                            </button>
                        </div>

                        <span className="toolbar-divider" />

                        <div className="toolbar-group">
                            <button
                                type="button"
                                className="toolbar-btn"
                                onClick={() => executeCommand('horizontalRule')}
                                title="Đường kẻ ngang"
                            >
                                <MinusOutlined />
                            </button>
                        </div>
                    </div>

                    <div className="template-picker-btn-wrap">
                        <Button
                            type="default"
                            onClick={() => setShowTemplatePicker(true)}
                            className="template-select-btn"
                        >
                            <FileTextOutlined /> Mẫu: <strong>{TEMPLATES[template]?.label || 'Không có'}</strong>{' '}
                            <DownOutlined style={{ fontSize: 10, marginLeft: 2 }} />
                        </Button>
                    </div>
                </div>

                {/* Row 2: Inserters */}
                <div className="toolbar-row insertion-row">
                    <div className="insert-label-group">
                        <span className="insert-label">
                            <PlusOutlined style={{ fontSize: 11 }} /> Chèn nhanh:
                        </span>
                        <div className="insert-buttons">
                            <button
                                type="button"
                                className="insert-btn callout-ib"
                                onClick={() => executeCommand('callout')}
                                title="Chèn Hộp Lưu ý"
                            >
                                <InfoCircleOutlined /> Lưu ý
                            </button>
                            <button
                                type="button"
                                className="insert-btn step-ib"
                                onClick={() => executeCommand('step')}
                                title="Chèn Bước Hướng dẫn"
                            >
                                <BookOutlined /> Bước
                            </button>
                            <button
                                type="button"
                                className="insert-btn section-ib"
                                onClick={() => executeCommand('section')}
                                title="Chèn Section"
                            >
                                <PlusOutlined /> Mục lớn
                            </button>


                        </div>
                    </div>
                </div>
            </div>

            {/* Full Width Editor Canvas */}
            <div className="editor-wrap-full">
                <div className="editor-pane-left">
                    <div className="editor-doc-meta" style={{ padding: '24px 24px 0px 24px' }}>
                        <textarea
                            className="doc-title"
                            id="be-doc-title"
                            placeholder="Tiêu đề bài học..."
                            rows="1"
                            value={title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                        />
                        <textarea
                            className="doc-description"
                            id="be-doc-description"
                            placeholder="Mô tả ngắn bài học..."
                            rows="1"
                            value={description}
                            onChange={(e) => handleDescriptionChange(e.target.value)}
                        />
                    </div>
                    <div
                        className="tiptap-editor-wrapper"
                        style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px 24px' }}
                    >
                        <EditorContent editor={editor} />
                    </div>
                </div>
            </div>

            {/* Template Picker Modal */}
            <Modal
                title="Chọn Mẫu Nội Dung"
                open={showTemplatePicker}
                onCancel={() => setShowTemplatePicker(false)}
                footer={[
                    <span
                        key="blank"
                        className="tp-blank"
                        onClick={handleResetToBlank}
                        style={{
                            marginRight: 16,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            color: 'var(--accent)',
                        }}
                    >
                        Tạo bài viết trống (Không dùng mẫu)
                    </span>,
                    <Button key="close" onClick={() => setShowTemplatePicker(false)}>
                        Đóng
                    </Button>,
                ]}
                width={700}
            >
                <div
                    className="template-picker-grid"
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '12px 0' }}
                >
                    {Object.entries(TEMPLATES).map(([key, value]) => (
                        <Card
                            key={key}
                            hoverable
                            onClick={() => handleLoadTemplate(key)}
                            title={<strong>Mẫu {value.label}</strong>}
                            size="small"
                        >
                            <p style={{ color: '#595959', fontSize: 13, margin: 0, fontStyle: 'italic' }}>
                                {value.description}
                            </p>
                        </Card>
                    ))}
                </div>
            </Modal>

            {/* Link Modal */}
            <Modal
                title="Chèn liên kết"
                open={linkModalVisible}
                onCancel={() => setLinkModalVisible(false)}
                onOk={() => {
                    if (!linkUrl) {
                        editor.chain().focus().unsetLink().run();
                    } else {
                        editor.chain().focus().setLink({ href: linkUrl }).run();
                    }
                    setLinkModalVisible(false);
                }}
                okText="Áp dụng"
                cancelText="Hủy"
                destroyOnClose
            >
                <Input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                    size="large"
                    autoFocus
                />
            </Modal>

            {/* Image Modal */}
            <Modal
                title="Chèn hình ảnh"
                open={imageModalVisible}
                onCancel={() => setImageModalVisible(false)}
                onOk={() => {
                    if (imageUrl) {
                        editor.chain().focus().setImage({ src: imageUrl }).run();
                    }
                    setImageModalVisible(false);
                }}
                okText="Chèn"
                cancelText="Hủy"
                destroyOnClose
            >
                <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    size="large"
                    autoFocus
                />
            </Modal>
        </div>
    );
}


