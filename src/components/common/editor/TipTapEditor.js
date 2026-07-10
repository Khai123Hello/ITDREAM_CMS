import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import UnderlineExtension from '@tiptap/extension-underline';
import ImageExtension from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { Modal, Input } from 'antd';
import {
    BoldOutlined,
    ItalicOutlined,
    UnderlineOutlined,
    StrikethroughOutlined,
    LinkOutlined,
    UnorderedListOutlined,
    OrderedListOutlined,
    PictureOutlined,
    UndoOutlined,
    RedoOutlined,
    AlignLeftOutlined,
    AlignCenterOutlined,
    AlignRightOutlined,
    MenuOutlined,
} from '@ant-design/icons';
import './TipTapEditor.scss';

const parseContent = (val) => {
    if (!val) return '';
    const trimmed = val.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
            return JSON.parse(trimmed);
        } catch (e) {
            return trimmed;
        }
    }
    return trimmed;
};

export default function TipTapEditor({ value = '', onChange, disabled = false, placeholder = 'Nhập nội dung...' }) {
    const [linkModalVisible, setLinkModalVisible] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [imageUrl, setImageUrl] = useState('');

    const lastSentValueRef = useRef(value);

    const editor = useEditor({
        extensions: [
            StarterKit,
            UnderlineExtension,
            LinkExtension.configure({
                openOnClick: false,
                HTMLAttributes: {
                    target: '_blank',
                    rel: 'noopener noreferrer nofollow',
                },
            }),
            ImageExtension,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
        ],
        content: parseContent(value),
        editable: !disabled,
        onUpdate({ editor: ed }) {
            const jsonStr = JSON.stringify(ed.getJSON());
            lastSentValueRef.current = jsonStr;
            if (onChange) {
                onChange(jsonStr);
            }
        },
    });

    // Handle external value changes (like form reset or initial load)
    useEffect(() => {
        if (editor && value !== undefined && value !== lastSentValueRef.current) {
            editor.commands.setContent(parseContent(value));
            lastSentValueRef.current = value;
        }
    }, [value, editor]);

    // Handle disabled prop change
    useEffect(() => {
        if (editor) {
            editor.setEditable(!disabled);
        }
    }, [editor, disabled]);

    if (!editor) {
        return null;
    }

    const handleLinkClick = () => {
        setLinkUrl(editor.getAttributes('link').href || '');
        setLinkModalVisible(true);
    };

    const handleImageClick = () => {
        setImageUrl('');
        setImageModalVisible(true);
    };

    const addLink = () => {
        if (!linkUrl) {
            editor.chain().focus().unsetLink().run();
        } else {
            editor.chain().focus().setLink({ href: linkUrl }).run();
        }
        setLinkModalVisible(false);
    };

    const addImage = () => {
        if (imageUrl) {
            editor.chain().focus().setImage({ src: imageUrl }).run();
        }
        setImageModalVisible(false);
    };

    return (
        <div className={`tiptap-editor-container ${disabled ? 'tiptap-disabled' : ''}`}>
            {!disabled && (
                <div className="tiptap-toolbar">
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
                            className={`toolbar-btn ${editor.isActive('strike') ? 'active' : ''}`}
                            onClick={() => editor.chain().focus().toggleStrike().run()}
                            title="Gạch ngang"
                        >
                            <StrikethroughOutlined />
                        </button>
                    </div>

                    <span className="toolbar-divider" />

                    <div className="toolbar-group">
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
                            className={`toolbar-btn ${editor.isActive({ textAlign: 'left' }) ? 'active' : ''}`}
                            onClick={() => editor.chain().focus().setTextAlign('left').run()}
                            title="Căn lề trái"
                        >
                            <AlignLeftOutlined />
                        </button>
                        <button
                            type="button"
                            className={`toolbar-btn ${editor.isActive({ textAlign: 'center' }) ? 'active' : ''}`}
                            onClick={() => editor.chain().focus().setTextAlign('center').run()}
                            title="Căn giữa"
                        >
                            <AlignCenterOutlined />
                        </button>
                        <button
                            type="button"
                            className={`toolbar-btn ${editor.isActive({ textAlign: 'right' }) ? 'active' : ''}`}
                            onClick={() => editor.chain().focus().setTextAlign('right').run()}
                            title="Căn lề phải"
                        >
                            <AlignRightOutlined />
                        </button>
                        <button
                            type="button"
                            className={`toolbar-btn ${editor.isActive({ textAlign: 'justify' }) ? 'active' : ''}`}
                            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                            title="Căn đều"
                        >
                            <MenuOutlined />
                        </button>
                    </div>

                    <span className="toolbar-divider" />

                    <div className="toolbar-group">
                        <button
                            type="button"
                            className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            title="Danh sách đầu dòng"
                        >
                            <UnorderedListOutlined />
                        </button>
                        <button
                            type="button"
                            className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            title="Danh sách số"
                        >
                            <OrderedListOutlined />
                        </button>
                    </div>

                    <span className="toolbar-divider" />

                    <div className="toolbar-group">
                        <button
                            type="button"
                            className={`toolbar-btn ${editor.isActive('link') ? 'active' : ''}`}
                            onClick={handleLinkClick}
                            title="Chèn liên kết"
                        >
                            <LinkOutlined />
                        </button>
                        <button type="button" className="toolbar-btn" onClick={handleImageClick} title="Chèn ảnh">
                            <PictureOutlined />
                        </button>
                    </div>

                    <span className="toolbar-divider" />

                    <div className="toolbar-group" style={{ marginLeft: 'auto' }}>
                        <button
                            type="button"
                            className="toolbar-btn"
                            onClick={() => editor.chain().focus().undo().run()}
                            disabled={!editor.can().undo()}
                            title="Hoàn tác"
                        >
                            <UndoOutlined />
                        </button>
                        <button
                            type="button"
                            className="toolbar-btn"
                            onClick={() => editor.chain().focus().redo().run()}
                            disabled={!editor.can().redo()}
                            title="Làm lại"
                        >
                            <RedoOutlined />
                        </button>
                    </div>
                </div>
            )}

            <div className="tiptap-content-wrapper">
                <EditorContent editor={editor} placeholder={placeholder} />
            </div>

            {/* Link Modal */}
            <Modal
                title="Chèn liên kết"
                open={linkModalVisible}
                onCancel={() => setLinkModalVisible(false)}
                onOk={addLink}
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
                onOk={addImage}
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
