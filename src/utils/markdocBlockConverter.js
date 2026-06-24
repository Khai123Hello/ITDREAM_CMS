import Markdoc from '@markdoc/markdoc';

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

/**
 * Returns true if the string is a legacy JSON-blocks array.
 * @param {string} str
 * @returns {boolean}
 */
export function isJsonBlocks(str) {
    if (!str || typeof str !== 'string') return false;
    const trimmed = str.trim();
    if (!trimmed.startsWith('[')) return false;
    try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && 'type' in parsed[0];
    } catch {
        return false;
    }
}

// ---------------------------------------------------------------------------
// HTML stripping helper (for legacy "text" blocks that stored HTML)
// ---------------------------------------------------------------------------

function stripHtml(html) {
    if (!html) return '';
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<li>/gi, '- ')
        .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
        .replace(/<em>(.*?)<\/em>/gi, '_$1_')
        .replace(/<code>(.*?)<\/code>/gi, '`$1`')
        .replace(/<[^>]+>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ')
        .trim();
}

// ---------------------------------------------------------------------------
// blocksToMarkdoc — legacy JSON blocks → Markdoc Markdown string
// ---------------------------------------------------------------------------

/**
 * Convert a legacy JSON blocks array to a Markdoc Markdown string.
 * @param {object[]} blocks
 * @returns {string}
 */
export function blocksToMarkdoc(blocks) {
    if (!Array.isArray(blocks)) return '';

    const lines = [];

    blocks.forEach((block) => {
        switch (block.type) {
                        case 'text': {
                            const text = stripHtml(block.content || '');
                            if (text) lines.push(text, '');
                            break;
                        }

                        case 'h1':
                            lines.push(`# ${stripHtml(block.content || '')}`);
                            lines.push('');
                            break;

                        case 'h2':
                            lines.push(`## ${stripHtml(block.content || '')}`);
                            lines.push('');
                            break;

                        case 'h3':
                            lines.push(`### ${stripHtml(block.content || '')}`);
                            lines.push('');
                            break;

                        case 'bullet':
                            lines.push(`- ${stripHtml(block.content || '')}`);
                            break;

                        case 'numbered':
                            lines.push(`1. ${stripHtml(block.content || '')}`);
                            break;

                        case 'divider':
                            lines.push('---');
                            lines.push('');
                            break;

                        case 'code':
                            lines.push('```');
                            lines.push(block.content || '');
                            lines.push('```');
                            lines.push('');
                            break;

                        case 'callout': {
                            const icon = block.icon || '💡';
                            const content = block.content || '';
                            lines.push(`{% callout icon="${icon}" %}`);
                            lines.push(content);
                            lines.push('{% /callout %}');
                            lines.push('');
                            break;
                        }

                        case 'step': {
                            const label = block.label || 'Bước';
                            const body = block.body || '';
                            lines.push(`{% step label="${label}" %}`);
                            lines.push(body);
                            lines.push('{% /step %}');
                            lines.push('');
                            break;
                        }

                        case 'section': {
                            const icon = block.icon || '🎓';
                            const title = block.title || '';
                            const bullets = Array.isArray(block.bullets) ? block.bullets : [];
                            lines.push(`{% section icon="${icon}" title="${title}" %}`);
                            bullets.filter(Boolean).forEach((b) => lines.push(`- ${b}`));
                            lines.push('{% /section %}');
                            lines.push('');
                            break;
                        }

                        case 'quiz': {
                            const question = block.question || '';
                            const options = Array.isArray(block.options) ? block.options : [];
                            lines.push(`{% quiz question="${question}" %}`);
                            options.forEach((opt) => {
                                const isCorrect = opt.answer === true;
                                lines.push(`  {% option correct=${isCorrect} %}${opt.option || ''}{% /option %}`);
                            });
                            lines.push('{% /quiz %}');
                            lines.push('');
                            break;
                        }

                        default:
                            break;
        }
    });

    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ---------------------------------------------------------------------------
// markdocToHtml — Parse Markdoc Markdown string to HTML for TipTap content ingestion
// ---------------------------------------------------------------------------

const htmlConfig = {
    tags: {
        callout: {
            render: 'callout-block',
            attributes: {
                icon: { type: String },
            },
        },
        step: {
            render: 'step-block',
            attributes: {
                label: { type: String },
            },
        },
        section: {
            render: 'section-block',
            attributes: {
                icon: { type: String },
                title: { type: String },
            },
        },
        quiz: {
            render: 'quiz-block',
            attributes: {
                question: { type: String },
            },
        },
        option: {
            render: 'option-block',
            attributes: {
                correct: { type: Boolean },
            },
        },
    },
};

/**
 * Converts a Markdoc Markdown string to HTML custom tags.
 * Handles legacy JSON conversion on the fly.
 * @param {string} contentStr
 * @returns {string}
 */
export function markdocToHtml(contentStr) {
    if (!contentStr) return '';
    let markdown = contentStr;

    if (isJsonBlocks(contentStr)) {
        try {
            markdown = blocksToMarkdoc(JSON.parse(contentStr));
        } catch (e) {
            console.error('Failed to convert legacy content to Markdoc', e);
        }
    }

    try {
        const ast = Markdoc.parse(markdown);
        const transformed = Markdoc.transform(ast, htmlConfig);
        return Markdoc.renderers.html(transformed) || '';
    } catch (err) {
        console.error('Markdoc parser to HTML error:', err);
        return markdown;
    }
}

// ---------------------------------------------------------------------------
// tipTapToMarkdoc — Converts TipTap JSON Node document to Markdoc Markdown string
// ---------------------------------------------------------------------------

/**
 * Converts a TipTap JSON node representation back to Markdoc Markdown.
 * @param {object} node
 * @returns {string}
 */
export function tipTapToMarkdoc(node) {
    if (!node) return '';

    if (node.type === 'text') {
        let text = node.text || '';
        if (node.marks) {
            // Apply marks in order: bold, italic, underline, code, link
            node.marks.forEach((mark) => {
                if (mark.type === 'bold') text = `**${text}**`;
                if (mark.type === 'italic') text = `*${text}*`;
                if (mark.type === 'underline') text = `<u>${text}</u>`;
                if (mark.type === 'code') text = `\`${text}\``;
                if (mark.type === 'link') text = `[${text}](${mark.attrs?.href || ''})`;
            });
        }
        return text;
    }

    const childrenContent = (node.content || []).map(tipTapToMarkdoc).join('');

    switch (node.type) {
                    case 'doc':
                        return (node.content || []).map(tipTapToMarkdoc).join('\n\n').trim();
                    case 'paragraph':
                        return childrenContent;
                    case 'heading': {
                        const level = node.attrs?.level || 1;
                        return `${'#'.repeat(level)} ${childrenContent}`;
                    }
                    case 'bulletList':
                        return (node.content || []).map(tipTapToMarkdoc).join('\n');
                    case 'orderedList':
                        return (node.content || [])
                            .map((child, idx) => {
                                const itemContent = tipTapToMarkdoc(child);
                                // Replace bullet prefix with numbered index
                                return itemContent.replace(/^-\s+/, `${idx + 1}. `);
                            })
                            .join('\n');
                    case 'listItem':
                        return `- ${childrenContent}`;
                    case 'codeBlock':
                        return `\`\`\`\n${childrenContent}\n\`\`\``;
                    case 'horizontalRule':
                        return '---';
                    case 'callout': {
                        const icon = node.attrs?.icon || '💡';
                        return `{% callout icon="${icon}" %}\n${childrenContent.trim()}\n{% /callout %}`;
                    }
                    case 'step': {
                        const label = node.attrs?.label || 'Bước';
                        return `{% step label="${label}" %}\n${childrenContent.trim()}\n{% /step %}`;
                    }
                    case 'section': {
                        const icon = node.attrs?.icon || '🎓';
                        const title = node.attrs?.title || '';
                        return `{% section icon="${icon}" title="${title}" %}\n${childrenContent.trim()}\n{% /section %}`;
                    }
                    case 'quiz': {
                        const question = node.attrs?.question || '';
                        return `{% quiz question="${question}" %}\n${childrenContent.trim()}\n{% /quiz %}`;
                    }
                    case 'option': {
                        const correct = node.attrs?.correct === true;
                        return `{% option correct=${correct} %}${childrenContent.trim()}{% /option %}`;
                    }
                    default:
                        return childrenContent;
    }
}

// ---------------------------------------------------------------------------
// extractQuizFromMarkdoc — pull quiz blocks out for TaskQuestion API sync
// ---------------------------------------------------------------------------

/**
 * Extracts quiz questions from a Markdoc Markdown string.
 * Returns array matching the shape expected by onQuestionsChange in TaskForm.
 *
 * @param {string} markdown
 * @returns {{ id?: number, question: string, options: string }[]}
 */
export function extractQuizFromMarkdoc(markdown) {
    if (!markdown) return [];

    let parsedMarkdown = markdown;
    if (isJsonBlocks(markdown)) {
        try {
            parsedMarkdown = blocksToMarkdoc(JSON.parse(markdown));
        } catch {
            return [];
        }
    }

    try {
        const ast = Markdoc.parse(parsedMarkdown);
        const quizzes = [];

        for (const node of ast.walk()) {
            if (node.tag === 'quiz') {
                const question = node.attributes.question || '';
                const options = [];

                // Look for option tags inside this quiz
                if (Array.isArray(node.children)) {
                    node.children.forEach((child) => {
                        if (child.tag === 'option') {
                            const correct = child.attributes.correct === true;
                            // Extract inline text content of option
                            let optionText = '';
                            if (Array.isArray(child.children)) {
                                optionText = child.children
                                    .map((c) => (c.type === 'text' ? c.attributes.content : ''))
                                    .join('')
                                    .trim();
                            }
                            options.push({ option: optionText, answer: correct });
                        }
                    });
                }

                quizzes.push({
                    question,
                    options: JSON.stringify(options),
                });
            }
        }

        return quizzes;
    } catch (err) {
        console.error('Failed to extract quiz questions from Markdoc AST:', err);
        return [];
    }
}
