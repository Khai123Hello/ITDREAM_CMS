import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Dropdown, Button, Checkbox } from 'antd';
import './BlockEditor.scss';

// Unique ID helper
const uid = () => Math.random().toString(36).slice(2, 9);

// Block metadata definitions
const BLOCK_TYPES = {
    text: { label: 'Văn bản', desc: 'Đoạn văn thường', icon: '¶', group: 'Cơ bản' },
    h1: { label: 'Tiêu đề 1', desc: 'Tiêu đề lớn (serif)', icon: 'H₁', group: 'Cơ bản' },
    h2: { label: 'Tiêu đề 2', desc: 'Tiêu đề vừa', icon: 'H₂', group: 'Cơ bản' },
    h3: { label: 'Tiêu đề 3', desc: 'Tiêu đề nhỏ / nhãn', icon: 'H₃', group: 'Cơ bản' },
    bullet: { label: 'Danh sách •', desc: 'Bullet list', icon: '•', group: 'Cơ bản', aliases: ['list', 'ul'] },
    numbered: { label: 'Danh sách số', desc: 'Numbered list', icon: '1.', group: 'Cơ bản', aliases: ['num', 'ol'] },
    divider: { label: 'Đường kẻ ngang', desc: 'Phân cách phần', icon: '—', group: 'Cơ bản' },
    callout: { label: 'Callout', desc: 'Hộp nổi bật với icon', icon: '💡', group: 'Cơ bản' },
    code: { label: 'Code', desc: 'Khối code mono', icon: '</>', group: 'Cơ bản' },
    meta: { label: 'Meta (giờ · cấp)', desc: 'Dòng thông tin ngắn màu xanh', icon: '🏷', group: 'Nâng cao' },
    section: { label: 'Section', desc: 'Khung section với icon & bullets', icon: '☰', group: 'Nâng cao' },
    step: { label: 'Step', desc: 'Bước hướng dẫn label: body', icon: '→', group: 'Nâng cao' },
    quiz: { label: 'Trắc nghiệm', desc: 'Câu hỏi trắc nghiệm một lựa chọn', icon: '❓', group: 'Nâng cao' },
};

// Emoji set definitions
const EMOJI_SETS = [
    { l: 'Học & Kiến thức', e: ['🎓', '📚', '💡', '🔬', '🧪', '🧩', '📖', '✏️', '🖊️', '📝'] },
    { l: 'Thực hành', e: ['⚙️', '🛠️', '🔧', '🔨', '🚀', '✅', '🎯', '💻', '📱', '🖥️'] },
    { l: 'Kết quả', e: ['🏆', '⭐', '🌟', '🎉', '💎', '🥇', '🔑', '🎁', '📦', '🚩'] },
    { l: 'Thông tin', e: ['📋', '📊', '📈', '📉', '🗂️', '📁', '📌', '📎', '🗒️', '📰'] },
];

const makeBlock = (type, data = {}) => {
    const defaults = {
        text: { content: '' },
        h1: { content: '' },
        h2: { content: '' },
        h3: { content: '' },
        bullet: { content: '' },
        numbered: { content: '' },
        divider: {},
        callout: { icon: '💡', content: '' },
        code: { content: '' },
        meta: { duration: '1–2 hours', level: 'Introductory' },
        section: { icon: '🎓', title: '', bullets: [''] },
        step: { label: 'Step One', body: '' },
        quiz: {
            question: '',
            options: [
                { option: '', answer: false },
                { option: '', answer: false },
            ],
        },
    };
    return { id: uid(), type, ...defaults[type], ...data };
};

const TEMPLATES = {
    task: {
        label: 'Giới thiệu',
        title: 'Nhập tiêu đề giới thiệu ở đây (ví dụ: Giới thiệu về lập trình React)',
        description:
            'Nhập mô tả ngắn gọn về bài học ở đây (ví dụ: Bài viết giúp học viên làm quen với thư viện ReactJS cơ bản)',
        blocks: () => [
            makeBlock('section', {
                icon: '🎓',
                title: 'Kiến thức sẽ đạt được (ví dụ: Mục tiêu bài học)',
                bullets: [
                    'Nhập nội dung kiến thức thứ nhất (ví dụ: Cách khởi tạo component)',
                    'Nhập nội dung kiến thức thứ hai (ví dụ: Cách truyền props và quản lý state)',
                ],
            }),
            makeBlock('section', {
                icon: '🛠️',
                title: 'Các bước thực hành chính (ví dụ: Nhiệm vụ cần làm)',
                bullets: [
                    'Nhập hành động thực hành thứ nhất (ví dụ: Cài đặt môi trường Node.js)',
                    'Nhập hành động thực hành thứ hai (ví dụ: Chạy kiểm thử ứng dụng)',
                ],
            }),
        ],
    },
    guide: {
        label: 'Hướng dẫn',
        title: 'Nhập tiêu đề hướng dẫn (ví dụ: Hướng dẫn các bước cấu hình)',
        description:
            'Nhập hướng dẫn tổng quan (ví dụ: Thực hiện tuần tự các bước dưới đây để hoàn thành cấu hình ứng dụng)',
        blocks: () => [
            makeBlock('step', {
                label: 'Bước 1',
                body: 'Mô tả bước thực hiện thứ nhất ở đây (ví dụ: Tạo file mới có tên App.js trong thư mục src)',
            }),
            makeBlock('step', {
                label: 'Bước 2',
                body: 'Mô tả bước thực hiện thứ hai ở đây (ví dụ: Chạy lệnh `npm install` để tải thư viện)',
            }),
            makeBlock('step', {
                label: 'Bước 3',
                body: 'Mô tả bước thực hiện thứ ba ở đây (ví dụ: Viết code cho Component chính và xuất ra ngoài)',
            }),
            makeBlock('step', {
                label: 'Bước 4',
                body: 'Mô tả bước thực hiện thứ tư ở đây (ví dụ: Nhấp vào nút Lưu để lưu lại cấu hình)',
            }),
            makeBlock('step', {
                label: 'Bước 5',
                body: 'Mô tả bước thực hiện thứ năm ở đây (ví dụ: Mở trình duyệt và truy cập vào localhost:3000 để kiểm tra kết quả)',
            }),
            makeBlock('divider'),
            makeBlock('text', {
                content:
                    'Nhập tóm tắt hoặc lưu ý cuối cùng ở đây (ví dụ: Cuối cùng, hãy nhấn nút nộp bài ở bước tiếp theo!)',
            }),
        ],
    },
    reading: {
        label: 'Ví dụ',
        title: 'Nhập tiêu đề tài liệu tham khảo hoặc ví dụ (ví dụ: Ví dụ về cấu trúc thư mục dự án)',
        description:
            'Mô tả tổng quan về ví dụ hoặc tài liệu ở đây (ví dụ: Đọc kỹ phần thông tin nền tảng này trước khi bắt đầu nhiệm vụ)',
        blocks: () => [
            makeBlock('text', {
                content:
                    'Nhập đoạn văn bản giới thiệu/bối cảnh ở đây (ví dụ: React là một thư viện Javascript phổ biến để xây dựng giao diện người dùng đơn trang)',
            }),
            makeBlock('text', {
                content: 'Nhập hướng dẫn các bước tiếp theo (ví dụ: Ví dụ này bao gồm ba phần chính cần chú ý:)',
            }),
            makeBlock('numbered', { content: 'Nhập mục thứ nhất (ví dụ: Khởi tạo dự án bằng Vite)' }),
            makeBlock('numbered', { content: 'Nhập mục thứ hai (ví dụ: Tạo component Header và Footer)' }),
            makeBlock('numbered', { content: 'Nhập mục thứ ba (ví dụ: Chạy ứng dụng trên cổng 5173)' }),
            makeBlock('callout', {
                icon: '💡',
                content:
                    'Nhập lưu ý hoặc thông tin đặc biệt nhấn mạnh ở đây (ví dụ: Hãy đảm bảo rằng bạn đã cài đặt phiên bản Node.js LTS trở lên)',
            }),
        ],
    },
    quiz: {
        label: 'Trắc nghiệm',
        title: 'Kiểm tra kiến thức (ví dụ: Trắc nghiệm nhanh)',
        description: 'Trả lời các câu hỏi trắc nghiệm dưới đây để hoàn thành bài học.',
        blocks: () => [
            makeBlock('text', { content: 'Hãy chọn đáp án đúng nhất cho từng câu hỏi.' }),
            makeBlock('quiz', {
                question: 'Thủ đô của Việt Nam là gì?',
                options: [
                    { option: 'Hà Nội', answer: true },
                    { option: 'TP. Hồ Chí Minh', answer: false },
                    { option: 'Đà Nẵng', answer: false },
                ],
            }),
        ],
    },
};

// Auto-resize textarea — replaces contentEditable for reliable input
const AutoResizeTextarea = ({ className, value, onChange, onKeyDown, placeholder, dataId, dataBi, rows }) => {
    const ref = useRef();

    useEffect(() => {
        const el = ref.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = el.scrollHeight + 'px';
        }
    }, [value]);

    return (
        <textarea
            ref={ref}
            className={className}
            data-id={dataId}
            data-bi={dataBi}
            placeholder={placeholder}
            value={value || ''}
            rows={rows || 1}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
        />
    );
};

export default function BlockEditor({
    initialTitle = '',
    initialDescription = '',
    initialContent = '',
    onChange,
    onTitleChange, // lightweight: called immediately on title keystroke (no JSON.stringify)
    onDescriptionChange, // lightweight: called immediately on description keystroke (no JSON.stringify)
    onTemplateLoad,
    onTemplateChange,
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

    // Initial state parser
    const [blocks, setBlocks] = useState(() => {
        if (!initialContent) {
            if (autoLoadTemplate && TEMPLATES[defaultTemplate]) {
                return TEMPLATES[defaultTemplate].blocks().map((b) => ({ id: uid(), ...b }));
            }
            return [];
        }
        try {
            const parsed = JSON.parse(initialContent);
            if (Array.isArray(parsed)) {
                return parsed.map((b) => ({ id: uid(), ...b }));
            }
            return [makeBlock('text', { content: initialContent })];
        } catch (e) {
            return [makeBlock('text', { content: initialContent })];
        }
    });

    // Overlays state
    const [slashMenu, setSlashMenu] = useState(null); // { blockId, query, left, top, activeIndex }
    const [emojiPicker, setEmojiPicker] = useState(null); // { blockId, left, top }

    // Drag-and-drop state
    const [draggingId, setDraggingId] = useState(null);
    const [dragOverInfo, setDragOverInfo] = useState(null); // { id, position: 'top'|'bottom' }

    // Debounce timer ref for syncWithParent (text input changes)
    const syncDebounceRef = useRef(null);
    // Keep latest onChange ref to avoid stale closure
    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    // Auto-resize textareas
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

    // Sync initial load if autoLoadTemplate is active
    useEffect(() => {
        if (autoLoadTemplate && !initialContent && !initialTitle && TEMPLATES[defaultTemplate]) {
            const tmpl = TEMPLATES[defaultTemplate];
            const tBlocks = tmpl.blocks();
            syncWithParent(tmpl.title, tmpl.description, tBlocks);

            // Thông báo snapshot lên cha ngay khi auto-load template
            if (onTemplateLoad) {
                onTemplateLoad(buildTemplateSnapshot(tmpl.title, tmpl.description, tBlocks));
            }
        }
    }, []);

    // Close overlays on outside click
    useEffect(() => {
        const handleGlobalClick = (e) => {
            if (slashMenu && !e.target.closest('.slash-menu')) {
                setSlashMenu(null);
            }
            if (
                emojiPicker &&
                !e.target.closest('.emoji-picker') &&
                !e.target.closest('.b-section-icon') &&
                !e.target.closest('.b-callout-icon')
            ) {
                setEmojiPicker(null);
            }
        };
        document.addEventListener('click', handleGlobalClick);
        return () => document.removeEventListener('click', handleGlobalClick);
    }, [slashMenu, emojiPicker]);

    // Focus block helper
    const focusBlock = (id, positionAtEnd = false, focusLast = false) => {
        setTimeout(() => {
            const elements = document.querySelectorAll(`[data-id="${id}"]`);
            if (elements.length > 0) {
                const el = focusLast ? elements[elements.length - 1] : elements[0];
                if (el) {
                    el.focus();
                    if (positionAtEnd && el.setSelectionRange) {
                        const len = (el.value || '').length;
                        el.setSelectionRange(len, len);
                    }
                }
            }
        }, 30);
    };

    // Build clean payload (strips internal 'id' field from blocks)
    const buildPayload = useCallback((newTitle, newDesc, newBlocks) => {
        const cleanBlocks = newBlocks.map((block) => {
            const rest = { ...block };
            delete rest.id;
            return rest;
        });
        return { title: newTitle, description: newDesc, content: JSON.stringify(cleanBlocks) };
    }, []);

    // Debounced sync — used for TEXT INPUT (typing) to avoid re-render on every keystroke
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

    // Immediate sync — used for STRUCTURAL changes (add/delete/move/template)
    const syncWithParentImmediate = useCallback(
        (newTitle, newDesc, newBlocks) => {
            if (syncDebounceRef.current) clearTimeout(syncDebounceRef.current);
            if (onChangeRef.current) {
                onChangeRef.current(buildPayload(newTitle, newDesc, newBlocks));
            }
        },
        [buildPayload],
    );

    // Tạo template snapshot (bỏ id block để so sánh nội dung thuần)
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

    // Title & description are cheap strings — sync immediately so form validation always sees current value
    const handleTitleChange = (val) => {
        setTitle(val);
        if (onTitleChange) {
            // Fast path: only update title in parent, no JSON.stringify of blocks
            onTitleChange(val);
        } else {
            syncWithParentImmediate(val, description, blocks);
        }
    };

    const handleDescriptionChange = (val) => {
        setDescription(val);
        if (onDescriptionChange) {
            // Fast path: only update description in parent, no JSON.stringify of blocks
            onDescriptionChange(val);
        } else {
            syncWithParentImmediate(title, val, blocks);
        }
    };

    // Debounced — for text input inside blocks
    const handleBlocksChange = (newBlocks) => {
        setBlocks(newBlocks);
        syncWithParent(title, description, newBlocks);
    };

    // Immediate — for structural changes (add, delete, move, type change)
    const handleBlocksChangeImmediate = (newBlocks) => {
        setBlocks(newBlocks);
        syncWithParentImmediate(title, description, newBlocks);
    };

    const insertBlockAfter = (targetId, newBlock) => {
        const idx = blocks.findIndex((x) => x.id === targetId);
        const newBlocks = [...blocks];
        newBlocks.splice(idx + 1, 0, newBlock);
        handleBlocksChangeImmediate(newBlocks);
        focusBlock(newBlock.id);
    };

    const addBlockAtEnd = () => {
        const newBlock = makeBlock('text');
        const newBlocks = [...blocks, newBlock];
        handleBlocksChangeImmediate(newBlocks);
        focusBlock(newBlock.id);
    };

    // Keyboard navigation inside blocks
    const handleBlockKeyDown = (e, id, index, bi = null) => {
        const b = blocks[index];

        if (b.type === 'meta') {
            const isDur = e.target.classList.contains('b-meta-dur');
            const isLevel = e.target.classList.contains('b-meta-level');
            const val = e.target.value || '';

            if (e.key === 'ArrowUp') {
                if (isDur) {
                    if (index > 0) {
                        e.preventDefault();
                        focusBlock(blocks[index - 1].id, true, true);
                    }
                } else if (isLevel) {
                    e.preventDefault();
                    focusBlock(id, true); // focus duration
                }
                return;
            }

            if (e.key === 'ArrowDown') {
                if (isDur) {
                    e.preventDefault();
                    focusBlock(id, false, true); // focus level
                } else if (isLevel) {
                    if (index < blocks.length - 1) {
                        e.preventDefault();
                        focusBlock(blocks[index + 1].id);
                    }
                }
                return;
            }

            if (e.key === 'Enter') {
                e.preventDefault();
                if (isDur) {
                    focusBlock(id, false, true); // focus level
                } else if (isLevel) {
                    insertBlockAfter(id, makeBlock('text'));
                }
                return;
            }

            if (e.key === 'Backspace') {
                if (val === '') {
                    e.preventDefault();
                    if (isDur) {
                        if (blocks.length > 1) {
                            const newBlocks = [...blocks];
                            newBlocks.splice(index, 1);
                            handleBlocksChangeImmediate(newBlocks);
                            const focusId = index > 0 ? blocks[index - 1].id : blocks[1]?.id;
                            if (focusId) {
                                focusBlock(focusId, index > 0, index > 0);
                            }
                        } else {
                            const newBlock = makeBlock('text');
                            handleBlocksChangeImmediate([newBlock]);
                            focusBlock(newBlock.id);
                        }
                    } else if (isLevel) {
                        focusBlock(id, true); // focus duration
                    }
                    return;
                }
            }
            return;
        }

        if (b.type === 'section') {
            const isTitle = e.target.classList.contains('b-section-title');
            const isBullet = e.target.classList.contains('b-section-bullet-text');
            const val = e.target.value || '';

            if (isTitle) {
                if (e.key === 'ArrowUp') {
                    if (index > 0) {
                        e.preventDefault();
                        focusBlock(blocks[index - 1].id, true, true);
                    }
                    return;
                }
                if (e.key === 'ArrowDown' || e.key === 'Enter') {
                    e.preventDefault();
                    const el = document.querySelector(`[data-id="${id}"][data-bi="0"]`);
                    if (el) el.focus();
                    return;
                }
                if (e.key === 'Backspace') {
                    if (val === '') {
                        e.preventDefault();
                        if (blocks.length > 1) {
                            const newBlocks = [...blocks];
                            newBlocks.splice(index, 1);
                            handleBlocksChangeImmediate(newBlocks);
                            const focusId = index > 0 ? blocks[index - 1].id : blocks[1]?.id;
                            if (focusId) {
                                focusBlock(focusId, index > 0, index > 0);
                            }
                        } else {
                            const newBlock = makeBlock('text');
                            handleBlocksChangeImmediate([newBlock]);
                            focusBlock(newBlock.id);
                        }
                        return;
                    }
                }
            }

            if (isBullet && bi !== null) {
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (bi === 0) {
                        const el = document.querySelector(`.b-section-title[data-id="${id}"]`);
                        if (el) el.focus();
                    } else {
                        const el = document.querySelector(`[data-id="${id}"][data-bi="${bi - 1}"]`);
                        if (el) el.focus();
                    }
                    return;
                }
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (bi === b.bullets.length - 1) {
                        if (index < blocks.length - 1) {
                            focusBlock(blocks[index + 1].id);
                        }
                    } else {
                        const el = document.querySelector(`[data-id="${id}"][data-bi="${bi + 1}"]`);
                        if (el) el.focus();
                    }
                    return;
                }
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const newBullets = [...b.bullets];
                    newBullets.splice(bi + 1, 0, '');
                    b.bullets = newBullets;
                    handleBlocksChangeImmediate([...blocks]);
                    setTimeout(() => {
                        const el = document.querySelector(`[data-id="${id}"][data-bi="${bi + 1}"]`);
                        if (el) el.focus();
                    }, 30);
                    return;
                }
                if (e.key === 'Backspace') {
                    if (val === '') {
                        e.preventDefault();
                        if (b.bullets.length > 1) {
                            const newBullets = [...b.bullets];
                            newBullets.splice(bi, 1);
                            b.bullets = newBullets;
                            handleBlocksChangeImmediate([...blocks]);
                            setTimeout(() => {
                                const prevIdx = Math.max(0, bi - 1);
                                const el = document.querySelector(`[data-id="${id}"][data-bi="${prevIdx}"]`);
                                if (el) el.focus();
                            }, 30);
                        } else {
                            const el = document.querySelector(`.b-section-title[data-id="${id}"]`);
                            if (el) el.focus();
                        }
                        return;
                    }
                }
            }
            return;
        }

        if (b.type === 'step') {
            const isLabel = e.target.classList.contains('b-step-label');
            const isBody = e.target.classList.contains('b-step-body');
            const val = e.target.value || '';

            if (isLabel) {
                if (e.key === 'ArrowUp') {
                    if (index > 0) {
                        e.preventDefault();
                        focusBlock(blocks[index - 1].id, true, true);
                    }
                    return;
                }
                if (e.key === 'ArrowDown' || e.key === 'Enter') {
                    e.preventDefault();
                    const el = document.querySelector(`.b-step-body[data-id="${id}"]`);
                    if (el) el.focus();
                    return;
                }
                if (e.key === 'Backspace') {
                    if (val === '') {
                        e.preventDefault();
                        if (blocks.length > 1) {
                            const newBlocks = [...blocks];
                            newBlocks.splice(index, 1);
                            handleBlocksChangeImmediate(newBlocks);
                            const focusId = index > 0 ? blocks[index - 1].id : blocks[1]?.id;
                            if (focusId) {
                                focusBlock(focusId, index > 0, index > 0);
                            }
                        } else {
                            const newBlock = makeBlock('text');
                            handleBlocksChangeImmediate([newBlock]);
                            focusBlock(newBlock.id);
                        }
                        return;
                    }
                }
            }

            if (isBody) {
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const el = document.querySelector(`.b-step-label[data-id="${id}"]`);
                    if (el) el.focus();
                    return;
                }
                if (e.key === 'ArrowDown') {
                    if (index < blocks.length - 1) {
                        e.preventDefault();
                        focusBlock(blocks[index + 1].id);
                    }
                    return;
                }
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    insertBlockAfter(id, makeBlock('text'));
                    return;
                }
                if (e.key === 'Backspace') {
                    if (val === '') {
                        e.preventDefault();
                        const el = document.querySelector(`.b-step-label[data-id="${id}"]`);
                        if (el) {
                            el.focus();
                            const len = el.value.length;
                            el.setSelectionRange(len, len);
                        }
                        return;
                    }
                }
            }
            return;
        }

        if (b.type === 'quiz') {
            const isQuestion = e.target.classList.contains('b-quiz-question');
            const isOption = e.target.classList.contains('b-quiz-option-text');
            const val = e.target.value || '';

            if (isQuestion) {
                if (e.key === 'ArrowUp') {
                    if (index > 0) {
                        e.preventDefault();
                        focusBlock(blocks[index - 1].id, true, true);
                    }
                    return;
                }
                if (e.key === 'ArrowDown' || e.key === 'Enter') {
                    e.preventDefault();
                    const el = document.querySelector(`[data-id="${id}"][data-bi="0"]`);
                    if (el) el.focus();
                    return;
                }
                if (e.key === 'Backspace') {
                    if (val === '') {
                        e.preventDefault();
                        if (blocks.length > 1) {
                            const newBlocks = [...blocks];
                            newBlocks.splice(index, 1);
                            handleBlocksChangeImmediate(newBlocks);
                            const focusId = index > 0 ? blocks[index - 1].id : blocks[1]?.id;
                            if (focusId) {
                                focusBlock(focusId, index > 0, index > 0);
                            }
                        } else {
                            const newBlock = makeBlock('text');
                            handleBlocksChangeImmediate([newBlock]);
                            focusBlock(newBlock.id);
                        }
                        return;
                    }
                }
            }

            if (isOption && bi !== null) {
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (bi === 0) {
                        const el = document.querySelector(`.b-quiz-question[data-id="${id}"]`);
                        if (el) el.focus();
                    } else {
                        const el = document.querySelector(`[data-id="${id}"][data-bi="${bi - 1}"]`);
                        if (el) el.focus();
                    }
                    return;
                }
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (bi === b.options.length - 1) {
                        if (index < blocks.length - 1) {
                            focusBlock(blocks[index + 1].id);
                        }
                    } else {
                        const el = document.querySelector(`[data-id="${id}"][data-bi="${bi + 1}"]`);
                        if (el) el.focus();
                    }
                    return;
                }
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const newOpts = [...b.options];
                    newOpts.splice(bi + 1, 0, { option: '', answer: false });
                    b.options = newOpts;
                    handleBlocksChangeImmediate([...blocks]);
                    setTimeout(() => {
                        const el = document.querySelector(`[data-id="${id}"][data-bi="${bi + 1}"]`);
                        if (el) el.focus();
                    }, 30);
                    return;
                }
                if (e.key === 'Backspace') {
                    if (val === '') {
                        e.preventDefault();
                        if (b.options.length > 2) {
                            const newOpts = [...b.options];
                            newOpts.splice(bi, 1);
                            b.options = newOpts;
                            handleBlocksChangeImmediate([...blocks]);
                            setTimeout(() => {
                                const prevIdx = Math.max(0, bi - 1);
                                const el = document.querySelector(`[data-id="${id}"][data-bi="${prevIdx}"]`);
                                if (el) el.focus();
                            }, 30);
                        } else {
                            if (bi > 0) {
                                const el = document.querySelector(`[data-id="${id}"][data-bi="${bi - 1}"]`);
                                if (el) el.focus();
                            } else {
                                const el = document.querySelector(`.b-quiz-question[data-id="${id}"]`);
                                if (el) el.focus();
                            }
                        }
                        return;
                    }
                }
            }
            return;
        }

        if (e.key === '/') {
            setTimeout(() => {
                const el = e.target;
                if (el) {
                    const rect = el.getBoundingClientRect();
                    setSlashMenu({
                        blockId: id,
                        query: '',
                        left: rect.left,
                        top: rect.bottom + window.scrollY + 6,
                        activeIndex: 0,
                    });
                }
            }, 0);
            return;
        }

        if (e.key === 'ArrowUp') {
            if (index === 0) {
                e.preventDefault();
                const descEl = document.getElementById('be-doc-description');
                if (descEl) {
                    descEl.focus();
                    descEl.selectionStart = descEl.selectionEnd = descEl.value.length;
                }
            } else {
                e.preventDefault();
                focusBlock(blocks[index - 1].id, true, true);
            }
            return;
        }

        if (e.key === 'ArrowDown') {
            if (index < blocks.length - 1) {
                e.preventDefault();
                focusBlock(blocks[index + 1].id);
            }
            return;
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            if (b.type === 'step' || b.type === 'h1' || b.type === 'h2' || b.type === 'h3') {
                e.preventDefault();
                insertBlockAfter(id, makeBlock('text'));
                return;
            }
            if (b.type === 'bullet' || b.type === 'numbered') {
                const text = (b.content || '').trim();
                if (text === '') {
                    e.preventDefault();
                    const newBlocks = [...blocks];
                    newBlocks[index] = makeBlock('text');
                    handleBlocksChangeImmediate(newBlocks);
                    return;
                }
                e.preventDefault();
                insertBlockAfter(id, makeBlock(b.type));
                return;
            }
        }

        if (e.key === 'Backspace') {
            const text = e.target.value || '';
            if (text === '') {
                if (blocks.length > 1) {
                    e.preventDefault();
                    const newBlocks = [...blocks];
                    newBlocks.splice(index, 1);
                    handleBlocksChangeImmediate(newBlocks);

                    const focusId = index > 0 ? blocks[index - 1].id : blocks[1]?.id;
                    if (focusId) {
                        focusBlock(focusId, index > 0, index > 0);
                    }
                } else {
                    if (b.type !== 'text') {
                        e.preventDefault();
                        const newBlock = makeBlock('text');
                        handleBlocksChangeImmediate([newBlock]);
                        focusBlock(newBlock.id);
                    }
                }
                return;
            }
        }

        // Markdown shortcuts
        if (e.key === ' ' || e.key === 'Enter') {
            const text = (e.target.value || '').trim();
            const map = {
                '#': 'h1',
                '##': 'h2',
                '###': 'h3',
                '-': 'bullet',
                '*': 'bullet',
                '1.': 'numbered',
                '---': 'divider',
                '```': 'code',
                '>': 'callout',
            };
            if (map[text]) {
                e.preventDefault();
                const newBlocks = [...blocks];
                newBlocks[index] = makeBlock(map[text]);
                handleBlocksChangeImmediate(newBlocks);
                focusBlock(id);
            }
        }
    };

    // Slash menu input keyboard handlers
    const handleSlashKeyDown = (e) => {
        if (!slashMenu) return;
        const { blockId, query, activeIndex } = slashMenu;
        const filtered = getFilteredSlashItems(query);

        if (e.key === 'Escape') {
            e.preventDefault();
            setSlashMenu(null);
            focusBlock(blockId);
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIdx = Math.min(activeIndex + 1, filtered.length - 1);
            setSlashMenu({ ...slashMenu, activeIndex: nextIdx });
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIdx = Math.max(activeIndex - 1, 0);
            setSlashMenu({ ...slashMenu, activeIndex: prevIdx });
            return;
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            if (filtered[activeIndex]) {
                insertSlashBlock(filtered[activeIndex].type);
            }
            return;
        }
    };

    const getFilteredSlashItems = (query) => {
        const q = query.toLowerCase();
        const items = [];
        Object.entries(BLOCK_TYPES).forEach(([type, def]) => {
            const match =
                type.includes(q) ||
                def.label.toLowerCase().includes(q) ||
                (def.aliases && def.aliases.some((a) => a.includes(q)));
            if (match) {
                items.push({ type, ...def });
            }
        });
        return items;
    };

    const insertSlashBlock = (type) => {
        if (!slashMenu) return;
        const { blockId } = slashMenu;
        const idx = blocks.findIndex((x) => x.id === blockId);
        if (idx === -1) return;

        const curText = (blocks[idx].content || '').replace('/', '').trim();

        const newBlocks = [...blocks];
        if (blocks[idx].type === 'text' && curText === '') {
            newBlocks[idx] = makeBlock(type);
            handleBlocksChangeImmediate(newBlocks);
            focusBlock(blockId);
        } else {
            newBlocks[idx] = { ...newBlocks[idx], content: (newBlocks[idx].content || '').replace(/\/$/, '').trim() };
            const newB = makeBlock(type);
            newBlocks.splice(idx + 1, 0, newB);
            handleBlocksChangeImmediate(newBlocks);
            focusBlock(newB.id);
        }
        setSlashMenu(null);
    };

    // Context menu handlers — all structural → use immediate sync
    const moveBlockUp = (id) => {
        const idx = blocks.findIndex((x) => x.id === id);
        if (idx > 0) {
            const newBlocks = [...blocks];
            [newBlocks[idx], newBlocks[idx - 1]] = [newBlocks[idx - 1], newBlocks[idx]];
            handleBlocksChangeImmediate(newBlocks);
        }
    };

    const moveBlockDown = (id) => {
        const idx = blocks.findIndex((x) => x.id === id);
        if (idx < blocks.length - 1) {
            const newBlocks = [...blocks];
            [newBlocks[idx], newBlocks[idx + 1]] = [newBlocks[idx + 1], newBlocks[idx]];
            handleBlocksChangeImmediate(newBlocks);
        }
    };

    const duplicateBlock = (id) => {
        const idx = blocks.findIndex((x) => x.id === id);
        if (idx > -1) {
            const copy = JSON.parse(JSON.stringify(blocks[idx]));
            copy.id = uid();
            const newBlocks = [...blocks];
            newBlocks.splice(idx + 1, 0, copy);
            handleBlocksChangeImmediate(newBlocks);
        }
    };

    const deleteBlock = (id) => {
        if (blocks.length > 1) {
            const idx = blocks.findIndex((x) => x.id === id);
            const newBlocks = [...blocks];
            newBlocks.splice(idx, 1);
            handleBlocksChangeImmediate(newBlocks);
        } else {
            const newBlock = makeBlock('text');
            handleBlocksChangeImmediate([newBlock]);
            focusBlock(newBlock.id);
        }
    };

    const handleContextMenuClick = (key, blockId) => {
        if (key === 'type') {
            focusBlock(blockId);
            setTimeout(() => {
                const el = document.querySelector(`[data-id="${blockId}"]`);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    setSlashMenu({
                        blockId: blockId,
                        query: '',
                        left: rect.left,
                        top: rect.bottom + window.scrollY + 6,
                        activeIndex: 0,
                    });
                }
            }, 50);
        } else if (key === 'up') {
            moveBlockUp(blockId);
        } else if (key === 'down') {
            moveBlockDown(blockId);
        } else if (key === 'duplicate') {
            duplicateBlock(blockId);
        } else if (key === 'delete') {
            deleteBlock(blockId);
        }
    };

    // Emoji Picker picker — structural change → immediate
    const pickEmoji = (emoji) => {
        if (!emojiPicker) return;
        const { blockId } = emojiPicker;
        const newBlocks = blocks.map((b) => {
            if (b.id === blockId) {
                return { ...b, icon: emoji };
            }
            return b;
        });
        handleBlocksChangeImmediate(newBlocks);
        setEmojiPicker(null);
    };

    // Template picker functions — structural → immediate
    const loadTemplate = (key) => {
        setTemplate(key);
        const tmpl = TEMPLATES[key];
        const newTitle = tmpl.title;
        const newDesc = tmpl.description;
        const newBlocks = tmpl.blocks();

        setTitle(newTitle);
        setDescription(newDesc);
        setBlocks(newBlocks);
        syncWithParentImmediate(newTitle, newDesc, newBlocks);
        setShowTemplatePicker(false);

        // Thông báo snapshot template lên cha để so sánh khi lưu
        if (onTemplateLoad) {
            onTemplateLoad(buildTemplateSnapshot(newTitle, newDesc, newBlocks));
        }

        // Notify template change
        if (onTemplateChange) {
            onTemplateChange(key);
        }
    };

    const startBlank = () => {
        setTemplate('blank');
        setTitle('');
        setDescription('');
        setBlocks([]);
        syncWithParentImmediate('', '', []);
        setShowTemplatePicker(false);

        // Không có template → báo null để TaskForm biết bỏ qua so sánh
        if (onTemplateLoad) {
            onTemplateLoad(null);
        }
    };

    // HTML elements queries for drag-and-drop
    const handleDragStart = (e, id) => {
        setDraggingId(id);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, targetId) => {
        if (draggingId === targetId) return;
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const midPoint = rect.top + rect.height / 2;
        const position = e.clientY < midPoint ? 'top' : 'bottom';
        setDragOverInfo({ id: targetId, position });
    };

    const handleDrop = (targetId) => {
        if (!draggingId || draggingId === targetId) return;
        const srcIndex = blocks.findIndex((x) => x.id === draggingId);
        const targetIndex = blocks.findIndex((x) => x.id === targetId);
        if (srcIndex === -1 || targetIndex === -1) return;

        const isTop = dragOverInfo && dragOverInfo.position === 'top';
        const newBlocks = [...blocks];
        const [moved] = newBlocks.splice(srcIndex, 1);

        const adjTargetIndex = newBlocks.findIndex((x) => x.id === targetId);
        const insertIndex = isTop ? adjTargetIndex : adjTargetIndex + 1;
        newBlocks.splice(insertIndex, 0, moved);

        handleBlocksChangeImmediate(newBlocks);
        setDraggingId(null);
        setDragOverInfo(null);
    };

    const handleDragEnd = () => {
        setDraggingId(null);
        setDragOverInfo(null);
    };

    // Render elements helper based on type
    const renderBlock = (b, index) => {
        switch (b.type) {
                        case 'text':
                            return (
                                <AutoResizeTextarea
                                    className="b-text"
                                    value={b.content}
                                    placeholder="Nhập văn bản hoặc gõ / để chọn block..."
                                    onKeyDown={(e) => handleBlockKeyDown(e, b.id, index)}
                                    onChange={(val) => {
                                        b.content = val;
                                        handleBlocksChange([...blocks]);
                                    }}
                                    dataId={b.id}
                                />
                            );
                        case 'h1':
                            return (
                                <AutoResizeTextarea
                                    className="b-h1"
                                    value={b.content}
                                    placeholder="Tiêu đề 1"
                                    onKeyDown={(e) => handleBlockKeyDown(e, b.id, index)}
                                    onChange={(val) => {
                                        b.content = val;
                                        handleBlocksChange([...blocks]);
                                    }}
                                    dataId={b.id}
                                />
                            );
                        case 'h2':
                            return (
                                <AutoResizeTextarea
                                    className="b-h2"
                                    value={b.content}
                                    placeholder="Tiêu đề 2"
                                    onKeyDown={(e) => handleBlockKeyDown(e, b.id, index)}
                                    onChange={(val) => {
                                        b.content = val;
                                        handleBlocksChange([...blocks]);
                                    }}
                                    dataId={b.id}
                                />
                            );
                        case 'h3':
                            return (
                                <AutoResizeTextarea
                                    className="b-h3"
                                    value={b.content}
                                    placeholder="Tiêu đề 3"
                                    onKeyDown={(e) => handleBlockKeyDown(e, b.id, index)}
                                    onChange={(val) => {
                                        b.content = val;
                                        handleBlocksChange([...blocks]);
                                    }}
                                    dataId={b.id}
                                />
                            );
                        case 'bullet':
                            return (
                                <div className="b-bullet-wrap">
                                    <span className="b-bullet-dot">•</span>
                                    <input
                                        type="text"
                                        className="b-bullet"
                                        data-id={b.id}
                                        placeholder="Dòng danh sách"
                                        value={b.content || ''}
                                        onKeyDown={(e) => handleBlockKeyDown(e, b.id, index)}
                                        onChange={(e) => {
                                            b.content = e.target.value;
                                            handleBlocksChange([...blocks]);
                                        }}
                                    />
                                </div>
                            );
                        case 'numbered': {
                            const count = blocks.filter((x, i2) => x.type === 'numbered' && i2 <= index).length;
                            return (
                                <div className="b-num-wrap">
                                    <span className="b-num-label">{count}.</span>
                                    <input
                                        type="text"
                                        className="b-num"
                                        data-id={b.id}
                                        placeholder="Dòng danh sách"
                                        value={b.content || ''}
                                        onKeyDown={(e) => handleBlockKeyDown(e, b.id, index)}
                                        onChange={(e) => {
                                            b.content = e.target.value;
                                            handleBlocksChange([...blocks]);
                                        }}
                                    />
                                </div>
                            );
                        }
                        case 'divider':
                            return <hr className="b-divider" />;
                        case 'callout':
                            return (
                                <div className="b-callout-wrap">
                                    <span
                                        className="b-callout-icon"
                                        onClick={(e) => {
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            setEmojiPicker({
                                                blockId: b.id,
                                                left: rect.left,
                                                top: rect.bottom + window.scrollY + 6,
                                            });
                                        }}
                                    >
                                        {b.icon || '💡'}
                                    </span>
                                    <AutoResizeTextarea
                                        className="b-callout-text"
                                        value={b.content}
                                        placeholder="Nội dung Callout"
                                        onKeyDown={(e) => handleBlockKeyDown(e, b.id, index)}
                                        onChange={(val) => {
                                            b.content = val;
                                            handleBlocksChange([...blocks]);
                                        }}
                                        dataId={b.id}
                                    />
                                </div>
                            );
                        case 'code':
                            return (
                                <div className="b-code-wrap">
                                    <AutoResizeTextarea
                                        className="b-code"
                                        value={b.content}
                                        placeholder="Code..."
                                        onKeyDown={(e) => handleBlockKeyDown(e, b.id, index)}
                                        onChange={(val) => {
                                            b.content = val;
                                            handleBlocksChange([...blocks]);
                                        }}
                                        dataId={b.id}
                                    />
                                </div>
                            );
                        case 'meta':
                            return (
                                <div className="b-meta-wrap">
                                    <input
                                        type="text"
                                        className="b-meta-dur"
                                        data-id={b.id}
                                        placeholder="1–2 hours"
                                        value={b.duration || ''}
                                        onKeyDown={(e) => handleBlockKeyDown(e, b.id, index)}
                                        onChange={(e) => {
                                            b.duration = e.target.value;
                                            handleBlocksChange([...blocks]);
                                        }}
                                    />
                                    <span className="b-meta-sep">·</span>
                                    <input
                                        type="text"
                                        className="b-meta-level"
                                        data-id={b.id}
                                        placeholder="Introductory"
                                        value={b.level || ''}
                                        onKeyDown={(e) => handleBlockKeyDown(e, b.id, index)}
                                        onChange={(e) => {
                                            b.level = e.target.value;
                                            handleBlocksChange([...blocks]);
                                        }}
                                    />
                                </div>
                            );
                        case 'section':
                            return (
                                <div className="b-section-wrap">
                                    <div className="b-section-header">
                                        <span
                                            className="b-section-icon"
                                            onClick={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setEmojiPicker({
                                                    blockId: b.id,
                                                    left: rect.left,
                                                    top: rect.bottom + window.scrollY + 6,
                                                });
                                            }}
                                        >
                                            {b.icon || '🎓'}
                                        </span>
                                        <input
                                            type="text"
                                            className="b-section-title"
                                            data-id={b.id}
                                            placeholder="Tiêu đề Section"
                                            value={b.title || ''}
                                            onKeyDown={(e) => handleBlockKeyDown(e, b.id, index)}
                                            onChange={(e) => {
                                                b.title = e.target.value;
                                                handleBlocksChange([...blocks]);
                                            }}
                                        />
                                    </div>
                                    <div className="b-section-bullets">
                                        {b.bullets.map((bullet, bi) => (
                                            <div key={bi} className="b-section-bullet-row">
                                                <span className="b-section-bullet-dot">–</span>
                                                <input
                                                    type="text"
                                                    className="b-section-bullet-text"
                                                    data-id={b.id}
                                                    data-bi={bi}
                                                    placeholder="Bullet item"
                                                    value={bullet || ''}
                                                    onKeyDown={(e) => handleBlockKeyDown(e, b.id, index, bi)}
                                                    onChange={(e) => {
                                                        const newBullets = [...b.bullets];
                                                        newBullets[bi] = e.target.value;
                                                        b.bullets = newBullets;
                                                        handleBlocksChange([...blocks]);
                                                    }}
                                                />
                                                <button
                                                    className="b-section-bullet-del"
                                                    onClick={() => {
                                                        if (b.bullets.length > 1) {
                                                            const newBullets = [...b.bullets];
                                                            newBullets.splice(bi, 1);
                                                            b.bullets = newBullets;
                                                            handleBlocksChangeImmediate([...blocks]);
                                                        }
                                                    }}
                                                >
                                        ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        className="b-section-add-bullet"
                                        onClick={() => {
                                            b.bullets = [...b.bullets, ''];
                                            handleBlocksChangeImmediate([...blocks]);
                                            setTimeout(() => {
                                                const all = document.querySelectorAll(`[data-id="${b.id}"][data-bi]`);
                                                const last = all[all.length - 1];
                                                if (last) last.focus();
                                            }, 30);
                                        }}
                                    >
                            ＋ Thêm dòng
                                    </button>
                                </div>
                            );
                        case 'step':
                            return (
                                <div className="b-step-wrap">
                                    <div className="b-step-badge">{index + 1}</div>
                                    <div className="b-step-content">
                                        <input
                                            type="text"
                                            className="b-step-label"
                                            data-id={b.id}
                                            placeholder="Tên bước (ví dụ: Bước 1)"
                                            value={b.label || ''}
                                            onKeyDown={(e) => handleBlockKeyDown(e, b.id, index)}
                                            onChange={(e) => {
                                                b.label = e.target.value;
                                                handleBlocksChange([...blocks]);
                                            }}
                                        />
                                        <AutoResizeTextarea
                                            className="b-step-body"
                                            value={b.body || ''}
                                            placeholder="Mô tả nội dung bước này..."
                                            onKeyDown={(e) => handleBlockKeyDown(e, b.id, index)}
                                            onChange={(val) => {
                                                b.body = val;
                                                handleBlocksChange([...blocks]);
                                            }}
                                            dataId={b.id}
                                        />
                                    </div>
                                </div>
                            );
                        case 'quiz':
                            return (
                                <div className="b-quiz-wrap">
                                    <div className="b-quiz-question-row">
                                        <span className="b-quiz-icon">❓</span>
                                        <input
                                            type="text"
                                            className="b-quiz-question"
                                            data-id={b.id}
                                            placeholder="Nhập câu hỏi trắc nghiệm..."
                                            value={b.question || ''}
                                            onKeyDown={(e) => handleBlockKeyDown(e, b.id, index)}
                                            onChange={(e) => {
                                                b.question = e.target.value;
                                                handleBlocksChange([...blocks]);
                                            }}
                                        />
                                    </div>
                                    <div className="b-quiz-options-list">
                                        {b.options.map((opt, oi) => (
                                            <div key={oi} className="b-quiz-option-row">
                                                <Checkbox
                                                    checked={opt.answer}
                                                    onChange={(e) => {
                                                        b.options = b.options.map((o, idx) => ({
                                                            ...o,
                                                            answer: idx === oi ? e.target.checked : false,
                                                        }));
                                                        handleBlocksChangeImmediate([...blocks]);
                                                    }}
                                                />
                                                <span className="b-quiz-option-letter">{String.fromCharCode(65 + oi)}.</span>
                                                <input
                                                    type="text"
                                                    className="b-quiz-option-text"
                                                    data-id={b.id}
                                                    data-bi={oi}
                                                    placeholder="Nhập đáp án..."
                                                    value={opt.option || ''}
                                                    onKeyDown={(e) => handleBlockKeyDown(e, b.id, index, oi)}
                                                    onChange={(e) => {
                                                        const newOpts = [...b.options];
                                                        newOpts[oi] = { ...newOpts[oi], option: e.target.value };
                                                        b.options = newOpts;
                                                        handleBlocksChange([...blocks]);
                                                    }}
                                                />
                                                {b.options.length > 2 && (
                                                    <button
                                                        className="b-quiz-option-del"
                                                        onClick={() => {
                                                            b.options = b.options.filter((_, idx) => idx !== oi);
                                                            handleBlocksChangeImmediate([...blocks]);
                                                        }}
                                                    >
                                            ✕
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        className="b-quiz-add-option"
                                        onClick={() => {
                                            b.options = [...b.options, { option: '', answer: false }];
                                            handleBlocksChangeImmediate([...blocks]);
                                            setTimeout(() => {
                                                const all = document.querySelectorAll(`[data-id="${b.id}"][data-bi]`);
                                                const last = all[all.length - 1];
                                                if (last) last.focus();
                                            }, 30);
                                        }}
                                    >
                            ＋ Thêm đáp án
                                    </button>
                                </div>
                            );
                        default:
                            return null;
        }
    };

    return (
        <div className="block-editor-container">
            {/* Template picker button top right */}
            <div className="template-picker-btn-wrap">
                <Button type="default" onClick={() => setShowTemplatePicker(true)}>
                    Mẫu: <strong>{TEMPLATES[template]?.label || 'Không có'}</strong>
                </Button>
            </div>

            {/* Editor doc */}
            <div className="editor-wrap">
                <div className="editor-doc">
                    <textarea
                        className="doc-title"
                        id="be-doc-title"
                        placeholder="Tiêu đề..."
                        rows="1"
                        value={title}
                        onInput={(e) => {
                            handleTitleChange(e.target.value);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                const descEl = document.getElementById('be-doc-description');
                                if (descEl) descEl.focus();
                            }
                        }}
                        onChange={() => {}} // React warning suppression
                    />
                    <textarea
                        className="doc-description"
                        id="be-doc-description"
                        placeholder="Mô tả ngắn..."
                        rows="1"
                        value={description}
                        onInput={(e) => {
                            handleDescriptionChange(e.target.value);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                if (blocks.length === 0) {
                                    addBlockAtEnd();
                                } else {
                                    focusBlock(blocks[0].id);
                                }
                            }
                            if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                if (blocks.length > 0) focusBlock(blocks[0].id);
                            }
                        }}
                        onChange={() => {}} // React warning suppression
                    />

                    {/* Blocks */}
                    <div className="blocks-container">
                        {blocks.map((b, index) => {
                            let rowClass = 'block-row';
                            if (draggingId === b.id) rowClass += ' dragging';
                            if (dragOverInfo && dragOverInfo.id === b.id) {
                                if (dragOverInfo.position === 'top') rowClass += ' drag-over-top';
                                if (dragOverInfo.position === 'bottom') rowClass += ' drag-over-bottom';
                            }

                            return (
                                <div
                                    key={b.id}
                                    className={rowClass}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, b.id)}
                                    onDragOver={(e) => handleDragOver(e, b.id)}
                                    onDrop={() => handleDrop(b.id)}
                                    onDragEnd={handleDragEnd}
                                >
                                    <div className="block-gutter">
                                        <Dropdown
                                            menu={{
                                                items: [
                                                    { key: 'type', label: 'Đổi kiểu block', icon: '🔄' },
                                                    { key: 'up', label: 'Di chuyển lên', icon: '↑' },
                                                    { key: 'down', label: 'Di chuyển xuống', icon: '↓' },
                                                    { key: 'duplicate', label: 'Nhân bản', icon: '⧉' },
                                                    { type: 'divider' },
                                                    { key: 'delete', label: 'Xoá block', icon: '✕', danger: true },
                                                ],
                                                onClick: ({ key }) => handleContextMenuClick(key, b.id),
                                            }}
                                            trigger={['click']}
                                            placement="bottomLeft"
                                        >
                                            <button type="button" className="gutter-btn">
                                                ⋮
                                            </button>
                                        </Dropdown>
                                        <button type="button" className="gutter-btn drag-btn">
                                            ⠿
                                        </button>
                                    </div>
                                    <div className="block-content">{renderBlock(b, index)}</div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ height: 80, cursor: 'text' }} onClick={addBlockAtEnd} />
                </div>
            </div>

            <button type="button" className="float-add" onClick={addBlockAtEnd}>
                ＋
            </button>

            {/* Template Picker Modal */}
            <Modal
                title="Chọn mẫu"
                open={showTemplatePicker}
                onCancel={() => setShowTemplatePicker(false)}
                footer={[
                    <span
                        key="blank"
                        className="tp-blank"
                        style={{
                            marginRight: 16,
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            color: 'var(--accent)',
                        }}
                        onClick={startBlank}
                    >
                        Bắt đầu trống
                    </span>,
                    <Button key="start" type="primary" onClick={() => loadTemplate(template)}>
                        Bắt đầu →
                    </Button>,
                ]}
                width={680}
                destroyOnClose
            >
                <div className="tp-modal-content">
                    <p style={{ color: 'var(--text2)', marginBottom: 16 }}>
                        Bắt đầu từ một cấu trúc có sẵn, hoặc tạo tài liệu trắng.
                    </p>
                    <div className="tp-grid">
                        <div
                            className={`tp-card ${template === 'task' ? 'selected' : ''}`}
                            onClick={() => setTemplate('task')}
                        >
                            <div className="tp-card-icon">📋</div>
                            <div className="tp-card-name">Giới thiệu</div>
                            <div className="tp-card-desc">
                                Mẫu giới thiệu bài học/nhiệm vụ với mục tiêu và các bước rõ ràng.
                            </div>
                            <div className="tp-card-preview">
                                <div className="tp-prev-line dark"></div>
                                <div className="tp-prev-line short" style={{ marginTop: 2 }}></div>
                                <div className="tp-prev-box" style={{ marginTop: 4 }}></div>
                                <div className="tp-prev-box"></div>
                            </div>
                        </div>
                        <div
                            className={`tp-card ${template === 'guide' ? 'selected' : ''}`}
                            onClick={() => setTemplate('guide')}
                        >
                            <div className="tp-card-icon">🪜</div>
                            <div className="tp-card-name">Hướng dẫn</div>
                            <div className="tp-card-desc">
                                Mẫu hướng dẫn chi tiết các bước cấu hình và thực hiện tuần tự.
                            </div>
                            <div className="tp-card-preview">
                                <div className="tp-prev-line dark"></div>
                                <div className="tp-prev-line short" style={{ marginTop: 2 }}></div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
                                    <div className="tp-prev-line shorter"></div>
                                    <div className="tp-prev-line shorter"></div>
                                    <div className="tp-prev-line shorter"></div>
                                </div>
                            </div>
                        </div>
                        <div
                            className={`tp-card ${template === 'reading' ? 'selected' : ''}`}
                            onClick={() => setTemplate('reading')}
                        >
                            <div className="tp-card-icon">📖</div>
                            <div className="tp-card-name">Ví dụ</div>
                            <div className="tp-card-desc">Mẫu ví dụ thực tế hoặc tài liệu đọc tham khảo bổ ích.</div>
                            <div className="tp-card-preview">
                                <div className="tp-prev-line dark"></div>
                                <div className="tp-prev-line short" style={{ marginTop: 2 }}></div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6 }}>
                                    <div className="tp-prev-line"></div>
                                    <div className="tp-prev-line"></div>
                                    <div className="tp-prev-line short"></div>
                                </div>
                            </div>
                        </div>
                        <div
                            className={`tp-card ${template === 'quiz' ? 'selected' : ''}`}
                            onClick={() => setTemplate('quiz')}
                        >
                            <div className="tp-card-icon">❓</div>
                            <div className="tp-card-name">Trắc nghiệm</div>
                            <div className="tp-card-desc">Mẫu bài kiểm tra trắc nghiệm kiến thức.</div>
                            <div className="tp-card-preview">
                                <div className="tp-prev-line dark"></div>
                                <div className="tp-prev-line short" style={{ marginTop: 2 }}></div>
                                <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                                    <div className="tp-prev-line shorter"></div>
                                    <div className="tp-prev-line shorter"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Slash Menu */}
            {slashMenu && (
                <div className="slash-menu show" style={{ left: slashMenu.left, top: slashMenu.top }}>
                    <div className="slash-search">
                        <input
                            autoFocus
                            placeholder="Tìm loại block..."
                            value={slashMenu.query}
                            onChange={(e) => setSlashMenu({ ...slashMenu, query: e.target.value, activeIndex: 0 })}
                            onKeyDown={handleSlashKeyDown}
                        />
                    </div>
                    <div className="slash-items">
                        {(() => {
                            const filtered = getFilteredSlashItems(slashMenu.query);
                            if (filtered.length === 0) {
                                return (
                                    <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text3)' }}>
                                        Không tìm thấy block phù hợp
                                    </div>
                                );
                            }

                            // Group them in DOM
                            const groups = {};
                            filtered.forEach((item, indexInFiltered) => {
                                if (!groups[item.group]) groups[item.group] = [];
                                groups[item.group].push({ item, indexInFiltered });
                            });

                            return Object.entries(groups).map(([groupName, groupItems]) => (
                                <React.Fragment key={groupName}>
                                    <div className="slash-group-label">{groupName}</div>
                                    {groupItems.map(({ item, indexInFiltered }) => (
                                        <div
                                            key={item.type}
                                            className={`slash-item ${indexInFiltered === slashMenu.activeIndex ? 'active' : ''}`}
                                            onClick={() => insertSlashBlock(item.type)}
                                        >
                                            <div className="slash-item-icon">{item.icon}</div>
                                            <div className="slash-item-info">
                                                <div className="slash-item-name">{item.label}</div>
                                                <div className="slash-item-desc">{item.desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </React.Fragment>
                            ));
                        })()}
                    </div>
                </div>
            )}

            {/* Emoji Picker */}
            {emojiPicker && (
                <div className="emoji-picker show" style={{ left: emojiPicker.left, top: emojiPicker.top }}>
                    {EMOJI_SETS.map((group) => (
                        <React.Fragment key={group.l}>
                            <div className="ep-label">{group.l}</div>
                            {group.e.map((em) => (
                                <div key={em} className="ep-em" onClick={() => pickEmoji(em)}>
                                    {em}
                                </div>
                            ))}
                        </React.Fragment>
                    ))}
                </div>
            )}
        </div>
    );
}
