import React, { useMemo } from 'react';
import { markdocToTipTapJson } from '@utils/markdocBlockConverter';

export function extractHeadings(content) {
    if (!content) return [];
    let json = content;
    if (typeof content === 'string') {
        const trimmed = content.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            try {
                json = JSON.parse(trimmed);
            } catch {
                json = markdocToTipTapJson(content);
            }
        } else {
            json = markdocToTipTapJson(content);
        }
    }

    const headings = [];
    const walk = (nodes) => {
        if (!nodes) return;
        const arr = Array.isArray(nodes) ? nodes : [nodes];
        arr.forEach((node) => {
            if (node.type === 'heading') {
                const text = node.content?.map((c) => c.text || '').join('') || '';
                if (text.trim()) {
                    const level = node.attrs?.level || 1;
                    const id = text
                        .toLowerCase()
                        .trim()
                        .replace(/[^a-z0-9\u00C0-\u017F]+/g, '-');
                    headings.push({ text, level, id });
                }
            }
            if (node.content) {
                walk(node.content);
            }
        });
    };
    walk(json);
    return headings;
}

export default function TableOfContents({ content, activeId }) {
    const headings = useMemo(() => extractHeadings(content), [content]);

    const handleScrollTo = (id) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (headings.length === 0) return null;

    return (
        <div className="tfo-toc-container">
            <h4 className="tfo-toc-title">MỤC LỤC CHI TIẾT</h4>
            <ul className="tfo-toc-list">
                {headings.map((heading, i) => (
                    <li
                        key={i}
                        className={`tfo-toc-item level-${heading.level} ${activeId === heading.id ? 'active' : ''}`}
                    >
                        <button type="button" onClick={() => handleScrollTo(heading.id)}>
                            {heading.text}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
