import React, { useState, useEffect, useRef } from 'react';
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
    };
    return { id: uid(), type, ...defaults[type], ...data };
};

const TEMPLATES = {
    task: {
        label: 'Task Card',
        title: 'Task One: Create a Backpack React Web App',
        description: "Use Skyscanner's Backpack React library to build a basic web app.",
        blocks: () => [
            makeBlock('meta', { duration: '1–2 hours', level: 'Introductory' }),
            makeBlock('section', {
                icon: '🎓',
                title: "What you'll learn",
                bullets: [
                    "Receive an introduction to Skyscanner's open-source collection of design resources",
                    'How to set up your local development environment',
                ],
            }),
            makeBlock('section', {
                icon: '🛠️',
                title: "What you'll do",
                bullets: ['Set up and customise your React application', 'Test your application'],
            }),
        ],
    },
    guide: {
        label: 'Step Guide',
        title: 'Customise the Application',
        description: 'Follow these steps to customise your app and get it ready for submission.',
        blocks: () => [
            makeBlock('step', { label: 'Step One', body: 'Update the header text to read "Flight Schedule"' }),
            makeBlock('step', {
                label: 'Step Two',
                body: 'Install the Calendar component by running `npm install bpk-component-calendar --save-dev`.',
            }),
            makeBlock('step', {
                label: 'Step Three',
                body: 'Review the Calendar documentation and add this feature into your `App.js` file.',
            }),
            makeBlock('step', {
                label: 'Step Four',
                body: 'Place the "Click Me" button below the calendar, and update the text to say "Continue."',
            }),
            makeBlock('step', {
                label: 'Step Five',
                body: 'Review your app by running `npm start` and navigating to localhost:3000.',
            }),
            makeBlock('divider'),
            makeBlock('text', { content: "Finally, on the next step, we'll test and submit the application!" }),
        ],
    },
    reading: {
        label: 'Bài đọc',
        title: "Here's some background information...",
        description: 'Read through this material before starting the task.',
        blocks: () => [
            makeBlock('text', {
                content:
                    'Skyscanner is a search engine and travel agency that allows people to research and book travel options like flights, hotels, and car rentals. The company also created Backpack, an open-source collection of design resources and reusable guidelines.',
            }),
            makeBlock('text', {
                content:
                    "In this task, you'll be using the Backpack library to build a simple web application. This task includes three stages:",
            }),
            makeBlock('numbered', { content: 'Setting up your workspace,' }),
            makeBlock('numbered', { content: 'Customising your application, and' }),
            makeBlock('numbered', { content: 'Executing automated tests.' }),
            makeBlock('callout', {
                icon: '💡',
                content:
                    'While this task only explores the basics of Backpack, it will give you a strong foundation to build on.',
            }),
        ],
    },
};

// Custom Editable Text component to solve caret jumping in contenteditable React
const EditableText = ({ className, value, onInput, onKeyDown, placeholder, dataId, dataBi }) => {
    const ref = useRef();

    useEffect(() => {
        if (ref.current && ref.current.innerText !== value) {
            ref.current.innerText = value || '';
        }
    }, [value]);

    return (
        <div
            ref={ref}
            className={className}
            contentEditable
            suppressContentEditableWarning
            data-id={dataId}
            data-bi={dataBi}
            data-ph={placeholder}
            onKeyDown={onKeyDown}
            onInput={(e) => {
                onInput(e.target.innerText);
            }}
        />
    );
};

export default function BlockEditor({
    initialTitle = '',
    initialDescription = '',
    initialContent = '',
    onChange,
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
    const [contextMenu, setContextMenu] = useState(null); // { blockId, left, top }
    const [emojiPicker, setEmojiPicker] = useState(null); // { blockId, left, top }

    // Drag-and-drop state
    const [draggingId, setDraggingId] = useState(null);
    const [dragOverInfo, setDragOverInfo] = useState(null); // { id, position: 'top'|'bottom' }

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
        }
    }, []);

    // Close overlays on outside click
    useEffect(() => {
        const handleGlobalClick = (e) => {
            if (slashMenu && !e.target.closest('.slash-menu')) {
                setSlashMenu(null);
            }
            if (contextMenu && !e.target.closest('.ctx-menu') && !e.target.closest('.gutter-btn')) {
                setContextMenu(null);
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
    }, [slashMenu, contextMenu, emojiPicker]);

    // Focus block helper
    const focusBlock = (id, positionAtEnd = false) => {
        setTimeout(() => {
            const el = document.querySelector(`[data-id="${id}"]`);
            if (el) {
                el.focus();
                if (positionAtEnd) {
                    const range = document.createRange();
                    range.selectNodeContents(el);
                    range.collapse(false);
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            }
        }, 30);
    };

    // Prop sync trigger
    const syncWithParent = (newTitle, newDesc, newBlocks) => {
        if (onChange) {
            const cleanBlocks = newBlocks.map((block) => {
                const rest = { ...block };
                delete rest.id;
                return rest;
            });
            onChange({
                title: newTitle,
                description: newDesc,
                content: JSON.stringify(cleanBlocks),
            });
        }
    };

    const handleTitleChange = (val) => {
        setTitle(val);
        syncWithParent(val, description, blocks);
    };

    const handleDescriptionChange = (val) => {
        setDescription(val);
        syncWithParent(title, val, blocks);
    };

    const handleBlocksChange = (newBlocks) => {
        setBlocks(newBlocks);
        syncWithParent(title, description, newBlocks);
    };

    const insertBlockAfter = (targetId, newBlock) => {
        const idx = blocks.findIndex((x) => x.id === targetId);
        const newBlocks = [...blocks];
        newBlocks.splice(idx + 1, 0, newBlock);
        handleBlocksChange(newBlocks);
        focusBlock(newBlock.id);
    };

    const addBlockAtEnd = () => {
        const newBlock = makeBlock('text');
        const newBlocks = [...blocks, newBlock];
        handleBlocksChange(newBlocks);
        focusBlock(newBlock.id);
    };

    // Keyboard navigation inside blocks
    const handleBlockKeyDown = (e, id, index) => {
        const b = blocks[index];

        if (e.key === '/') {
            setTimeout(() => {
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                    const rect = sel.getRangeAt(0).getBoundingClientRect();
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
                focusBlock(blocks[index - 1].id, true);
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
                const el = document.querySelector(`[data-id="${id}"]`);
                const text = el ? el.innerText.trim() : '';
                if (text === '') {
                    e.preventDefault();
                    const newBlocks = [...blocks];
                    newBlocks[index] = makeBlock('text');
                    handleBlocksChange(newBlocks);
                    return;
                }
                e.preventDefault();
                insertBlockAfter(id, makeBlock(b.type));
                return;
            }
        }

        if (e.key === 'Backspace') {
            const el = e.target;
            const text = el.innerText || '';
            if (text === '') {
                if (blocks.length > 1) {
                    e.preventDefault();
                    const newBlocks = [...blocks];
                    newBlocks.splice(index, 1);
                    handleBlocksChange(newBlocks);

                    const prevIndex = Math.max(0, index - 1);
                    focusBlock(blocks[prevIndex]?.id, true);
                }
                return;
            }
        }

        // Markdown shortcuts
        if (e.key === ' ' || e.key === 'Enter') {
            const el = e.target;
            const text = el.innerText.trim();
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
                el.innerText = '';
                const newBlocks = [...blocks];
                newBlocks[index] = makeBlock(map[text]);
                handleBlocksChange(newBlocks);
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

        const el = document.querySelector(`[data-id="${blockId}"]`);
        const curText = el ? el.innerText.replace('/', '').trim() : '';

        const newBlocks = [...blocks];
        if (blocks[idx].type === 'text' && curText === '') {
            newBlocks[idx] = makeBlock(type);
            handleBlocksChange(newBlocks);
            focusBlock(blockId);
        } else {
            if (el) {
                el.innerText = el.innerText.replace(/\/$/, '').trim();
                blocks[idx].content = el.innerText;
            }
            const newB = makeBlock(type);
            newBlocks.splice(idx + 1, 0, newB);
            handleBlocksChange(newBlocks);
            focusBlock(newB.id);
        }
        setSlashMenu(null);
    };

    // Context menu handlers
    const moveBlockUp = (id) => {
        const idx = blocks.findIndex((x) => x.id === id);
        if (idx > 0) {
            const newBlocks = [...blocks];
            [newBlocks[idx], newBlocks[idx - 1]] = [newBlocks[idx - 1], newBlocks[idx]];
            handleBlocksChange(newBlocks);
        }
        setContextMenu(null);
    };

    const moveBlockDown = (id) => {
        const idx = blocks.findIndex((x) => x.id === id);
        if (idx < blocks.length - 1) {
            const newBlocks = [...blocks];
            [newBlocks[idx], newBlocks[idx + 1]] = [newBlocks[idx + 1], newBlocks[idx]];
            handleBlocksChange(newBlocks);
        }
        setContextMenu(null);
    };

    const duplicateBlock = (id) => {
        const idx = blocks.findIndex((x) => x.id === id);
        if (idx > -1) {
            const copy = JSON.parse(JSON.stringify(blocks[idx]));
            copy.id = uid();
            const newBlocks = [...blocks];
            newBlocks.splice(idx + 1, 0, copy);
            handleBlocksChange(newBlocks);
        }
        setContextMenu(null);
    };

    const deleteBlock = (id) => {
        if (blocks.length > 1) {
            const idx = blocks.findIndex((x) => x.id === id);
            const newBlocks = [...blocks];
            newBlocks.splice(idx, 1);
            handleBlocksChange(newBlocks);
        }
        setContextMenu(null);
    };

    // Emoji Picker picker
    const pickEmoji = (emoji) => {
        if (!emojiPicker) return;
        const { blockId } = emojiPicker;
        const newBlocks = blocks.map((b) => {
            if (b.id === blockId) {
                return { ...b, icon: emoji };
            }
            return b;
        });
        handleBlocksChange(newBlocks);
        setEmojiPicker(null);
    };

    // Template picker functions
    const loadTemplate = (key) => {
        setTemplate(key);
        const tmpl = TEMPLATES[key];
        const newTitle = tmpl.title;
        const newDesc = tmpl.description;
        const newBlocks = tmpl.blocks();

        setTitle(newTitle);
        setDescription(newDesc);
        setBlocks(newBlocks);
        syncWithParent(newTitle, newDesc, newBlocks);
        setShowTemplatePicker(false);
    };

    const startBlank = () => {
        setTemplate('blank');
        setTitle('');
        setDescription('');
        setBlocks([]);
        syncWithParent('', '', []);
        setShowTemplatePicker(false);
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

        handleBlocksChange(newBlocks);
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
                                <EditableText
                                    className="b-text"
                                    value={b.content}
                                    placeholder="Nhập văn bản hoặc gõ / để chọn block..."
                                    onKeyDown={(e) => handleBlockKeyDown(e, b.id, index)}
                                    onInput={(val) => {
                                        b.content = val;
                                        handleBlocksChange([...blocks]);
                                    }}
                                    dataId={b.id}
                                />
                            );
                        case 'h1':
                            return (
                                <EditableText
                                    className="b-h1"
                                    value={b.content}
                                    placeholder="Tiêu đề 1"
                                    onKeyDown={(e) => handleBlockKeyDown(e, b.id, index)}
                                    onInput={(val) => {
                                        b.content = val;
                                        handleBlocksChange([...blocks]);
                                    }}
                                    dataId={b.id}
                                />
                            );
                        case 'h2':
                            return (
                                <EditableText
                                    className="b-h2"
                                    value={b.content}
                                    placeholder="Tiêu đề 2"
                                    onKeyDown={(e) => handleBlockKeyDown(e, b.id, index)}
                                    onInput={(val) => {
                                        b.content = val;
                                        handleBlocksChange([...blocks]);
                                    }}
                                    dataId={b.id}
                                />
                            );
                        case 'h3':
                            return (
                                <EditableText
                                    className="b-h3"
                                    value={b.content}
                                    placeholder="Tiêu đề 3"
                                    onKeyDown={(e) => handleBlockKeyDown(e, b.id, index)}
                                    onInput={(val) => {
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
                                    <EditableText
                                        className="b-bullet"
                                        value={b.content}
                                        placeholder="Dòng danh sách"
                                        onKeyDown={(e) => handleBlockKeyDown(e, b.id, index)}
                                        onInput={(val) => {
                                            b.content = val;
                                            handleBlocksChange([...blocks]);
                                        }}
                                        dataId={b.id}
                                    />
                                </div>
                            );
                        case 'numbered': {
                            const count = blocks.filter((x, i2) => x.type === 'numbered' && i2 <= index).length;
                            return (
                                <div className="b-num-wrap">
                                    <span className="b-num-label">{count}.</span>
                                    <EditableText
                                        className="b-num"
                                        value={b.content}
                                        placeholder="Dòng danh sách"
                                        onKeyDown={(e) => handleBlockKeyDown(e, b.id, index)}
                                        onInput={(val) => {
                                            b.content = val;
                                            handleBlocksChange([...blocks]);
                                        }}
                                        dataId={b.id}
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
                                    <EditableText
                                        className="b-callout-text"
                                        value={b.content}
                                        placeholder="Nội dung Callout"
                                        onKeyDown={(e) => handleBlockKeyDown(e, b.id, index)}
                                        onInput={(val) => {
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
                                    <EditableText
                                        className="b-code"
                                        value={b.content}
                                        placeholder="Code..."
                                        onKeyDown={(e) => handleBlockKeyDown(e, b.id, index)}
                                        onInput={(val) => {
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
                                    <EditableText
                                        className="b-meta-dur"
                                        value={b.duration}
                                        placeholder="1–2 hours"
                                        onInput={(val) => {
                                            b.duration = val;
                                            handleBlocksChange([...blocks]);
                                        }}
                                        dataId={b.id}
                                    />
                                    <span className="b-meta-sep">·</span>
                                    <EditableText
                                        className="b-meta-level"
                                        value={b.level}
                                        placeholder="Introductory"
                                        onInput={(val) => {
                                            b.level = val;
                                            handleBlocksChange([...blocks]);
                                        }}
                                        dataId={b.id}
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
                                        <EditableText
                                            className="b-section-title"
                                            value={b.title}
                                            placeholder="Tiêu đề Section"
                                            onInput={(val) => {
                                                b.title = val;
                                                handleBlocksChange([...blocks]);
                                            }}
                                            dataId={b.id}
                                        />
                                    </div>
                                    <div className="b-section-bullets">
                                        {b.bullets.map((bullet, bi) => (
                                            <div key={bi} className="b-section-bullet-row">
                                                <span className="b-section-bullet-dot">–</span>
                                                <EditableText
                                                    className="b-section-bullet-text"
                                                    value={bullet}
                                                    placeholder="Bullet item"
                                                    dataId={b.id}
                                                    dataBi={bi}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const newBullets = [...b.bullets];
                                                            newBullets.splice(bi + 1, 0, '');
                                                            b.bullets = newBullets;
                                                            handleBlocksChange([...blocks]);
                                                            setTimeout(() => {
                                                                const el = document.querySelector(
                                                                    `[data-id="${b.id}"][data-bi="${bi + 1}"]`,
                                                                );
                                                                if (el) el.focus();
                                                            }, 30);
                                                        }
                                                        if (e.key === 'Backspace' && bullet === '') {
                                                            e.preventDefault();
                                                            if (b.bullets.length > 1) {
                                                                const newBullets = [...b.bullets];
                                                                newBullets.splice(bi, 1);
                                                                b.bullets = newBullets;
                                                                handleBlocksChange([...blocks]);
                                                                setTimeout(() => {
                                                                    const prevIdx = Math.max(0, bi - 1);
                                                                    const el = document.querySelector(
                                                                        `[data-id="${b.id}"][data-bi="${prevIdx}"]`,
                                                                    );
                                                                    if (el) el.focus();
                                                                }, 30);
                                                            }
                                                        }
                                                    }}
                                                    onInput={(val) => {
                                                        const newBullets = [...b.bullets];
                                                        newBullets[bi] = val;
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
                                                            handleBlocksChange([...blocks]);
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
                                            handleBlocksChange([...blocks]);
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
                                    <EditableText
                                        className="b-step-label"
                                        value={b.label}
                                        placeholder="Step One"
                                        onKeyDown={(e) => handleBlockKeyDown(e, b.id, index)}
                                        onInput={(val) => {
                                            b.label = val;
                                            handleBlocksChange([...blocks]);
                                        }}
                                        dataId={b.id}
                                    />
                                    <span className="b-step-colon">:</span>
                                    <EditableText
                                        className="b-step-body"
                                        value={b.body}
                                        placeholder="Nội dung bước"
                                        onKeyDown={(e) => handleBlockKeyDown(e, b.id, index)}
                                        onInput={(val) => {
                                            b.body = val;
                                            handleBlocksChange([...blocks]);
                                        }}
                                        dataId={b.id}
                                    />
                                </div>
                            );
                        default:
                            return null;
        }
    };

    return (
        <div className="block-editor-container">
            {/* Topbar */}
            <div className="topbar">
                <div className="topbar-logo">✦</div>
                <div className="topbar-title">Block Editor</div>
                <div className="topbar-divider"></div>
                <div className="topbar-template-badge" onClick={() => setShowTemplatePicker(true)}>
                    <span className="badge-dot"></span>
                    <span>{TEMPLATES[template]?.label || 'Không có template'}</span>
                </div>
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
                                        <button
                                            type="button"
                                            className="gutter-btn"
                                            onClick={(e) => {
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setContextMenu({
                                                    blockId: b.id,
                                                    left: rect.right + 6,
                                                    top: rect.top + window.scrollY,
                                                });
                                            }}
                                        >
                                            ⋮
                                        </button>
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
            {showTemplatePicker && (
                <div className="tp-overlay">
                    <div className="tp-modal">
                        <div className="tp-header">
                            <h2>Chọn template</h2>
                            <p>Bắt đầu từ một cấu trúc có sẵn, hoặc tạo tài liệu trắng.</p>
                        </div>
                        <div className="tp-grid">
                            <div
                                className={`tp-card ${template === 'task' ? 'selected' : ''}`}
                                onClick={() => setTemplate('task')}
                            >
                                <div className="tp-card-icon">📋</div>
                                <div className="tp-card-name">Task Card</div>
                                <div className="tp-card-desc">Mô tả nhiệm vụ với mục tiêu và yêu cầu rõ ràng.</div>
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
                                <div className="tp-card-name">Step Guide</div>
                                <div className="tp-card-desc">Hướng dẫn từng bước theo trình tự rõ ràng.</div>
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
                                <div className="tp-card-name">Bài đọc</div>
                                <div className="tp-card-desc">Nội dung dạng bài viết, tài liệu tham khảo.</div>
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
                        </div>
                        <div className="tp-footer">
                            <span className="tp-blank" onClick={startBlank}>
                                Bắt đầu trống
                            </span>
                            <button type="button" className="btn-start" onClick={() => loadTemplate(template)}>
                                Bắt đầu →
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

            {/* Context Menu */}
            {contextMenu && (
                <div className="ctx-menu show" style={{ left: contextMenu.left, top: contextMenu.top }}>
                    <div
                        className="ctx-item"
                        onClick={() => {
                            setContextMenu(null);
                            focusBlock(contextMenu.blockId);
                            setTimeout(() => {
                                const el = document.querySelector(`[data-id="${contextMenu.blockId}"]`);
                                if (el) {
                                    const rect = el.getBoundingClientRect();
                                    setSlashMenu({
                                        blockId: contextMenu.blockId,
                                        query: '',
                                        left: rect.left,
                                        top: rect.bottom + window.scrollY + 6,
                                        activeIndex: 0,
                                    });
                                }
                            }, 50);
                        }}
                    >
                        <span className="ctx-item-icon">🔄</span> Đổi kiểu block
                    </div>
                    <div className="ctx-item" onClick={() => moveBlockUp(contextMenu.blockId)}>
                        <span className="ctx-item-icon">↑</span> Di chuyển lên
                    </div>
                    <div className="ctx-item" onClick={() => moveBlockDown(contextMenu.blockId)}>
                        <span className="ctx-item-icon">↓</span> Di chuyển xuống
                    </div>
                    <div className="ctx-item" onClick={() => duplicateBlock(contextMenu.blockId)}>
                        <span className="ctx-item-icon">⧉</span> Nhân bản
                    </div>
                    <hr className="ctx-sep" />
                    <div className="ctx-item danger" onClick={() => deleteBlock(contextMenu.blockId)}>
                        <span className="ctx-item-icon">✕</span> Xoá block
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
