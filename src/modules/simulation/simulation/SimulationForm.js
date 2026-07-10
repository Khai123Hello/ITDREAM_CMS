import React, { useEffect, useState, useCallback } from 'react';
import { Space, Switch, Tooltip, Form } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { BaseForm } from '@components/common/form/BaseForm';
import useBasicForm from '@hooks/useBasicForm';
import { UserTypes } from '@constants';
import { getData } from '@utils/localStorage';
import { storageKeys } from '@constants';
import SimulationDetailPreview from '@components/simulation/SimulationDetailPreview';

const DEFAULT_OVERVIEW_TEMPLATE = {
    introduction: '',
    bager: ['Tự học theo tốc độ riêng', '1–2 giờ', 'Không có điểm số', 'Không có bài kiểm tra nào', 'Giới thiệu'],
    content: '',
    skills: [],
};

const SimulationForm = (props) => {
    const { formId, actions, dataDetail, onSubmit, setIsChangedFormValues, categories, levels } = props;

    const userType = getData(storageKeys.USER_TYPE);
    const canEdit = userType === UserTypes.EDUCATOR;

    // ── State + ref sync ─────────────────────────────────────────────────────
    // Mỗi setter ghi đồng thời vào React state (re-render) và ref (không stale)
    const latestState = React.useRef({
        imagePath: null,
        videoUrl: '',
        overviewData: DEFAULT_OVERVIEW_TEMPLATE,
    });

    const setImagePath = (val) => {
        _setImagePath(val);
        latestState.current.imagePath = val;
    };
    const setVideoUrl = (val) => {
        _setVideoUrl(val);
        latestState.current.videoUrl = val;
    };
    const setOverviewData = (val) => {
        _setOverviewData(val);
        latestState.current.overviewData = val;
    };

    const [_imagePath, _setImagePath] = useState(null);
    const [_videoUrl, _setVideoUrl] = useState('');
    const [_overviewData, _setOverviewData] = useState(DEFAULT_OVERVIEW_TEMPLATE);

    const imagePath = _imagePath;
    const videoUrl = _videoUrl;
    const overviewData = _overviewData;

    // ── UI state ─────────────────────────────────────────────────────────────
    const [previewEditable, setPreviewEditable] = useState(true); // mặc định bật
    const [previewData, setPreviewData] = useState({});

    const { form, mixinFuncs, onValuesChange } = useBasicForm({ onSubmit, setIsChangedFormValues });

    // ── Parse helpers ────────────────────────────────────────────────────────
    const cleanQuillHtml = (html) => {
        if (!html || html === '<p><br></p>') return '';
        return html.trim().replace(/(<p><br><\/p>|<p><\/p>)+$/g, '');
    };

    const parseOverviewData = (overviewStr) => {
        const fallbackTemplate = {
            introduction: '',
            bager: [
                'Tự học theo tốc độ riêng',
                '1–2 giờ',
                'Không có điểm số',
                'Không có bài kiểm tra nào',
                'Giới thiệu',
            ],
            content: '',
            skills: [],
        };
        if (!overviewStr) return fallbackTemplate;
        try {
            const parsed = JSON.parse(overviewStr);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return {
                    introduction: parsed.introduction || parsed.hero?.description || '',
                    bager: Array.isArray(parsed.bager)
                        ? parsed.bager
                        : Array.isArray(parsed.barger)
                          ? parsed.barger
                          : Array.isArray(parsed.hero?.badges)
                            ? parsed.hero.badges
                            : fallbackTemplate.bager,
                    content: parsed.content || parsed.intro?.content || '',
                    skills: Array.isArray(parsed.skills) ? parsed.skills : fallbackTemplate.skills,
                };
            }
        } catch (e) {
            // ignore
        }
        return { ...fallbackTemplate, content: overviewStr };
    };

    // ── Build & refresh preview ──────────────────────────────────────────────
    const buildPreviewData = useCallback(
        (overrides = {}) => {
            const formValues = form.getFieldsValue(true);
            const latest = latestState.current;
            return {
                ...formValues,
                imagePath: overrides.imagePath ?? latest.imagePath,
                videoPath: overrides.videoUrl ?? latest.videoUrl,
                overviewData: overrides.overviewData ?? latest.overviewData,
                category: categories?.find((c) => c.value == formValues.categoryId),
                level: levels?.find((l) => l.value == formValues.level),
            };
        },
        [form, categories, levels],
    );

    const refreshPreview = useCallback(
        (overrides = {}) => {
            setPreviewData(buildPreviewData(overrides));
        },
        [buildPreviewData],
    );

    // ── Load dataDetail ──────────────────────────────────────────────────────
    useEffect(() => {
        if (dataDetail && Object.keys(dataDetail).length > 0) {
            form.setFieldsValue({
                ...dataDetail,
                categoryId: dataDetail.category?.id || dataDetail.specialization?.id,
                totalEstimatedTime: dataDetail.duration || dataDetail.totalEstimatedTime,
                description: dataDetail.description || '',
            });

            const newImagePath = dataDetail.thumbnail || dataDetail.imagePath || null;
            const newVideoUrl = dataDetail.videoPath || '';
            const newOverviewData = dataDetail.overview
                ? parseOverviewData(dataDetail.overview)
                : DEFAULT_OVERVIEW_TEMPLATE;

            latestState.current = {
                imagePath: newImagePath,
                videoUrl: newVideoUrl,
                overviewData: newOverviewData,
            };

            _setImagePath(newImagePath);
            _setVideoUrl(newVideoUrl);
            _setOverviewData(newOverviewData);
        } else {
            form.setFieldsValue({
                title: '',
                description: '',
                totalEstimatedTime: '',
                categoryId: undefined,
                level: 1,
            });

            latestState.current = {
                imagePath: null,
                videoUrl: '',
                overviewData: DEFAULT_OVERVIEW_TEMPLATE,
            };

            _setImagePath(null);
            _setVideoUrl('');
            _setOverviewData(DEFAULT_OVERVIEW_TEMPLATE);
        }

        setPreviewData(buildPreviewData());
    }, [dataDetail]); // eslint-disable-line

    // Cập nhật previewData khi categories hoặc levels hoàn thành việc tải/thay đổi
    useEffect(() => {
        setPreviewData(buildPreviewData());
    }, [categories, levels, buildPreviewData]);

    // ────────────────────────────────────────────────────────────────────────
    // handleFieldChange — nhận edit từ preview, sync về form + state
    //
    // Lưu ý: các field form (title, notice, totalEstimatedTime) cần
    // setFieldsValue TRƯỚC KHI gọi refreshPreview, vì buildPreviewData
    // đọc formValues qua form.getFieldsValue() — nếu set sau thì preview
    // sẽ hiển thị giá trị cũ một lần trước khi update.
    // ────────────────────────────────────────────────────────────────────────
    const handleFieldChange = useCallback(
        (fieldPath, value) => {
            setIsChangedFormValues(true);

            // ── Form fields đơn giản ─────────────────────────────────────────────
            if (['title', 'description', 'totalEstimatedTime', 'level', 'categoryId'].includes(fieldPath)) {
                const finalValue = ['level', 'categoryId'].includes(fieldPath) ? Number(value) : value;
                form.setFieldsValue({ [fieldPath]: finalValue });
                refreshPreview();
                return;
            }

            // ── imagePath / thumbnail ────────────────────────────────────────────
            if (fieldPath === 'imagePath' || fieldPath === 'thumbnail') {
                setImagePath(value);
                refreshPreview({ imagePath: value });
                return;
            }

            // ── videoPath / videoUrl ─────────────────────────────────────────────
            if (fieldPath === 'videoPath' || fieldPath === 'videoUrl') {
                setVideoUrl(value);
                refreshPreview({ videoUrl: value });
                return;
            }

            // ── overview.introduction ─────────────────────────────────────────────
            if (fieldPath === 'overview.introduction') {
                const current = { ...latestState.current.overviewData };
                const updated = {
                    ...current,
                    introduction: value,
                };
                setOverviewData(updated);
                refreshPreview({ overviewData: updated });
                return;
            }

            // ── overview.content ──────────────────────────────────────────────────
            if (fieldPath === 'overview.content') {
                const current = { ...latestState.current.overviewData };
                const updated = {
                    ...current,
                    content: value,
                };
                setOverviewData(updated);
                refreshPreview({ overviewData: updated });
                return;
            }

            // ── overview.bager ────────────────────────────────────────────────────
            if (fieldPath === 'overview.bager') {
                const current = { ...latestState.current.overviewData };
                const updated = {
                    ...current,
                    bager: value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                };
                setOverviewData(updated);
                refreshPreview({ overviewData: updated });
                return;
            }

            // ── overview.skills ───────────────────────────────────────────────────
            if (fieldPath === 'overview.skills') {
                const current = { ...latestState.current.overviewData };
                const updated = {
                    ...current,
                    skills: value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                };
                setOverviewData(updated);
                refreshPreview({ overviewData: updated });
                return;
            }

            console.warn('[SimulationForm] handleFieldChange: unknown fieldPath', fieldPath);
        },
        [form, setIsChangedFormValues, refreshPreview, setImagePath, setVideoUrl, setOverviewData],
    );

    // ── Submit ───────────────────────────────────────────────────────────────
    const handleSubmit = (values) => {
        mixinFuncs.handleSubmit({
            ...values,
            thumbnail: imagePath || null,
            videoPath: videoUrl || null,
            duration: values.totalEstimatedTime || '',
            description: values.description || '',
            overview: JSON.stringify({
                introduction: cleanQuillHtml(overviewData.introduction),
                bager: overviewData.bager || [],
                content: cleanQuillHtml(overviewData.content),
                skills: overviewData.skills || [],
            }),
        });
    };

    // ─────────────────────────────────────────────────────────────────────────
    // RENDER — chỉ có preview panel, edit panel đã bỏ
    // BaseForm ẩn (display:none) vẫn cần để submit hoạt động đúng
    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div style={styles.root}>
            {/* BaseForm ẩn — chỉ để submit, validation, không render UI */}
            <BaseForm
                id={formId}
                onFinish={handleSubmit}
                form={form}
                onValuesChange={onValuesChange}
                style={{ display: 'none' }}
            >
                <Form.Item name="title" />
                <Form.Item name="description" />
                <Form.Item name="totalEstimatedTime" />
                <Form.Item name="categoryId" />
                <Form.Item name="level" />
            </BaseForm>

            {/* ══ PREVIEW PANEL (100%) ═════════════════════════════════════════ */}
            <div style={styles.panel}>
                {/* Sticky header */}
                <div style={styles.header}>
                    {/* Trạng thái */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <EditOutlined style={{ color: previewEditable ? '#1677ff' : '#aaa' }} />
                        <span style={{ fontWeight: 700, fontSize: 13, color: previewEditable ? '#1677ff' : '#555' }}>
                            {previewEditable ? 'Chế độ chỉnh sửa trực tiếp' : 'Xem trước'}
                        </span>
                        {previewEditable && (
                            <span style={{ fontSize: 11, color: '#888' }}>— Click vào bất kỳ text nào để sửa</span>
                        )}
                    </div>

                    {/* Actions bên phải */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
                        {/* Toggle chế độ */}
                        {canEdit && (
                            <Tooltip title={previewEditable ? 'Tắt chỉnh sửa' : 'Bật chỉnh sửa trực tiếp'}>
                                <Switch
                                    size="small"
                                    checked={previewEditable}
                                    onChange={setPreviewEditable}
                                    checkedChildren="✏️"
                                    unCheckedChildren="👁"
                                />
                            </Tooltip>
                        )}

                        {/* Nút submit */}
                        {canEdit && <Space>{actions}</Space>}
                    </div>
                </div>

                {/* Preview content */}
                <SimulationDetailPreview
                    previewData={previewData}
                    tasks={[]}
                    editable={previewEditable && canEdit}
                    onFieldChange={handleFieldChange}
                    categories={categories}
                    simulationId={dataDetail?.id}
                />
            </div>
        </div>
    );
};

const styles = {
    root: {
        display: 'flex',
        flexDirection: 'column',
    },
    panel: {
        flex: 1,
        background: '#f5f5f5',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    },
};

export default SimulationForm;
