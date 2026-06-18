import React, { useMemo, useState } from 'react';
import { Empty, Modal, Upload, Input, Button, Tabs, message, Spin } from 'antd';
import { UploadOutlined, FileAddOutlined, BookOutlined } from '@ant-design/icons';
import useFetch from '@hooks/useFetch';
import apiConfig from '@constants/apiConfig';
import { AppConstants } from '@constants';
import EditableZone from './EditableZone';
import styles from './detail.module.scss';

/**
 * SimulationDetailPreview
 *
 * Props:
 *   previewData   – object từ SimulationForm
 *   tasks         – array nhiệm vụ (optional, default [])
 *   editable      – boolean (default false)
 *   onFieldChange – callback(fieldPath, value)
 *
 * fieldPath map:
 *   "title"                  → form.title
 *   "notice"                 → form.notice
 *   "totalEstimatedTime"     → form.totalEstimatedTime
 *   "description"            → descriptionContent (Quill HTML)
 *   "overview.intro.content" → overviewData.intro.content
 *                              → hiển thị trong phần "Tại sao..."
 *                                và cả phần body overview tab
 */
function SimulationDetailPreview({
    previewData = {},
    tasks = [],
    editable = false,
    onFieldChange,
    categories = [],
}) {
    const [activeTab, setActiveTab] = useState('overview');
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const { execute: executeUpFile } = useFetch(apiConfig.file.upload, { immediate: false });

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:image')) {
            return path;
        }
        return `${AppConstants.contentRootUrl}${path}`;
    };

    const getVideoUrl = (path) => {
        if (!path) return '';
        if (path.startsWith('http://') || path.startsWith('https://')) {
            return path;
        }
        return `${AppConstants.contentRootUrl}${path}`;
    };

    // ── Map previewData → simulation ─────────────────────────────────────────
    const simulation = useMemo(() => ({
        title:            previewData.title             || '',
        notice:           previewData.description       || '', // Mapped to description
        thumbnail:        previewData.imagePath         || null,
        level:            previewData.level?.value      ?? previewData.level ?? 1,
        duration:         previewData.totalEstimatedTime || '',
        description:      previewData.descriptionContent || '',
        overview:         previewData.overviewData      || null,
        avgStar:          previewData.avgStar           ?? undefined,
        totalParticipant: previewData.totalParticipant  ?? 0,
        educator:         previewData.educator          || null,
        categoryId:       previewData.categoryId        || null,
        category:         previewData.category          || null,
    }), [previewData]);

    const getLevelLabel = (level) =>
        ({ 1: 'Cơ bản', 2: 'Trung cấp', 3: 'Nâng cao' }[level] ?? 'Cơ bản');

    const getStarCount = (avgStar) => Math.round(avgStar || 0);

    const badgesString = Array.isArray(simulation.overview?.bager)
        ? simulation.overview.bager.join(', ')
        : (Array.isArray(simulation.overview?.barger)
            ? simulation.overview.barger.join(', ')
            : '');

    const skillsString = Array.isArray(simulation.overview?.skills)
        ? simulation.overview.skills.join(', ')
        : '';

    // ── EZ shorthand ────────────────────────────────────────────────────────
    const EZ = ({ fieldPath, value, type = 'text', label, children, options }) => (
        <EditableZone
            fieldPath={fieldPath}
            value={value}
            type={type}
            label={label}
            onCommit={onFieldChange}
            editable={editable}
            options={options}
        >
            {children}
        </EditableZone>
    );



    const TABS = [
        { key: 'overview', label: 'Tổng quan' },
        { key: 'tasks',    label: `Nhiệm vụ${tasks.length ? ` (${tasks.length})` : ''}` },
        { key: 'reviews',  label: 'Đánh giá' },
    ];

    return (
        <div style={{ background: '#fff', minHeight: '100%' }}>

            {/* Preview mode badge */}
            <div style={{
                ...badgeBase,
                background: editable ? '#1677ff' : '#faad14',
            }}>
                {editable
                    ? '✏️ CHẾ ĐỘ CHỈNH SỬA — Click vào text để sửa trực tiếp'
                    : '👁 XEM TRƯỚC'}
            </div>

            <div className={styles.page}>

                {/* ══ HERO ══════════════════════════════════════════════════════ */}
                <section className={styles.hero}>
                    <div className={styles.heroBg}>
                        {simulation.thumbnail
                            ? <img src={getImageUrl(simulation.thumbnail)} alt="" className={styles.heroBgImg} />
                            : <div className={styles.heroBgGradient} />
                        }
                        <div className={styles.heroBgOverlay} />
                    </div>

                    {editable && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsImageModalOpen(true);
                            }}
                            className={styles.changeBgBtn}
                        >
                            📷 Thay đổi ảnh bìa
                        </button>
                    )}

                    <div className={styles.heroInner}>
                        {/* LEFT */}
                        <div className={styles.heroLeft}>
                            {simulation?.educator?.organization?.logoUrl && (
                                <div className={styles.orgBadge}>
                                    <img
                                        src={simulation.educator.organization.logoUrl}
                                        alt={simulation.educator.organization.name}
                                        className={styles.orgLogo}
                                    />
                                    <span className={styles.orgName}>
                                        {simulation.educator.organization.shortName || simulation.educator.organization.name}
                                    </span>
                                </div>
                            )}

                            {/* EDITABLE: title */}
                            <EZ fieldPath="title" value={simulation.title} type="text" label="Tiêu đề">
                                <h1 className={styles.heroTitle}>
                                    {simulation.title || <span style={{ opacity: 0.4 }}>Tiêu đề bài mô phỏng</span>}
                                </h1>
                            </EZ>

                            {/* EDITABLE: description */}
                            <EZ fieldPath="description" value={simulation.notice} type="textarea" label="Mô tả ngắn">
                                <p className={styles.heroNotice}>
                                    {simulation.notice || <span style={{ opacity: 0.4 }}>Mô tả ngắn sẽ hiển thị ở đây</span>}
                                </p>
                            </EZ>

                            <div className={styles.heroMeta}>
                                {/* EDITABLE: categoryId */}
                                <EZ
                                    fieldPath="categoryId"
                                    value={simulation.categoryId}
                                    type="select"
                                    label="Chuyên ngành"
                                    options={categories}
                                >
                                    <span className={styles.heroMetaItem} style={{ cursor: 'pointer' }}>
                                        <BookOutlined style={{ marginRight: 6 }} />
                                        {simulation.category?.label || 'Chọn chuyên ngành'}
                                    </span>
                                </EZ>
                                <span className={styles.heroMetaDot} />

                                {/* EDITABLE: totalEstimatedTime */}
                                <EZ fieldPath="totalEstimatedTime" value={simulation.duration} type="text" label="Thời gian">
                                    <span className={styles.heroMetaItem}>
                                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.4"/>
                                            <path d="M7 4.5V7l1.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                                        </svg>
                                        {simulation.duration || 'Tự hoàn thành'}
                                    </span>
                                </EZ>
                                <span className={styles.heroMetaDot} />
                                <span className={styles.heroMetaItem}>
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                        <path d="M7 1.5l1.5 3 3.5.5-2.5 2.5.5 3.5L7 9.5l-3 1.5.5-3.5L2 5l3.5-.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                                    </svg>
                                    Miễn phí
                                </span>
                                <span className={styles.heroMetaDot} />
                                <span className={styles.heroMetaItem}>
                                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                        <path d="M2 11c0-2.2 2.2-4 5-4s5 1.8 5 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                                        <circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
                                    </svg>
                                    {simulation.totalParticipant?.toLocaleString() || 0} học viên
                                </span>
                                {simulation.avgStar !== undefined && (
                                    <>
                                        <span className={styles.heroMetaDot} />
                                        <span className={styles.heroMetaItem}>
                                            <span className={styles.heroStar}>★</span>
                                            {simulation.avgStar?.toFixed(1)}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* RIGHT — Enroll card (static) */}
                        <div className={styles.enrollCard}>
                            <div className={styles.enrollCardBadge}>
                                {getLevelLabel(simulation.level)}
                            </div>
                            <div className={styles.enrollCardTitle}>Sẵn sàng bắt đầu?</div>
                            <ul className={styles.enrollChecklist}>
                                <li><span className={styles.checkIcon}>✓</span> Hoàn thành công việc dự án thực tế. Tự hoàn thành.</li>
                                <li><span className={styles.checkIcon}>✓</span> Nhận chứng chỉ bổ sung vào hồ sơ & LinkedIn.</li>
                                <li><span className={styles.checkIcon}>✓</span> Không tính điểm, không áp lực.</li>
                            </ul>
                            <button className={styles.ctaBtn} disabled style={{ cursor: 'not-allowed', opacity: 0.7 }}>
                                Tham gia miễn phí
                            </button>
                            <p className={styles.enrollNote}>Hoàn toàn miễn phí · Không cần thẻ tín dụng</p>
                        </div>
                    </div>
                </section>

                {/* ══ TABS ══════════════════════════════════════════════════════ */}
                <div className={styles.tabsBar}>
                    <div className={styles.tabsInner}>
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                className={`${styles.tabBtn} ${activeTab === tab.key ? styles.tabBtnActive : ''}`}
                                onClick={() => setActiveTab(tab.key)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ══ CONTENT ═══════════════════════════════════════════════════ */}
                <main className={styles.main}>

                    {/* ── OVERVIEW TAB ── */}
                    {activeTab === 'overview' && (
                        <div className={styles.overviewLayout}>
                            <div className={styles.overviewBody}>

                                {/* ┌─ Phần "Tại sao..." ─────────────────────────────────┐ */}
                                <section className={styles.section}>
                                    <h2 className={styles.sectionTitle} style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                                        Tại sao nên hoàn thành bài mô phỏng công việc này?
                                    </h2>

                                    {/* EDITABLE: overview.introduction */}
                                    <EZ
                                        fieldPath="overview.introduction"
                                        value={simulation.overview?.introduction || ''}
                                        type="richtext"
                                        label="Nội dung giới thiệu"
                                    >
                                        {simulation.overview?.introduction ? (
                                            <div
                                                className={styles.bodyText}
                                                dangerouslySetInnerHTML={{ __html: simulation.overview.introduction }}
                                            />
                                        ) : (
                                            <p className={styles.bodyText} style={{ opacity: 0.4 }}>
                                                Nội dung giới thiệu sẽ hiển thị ở đây...
                                            </p>
                                        )}
                                    </EZ>

                                    <EZ fieldPath="overview.bager" value={badgesString} type="text" label="Các thẻ (phân cách bằng dấu phẩy)">
                                        <div className={styles.tagRow}>
                                            {(simulation.overview?.bager || simulation.overview?.barger) && (simulation.overview.bager || simulation.overview.barger).length > 0 ? (
                                                (simulation.overview.bager || simulation.overview.barger).map((badge, idx) => (
                                                    <span key={idx} className={styles.tagOutline}>
                                                        {badge}
                                                    </span>
                                                ))
                                            ) : (
                                                <span style={{ opacity: 0.4 }}>Chưa có thẻ nào. Click để thêm.</span>
                                            )}
                                        </div>
                                    </EZ>
                                </section>
                                {/* └────────────────────────────────────────────────────┘ */}
                                {/* ┌─ Section sau đường kẻ ──────────────────────────────┐ */}
                                <section className={styles.section} style={{ marginTop: 24 }}>
                                    <EZ
                                        fieldPath="overview.content"
                                        value={simulation.overview?.content || ''}
                                        type="richtext"
                                        label="Nội dung chính"
                                    >
                                        {simulation.overview?.content ? (
                                            <div
                                                className={styles.bodyText}
                                                dangerouslySetInnerHTML={{ __html: simulation.overview.content }}
                                            />
                                        ) : (
                                            <p className={styles.bodyText} style={{ opacity: 0.4 }}>
                                                Nội dung giới thiệu sẽ hiển thị ở đây...
                                            </p>
                                        )}
                                    </EZ>
                                </section>
                                {/* └────────────────────────────────────────────────────┘ */}

                                {/* ┌─ Video section ─────────────────────────────────────┐ */}
                                <section className={styles.section} style={{ marginTop: 24 }}>
                                    <h2 className={styles.sectionTitle}>Video</h2>
                                    {previewData.videoPath ? (
                                        <div style={{ position: 'relative', width: '100%', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
                                            <video
                                                controls
                                                style={{ width: '100%', display: 'block' }}
                                                key={previewData.videoPath}
                                            >
                                                <source src={getVideoUrl(previewData.videoPath)} />
                                                Trình duyệt của bạn không hỗ trợ phát video.
                                            </video>
                                        </div>
                                    ) : (
                                        <div style={{ padding: '24px', border: '1px dashed #d9d9d9', borderRadius: 8, textAlign: 'center', background: '#fafafa', color: '#888' }}>
                                            Chưa có video giới thiệu.
                                        </div>
                                    )}

                                    {editable && (
                                        <div style={{ marginTop: 12 }}>
                                            <Button
                                                type="dashed"
                                                icon={<span>📹</span>}
                                                onClick={() => setIsVideoModalOpen(true)}
                                            >
                                                Cập nhật Video
                                            </Button>
                                        </div>
                                    )}
                                </section>
                                {/* └────────────────────────────────────────────────────┘ */}
                            </div>

                            {/* SKILLS SIDEBAR */}
                            <aside className={styles.overviewSidebar}>
                                <div className={styles.sideCard}>
                                    <div className={styles.sideCardTitle}>Kỹ năng bạn sẽ thực hành</div>
                                    <EZ fieldPath="overview.skills" value={skillsString} type="text" label="Các kỹ năng (phân cách bằng dấu phẩy)">
                                        <div className={styles.skillPills}>
                                            {simulation.overview?.skills && simulation.overview.skills.length > 0 ? (
                                                simulation.overview.skills.map((s) => (
                                                    <span key={s} className={styles.skillPill}>{s}</span>
                                                ))
                                            ) : (
                                                <span style={{ opacity: 0.4, fontSize: 12 }}>Chưa có kỹ năng nào. Click để thêm.</span>
                                            )}
                                        </div>
                                    </EZ>
                                    {simulation.overview?.skills && simulation.overview.skills.length > 5 && (
                                        <button className={styles.sideCardLink}>Xem tất cả kỹ năng →</button>
                                    )}
                                </div>
                                <div className={styles.sideCard}>
                                    <div className={styles.sideCardTitle}>Thông tin</div>
                                    <div className={styles.infoList}>
                                        <div className={styles.infoRow}>
                                            <span className={styles.infoLabel}>Thời gian</span>
                                            <EZ fieldPath="totalEstimatedTime" value={simulation.duration} type="text" label="Thời gian">
                                                <span className={styles.infoVal} style={{ cursor: 'pointer' }}>{simulation.duration || '—'}</span>
                                            </EZ>
                                        </div>
                                        <div className={styles.infoRow}>
                                            <span className={styles.infoLabel}>Chuyên ngành</span>
                                            <EZ
                                                fieldPath="categoryId"
                                                value={simulation.categoryId}
                                                type="select"
                                                label="Chuyên ngành"
                                                options={categories}
                                            >
                                                <span className={styles.infoVal} style={{ cursor: 'pointer' }}>{simulation.category?.label || '—'}</span>
                                            </EZ>
                                        </div>
                                        <div className={styles.infoRow}>
                                            <span className={styles.infoLabel}>Cấp độ</span>
                                            <EZ
                                                fieldPath="level"
                                                value={simulation.level}
                                                type="select"
                                                label="Cấp độ"
                                                options={[
                                                    { value: 1, label: 'Cơ bản' },
                                                    { value: 2, label: 'Trung cấp' },
                                                    { value: 3, label: 'Nâng cao' },
                                                ]}
                                            >
                                                <span className={styles.infoVal} style={{ cursor: 'pointer' }}>{getLevelLabel(simulation.level)}</span>
                                            </EZ>
                                        </div>
                                        <div className={styles.infoRow}>
                                            <span className={styles.infoLabel}>Học viên</span>
                                            <span className={styles.infoVal}>{simulation.totalParticipant?.toLocaleString() || 0}</span>
                                        </div>
                                        <div className={styles.infoRow}>
                                            <span className={styles.infoLabel}>Nhiệm vụ</span>
                                            <span className={styles.infoVal}>{tasks.length}</span>
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    )}

                    {/* ── TASKS TAB ── */}
                    {activeTab === 'tasks' && (
                        <div className={styles.tasksLayout}>
                            {tasks.length > 0 ? (
                                <p style={{ padding: 24 }}>TaskPanel: {tasks.length} nhiệm vụ</p>
                            ) : (
                                <div className={styles.emptyWrap}>
                                    <Empty description="Chưa có nhiệm vụ nào" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── REVIEWS TAB ── */}
                    {activeTab === 'reviews' && (
                        <div className={styles.reviewsLayout}>
                            <div className={styles.reviewsSummary}>
                                <div className={styles.reviewsScore}>{simulation.avgStar?.toFixed(1) || '—'}</div>
                                <div className={styles.reviewsStars}>
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <span key={n} className={n <= getStarCount(simulation.avgStar) ? styles.starFilled : styles.starEmpty}>★</span>
                                    ))}
                                </div>
                                <div className={styles.reviewsTotal}>{simulation.totalParticipant || 0} đánh giá</div>
                            </div>
                            <div className={styles.reviewsCarousel}>
                                <button className={styles.reviewArrow}>
                                    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11L5 7l4-4"/></svg>
                                </button>
                                <blockquote className={styles.reviewQuote}>
                                    <p>&quot;Bài mô phỏng rất hấp dẫn và thực tế.&quot;</p>
                                    <footer>— Học viên từ {simulation.educator?.organization?.name || 'cộng đồng'}</footer>
                                </blockquote>
                                <button className={styles.reviewArrow}>
                                    <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 3l4 4-4 4"/></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </main>

                {/* ══ BOTTOM CTA ════════════════════════════════════════════════ */}
                <div className={styles.bottomCta}>
                    <span>Chưa tìm thấy bài mô phỏng phù hợp?</span>
                    <a href="/" className={styles.bottomCtaLink}>Xem các bài khác →</a>
                </div>
            </div>

            {/* Modals for Image and Video Upload */}
            <ImageUploadModal
                open={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                onSave={(url) => {
                    onFieldChange?.('imagePath', url);
                    setIsImageModalOpen(false);
                }}
                executeUpFile={executeUpFile}
            />

            <VideoUploadModal
                open={isVideoModalOpen}
                onClose={() => setIsVideoModalOpen(false)}
                onSave={(url) => {
                    onFieldChange?.('videoPath', url);
                    setIsVideoModalOpen(false);
                }}
                executeUpFile={executeUpFile}
            />
        </div>
    );
}

// ── Modals & Upload Helpers ──────────────────────────────────────────────────
function ImageUploadModal({ open, onClose, onSave, executeUpFile }) {
    const [activeTab, setActiveTab] = useState('upload');
    const [url, setUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    const handleUpload = ({ file, onSuccess, onError }) => {
        setUploading(true);
        executeUpFile({
            data: {
                type: 'IMAGE',
                file: file,
            },
            onCompleted: (response) => {
                setUploading(false);
                if (response.result === true) {
                    onSuccess();
                    onSave(response.data.filePath);
                } else {
                    onError();
                    message.error(response.message || 'Upload thất bại');
                }
            },
            onError: () => {
                setUploading(false);
                onError();
                message.error('Lỗi kết nối khi upload');
            },
        });
    };

    const handleOk = () => {
        if (activeTab === 'url') {
            if (!url.trim()) {
                message.warning('Vui lòng nhập đường dẫn ảnh');
                return;
            }
            onSave(url.trim());
        }
    };

    return (
        <Modal
            title="Cập nhật ảnh bìa bài mô phỏng"
            open={open}
            onCancel={onClose}
            onOk={handleOk}
            footer={activeTab === 'upload' ? null : undefined}
            destroyOnClose
        >
            <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                {
                    key: 'upload',
                    label: 'Upload File',
                    children: (
                        <div style={{ padding: '24px 0', textAlign: 'center' }}>
                            <Upload.Dragger
                                accept="image/*"
                                multiple={false}
                                customRequest={handleUpload}
                                showUploadList={false}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <Spin tip="Đang tải lên..." />
                                ) : (
                                    <>
                                        <p className="ant-upload-drag-icon">
                                            <UploadOutlined style={{ fontSize: 32, color: '#1677ff' }} />
                                        </p>
                                        <p className="ant-upload-text">Kéo thả file ảnh vào đây hoặc click để chọn file</p>
                                        <p className="ant-upload-hint">Chấp nhận định dạng JPG, PNG, WEBP...</p>
                                    </>
                                )}
                            </Upload.Dragger>
                        </div>
                    ),
                },
                {
                    key: 'url',
                    label: 'Đường dẫn liên kết (URL)',
                    children: (
                        <div style={{ padding: '16px 0' }}>
                            <div style={{ marginBottom: 8 }}>Nhập URL ảnh:</div>
                            <Input
                                placeholder="https://example.com/image.png"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                            />
                        </div>
                    ),
                },
            ]} />
        </Modal>
    );
}

function VideoUploadModal({ open, onClose, onSave, executeUpFile }) {
    const [activeTab, setActiveTab] = useState('upload');
    const [url, setUrl] = useState('');
    const [uploading, setUploading] = useState(false);

    const handleUpload = ({ file, onSuccess, onError }) => {
        setUploading(true);
        executeUpFile({
            data: {
                type: 'VIDEO',
                file: file,
            },
            onCompleted: (response) => {
                setUploading(false);
                if (response.result === true) {
                    onSuccess();
                    onSave(response.data.filePath);
                } else {
                    onError();
                    message.error(response.message || 'Upload thất bại');
                }
            },
            onError: (err) => {
                setUploading(false);
                onError(err);
                message.error('Lỗi kết nối khi upload');
            },
        });
    };

    const handleOk = () => {
        if (activeTab === 'url') {
            if (!url.trim()) {
                message.warning('Vui lòng nhập đường dẫn video');
                return;
            }
            onSave(url.trim());
        }
    };

    return (
        <Modal
            title="Cập nhật video giới thiệu"
            open={open}
            onCancel={onClose}
            onOk={handleOk}
            footer={activeTab === 'upload' ? null : undefined}
            destroyOnClose
        >
            <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
                {
                    key: 'upload',
                    label: 'Upload File',
                    children: (
                        <div style={{ padding: '24px 0', textAlign: 'center' }}>
                            <Upload.Dragger
                                accept="video/*"
                                multiple={false}
                                customRequest={handleUpload}
                                showUploadList={false}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <Spin tip="Đang tải lên..." />
                                ) : (
                                    <>
                                        <p className="ant-upload-drag-icon">
                                            <FileAddOutlined style={{ fontSize: 32, color: '#1677ff' }} />
                                        </p>
                                        <p className="ant-upload-text">Kéo thả file video vào đây hoặc click để chọn file</p>
                                        <p className="ant-upload-hint">Chấp nhận định dạng MP4, WEBM...</p>
                                    </>
                                )}
                            </Upload.Dragger>
                        </div>
                    ),
                },
                {
                    key: 'url',
                    label: 'Đường dẫn liên kết (URL)',
                    children: (
                        <div style={{ padding: '16px 0' }}>
                            <div style={{ marginBottom: 8 }}>Nhập URL video:</div>
                            <Input
                                placeholder="https://example.com/video.mp4"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                            />
                        </div>
                    ),
                },
            ]} />
        </Modal>
    );
}

const badgeBase = {
    position:      'sticky',
    top:           0,
    zIndex:        100,
    textAlign:     'center',
    fontSize:      12,
    fontWeight:    600,
    padding:       '5px 0',
    letterSpacing: 0.5,
    color:         '#fff',
};



export default SimulationDetailPreview;