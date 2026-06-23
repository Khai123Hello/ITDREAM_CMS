import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Button, Radio, Input, Card, Dropdown } from 'antd';
import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { DOMSerializer, Fragment } from '@tiptap/pm/model';
import { Mark, Node, mergeAttributes } from '@tiptap/core';
import {
    BoldOutlined,
    ItalicOutlined,
    UnderlineOutlined,
    UnorderedListOutlined,
    OrderedListOutlined,
    LinkOutlined,
    CodeOutlined,
    PlusOutlined,
    DeleteOutlined,
    BookOutlined,
    InfoCircleOutlined,
    QuestionCircleOutlined,
    FileTextOutlined,
    DownOutlined,
} from '@ant-design/icons';
import './BlockEditor.scss';

// EMOJI_SETS
const EMOJI_SETS = [
    { l: 'Học & Kiến thức', e: ['🎓', '📚', '💡', '🔬', '🧪', '🧩', '📖', '✏️', '📝'] },
    { l: 'Thực hành', e: ['⚙️', '🛠️', '🔧', '🔨', '🚀', '✅', '🎯', '💻', '🖥️'] },
    { l: 'Kết quả', e: ['🏆', '⭐', '🌟', '🎉', '💎', '🥇', '🔑', '🎁'] },
    { l: 'Thông tin', e: ['📋', '📊', '📈', '📉', '🗂️', '📁', '📌', '📎'] },
];

// Custom Underline Mark
const Underline = Mark.create({
    name: 'underline',
    parseHTML() {
        return [{ tag: 'u' }, { style: 'text-decoration=underline' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['u', mergeAttributes(HTMLAttributes), 0];
    },
    addCommands() {
        return {
            toggleUnderline: () => ({ commands }) => {
                return commands.toggleMark(this.name);
            },
        };
    },
    addKeyboardShortcuts() {
        return {
            'Mod-u': () => this.editor.commands.toggleUnderline(),
            'Mod-U': () => this.editor.commands.toggleUnderline(),
        };
    },
});

// Custom Link Mark
const Link = Mark.create({
    name: 'link',
    addAttributes() {
        return {
            href: { default: null },
            target: { default: '_blank' },
        };
    },
    parseHTML() {
        return [{ tag: 'a[href]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['a', mergeAttributes(HTMLAttributes), 0];
    },
});

// Callout Node View
const CalloutNodeView = ({ node, updateAttributes }) => {
    const [showEmoji, setShowEmoji] = useState(false);

    return (
        <NodeViewWrapper className="custom-callout-node-wrapper">
            <div className="custom-callout-node">
                <Dropdown
                    open={showEmoji}
                    onOpenChange={setShowEmoji}
                    dropdownRender={() => (
                        <div className="emoji-picker-dropdown">
                            {EMOJI_SETS.map((set) => (
                                <div key={set.l} className="emoji-section">
                                    <div className="emoji-section-title">{set.l}</div>
                                    <div className="emoji-grid">
                                        {set.e.map((emoji) => (
                                            <span
                                                key={emoji}
                                                className="emoji-item"
                                                onClick={() => {
                                                    updateAttributes({ icon: emoji });
                                                    setShowEmoji(false);
                                                }}
                                            >
                                                {emoji}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    trigger={['click']}
                    placement="bottomLeft"
                >
                    <span className="callout-icon-btn">{node.attrs.icon}</span>
                </Dropdown>
                <Input
                    className="callout-text-input"
                    value={node.attrs.content}
                    onChange={(e) => updateAttributes({ content: e.target.value })}
                    placeholder="Nhập nội dung lưu ý nổi bật..."
                    bordered={false}
                />
            </div>
        </NodeViewWrapper>
    );
};

// Callout Extension
const CalloutExtension = Node.create({
    name: 'callout',
    group: 'block',
    atom: true,
    addAttributes() {
        return {
            icon: { default: '💡' },
            content: { default: '' },
        };
    },
    parseHTML() {
        return [{ tag: 'div[data-type="callout"]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'callout' })];
    },
    addNodeView() {
        return ReactNodeViewRenderer(CalloutNodeView);
    },
});

// Step Node View
const StepNodeView = ({ node, updateAttributes }) => {
    return (
        <NodeViewWrapper className="custom-step-node-wrapper">
            <div className="custom-step-node">
                <div className="step-inputs">
                    <Input
                        className="step-label-input"
                        value={node.attrs.label}
                        onChange={(e) => updateAttributes({ label: e.target.value })}
                        placeholder="Ví dụ: Bước 1"
                        style={{ width: 120, fontWeight: 600 }}
                    />
                    <Input.TextArea
                        className="step-body-input"
                        value={node.attrs.body}
                        onChange={(e) => updateAttributes({ body: e.target.value })}
                        placeholder="Mô tả nội dung của bước này..."
                        autoSize={{ minRows: 1, maxRows: 3 }}
                        bordered={false}
                    />
                </div>
            </div>
        </NodeViewWrapper>
    );
};

// Step Extension
const StepExtension = Node.create({
    name: 'stepBlock',
    group: 'block',
    atom: true,
    addAttributes() {
        return {
            label: { default: 'Bước 1' },
            body: { default: '' },
        };
    },
    parseHTML() {
        return [{ tag: 'div[data-type="step"]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'step' })];
    },
    addNodeView() {
        return ReactNodeViewRenderer(StepNodeView);
    },
});

// Section Node View
const SectionNodeView = ({ node, updateAttributes }) => {
    const [showEmoji, setShowEmoji] = useState(false);
    const { icon, title, bullets } = node.attrs;

    const handleBulletChange = (index, value) => {
        const newBullets = [...bullets];
        newBullets[index] = value;
        updateAttributes({ bullets: newBullets });
    };

    const addBullet = () => {
        updateAttributes({ bullets: [...bullets, ''] });
    };

    const deleteBullet = (index) => {
        const newBullets = bullets.filter((_, i) => i !== index);
        updateAttributes({ bullets: newBullets.length > 0 ? newBullets : [''] });
    };

    return (
        <NodeViewWrapper className="custom-section-node-wrapper">
            <Card
                className="custom-section-node-card"
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Dropdown
                            open={showEmoji}
                            onOpenChange={setShowEmoji}
                            dropdownRender={() => (
                                <div className="emoji-picker-dropdown">
                                    {EMOJI_SETS.map((set) => (
                                        <div key={set.l} className="emoji-section">
                                            <div className="emoji-section-title">{set.l}</div>
                                            <div className="emoji-grid">
                                                {set.e.map((emoji) => (
                                                    <span
                                                        key={emoji}
                                                        className="emoji-item"
                                                        onClick={() => {
                                                            updateAttributes({ icon: emoji });
                                                            setShowEmoji(false);
                                                        }}
                                                    >
                                                        {emoji}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            trigger={['click']}
                            placement="bottomLeft"
                        >
                            <span className="section-icon-btn">{icon}</span>
                        </Dropdown>
                        <Input
                            placeholder="Tiêu đề mục (ví dụ: Kiến thức đạt được)"
                            value={title}
                            onChange={(e) => updateAttributes({ title: e.target.value })}
                            bordered={false}
                            style={{ fontWeight: 600, fontSize: 16 }}
                        />
                    </div>
                }
                size="small"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {bullets.map((bullet, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: 'var(--accent)' }}>•</span>
                            <Input
                                value={bullet}
                                onChange={(e) => handleBulletChange(idx, e.target.value)}
                                placeholder="Nhập nội dung gạch đầu dòng..."
                                bordered={false}
                                style={{ flex: 1 }}
                            />
                            {bullets.length > 1 && (
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => deleteBullet(idx)}
                                    size="small"
                                />
                            )}
                        </div>
                    ))}
                    <Button
                        type="dashed"
                        onClick={addBullet}
                        icon={<PlusOutlined />}
                        size="small"
                        style={{ marginTop: 8 }}
                    >
                        Thêm gạch đầu dòng
                    </Button>
                </div>
            </Card>
        </NodeViewWrapper>
    );
};

// Section Extension
const SectionExtension = Node.create({
    name: 'sectionBlock',
    group: 'block',
    atom: true,
    addAttributes() {
        return {
            icon: { default: '🎓' },
            title: { default: '' },
            bullets: { default: [''] },
        };
    },
    parseHTML() {
        return [{ tag: 'div[data-type="section"]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'section' })];
    },
    addNodeView() {
        return ReactNodeViewRenderer(SectionNodeView);
    },
});

// Quiz Node View
const QuizNodeView = ({ node, updateAttributes }) => {
    const { question, options } = node.attrs;

    const handleOptionTextChange = (index, value) => {
        const newOptions = [...options];
        newOptions[index] = { ...newOptions[index], option: value };
        updateAttributes({ options: newOptions });
    };

    const handleCorrectAnswerChange = (index, checked) => {
        const newOptions = options.map((opt, i) => ({
            ...opt,
            answer: i === index ? checked : false, // Một lựa chọn (Single choice)
        }));
        updateAttributes({ options: newOptions });
    };

    const addOption = () => {
        updateAttributes({
            options: [...options, { option: '', answer: false }],
        });
    };

    const deleteOption = (index) => {
        const newOptions = options.filter((_, i) => i !== index);
        updateAttributes({ options: newOptions.length > 0 ? newOptions : [{ option: '', answer: false }] });
    };

    return (
        <NodeViewWrapper className="custom-quiz-node-wrapper">
            <Card
                className="custom-quiz-node-card"
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 18 }}>❓</span>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>Khối Trắc Nghiệm</span>
                    </div>
                }
                size="small"
            >
                <div style={{ marginBottom: 16 }}>
                    <label style={{ fontWeight: 500, display: 'block', marginBottom: 6 }}>Câu hỏi</label>
                    <Input.TextArea
                        placeholder="Nhập câu hỏi trắc nghiệm ở đây..."
                        value={question}
                        onChange={(e) => updateAttributes({ question: e.target.value })}
                        autoSize={{ minRows: 2, maxRows: 4 }}
                    />
                </div>
                <div>
                    <label style={{ fontWeight: 500, display: 'block', marginBottom: 6 }}>Đáp án chọn</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {options.map((opt, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Radio
                                    checked={opt.answer}
                                    onChange={(e) => handleCorrectAnswerChange(idx, e.target.checked)}
                                    title="Đặt làm đáp án đúng"
                                />
                                <Input
                                    value={opt.option}
                                    onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                                    placeholder={`Đáp án ${String.fromCharCode(65 + idx)}...`}
                                    style={{ flex: 1 }}
                                />
                                {options.length > 1 && (
                                    <Button
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => deleteOption(idx)}
                                        size="small"
                                    />
                                )}
                            </div>
                        ))}
                        <Button
                            type="dashed"
                            onClick={addOption}
                            icon={<PlusOutlined />}
                            size="small"
                            style={{ marginTop: 8 }}
                        >
                            Thêm đáp án chọn
                        </Button>
                    </div>
                </div>
            </Card>
        </NodeViewWrapper>
    );
};

// Quiz Extension
const QuizExtension = Node.create({
    name: 'quizBlock',
    group: 'block',
    atom: true,
    addAttributes() {
        return {
            question: { default: '' },
            options: {
                default: [
                    { option: '', answer: false },
                    { option: '', answer: false },
                ],
            },
        };
    },
    parseHTML() {
        return [{ tag: 'div[data-type="quiz"]' }];
    },
    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'quiz' })];
    },
    addNodeView() {
        return ReactNodeViewRenderer(QuizNodeView);
    },
});

// Templates definitions
const TEMPLATES = {
    task: {
        label: 'Giới thiệu',
        title: 'Nhập tiêu đề giới thiệu ở đây (ví dụ: Giới thiệu về lập trình React)',
        description:
            'Nhập mô tả ngắn gọn về bài học ở đây (ví dụ: Bài viết giúp học viên làm quen với thư viện ReactJS cơ bản)',
        blocks: () => [
            {
                type: 'section',
                icon: '🎓',
                title: 'Kiến thức sẽ đạt được (ví dụ: Mục tiêu bài học)',
                bullets: [
                    'Nhập nội dung kiến thức thứ nhất (ví dụ: Cách khởi tạo component)',
                    'Nhập nội dung kiến thức thứ hai (ví dụ: Cách truyền props và quản lý state)',
                ],
            },
            {
                type: 'section',
                icon: '🛠️',
                title: 'Các bước thực hành chính (ví dụ: Nhiệm vụ cần làm)',
                bullets: [
                    'Nhập hành động thực hành thứ nhất (ví dụ: Cài đặt môi trường Node.js)',
                    'Nhập hành động thực hành thứ hai (ví dụ: Chạy kiểm thử ứng dụng)',
                ],
            },
        ],
    },
    guide: {
        label: 'Hướng dẫn',
        title: 'Nhập tiêu đề hướng dẫn (ví dụ: Hướng dẫn các bước cấu hình)',
        description:
            'Nhập hướng dẫn tổng quan (ví dụ: Thực hiện tuần tự các bước dưới đây để hoàn thành cấu hình ứng dụng)',
        blocks: () => [
            {
                type: 'step',
                label: 'Bước 1',
                body: 'Mô tả bước thực hiện thứ nhất ở đây (ví dụ: Tạo file mới có tên App.js trong thư mục src)',
            },
            {
                type: 'step',
                label: 'Bước 2',
                body: 'Mô tả bước thực hiện thứ hai ở đây (ví dụ: Chạy lệnh `npm install` để tải thư viện)',
            },
            {
                type: 'step',
                label: 'Bước 3',
                body: 'Mô tả bước thực hiện thứ ba ở đây (ví dụ: Viết code cho Component chính và xuất ra ngoài)',
            },
            {
                type: 'step',
                label: 'Bước 4',
                body: 'Mô tả bước thực hiện thứ tư ở đây (ví dụ: Nhấp vào nút Lưu để lưu lại cấu hình)',
            },
            {
                type: 'step',
                label: 'Bước 5',
                body: 'Mô tả bước thực hiện thứ năm ở đây (ví dụ: Mở trình duyệt và truy cập vào localhost:3000 để kiểm tra kết quả)',
            },
            {
                type: 'divider',
            },
            {
                type: 'text',
                content:
                    'Nhập tóm tắt hoặc lưu ý cuối cùng ở đây (ví dụ: Cuối cùng, hãy nhấn nút nộp bài ở bước tiếp theo!)',
            },
        ],
    },
    reading: {
        label: 'Ví dụ',
        title: 'Nhập tiêu đề tài liệu tham khảo hoặc ví dụ (ví dụ: Ví dụ về cấu trúc thư mục dự án)',
        description:
            'Mô tả tổng quan về ví dụ hoặc tài liệu ở đây (ví dụ: Đọc kỹ phần thông tin nền tảng này trước khi bắt đầu nhiệm vụ)',
        blocks: () => [
            {
                type: 'text',
                content:
                    'Nhập đoạn văn bản giới thiệu/bối cảnh ở đây (ví dụ: React là một thư viện Javascript phổ biến để xây dựng giao diện người dùng đơn trang)',
            },
            {
                type: 'text',
                content: 'Nhập hướng dẫn các bước tiếp theo (ví dụ: Ví dụ này bao gồm ba phần chính cần chú ý:)',
            },
            {
                type: 'numbered',
                content: 'Nhập mục thứ nhất (ví dụ: Khởi tạo dự án bằng Vite)',
            },
            {
                type: 'numbered',
                content: 'Nhập mục thứ hai (ví dụ: Tạo component Header và Footer)',
            },
            {
                type: 'numbered',
                content: 'Nhập mục thứ ba (ví dụ: Chạy ứng dụng trên cổng 5173)',
            },
            {
                type: 'callout',
                icon: '💡',
                content:
                    'Nhập lưu ý hoặc thông tin đặc biệt nhấn mạnh ở đây (ví dụ: Hãy đảm bảo rằng bạn đã cài đặt phiên bản Node.js LTS trở lên)',
            },
        ],
    },
    quiz: {
        label: 'Trắc nghiệm',
        title: 'Kiểm tra kiến thức (ví dụ: Trắc nghiệm nhanh)',
        description: 'Trả lời các câu hỏi trắc nghiệm dưới đây để hoàn thành bài học.',
        blocks: () => [
            { type: 'text', content: 'Hãy chọn đáp án đúng nhất cho từng câu hỏi.' },
            {
                type: 'quiz',
                question: 'Thủ đô của Việt Nam là gì?',
                options: [
                    { option: 'Hà Nội', answer: true },
                    { option: 'TP. Hồ Chí Minh', answer: false },
                    { option: 'Đà Nẵng', answer: false },
                ],
            },
        ],
    },
};

// Slash Menu Items definitions
const SLASH_ITEMS = [
    { key: 'callout', label: 'Hộp Lưu ý', desc: 'Chèn khung ghi chú nổi bật', icon: '💡', type: 'callout' },
    { key: 'stepBlock', label: 'Bước Hướng dẫn', desc: 'Chèn một bước thực hành', icon: '👣', type: 'stepBlock' },
    { key: 'sectionBlock', label: 'Mục lớn (Section)', desc: 'Chèn khung mục tiêu bài học', icon: '🎓', type: 'sectionBlock' },
    { key: 'quizBlock', label: 'Trắc nghiệm', desc: 'Chèn câu hỏi trắc nghiệm', icon: '❓', type: 'quizBlock' },
    { key: 'bulletList', label: 'Danh sách dấu tròn', desc: 'Chèn danh sách không thứ tự', icon: '•', type: 'bulletList' },
    { key: 'orderedList', label: 'Danh sách số', desc: 'Chèn danh sách có thứ tự', icon: '1.', type: 'orderedList' },
    { key: 'codeBlock', label: 'Khối Code', desc: 'Khung nhập mã nguồn đơn sắc', icon: '</>', type: 'codeBlock' },
    { key: 'h1', label: 'Tiêu đề 1', desc: 'Tiêu đề cỡ lớn', icon: 'H1', type: 'h1' },
    { key: 'h2', label: 'Tiêu đề 2', desc: 'Tiêu đề cỡ vừa', icon: 'H2', type: 'h2' },
    { key: 'h3', label: 'Tiêu đề 3', desc: 'Tiêu đề mục nhỏ', icon: 'H3', type: 'h3' },
];

// Conversions
const deserializeBlocksToTipTap = (blocks) => {
    if (!blocks || !Array.isArray(blocks)) {
        return {
            type: 'doc',
            content: [{ type: 'paragraph' }],
        };
    }

    const content = [];
    let i = 0;

    while (i < blocks.length) {
        const block = blocks[i];

        if (block.type === 'text') {
            content.push({
                type: 'paragraph',
                content: block.content ? [{ type: 'text', text: block.content }] : [],
            });
            i++;
        } else if (block.type === 'h1') {
            content.push({
                type: 'heading',
                attrs: { level: 1 },
                content: block.content ? [{ type: 'text', text: block.content }] : [],
            });
            i++;
        } else if (block.type === 'h2') {
            content.push({
                type: 'heading',
                attrs: { level: 2 },
                content: block.content ? [{ type: 'text', text: block.content }] : [],
            });
            i++;
        } else if (block.type === 'h3') {
            content.push({
                type: 'heading',
                attrs: { level: 3 },
                content: block.content ? [{ type: 'text', text: block.content }] : [],
            });
            i++;
        } else if (block.type === 'bullet') {
            const listItems = [];
            while (i < blocks.length && blocks[i].type === 'bullet') {
                listItems.push({
                    type: 'listItem',
                    content: [
                        {
                            type: 'paragraph',
                            content: blocks[i].content ? [{ type: 'text', text: blocks[i].content }] : [],
                        },
                    ],
                });
                i++;
            }
            content.push({
                type: 'bulletList',
                content: listItems,
            });
        } else if (block.type === 'numbered') {
            const listItems = [];
            while (i < blocks.length && blocks[i].type === 'numbered') {
                listItems.push({
                    type: 'listItem',
                    content: [
                        {
                            type: 'paragraph',
                            content: blocks[i].content ? [{ type: 'text', text: blocks[i].content }] : [],
                        },
                    ],
                });
                i++;
            }
            content.push({
                type: 'orderedList',
                content: listItems,
            });
        } else if (block.type === 'divider') {
            content.push({ type: 'horizontalRule' });
            i++;
        } else if (block.type === 'callout') {
            content.push({
                type: 'callout',
                attrs: {
                    icon: block.icon || '💡',
                    content: block.content || '',
                },
            });
            i++;
        } else if (block.type === 'code') {
            content.push({
                type: 'codeBlock',
                content: block.content ? [{ type: 'text', text: block.content }] : [],
            });
            i++;
        } else if (block.type === 'section') {
            content.push({
                type: 'sectionBlock',
                attrs: {
                    icon: block.icon || '🎓',
                    title: block.title || '',
                    bullets: block.bullets || [''],
                },
            });
            i++;
        } else if (block.type === 'step') {
            content.push({
                type: 'stepBlock',
                attrs: {
                    label: block.label || 'Bước 1',
                    body: block.body || '',
                },
            });
            i++;
        } else if (block.type === 'quiz') {
            content.push({
                type: 'quizBlock',
                attrs: {
                    question: block.question || '',
                    options: block.options || [
                        { option: '', answer: false },
                        { option: '', answer: false },
                    ],
                },
            });
            i++;
        } else {
            content.push({
                type: 'paragraph',
            });
            i++;
        }
    }

    if (content.length === 0) {
        content.push({ type: 'paragraph' });
    }

    return {
        type: 'doc',
        content,
    };
};

const serializeTipTapToBlocks = (doc, schema) => {
    if (!doc || !doc.content || !Array.isArray(doc.content)) {
        return [];
    }

    const blocks = [];
    const serializer = DOMSerializer.fromSchema(schema);

    const getHTMLFromNodeContent = (node) => {
        if (!node) return '';
        try {
            const fragment = Fragment.fromJSON(schema, node.content);
            const tempDiv = document.createElement('div');
            serializer.serializeFragment(fragment, { document }, tempDiv);
            return tempDiv.innerHTML || '';
        } catch (e) {
            console.error('Error serializing node content:', e);
            return '';
        }
    };

    doc.content.forEach((node) => {
        const textContent = node.content?.map((c) => c.text || '').join('') || '';
        const richHTML = getHTMLFromNodeContent(node);

        if (node.type === 'paragraph') {
            blocks.push({ type: 'text', content: richHTML });
        } else if (node.type === 'heading') {
            const level = node.attrs?.level || 1;
            blocks.push({ type: `h${level}`, content: richHTML });
        } else if (node.type === 'bulletList') {
            node.content?.forEach((item) => {
                const itemText = item.content?.[0] ? getHTMLFromNodeContent(item.content[0]) : '';
                blocks.push({ type: 'bullet', content: itemText });
            });
        } else if (node.type === 'orderedList') {
            node.content?.forEach((item) => {
                const itemText = item.content?.[0] ? getHTMLFromNodeContent(item.content[0]) : '';
                blocks.push({ type: 'numbered', content: itemText });
            });
        } else if (node.type === 'horizontalRule') {
            blocks.push({ type: 'divider' });
        } else if (node.type === 'callout') {
            blocks.push({
                type: 'callout',
                icon: node.attrs?.icon || '💡',
                content: node.attrs?.content || '',
            });
        } else if (node.type === 'codeBlock') {
            blocks.push({ type: 'code', content: textContent });
        } else if (node.type === 'sectionBlock') {
            blocks.push({
                type: 'section',
                icon: node.attrs?.icon || '🎓',
                title: node.attrs?.title || '',
                bullets: node.attrs?.bullets || [''],
            });
        } else if (node.type === 'stepBlock') {
            blocks.push({
                type: 'step',
                label: node.attrs?.label || 'Bước 1',
                body: node.attrs?.body || '',
            });
        } else if (node.type === 'quizBlock') {
            blocks.push({
                type: 'quiz',
                question: node.attrs?.question || '',
                options: node.attrs?.options || [],
            });
        }
    });

    return blocks;
};

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
    const [template, setTemplate] = useState(defaultTemplate);
    const [showTemplatePicker, setShowTemplatePicker] = useState(() => {
        if (autoLoadTemplate && !initialContent && !initialTitle) return false;
        return !initialContent && !initialTitle;
    });

    const [title, setTitle] = useState(() => {
        if (autoLoadTemplate && !initialTitle && !initialContent && TEMPLATES[defaultTemplate]) {
            return TEMPLATES[defaultTemplate].title;
        }
        return initialTitle;
    });

    const [description, setDescription] = useState(() => {
        if (autoLoadTemplate && !initialDescription && !initialContent && TEMPLATES[defaultTemplate]) {
            return TEMPLATES[defaultTemplate].description;
        }
        return initialDescription;
    });

    const titleRef = useRef(title);
    const descriptionRef = useRef(description);

    useEffect(() => {
        titleRef.current = title;
    }, [title]);

    useEffect(() => {
        descriptionRef.current = description;
    }, [description]);

    const [slashMenu, setSlashMenu] = useState({
        isOpen: false,
        x: 0,
        y: 0,
        selectedIndex: 0,
        startPos: 0,
    });
    const [slashQuery, setSlashQuery] = useState('');

    const filteredItems = SLASH_ITEMS.filter((item) =>
        item.label.toLowerCase().includes(slashQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(slashQuery.toLowerCase()) ||
        item.key.toLowerCase().includes(slashQuery.toLowerCase()),
    );

    const slashMenuRef = useRef(slashMenu);
    useEffect(() => {
        slashMenuRef.current = slashMenu;
    }, [slashMenu]);

    const filteredItemsRef = useRef(filteredItems);
    useEffect(() => {
        filteredItemsRef.current = filteredItems;
    }, [filteredItems]);

    const handleSelectSlashItemRef = useRef(null);
    handleSelectSlashItemRef.current = (item) => {
        if (!editor || !item) return;

        const startPos = slashMenuRef.current.startPos;
        const endPos = editor.state.selection.from;

        editor.chain()
            .focus()
            .deleteRange({ from: startPos, to: endPos })
            .run();

        if (['callout', 'stepBlock', 'sectionBlock', 'quizBlock'].includes(item.type)) {
            safeInsertContent(item.type);
        } else if (item.type === 'bulletList') {
            editor.chain().focus().toggleBulletList().run();
        } else if (item.type === 'orderedList') {
            editor.chain().focus().toggleOrderedList().run();
        } else if (item.type === 'codeBlock') {
            editor.chain().focus().toggleCodeBlock().run();
        } else if (item.type === 'h1') {
            editor.chain().focus().toggleHeading({ level: 1 }).run();
        } else if (item.type === 'h2') {
            editor.chain().focus().toggleHeading({ level: 2 }).run();
        } else if (item.type === 'h3') {
            editor.chain().focus().toggleHeading({ level: 3 }).run();
        }

        setSlashMenu((prev) => ({ ...prev, isOpen: false }));
    };

    // Parse initial content to TipTap JSON document
    const initialDoc = useRef(null);
    if (!initialDoc.current) {
        let initialBlocks = [];
        if (initialContent) {
            try {
                const parsed = JSON.parse(initialContent);
                if (Array.isArray(parsed)) {
                    initialBlocks = parsed;
                } else {
                    initialBlocks = [{ type: 'text', content: initialContent }];
                }
            } catch (e) {
                initialBlocks = [{ type: 'text', content: initialContent }];
            }
        } else if (autoLoadTemplate && TEMPLATES[defaultTemplate]) {
            initialBlocks = TEMPLATES[defaultTemplate].blocks();
        }
        initialDoc.current = deserializeBlocksToTipTap(initialBlocks);
    }

    // Keep latest onChange ref to avoid stale closures
    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    const safeInsertContent = useCallback(
        (type) => {
            if (!editor) return;
            const { selection } = editor.state;
            if (selection && selection.node) {
                editor.chain().focus().insertContentAt(selection.to, { type }).run();
            } else {
                editor.chain().focus().insertContent({ type }).run();
            }
        },
        [editor],
    );

    const buildPayload = useCallback((newTitle, newDesc, newBlocks) => {
        const cleanBlocks = newBlocks.map((block) => {
            const copy = { ...block };
            delete copy.id;
            return copy;
        });
        return { title: newTitle, description: newDesc, content: JSON.stringify(cleanBlocks) };
    }, []);

    // Sync debounce timer ref
    const syncDebounceRef = useRef(null);

    const syncWithParent = useCallback(
        (newTitle, newDesc, newBlocks) => {
            if (!onChangeRef.current) return;
            if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
            syncDebounceRef.current = setTimeout(() => {
                onChangeRef.current(buildPayload(newTitle, newDesc, newBlocks));
            }, 300);
        },
        [buildPayload],
    );

    const syncWithParentImmediate = useCallback(
        (newTitle, newDesc, newBlocks) => {
            if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
            if (onChangeRef.current) {
                onChangeRef.current(buildPayload(newTitle, newDesc, newBlocks));
            }
        },
        [buildPayload],
    );

    // Build template snapshot for saving confirmation
    const buildTemplateSnapshot = (tmplTitle, tmplDesc, tmplBlocks) => {
        const cleanBlocks = tmplBlocks.map((block) => {
            const copy = { ...block };
            delete copy.id;
            return copy;
        });
        return {
            title: tmplTitle,
            description: tmplDesc,
            content: JSON.stringify(cleanBlocks),
        };
    };

    // Configure TipTap Editor
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link,
            CalloutExtension,
            StepExtension,
            SectionExtension,
            QuizExtension,
        ],
        content: initialDoc.current,
        editorProps: {
            handleKeyDown(view, event) {
                const slashState = slashMenuRef.current;
                const items = filteredItemsRef.current;

                if (event.key === '/') {
                    const startPos = view.state.selection.from;
                    setTimeout(() => {
                        if (view.isDestroyed) return;
                        const currentPos = view.state.selection.from;
                        const coords = view.coordsAtPos(currentPos);
                        setSlashMenu({
                            isOpen: true,
                            x: coords.left,
                            y: coords.bottom + 4,
                            selectedIndex: 0,
                            startPos: startPos,
                        });
                        setSlashQuery('');
                    }, 10);
                    return false;
                }

                if (slashState.isOpen) {
                    if (event.key === 'ArrowDown') {
                        if (items.length > 0) {
                            event.preventDefault();
                            setSlashMenu((prev) => ({
                                ...prev,
                                selectedIndex: (prev.selectedIndex + 1) % items.length,
                            }));
                        }
                        return true;
                    }
                    if (event.key === 'ArrowUp') {
                        if (items.length > 0) {
                            event.preventDefault();
                            setSlashMenu((prev) => ({
                                ...prev,
                                selectedIndex: (prev.selectedIndex - 1 + items.length) % items.length,
                            }));
                        }
                        return true;
                    }
                    if (event.key === 'Enter') {
                        if (items.length > 0) {
                            event.preventDefault();
                            if (handleSelectSlashItemRef.current) {
                                handleSelectSlashItemRef.current(items[slashState.selectedIndex]);
                            }
                        }
                        return true;
                    }
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        setSlashMenu((prev) => ({ ...prev, isOpen: false }));
                        return true;
                    }
                }
                return false;
            },
        },
        onUpdate({ editor }) {
            const doc = editor.getJSON();
            const blocks = serializeTipTapToBlocks(doc, editor.schema);
            syncWithParent(titleRef.current, descriptionRef.current, blocks);

            // Handle query update if slash menu is open
            const slashState = slashMenuRef.current;
            if (slashState.isOpen) {
                const currentPos = editor.state.selection.from;
                if (currentPos < slashState.startPos) {
                    setSlashMenu((prev) => ({ ...prev, isOpen: false }));
                } else {
                    const text = editor.state.doc.textBetween(slashState.startPos, currentPos);
                    if (text.startsWith('/')) {
                        setSlashQuery(text.slice(1));
                    } else {
                        setSlashMenu((prev) => ({ ...prev, isOpen: false }));
                    }
                }
            }
        },
        onBlur() {
            setTimeout(() => {
                setSlashMenu((prev) => ({ ...prev, isOpen: false }));
            }, 200);
        },
    });

    // Auto-load template on initial mount
    useEffect(() => {
        if (autoLoadTemplate && !initialContent && !initialTitle && TEMPLATES[defaultTemplate]) {
            const tmpl = TEMPLATES[defaultTemplate];
            const tBlocks = tmpl.blocks();
            
            if (onTitleChange) onTitleChange(tmpl.title);
            if (onDescriptionChange) onDescriptionChange(tmpl.description);
            
            syncWithParent(tmpl.title, tmpl.description, tBlocks);

            if (onTemplateLoad) {
                onTemplateLoad(buildTemplateSnapshot(tmpl.title, tmpl.description, tBlocks));
            }
        }
    }, []);

    const handleTitleChange = (val) => {
        titleRef.current = val;
        setTitle(val);
        if (onTitleChange) onTitleChange(val);
        const currentBlocks = editor ? serializeTipTapToBlocks(editor.getJSON(), editor.schema) : [];
        syncWithParentImmediate(val, descriptionRef.current, currentBlocks);
    };

    const handleDescriptionChange = (val) => {
        descriptionRef.current = val;
        setDescription(val);
        if (onDescriptionChange) onDescriptionChange(val);
        const currentBlocks = editor ? serializeTipTapToBlocks(editor.getJSON(), editor.schema) : [];
        syncWithParentImmediate(titleRef.current, val, currentBlocks);
    };

    const handleLoadTemplate = (key) => {
        if (!editor || !TEMPLATES[key]) return;
        const tmpl = TEMPLATES[key];

        titleRef.current = tmpl.title;
        descriptionRef.current = tmpl.description;

        setTemplate(key);
        setTitle(tmpl.title);
        setDescription(tmpl.description);

        if (onTitleChange) onTitleChange(tmpl.title);
        if (onDescriptionChange) onDescriptionChange(tmpl.description);

        const tmplBlocks = tmpl.blocks();
        const tipTapDoc = deserializeBlocksToTipTap(tmplBlocks);

        editor.commands.setContent(tipTapDoc);
        setShowTemplatePicker(false);

        syncWithParentImmediate(tmpl.title, tmpl.description, tmplBlocks);

        if (onTemplateLoad) {
            onTemplateLoad(buildTemplateSnapshot(tmpl.title, tmpl.description, tmplBlocks));
        }
    };

    const handleResetToBlank = () => {
        if (!editor) return;
        titleRef.current = '';
        descriptionRef.current = '';
        setTitle('');
        setDescription('');
        if (onTitleChange) onTitleChange('');
        if (onDescriptionChange) onDescriptionChange('');

        editor.commands.setContent({
            type: 'doc',
            content: [{ type: 'paragraph' }],
        });
        setShowTemplatePicker(false);
        syncWithParentImmediate('', '', []);
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

    if (!editor) return null;

    return (
        <div className="block-editor-container">

            {/* Slash Command Menu */}
            {slashMenu.isOpen && filteredItems.length > 0 && (
                <div
                    className="slash-command-menu"
                    style={{
                        position: 'fixed',
                        left: slashMenu.x,
                        top: slashMenu.y,
                        zIndex: 9999,
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                >
                    {filteredItems.map((item, idx) => (
                        <div
                            key={item.key}
                            className={`slash-menu-item ${idx === slashMenu.selectedIndex ? 'active' : ''}`}
                            onClick={() => {
                                if (handleSelectSlashItemRef.current) {
                                    handleSelectSlashItemRef.current(item);
                                }
                            }}
                        >
                            <span className="slash-item-icon">{item.icon}</span>
                            <div className="slash-item-meta">
                                <span className="slash-item-label">{item.label}</span>
                                <span className="slash-item-desc">{item.desc}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Top Toolbar */}
            <div className="editor-toolbar-new">
                {/* Row 1: Text Formatting & Template */}
                <div className="toolbar-row formatting-row">
                    <div className="toolbar-left-group" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                        <div className="toolbar-group">
                            <button
                                type="button"
                                className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`}
                                onClick={() => editor.chain().focus().toggleBold().run()}
                                title="Chữ đậm"
                            >
                                <BoldOutlined />
                            </button>
                            <button
                                type="button"
                                className={`toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`}
                                onClick={() => editor.chain().focus().toggleItalic().run()}
                                title="Chữ nghiêng"
                            >
                                <ItalicOutlined />
                            </button>
                            <button
                                type="button"
                                className={`toolbar-btn ${editor.isActive('underline') ? 'active' : ''}`}
                                onClick={() => editor.chain().focus().toggleUnderline().run()}
                                title="Chữ gạch chân"
                            >
                                <UnderlineOutlined />
                            </button>
                            <button
                                type="button"
                                className={`toolbar-btn ${editor.isActive('link') ? 'active' : ''}`}
                                onClick={() => {
                                    const previousUrl = editor.getAttributes('link').href;
                                    const url = window.prompt('Nhập đường dẫn liên kết:', previousUrl);
                                    if (url === null) return;
                                    if (url === '') {
                                        editor.chain().focus().unsetLink().run();
                                    } else {
                                        editor.chain().focus().setLink({ href: url }).run();
                                    }
                                }}
                                title="Chèn liên kết"
                            >
                                <LinkOutlined />
                            </button>
                        </div>

                        <span className="toolbar-divider" />

                        <div className="toolbar-group">
                            <button
                                type="button"
                                className={`toolbar-btn ${editor.isActive('paragraph') ? 'active' : ''}`}
                                onClick={() => editor.chain().focus().setParagraph().run()}
                                title="Đoạn văn"
                            >
                                P
                            </button>
                            <button
                                type="button"
                                className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
                                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                                title="Tiêu đề 1"
                            >
                                H1
                            </button>
                            <button
                                type="button"
                                className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
                                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                                title="Tiêu đề 2"
                            >
                                H2
                            </button>
                            <button
                                type="button"
                                className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
                                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                                title="Tiêu đề 3"
                            >
                                H3
                            </button>
                        </div>

                        <span className="toolbar-divider" />

                        <div className="toolbar-group">
                            <button
                                type="button"
                                className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
                                onClick={() => editor.chain().focus().toggleBulletList().run()}
                                title="Danh sách gạch đầu dòng"
                            >
                                <UnorderedListOutlined />
                            </button>
                            <button
                                type="button"
                                className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
                                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                title="Danh sách đánh số"
                            >
                                <OrderedListOutlined />
                            </button>
                            <button
                                type="button"
                                className={`toolbar-btn ${editor.isActive('codeBlock') ? 'active' : ''}`}
                                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                                title="Khối Code"
                            >
                                <CodeOutlined />
                            </button>
                        </div>
                    </div>

                    <div className="template-picker-btn-wrap">
                        <Button type="default" onClick={() => setShowTemplatePicker(true)} className="template-select-btn">
                            <FileTextOutlined /> Mẫu: <strong>{TEMPLATES[template]?.label || 'Không có'}</strong> <DownOutlined style={{ fontSize: 10, marginLeft: 2 }} />
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
                                onClick={() => safeInsertContent('callout')}
                                title="Chèn Hộp Lưu ý"
                            >
                                <InfoCircleOutlined /> Lưu ý
                            </button>
                            <button
                                type="button"
                                className="insert-btn step-ib"
                                onClick={() => safeInsertContent('stepBlock')}
                                title="Chèn Bước Hướng dẫn"
                            >
                                <BookOutlined /> Bước
                            </button>
                            <button
                                type="button"
                                className="insert-btn section-ib"
                                onClick={() => safeInsertContent('sectionBlock')}
                                title="Chèn Section"
                            >
                                <PlusOutlined /> Mục lớn
                            </button>
                            <button
                                type="button"
                                className="insert-btn quiz-ib"
                                onClick={() => safeInsertContent('quizBlock')}
                                title="Chèn Trắc nghiệm"
                            >
                                <QuestionCircleOutlined /> Trắc nghiệm
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Editor Canvas */}
            <div className="editor-wrap">
                <div className="editor-doc">
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

                    <EditorContent editor={editor} className="tiptap-editor-canvas" />
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
                <div className="template-picker-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '12px 0' }}>
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
        </div>
    );
}
