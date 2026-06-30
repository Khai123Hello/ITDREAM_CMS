import React, { useMemo, useEffect } from 'react';
import { markdocToTipTapJson, blocksToMarkdoc } from '@utils/markdocBlockConverter';

const MARKS = {
    bold: (ch) => <strong key="b">{ch}</strong>,
    italic: (ch) => <em key="i">{ch}</em>,
    underline: (ch) => <u key="u">{ch}</u>,
    strike: (ch) => <s key="s">{ch}</s>,
    code: (ch) => <code key="c">{ch}</code>,
    link: (ch, attrs) => (
        <a key="l" href={attrs?.href} target="_blank" rel="noreferrer">
            {ch}
        </a>
    ),
    highlight: (ch, attrs) => (
        <mark key="h" style={{ background: attrs?.color || '#feffb3' }}>
            {ch}
        </mark>
    ),
    subscript: (ch) => <sub key="sub">{ch}</sub>,
    superscript: (ch) => <sup key="sup">{ch}</sup>,
};

function renderTextNode(node) {
    const text = node.text || '';
    if (node.marks && node.marks.length > 0) {
        let content = text;
        for (const mark of node.marks) {
            const fn = MARKS[mark.type];
            if (fn) content = fn(content, mark.attrs);
        }
        return content;
    }
    return text;
}

function renderNode(node, index, quizCtx) {
    if (!node) return null;

    if (node.type === 'text') {
        return <React.Fragment key={index}>{renderTextNode(node)}</React.Fragment>;
    }

    const children = (node.content || []).map((child, i) => renderNode(child, i, quizCtx));

    switch (node.type) {
                    case 'doc':
                        return (
                            <div key={index} className="tfo-blocks-content">
                                {children}
                            </div>
                        );

                    case 'paragraph':
                        return <p key={index}>{children.length > 0 ? children : <br />}</p>;

                    case 'heading': {
                        const level = node.attrs?.level || 1;
                        const text = node.content?.map((c) => c.text || '').join('') || '';
                        const id = text
                            .toLowerCase()
                            .trim()
                            .replace(/[^a-z0-9\u00C0-\u017F]+/g, '-');
                        const Tag = `h${level}`;
                        return (
                            <Tag key={index} id={id}>
                                {children}
                            </Tag>
                        );
                    }

                    case 'bulletList':
                        return <ul key={index}>{children}</ul>;

                    case 'orderedList':
                        return <ol key={index}>{children}</ol>;

                    case 'listItem':
                        return <li key={index}>{children}</li>;

                    case 'taskList':
                        return (
                            <ul key={index} data-type="taskList" className="tfo-task-list">
                                {children}
                            </ul>
                        );

                    case 'taskItem':
                        return (
                            <li key={index} className="tfo-task-item" data-checked={node.attrs?.checked}>
                                <input type="checkbox" checked={!!node.attrs?.checked} readOnly />
                                <span>{children}</span>
                            </li>
                        );

                    case 'codeBlock': {
                        const lang = node.attrs?.language;
                        return (
                            <pre key={index} className={lang ? `language-${lang}` : ''}>
                                <code>{node.content?.[0]?.text || ''}</code>
                            </pre>
                        );
                    }

                    case 'blockquote':
                        return <blockquote key={index}>{children}</blockquote>;

                    case 'horizontalRule':
                        return <hr key={index} />;

                    case 'image':
                        return (
                            <img
                                key={index}
                                src={node.attrs?.src}
                                alt={node.attrs?.alt || ''}
                                title={node.attrs?.title}
                                style={{ maxWidth: '100%', height: 'auto' }}
                            />
                        );

                    case 'hardBreak':
                        return <br key={index} />;

                    case 'callout':
                        return (
                            <div key={index} className="tfo-block-callout">
                                <span className="tfo-block-callout-icon">{node.attrs?.icon || '💡'}</span>
                                <div className="tfo-block-callout-text">{children}</div>
                            </div>
                        );

                    case 'step':
                        return (
                            <div key={index} className="tfo-block-step">
                                <div className="tfo-block-step-badge">{index + 1}</div>
                                <div className="tfo-block-step-content">
                                    {node.attrs?.label && <span className="tfo-block-step-label">{node.attrs.label}</span>}
                                    <div className="tfo-block-step-body">{children}</div>
                                </div>
                            </div>
                        );

                    case 'section':
                        return (
                            <div key={index} className="tfo-block-section">
                                <div className="tfo-block-section-header">
                                    <span className="tfo-block-section-icon">{node.attrs?.icon || '🎓'}</span>
                                    <span className="tfo-block-section-title">{node.attrs?.title}</span>
                                </div>
                                <div className="tfo-block-section-content">{children}</div>
                            </div>
                        );

                    case 'quiz': {
                        const options = (node.content || []).filter((c) => c.type === 'option');
                        const questionKey = (node.attrs?.question || '').trim();
                        const dataQId = node.attrs?.dataQuestionCode || '';
                        const questionId = dataQId
                            ? quizCtx?.questionMap?.[dataQId]
                            : quizCtx?.questionMap?.[questionKey];
                        const studentAnswer = quizCtx?.quizSubmissionMap?.[questionId];
                        const hasAnswerInfo = !!studentAnswer;
                        const isCorrect = studentAnswer?.isCorrect === true;

                        let quizClass = 'tfo-block-quiz';
                        if (quizCtx?.quizSubmissionMap) {
                            quizClass += hasAnswerInfo ? (isCorrect ? ' quiz-correct' : ' quiz-wrong') : '';
                        }

                        const optionElements = options.map((opt, i) => {
                            const correct = opt.attrs?.correct === true;
                            const letter = String.fromCharCode(65 + i);
                            const text = opt.content?.[0]?.text || '';
                            const isSelected = studentAnswer && (studentAnswer.answer === text);
                            let optClass = 'tfo-quiz-option';
                            if (quizCtx?.quizSubmissionMap) {
                                if (isSelected) optClass += ' selected';
                                if (correct) optClass += ' answer-correct';
                                if (isSelected && !correct) optClass += ' answer-wrong';
                            } else if (correct) {
                                optClass += ' answer-correct';
                            }
                            return (
                                <div key={i} className={optClass}>
                                    <span className="tfo-quiz-option-letter">{letter}.</span>
                                    <span className="tfo-quiz-option-text">{text}</span>
                                    {quizCtx?.quizSubmissionMap && correct && (
                                        <span className="tfo-quiz-option-badge correct">✓ Đúng</span>
                                    )}
                                    {quizCtx?.quizSubmissionMap && isSelected && !correct && (
                                        <span className="tfo-quiz-option-badge wrong">✗ Học viên chọn</span>
                                    )}
                                    {!quizCtx?.quizSubmissionMap && correct && (
                                        <span className="tfo-quiz-option-badge correct">✓ Đáp án đúng</span>
                                    )}
                                </div>
                            );
                        });

                        return (
                            <div key={index} className={quizClass}>
                                <div className="tfo-block-quiz-question">
                                    <span className="tfo-block-quiz-icon">❓</span>
                                    <span className="tfo-block-quiz-text">{node.attrs?.question}</span>
                                </div>
                                <div className="tfo-block-quiz-options">{optionElements}</div>
                                {quizCtx?.quizSubmissionMap && (
                                    <div className="tfo-block-quiz-footer">
                                        {hasAnswerInfo ? (
                                            <span className={`tfo-quiz-result-label ${isCorrect ? 'correct' : 'wrong'}`}>
                                                {isCorrect ? '🎉 Học viên trả lời chính xác!' : '😅 Học viên trả lời chưa đúng!'}
                                            </span>
                                        ) : (
                                            <span className="tfo-quiz-result-label" style={{ color: '#8c8c8c' }}>
                                    Học viên chưa làm câu này.
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    default:
                        return <React.Fragment key={index}>{children}</React.Fragment>;
    }
}

export default function TipTapJsonRenderer({ content, quizSubmissionMap, questionMap, onQuestionRendered }) {
    const json = useMemo(() => {
        if (!content) return { type: 'doc', content: [] };
        
        let parsed = content;
        if (typeof content === 'string') {
            const trimmed = content.trim();
            if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
                try {
                    parsed = JSON.parse(trimmed);
                } catch {
                    return markdocToTipTapJson(content);
                }
            } else {
                return markdocToTipTapJson(content);
            }
        }
        
        if (parsed && parsed.type === 'doc') {
            return parsed;
        }
        
        if (Array.isArray(parsed)) {
            const markdocStr = blocksToMarkdoc(parsed);
            return markdocToTipTapJson(markdocStr);
        }
        
        return { type: 'doc', content: [] };
    }, [content]);

    const quizCtx = useMemo(() => {
        return { quizSubmissionMap: quizSubmissionMap || {}, questionMap: questionMap || {} };
    }, [quizSubmissionMap, questionMap]);

    // Extract inline question IDs inside useMemo to avoid state setting during rendering
    const inlineQuestionIds = useMemo(() => {
        const ids = new Set();
        const walk = (nodes) => {
            (nodes || []).forEach((n) => {
                if (n.type === 'quiz') {
                    const questionKey = (n.attrs?.question || '').trim();
                    const dataQId = n.attrs?.dataQuestionCode || '';
                    const questionId = dataQId
                        ? quizCtx?.questionMap?.[dataQId]
                        : quizCtx?.questionMap?.[questionKey];
                    if (questionId) {
                        ids.add(String(questionId));
                    }
                }
                if (n.content) walk(n.content);
            });
        };
        walk(json.content);
        return Array.from(ids);
    }, [ json, quizCtx ]);

    // Notify parent component about rendered questions in useEffect
    useEffect(() => {
        if (onQuestionRendered) {
            onQuestionRendered(inlineQuestionIds);
        }
    }, [ inlineQuestionIds, onQuestionRendered ]);

    const rendered = useMemo(() => {
        return (json.content || []).map((node, i) => renderNode(node, i, quizCtx));
    }, [json, quizCtx]);

    if (!content) {
        return (
            <p className="tfo-empty-content" style={{ fontStyle: 'italic', color: '#94a3b8' }}>
                Không có nội dung.
            </p>
        );
    }

    return <div className="block-editor-preview-container tfo-blocks-content">{rendered}</div>;
}
