import React, { useMemo, useContext } from 'react';
import Markdoc from '@markdoc/markdoc';

// Context to share student answers with individual option components
const QuizContext = React.createContext(null);

/**
 * Custom tag schemas for Markdoc
 */
const markdocConfig = {
    tags: {
        callout: {
            render: 'Callout',
            attributes: {
                icon: { type: String, default: '💡' },
            },
        },
        step: {
            render: 'Step',
            attributes: {
                label: { type: String },
                stepNumber: { type: Number }, // pre-calculated by AST traversal
            },
        },
        section: {
            render: 'Section',
            attributes: {
                icon: { type: String, default: '🎓' },
                title: { type: String },
            },
        },
        quiz: {
            render: 'Quiz',
            attributes: {
                question: { type: String },
            },
        },
        option: {
            render: 'Option',
            attributes: {
                correct: { type: Boolean },
            },
        },
    },
};

/**
 * React Component Renderers for Markdoc custom tags
 */
const CalloutComponent = ({ icon, children }) => (
    <div className="tfo-block-callout">
        <span className="tfo-block-callout-icon">{icon || '💡'}</span>
        <div className="tfo-block-callout-text">{children}</div>
    </div>
);

const StepComponent = ({ label, stepNumber, children }) => (
    <div className="tfo-block-step">
        <div className="tfo-block-step-badge">{stepNumber}</div>
        <div className="tfo-block-step-content">
            {label && <span className="tfo-block-step-label">{label}</span>}
            <div className="tfo-block-step-body">{children}</div>
        </div>
    </div>
);

const SectionComponent = ({ icon, title, children }) => (
    <div className="tfo-block-section">
        <div className="tfo-block-section-header">
            <span className="tfo-block-section-icon">{icon || '🎓'}</span>
            <span className="tfo-block-section-title">{title}</span>
        </div>
        <div className="tfo-block-section-content">{children}</div>
    </div>
);

const QuizComponent = ({ question, children, quizSubmissionMap, questionMap }) => {
    const questionKey = (question || '').trim();
    const questionId = questionMap && questionKey ? questionMap[questionKey] : null;
    const studentAnswer = quizSubmissionMap && questionId ? quizSubmissionMap[questionId] : null;
    const hasAnswerInfo = !!studentAnswer;
    const isCorrect = studentAnswer?.isCorrect === true;

    let quizClass = 'tfo-block-quiz';
    if (quizSubmissionMap) {
        quizClass += hasAnswerInfo ? (isCorrect ? ' quiz-correct' : ' quiz-wrong') : '';
    }

    const contextValue = {
        studentAnswer,
        hasAnswerInfo,
        quizSubmissionMap,
    };

    // Inject sequential index to child Option components
    const optionElements = React.Children.map(children, (child, idx) => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child, { index: idx });
        }
        return child;
    });

    return (
        <QuizContext.Provider value={contextValue}>
            <div className={quizClass}>
                <div className="tfo-block-quiz-question">
                    <span className="tfo-block-quiz-icon">❓</span>
                    <span className="tfo-block-quiz-text">{question}</span>
                </div>

                <div className="tfo-block-quiz-options">{optionElements}</div>

                {quizSubmissionMap && (
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
        </QuizContext.Provider>
    );
};

const OptionComponent = ({ correct, index = 0, children }) => {
    const context = useContext(QuizContext);
    const { studentAnswer, quizSubmissionMap } = context || {};

    const letter = String.fromCharCode(65 + index);
    const optionText = typeof children === 'string' ? children.trim() : (children && children.toString ? children.toString().trim() : '');

    const isSelected = studentAnswer && (studentAnswer.answer === optionText || studentAnswer.answer === children);
    const isCorrectOpt = correct === true;

    let optionClass = 'tfo-quiz-option';
    if (quizSubmissionMap) {
        if (isSelected) optionClass += ' selected';
        if (isCorrectOpt) optionClass += ' answer-correct';
        if (isSelected && !isCorrectOpt) optionClass += ' answer-wrong';
    }

    return (
        <div className={optionClass}>
            <span className="tfo-quiz-option-letter">{letter}.</span>
            <span className="tfo-quiz-option-text">{children}</span>

            {quizSubmissionMap && isCorrectOpt && (
                <span className="tfo-quiz-option-badge correct">✓ Đúng</span>
            )}
            {quizSubmissionMap && isSelected && !isCorrectOpt && (
                <span className="tfo-quiz-option-badge wrong">✗ Học viên chọn</span>
            )}

            {!quizSubmissionMap && isCorrectOpt && (
                <span className="tfo-quiz-option-badge correct" style={{ marginLeft: 'auto' }}>
                    ✓ Đáp án đúng
                </span>
            )}
        </div>
    );
};

/**
 * Main Markdoc Renderer Component
 */
export default function MarkdocRenderer({ content, quizSubmissionMap, questionMap }) {
    const renderedContent = useMemo(() => {
        if (!content) return null;

        try {
            // Parse AST
            const ast = Markdoc.parse(content);

            // Traverse AST to pre-calculate step numbers
            let stepCounter = 1;
            for (const node of ast.walk()) {
                if (node.tag === 'step') {
                    node.attributes.stepNumber = stepCounter++;
                }
            }

            // Transform AST
            const transformed = Markdoc.transform(ast, markdocConfig);

            // Components map for renderer
            const components = {
                Callout: CalloutComponent,
                Step: StepComponent,
                Section: SectionComponent,
                Quiz: (props) => (
                    <QuizComponent
                        {...props}
                        quizSubmissionMap={quizSubmissionMap}
                        questionMap={questionMap}
                    />
                ),
                Option: OptionComponent,
            };

            // Render to React nodes
            return Markdoc.renderers.react(transformed, React, { components });
        } catch (error) {
            console.error('Markdoc rendering error:', error);
            return <pre style={{ color: 'red', whiteSpace: 'pre-wrap' }}>{content}</pre>;
        }
    }, [content, quizSubmissionMap, questionMap]);

    if (!content) {
        return (
            <p className="tfo-empty-content" style={{ fontStyle: 'italic', color: '#94a3b8' }}>
                Không có nội dung.
            </p>
        );
    }

    return (
        <div className="block-editor-preview-container tfo-blocks-content">
            {renderedContent}
        </div>
    );
}
