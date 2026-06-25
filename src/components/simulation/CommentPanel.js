import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Spin } from 'antd';
import { EditOutlined, DeleteOutlined, SendOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import '../../modules/reviewSubmission/StudentReviewDetailPage.scss';

// Enable relativeTime for dayjs and set Vietnamese locale
dayjs.extend(relativeTime);

const getInitials = (fullName) => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const getAvatarColor = (name) => {
    const colors = [
        'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
        'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
        'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    ];
    let hash = 0;
    const cleanName = name || '';
    for (let i = 0; i < cleanName.length; i++) {
        hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

function CommentPanel({
    comments = [],
    loading = false,
    profile = {},
    readOnly = false,
    onSendComment = () => {},
    onUpdateComment = () => {},
    onDeleteComment = () => {},
    studentUsername = '',
}) {
    const [mainText, setMainText] = useState('');
    const [replyingToId, setReplyingToId] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');
    const listEndRef = useRef(null);

    const rootComments = useMemo(() => {
        return comments.filter((c) => !c.parentId || c.parentId === 0);
    }, [comments]);

    const repliesMap = useMemo(() => {
        const map = {};
        const childComments = comments.filter((c) => c.parentId && c.parentId !== 0);

        childComments.forEach((reply) => {
            let rootId = reply.parentId;
            let parent = comments.find((c) => c.id === rootId);

            while (parent && parent.parentId && parent.parentId !== 0) {
                rootId = parent.parentId;
                parent = comments.find((c) => c.id === rootId);
            }

            if (!map[rootId]) {
                map[rootId] = [];
            }
            map[rootId].push(reply);
        });

        Object.keys(map).forEach((rootId) => {
            map[rootId].sort((a, b) => new Date(a.createdDate) - new Date(b.createdDate));
        });

        return map;
    }, [comments]);

    const handleMainSubmit = (e) => {
        e.preventDefault();
        if (!mainText.trim()) return;
        onSendComment(mainText.trim(), 0);
        setMainText('');
    };

    const handleReplySubmit = (e, parentId) => {
        e.preventDefault();
        if (!replyText.trim()) return;
        onSendComment(replyText.trim(), parentId);
        setReplyText('');
        setReplyingToId(null);
    };

    const handleEditSubmit = (e, commentId) => {
        e.preventDefault();
        if (!editText.trim()) return;
        onUpdateComment(commentId, editText.trim());
        setEditingId(null);
        setEditText('');
    };

    useEffect(() => {
        if (listEndRef.current) {
            listEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [comments.length]);

    const renderAvatar = (user) => {
        const fullName = user?.fullName || user?.username || 'Học viên';
        const initials = getInitials(fullName);
        const bg = getAvatarColor(fullName);

        if (user?.avatar && user.avatar.startsWith('http')) {
            return <img src={user.avatar} alt={fullName} className="tfo-comment-avatar" />;
        }

        return (
            <div className="tfo-comment-avatar-initials" style={{ background: bg }}>
                {initials}
            </div>
        );
    };

    const currentUsername = profile?.username || '';

    const renderCommentCard = (comment, isReply = false) => {
        const isSelf = comment.user?.username === currentUsername;
        const isEditing = editingId === comment.id;
        const isReplying = replyingToId === comment.id;

        const isStudent =
            studentUsername && comment.user?.username
                ? comment.user.username.toLowerCase() === studentUsername.toLowerCase()
                : true;
        const isTeacher = !isStudent;

        let cardClass = `tfo-comment-card`;
        if (isReply) cardClass += ' reply';
        if (isTeacher) cardClass += ' teacher-comment';

        return (
            <div key={comment.id} className={cardClass}>
                <div className="tfo-comment-card-header">
                    {renderAvatar(comment.user)}
                    <div className="tfo-comment-user-info">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="tfo-comment-fullname">
                                {comment.user?.fullName || comment.user?.username || 'Học viên'}
                            </span>
                            {isTeacher && (
                                <span
                                    style={{
                                        fontSize: '9px',
                                        fontWeight: 700,
                                        backgroundColor: '#bae6fd',
                                        color: '#0369a1',
                                        padding: '2px 6px',
                                        borderRadius: '10px',
                                        lineHeight: '1.2',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.3px',
                                        display: 'inline-block',
                                    }}
                                >
                                    Giáo viên
                                </span>
                            )}
                        </div>
                        <span className="tfo-comment-time">{dayjs(comment.createdDate).fromNow()}</span>
                    </div>
                    {isSelf && !isEditing && !readOnly && (
                        <div className="tfo-comment-actions">
                            <button
                                className="tfo-comment-edit-btn"
                                onClick={() => {
                                    setEditingId(comment.id);
                                    setEditText(comment.content);
                                    setReplyingToId(null);
                                }}
                                title="Sửa bình luận"
                            >
                                <EditOutlined style={{ fontSize: 11 }} />
                            </button>
                            <button
                                className="tfo-comment-delete-btn"
                                onClick={() => onDeleteComment(comment.id)}
                                title="Xóa bình luận"
                            >
                                <DeleteOutlined style={{ fontSize: 11, color: '#ff4d4f' }} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="tfo-comment-card-body">
                    {isEditing ? (
                        <form onSubmit={(e) => handleEditSubmit(e, comment.id)} className="tfo-comment-edit-form">
                            <textarea
                                className="tfo-comment-input-textarea"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                rows={2}
                                autoFocus
                            />
                            <div className="tfo-comment-input-actions">
                                <button
                                    type="button"
                                    className="tfo-comment-btn-text"
                                    onClick={() => setEditingId(null)}
                                >
                                    Hủy
                                </button>
                                <button type="submit" className="tfo-comment-btn-filled" disabled={!editText.trim()}>
                                    Lưu
                                </button>
                            </div>
                        </form>
                    ) : (
                        <p className="tfo-comment-text">
                            {comment.replyToUser && (
                                <span className="tfo-comment-mention">@{comment.replyToUser} </span>
                            )}
                            {comment.content}
                        </p>
                    )}
                </div>

                {!isEditing && !readOnly && (
                    <div className="tfo-comment-card-footer">
                        <button
                            className="tfo-comment-action-link"
                            onClick={() => {
                                setReplyingToId(comment.id);
                                setReplyText('');
                                setEditingId(null);
                            }}
                        >
                            Trả lời
                        </button>
                    </div>
                )}

                {isReplying && !readOnly && (
                    <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="tfo-comment-reply-form">
                        <textarea
                            className="tfo-comment-input-textarea"
                            placeholder={`Trả lời...`}
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={2}
                            autoFocus
                        />
                        <div className="tfo-comment-input-actions">
                            <button
                                type="button"
                                className="tfo-comment-btn-text"
                                onClick={() => setReplyingToId(null)}
                            >
                                Hủy
                            </button>
                            <button type="submit" className="tfo-comment-btn-filled" disabled={!replyText.trim()}>
                                Gửi
                            </button>
                        </div>
                    </form>
                )}
            </div>
        );
    };

    return (
        <div className="tfo-comments-pane-inner">
            <div className="tfo-comments-list-container">
                {loading && comments.length === 0 ? (
                    <div className="tfo-comments-loading" style={{ padding: '24px', textAlign: 'center' }}>
                        <Spin size="medium" />
                    </div>
                ) : comments.length === 0 ? (
                    <div
                        className="tfo-comments-empty"
                        style={{ padding: '24px', textAlign: 'center', color: '#8c8c8c' }}
                    >
                        <p>Chưa có bình luận nào. Hãy bắt đầu thảo luận!</p>
                    </div>
                ) : (
                    <div className="tfo-comments-scrollable">
                        {rootComments.map((root) => {
                            const threadReplies = repliesMap[root.id] || [];
                            return (
                                <div key={root.id} className="tfo-comment-thread">
                                    {renderCommentCard(root, false)}
                                    {threadReplies.length > 0 && (
                                        <div className="tfo-comment-thread-replies">
                                            <div className="tfo-comment-thread-line" />
                                            <div className="tfo-comment-replies-list">
                                                {threadReplies.map((reply) => (
                                                    <div key={reply.id} className="tfo-comment-reply-item">
                                                        <span className="tfo-comment-reply-arrow">↳</span>
                                                        {renderCommentCard(reply, true)}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        <div ref={listEndRef} />
                    </div>
                )}
            </div>

            {readOnly ? (
                <div
                    className="tfo-comments-read-only-banner"
                    style={{
                        padding: '12px 16px',
                        background: '#f8fafc',
                        borderTop: '1px solid #e2e8f0',
                        color: '#64748b',
                        fontSize: 13,
                        textAlign: 'center',
                        fontWeight: 500,
                    }}
                >
                    Bạn đang xem thảo luận ở chế độ chỉ đọc.
                </div>
            ) : (
                <form onSubmit={handleMainSubmit} className="tfo-comments-panel-footer">
                    <textarea
                        className="tfo-comments-main-textarea"
                        placeholder="Viết bình luận..."
                        value={mainText}
                        onChange={(e) => setMainText(e.target.value)}
                        rows={2}
                    />
                    <button
                        type="submit"
                        className="tfo-comments-send-btn"
                        disabled={!mainText.trim()}
                        title="Gửi bình luận"
                    >
                        <SendOutlined style={{ fontSize: 14 }} />
                    </button>
                </form>
            )}
        </div>
    );
}

export default CommentPanel;
