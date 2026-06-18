import React, { useRef, useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * EditableZone
 *
 * Wrap bất kỳ element nào trong preview để biến thành editable inline.
 * - Hover → viền xanh + icon ✏️
 * - Click → mở floating editor (input / textarea / quill-like)
 * - onCommit(value) → sync về SimulationForm
 *
 * Props:
 *   fieldPath   – string định danh field, VD: "title", "notice", "overview.intro.content"
 *   value       – giá trị hiện tại
 *   type        – "text" | "textarea" | "richtext" (default: "text")
 *   onCommit    – callback(fieldPath, newValue)
 *   editable    – boolean (false → render children bình thường)
 *   label       – tên hiển thị trong tooltip, VD: "Tiêu đề"
 *   children    – nội dung preview render ra
 */
function EditableZone({
    fieldPath,
    value,
    type = 'text',
    onCommit,
    editable = true,
    label,
    children,
    style,
    options,
}) {
    const [open, setOpen]       = useState(false);
    const [draft, setDraft]     = useState(value ?? '');
    const [hovered, setHovered] = useState(false);
    const [pos, setPos]         = useState({ top: 0, left: 0, width: 320 });

    const zoneRef    = useRef(null);
    const inputRef   = useRef(null);
    const popoverRef = useRef(null);

    // Sync draft khi value từ ngoài thay đổi (form edit bên trái)
    useEffect(() => {
        if (!open) setDraft(value ?? '');
    }, [value, open]);

    // Focus input khi mở
    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
            if (inputRef.current.setSelectionRange) {
                const len = inputRef.current.value.length;
                inputRef.current.setSelectionRange(len, len);
            }
        }
    }, [open]);

    // Đóng popover khi click outside
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (
                popoverRef.current && !popoverRef.current.contains(e.target) &&
                zoneRef.current   && !zoneRef.current.contains(e.target)
            ) {
                handleCommit();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open, draft]); // eslint-disable-line

    const handleOpen = useCallback(() => {
        if (!editable) return;
        if (open) return;
        const rect = zoneRef.current?.getBoundingClientRect();

        const popoverWidth = type === 'richtext' ? 480 : Math.max(320, rect?.width ?? 320);
        let left = (rect?.left ?? 0);
        let top  = (rect?.bottom ?? 0) + 6;

        // Tránh tràn màn hình phải
        if (left + popoverWidth > window.innerWidth - 16) {
            left = window.innerWidth - popoverWidth - 16;
        }

        setPos({ top, left, width: popoverWidth });
        setDraft(value ?? '');
        setOpen(true);
    }, [editable, type, value, open]);

    const handleCommit = useCallback((overrideValue) => {
        setOpen(false);
        const isEvent = overrideValue && (overrideValue.nativeEvent || overrideValue instanceof Event || overrideValue.preventDefault);
        const finalValue = (overrideValue !== undefined && !isEvent) ? overrideValue : draft;
        if (finalValue !== value) {
            onCommit?.(fieldPath, finalValue);
        }
    }, [draft, value, fieldPath, onCommit]);

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            setDraft(value ?? '');
            setOpen(false);
        }
        if (e.key === 'Enter' && type === 'text') {
            e.preventDefault();
            handleCommit();
        }
    };

    if (!editable) return <>{children}</>;

    return (
        <>
            {/* Zone wrapper */}
            <div
                ref={zoneRef}
                style={{
                    display:      'block',
                    position:     'relative',
                    cursor:       'text',
                    borderRadius: 4,
                    transition:   'box-shadow 0.15s, outline 0.15s',
                    outline:      open
                        ? '2px solid #1677ff'
                        : hovered
                            ? '2px dashed #91caff'
                            : '2px solid transparent',
                    outlineOffset: 3,
                    ...style,
                }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onClick={handleOpen}
            >
                {children}

                {/* Edit badge */}
                {(hovered || open) && (
                    <span style={badgeStyle}>
                        ✏️ {label || fieldPath}
                    </span>
                )}
            </div>

            {/* Floating popover — render vào body để không bị clip */}
            {open && createPortal(
                <FloatingEditor
                    ref={popoverRef}
                    pos={pos}
                    type={type}
                    draft={draft}
                    label={label || fieldPath}
                    inputRef={inputRef}
                    onChange={setDraft}
                    onCommit={handleCommit}
                    onCancel={() => { setDraft(value ?? ''); setOpen(false); }}
                    onKeyDown={handleKeyDown}
                    options={options}
                />,
                document.body,
            )}
        </>
    );
}

// ─── FloatingEditor ───────────────────────────────────────────────────────────
const FloatingEditor = React.forwardRef(function FloatingEditor(
    { pos, type, draft, label, inputRef, onChange, onCommit, onCancel, onKeyDown, options },
    ref,
) {
    return (
        <div
            ref={ref}
            style={{
                position:     'fixed',
                top:          pos.top,
                left:         pos.left,
                width:        pos.width,
                zIndex:       9999,
                background:   '#fff',
                border:       '1.5px solid #1677ff',
                borderRadius: 10,
                boxShadow:    '0 8px 32px rgba(22,119,255,0.18), 0 2px 8px rgba(0,0,0,0.10)',
                padding:      '10px 12px 8px',
                animation:    'ezFadeIn 0.12s ease',
            }}
        >
            <style>{`@keyframes ezFadeIn { from { opacity:0; transform: translateY(-4px); } to { opacity:1; transform:none; } }`}</style>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#1677ff', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    ✏️ {label}
                </span>
                <span style={{ fontSize: 10, color: '#aaa' }}>Enter để lưu · Esc để huỷ</span>
            </div>

            {/* Input area */}
            {type === 'select' ? (
                <select
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => {
                        const newVal = e.target.value;
                        onChange(newVal);
                        onCommit(newVal);
                    }}
                    onKeyDown={onKeyDown}
                    style={inputStyle}
                >
                    <option value="" disabled hidden>-- Chọn --</option>
                    {options && options.map(opt => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            ) : type === 'textarea' || type === 'richtext' ? (
                <textarea
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    rows={type === 'richtext' ? 6 : 4}
                    style={inputStyle}
                    placeholder="Nhập nội dung..."
                />
            ) : (
                <input
                    ref={inputRef}
                    type="text"
                    value={draft}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    style={inputStyle}
                    placeholder="Nhập nội dung..."
                />
            )}

            {/* Note for richtext */}
            {type === 'richtext' && (
                <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>
                    💡 Hỗ trợ HTML cơ bản. Để format nâng cao hãy dùng editor bên trái.
                </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
                <button onClick={onCancel} style={btnSecondaryStyle}>Huỷ</button>
                <button onClick={() => onCommit()} style={btnPrimaryStyle}>Lưu ✓</button>
            </div>
        </div>
    );
});

// ─── Styles ───────────────────────────────────────────────────────────────────
const badgeStyle = {
    position:     'absolute',
    top:          -22,
    right:        0,
    background:   '#1677ff',
    color:        '#fff',
    fontSize:     10,
    fontWeight:   700,
    padding:      '2px 8px',
    borderRadius: '4px 4px 0 0',
    whiteSpace:   'nowrap',
    pointerEvents: 'none',
    letterSpacing: 0.3,
};

const inputStyle = {
    width:        '100%',
    border:       '1px solid #d9d9d9',
    borderRadius: 6,
    padding:      '6px 8px',
    fontSize:     13,
    lineHeight:   1.5,
    outline:      'none',
    resize:       'vertical',
    fontFamily:   'inherit',
    color:        '#222',
    boxSizing:    'border-box',
    transition:   'border-color 0.15s',
};

const btnPrimaryStyle = {
    background:   '#1677ff',
    color:        '#fff',
    border:       'none',
    borderRadius: 6,
    padding:      '4px 14px',
    fontSize:     12,
    fontWeight:   600,
    cursor:       'pointer',
};

const btnSecondaryStyle = {
    background:   '#f5f5f5',
    color:        '#555',
    border:       '1px solid #d9d9d9',
    borderRadius: 6,
    padding:      '4px 12px',
    fontSize:     12,
    cursor:       'pointer',
};

export default EditableZone;