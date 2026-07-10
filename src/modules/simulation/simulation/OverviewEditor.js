import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Button, Input, Popover, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { AppConstants } from '@constants';

// Helper to detect if an icon is an image link
const isImageLink = (icon) => {
    if (!icon || typeof icon !== 'string') return false;
    const cleanIcon = icon.trim();
    return (
        cleanIcon.startsWith('http://') ||
        cleanIcon.startsWith('https://') ||
        cleanIcon.startsWith('/') ||
        cleanIcon.startsWith('./')
    );
};

// Simple, caretaker-friendly inline editable component that avoids cursor jumps
const EditableField = ({
    value,
    onChange,
    placeholder,
    disabled,
    tagName: Tag = 'div',
    className,
    style,
    ...props
}) => {
    const elementRef = useRef(null);

    useEffect(() => {
        if (elementRef.current && elementRef.current.innerText !== value) {
            elementRef.current.innerText = value || '';
        }
    }, [value]);

    const handleInput = () => {
        if (onChange && elementRef.current) {
            onChange(elementRef.current.innerText);
        }
    };

    return (
        <Tag
            ref={elementRef}
            contentEditable={!disabled}
            suppressContentEditableWarning
            onInput={handleInput}
            className={className}
            style={{
                outline: 'none',
                border: !disabled ? '1px dashed #1677ff44' : 'none',
                padding: !disabled ? '4px 8px' : '0',
                borderRadius: '6px',
                cursor: !disabled ? 'text' : 'inherit',
                minWidth: '50px',
                display: Tag === 'span' && !disabled ? 'inline-block' : undefined,
                transition: 'all 0.2s ease',
                ...style,
            }}
            placeholder={placeholder}
            {...props}
        />
    );
};

// Interactive Icon Selector supporting Emoji or Uploads
const IconPicker = ({ icon, onChange, uploadFile, canEdit }) => {
    const [visible, setVisible] = useState(false);
    const [inputValue, setInputValue] = useState(icon || '');

    useEffect(() => {
        setInputValue(icon || '');
    }, [icon]);

    const handleApply = () => {
        onChange(inputValue);
        setVisible(false);
    };

    if (!canEdit) {
        return (
            <div className="icon">
                {isImageLink(icon) ? (
                    <img
                        src={
                            icon.startsWith('/') && !icon.startsWith('//')
                                ? `${AppConstants.contentRootUrl}${icon}`
                                : icon
                        }
                        alt="icon"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    icon || '💡'
                )}
            </div>
        );
    }

    const content = (
        <div style={{ width: 240, padding: '4px' }}>
            <div style={{ marginBottom: 12 }}>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, fontSize: 13, color: '#333' }}>
                    Emoji / Ký tự:
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ví dụ: 💡, 📄, 👥"
                        onPressEnter={handleApply}
                        size="small"
                    />
                    <Button type="primary" size="small" onClick={handleApply}>
                        Ok
                    </Button>
                </div>
            </div>
            <div>
                <label style={{ fontWeight: 600, display: 'block', marginBottom: 6, fontSize: 13, color: '#333' }}>
                    Hoặc tải ảnh lên:
                </label>
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file && uploadFile) {
                            uploadFile(
                                file,
                                (url) => {
                                    onChange(url);
                                    setVisible(false);
                                },
                                (err) => {
                                    console.error(err);
                                },
                            );
                        }
                    }}
                    style={{ fontSize: 12, width: '100%' }}
                />
            </div>
        </div>
    );

    return (
        <Popover
            content={content}
            title="Đổi Icon"
            trigger="click"
            open={visible}
            onOpenChange={setVisible}
            placement="bottom"
        >
            <div className="icon" style={{ cursor: 'pointer', position: 'relative' }}>
                {isImageLink(icon) ? (
                    <img
                        src={
                            icon.startsWith('/') && !icon.startsWith('//')
                                ? `${AppConstants.contentRootUrl}${icon}`
                                : icon
                        }
                        alt="icon"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                ) : (
                    icon || '💡'
                )}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontSize: 12,
                        color: 'white',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        borderRadius: '50%',
                    }}
                    className="icon-hover-overlay"
                >
                    Đổi
                </div>
            </div>
        </Popover>
    );
};

const OverviewEditor = ({ value, onChange, canEdit, uploadFile }) => {
    const quillModules = useMemo(
        () => ({
            toolbar: [
                [{ header: [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                [{ color: [] }, { background: [] }],
                ['link'],
                ['clean'],
            ],
        }),
        [],
    );

    const quillFormats = [
        'header',
        'bold',
        'italic',
        'underline',
        'strike',
        'list',
        'bullet',
        'color',
        'background',
        'link',
    ];

    const data = value || {
        hero: { title: '', description: '', badges: [], button: '' },
        intro: { content: '' },
        howItWorks: { title: '', items: [] },
    };

    const triggerChange = (changedData) => {
        if (onChange) {
            onChange({
                ...data,
                ...changedData,
            });
        }
    };

    const handleUpdateHero = (field, val) => {
        triggerChange({
            hero: {
                ...data.hero,
                [field]: val,
            },
        });
    };

    const handleUpdateIntro = (val) => {
        triggerChange({
            intro: {
                content: val,
            },
        });
    };

    const handleUpdateHowItWorksTitle = (val) => {
        triggerChange({
            howItWorks: {
                ...data.howItWorks,
                title: val,
            },
        });
    };

    const handleAddBadge = () => {
        const badges = [...(data.hero?.badges || []), 'Nhãn mới'];
        handleUpdateHero('badges', badges);
    };

    const handleUpdateBadge = (index, val) => {
        const badges = [...(data.hero?.badges || [])];
        badges[index] = val;
        handleUpdateHero('badges', badges);
    };

    const handleRemoveBadge = (index) => {
        const badges = (data.hero?.badges || []).filter((_, i) => i !== index);
        handleUpdateHero('badges', badges);
    };

    const handleAddHowItWorksItem = () => {
        const items = [...(data.howItWorks?.items || []), { icon: '💡', text: 'Nhập mô tả nhiệm vụ...' }];
        triggerChange({
            howItWorks: {
                ...data.howItWorks,
                items,
            },
        });
    };

    const handleUpdateHowItWorksItem = (index, field, val) => {
        const items = [...(data.howItWorks?.items || [])];
        items[index] = {
            ...items[index],
            [field]: val,
        };
        triggerChange({
            howItWorks: {
                ...data.howItWorks,
                items,
            },
        });
    };

    const handleRemoveHowItWorksItem = (index) => {
        const items = (data.howItWorks?.items || []).filter((_, i) => i !== index);
        triggerChange({
            howItWorks: {
                ...data.howItWorks,
                items,
            },
        });
    };

    return (
        <>
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                .overview-html-editor {
                    max-width: 1100px;
                    margin: 16px auto;
                    padding: 24px;
                    background: white;
                    font-family: var(--font-sans);
                    border: 1px solid #edf2f7;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
                }
                .overview-html-editor h1 {
                    font-size: 28px;
                    line-height: 1.3;
                    color: #1f2937;
                    font-weight: 700;
                    margin: 0 0 12px 0;
                }
                .overview-html-editor h2 {
                    font-size: 22px;
                    color: #1f2937;
                    font-weight: 700;
                    margin: 0 0 16px 0;
                }
                .overview-html-editor p {
                    font-size: 15px;
                    line-height: 1.6;
                    color: #4b5563;
                    margin: 0 0 16px 0;
                }
                .overview-html-editor .badges {
                    margin: 16px 0;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    align-items: center;
                }
                .overview-html-editor .badges .badge-item-container {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                }
                .overview-html-editor .badges span.badge-text {
                    color: #0062e3;
                    font-weight: 600;
                    font-size: 13px;
                    background: #e3f0ff;
                    border: 1px solid #b3d7ff;
                    padding: 4px 12px;
                    border-radius: 20px;
                    display: inline-block;
                    transition: all 0.2s ease;
                }
                .overview-html-editor .badges .badge-delete-btn {
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: #ff4d4f;
                    color: white;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-size: 10px;
                    cursor: pointer;
                    border: 1.5px solid white;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                    z-index: 10;
                }
                .overview-html-editor .badges .badge-item-container:hover .badge-delete-btn {
                    opacity: 1;
                }
                .overview-html-editor .cta {
                    display: inline-block;
                    border: 2px solid #0062e3;
                    color: #0062e3;
                    padding: 8px 18px;
                    border-radius: 8px;
                    margin-top: 16px;
                    font-weight: 700;
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .overview-html-editor .cta:hover {
                    background: #0062e3;
                    color: white;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0, 98, 227, 0.15);
                }
                .overview-html-editor .feature-card {
                    display: flex;
                    gap: 16px;
                    padding: 16px;
                    border-radius: 12px;
                    background: white;
                    border: 1.5px solid #edf2f7;
                    margin-bottom: 12px;
                    position: relative;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .overview-html-editor .feature-card:hover {
                    border-color: #0062e3;
                    box-shadow: 0 12px 20px -8px rgba(0, 98, 227, 0.15);
                    transform: translateY(-2px);
                }
                .overview-html-editor .icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    background: #0062e3;
                    color: white;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-size: 20px;
                    flex-shrink: 0;
                    overflow: hidden;
                    transition: all 0.2s ease;
                }
                .overview-html-editor .icon:hover .icon-hover-overlay {
                    opacity: 1 !important;
                }
                .overview-html-editor .content {
                    flex: 1;
                    font-size: 14px;
                    line-height: 1.6;
                    color: #4b5563;
                    border: 1px dashed transparent;
                }
                .overview-html-editor .feature-card:hover .step-delete-btn {
                    opacity: 1 !important;
                }
                .overview-html-editor hr {
                    border: none;
                    border-top: 1.5px solid #e5e7eb;
                    margin: 24px 0;
                }
                .overview-html-editor [contenteditable]:focus {
                    border-color: #0062e3 !important;
                    outline: none;
                    box-shadow: 0 0 0 2px rgba(0, 98, 227, 0.1);
                    background: #fcfdfe;
                }
                .overview-html-editor [contenteditable]:empty:before {
                    content: attr(placeholder);
                    color: #9ca3af;
                    font-style: italic;
                    cursor: text;
                }
                .overview-html-editor .ql-container.ql-snow {
                    border: none !important;
                }
                .overview-html-editor .ql-editor {
                    font-size: 15px !important;
                    line-height: 1.6 !important;
                    color: #4b5563 !important;
                    font-family: var(--font-sans) !important;
                    padding: 0 !important;
                    min-height: 80px;
                }
                .overview-html-editor .ql-toolbar.ql-snow {
                    border: 1px dashed #d9d9d9 !important;
                    border-radius: 6px;
                    margin-bottom: 12px;
                    background: #fafafa;
                }
                `,
                }}
            />
            <Divider orientation="left">Tổng quan (Skyscanner style)</Divider>
            <div className="overview-html-editor">
                {/* HERO SECTION */}
                <section>
                    <EditableField
                        value={data.hero?.title}
                        onChange={(val) => handleUpdateHero('title', val)}
                        disabled={!canEdit}
                        tagName="h1"
                        placeholder="Nhập tiêu đề Banner..."
                    />

                    <EditableField
                        value={data.hero?.description}
                        onChange={(val) => handleUpdateHero('description', val)}
                        disabled={!canEdit}
                        tagName="p"
                        placeholder="Nhập mô tả ngắn Banner..."
                    />

                    <div className="badges">
                        {(data.hero?.badges || []).map((badge, index) => (
                            <div key={index} className="badge-item-container">
                                <EditableField
                                    value={badge}
                                    onChange={(val) => handleUpdateBadge(index, val)}
                                    disabled={!canEdit}
                                    tagName="span"
                                    className="badge-text"
                                    placeholder="Nhãn..."
                                />
                                {canEdit && (
                                    <div className="badge-delete-btn" onClick={() => handleRemoveBadge(index)}>
                                        ✕
                                    </div>
                                )}
                            </div>
                        ))}
                        {canEdit && (
                            <Button
                                type="dashed"
                                size="small"
                                onClick={handleAddBadge}
                                icon={<PlusOutlined />}
                                style={{
                                    borderRadius: '20px',
                                    color: '#1677ff',
                                    borderColor: '#1677ff',
                                    fontWeight: 600,
                                    height: '32px',
                                }}
                            >
                                Thêm Badge
                            </Button>
                        )}
                    </div>

                    <EditableField
                        value={data.hero?.button}
                        onChange={(val) => handleUpdateHero('button', val)}
                        disabled={!canEdit}
                        tagName="div"
                        className="cta"
                        placeholder="Nút hành động..."
                    />
                </section>

                <hr />

                {/* INTRO SECTION */}
                <section style={{ marginBottom: '40px' }}>
                    {canEdit ? (
                        <ReactQuill
                            theme="snow"
                            value={data.intro?.content || ''}
                            onChange={handleUpdateIntro}
                            modules={quillModules}
                            formats={quillFormats}
                            placeholder="Nhập nội dung giới thiệu..."
                        />
                    ) : (
                        <div
                            className="ql-editor"
                            style={{ padding: 0 }}
                            dangerouslySetInnerHTML={{ __html: data.intro?.content || '' }}
                        />
                    )}
                </section>

                {/* HOW IT WORKS SECTION */}
                <section>
                    <EditableField
                        value={data.howItWorks?.title}
                        onChange={(val) => handleUpdateHowItWorksTitle(val)}
                        disabled={!canEdit}
                        tagName="h2"
                        placeholder="Tiêu đề hoạt động..."
                    />

                    {(data.howItWorks?.items || []).map((item, index) => (
                        <div key={index} className="feature-card">
                            <IconPicker
                                icon={item.icon}
                                onChange={(newIcon) => handleUpdateHowItWorksItem(index, 'icon', newIcon)}
                                uploadFile={uploadFile}
                                canEdit={canEdit}
                            />

                            <EditableField
                                value={item.text}
                                onChange={(val) => handleUpdateHowItWorksItem(index, 'text', val)}
                                disabled={!canEdit}
                                tagName="div"
                                className="content"
                                placeholder="Nhập nội dung mô tả bước..."
                            />

                            {canEdit && (
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => handleRemoveHowItWorksItem(index)}
                                    style={{
                                        position: 'absolute',
                                        top: '12px',
                                        right: '12px',
                                        opacity: 0,
                                        transition: 'opacity 0.2s ease',
                                    }}
                                    className="step-delete-btn"
                                />
                            )}
                        </div>
                    ))}

                    {canEdit && (
                        <Button
                            type="dashed"
                            onClick={handleAddHowItWorksItem}
                            icon={<PlusOutlined />}
                            block
                            style={{
                                marginTop: '16px',
                                height: '56px',
                                borderRadius: '16px',
                                fontSize: '15px',
                                fontWeight: 600,
                            }}
                        >
                            Thêm bước hoạt động mới
                        </Button>
                    )}
                </section>
            </div>
        </>
    );
};

export default OverviewEditor;
