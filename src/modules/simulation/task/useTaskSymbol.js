import { useState, useEffect } from 'react';
import { TaskTypes } from '@constants';

export const useTaskSymbol = ({
    taskKind,
    parentOrder = 1,
    taskOrder = 1,
    initialValue = '',
}) => {
    const [requiresFileUpload, setRequiresFileUpload] = useState(false);
    const [requiresTextResponse, setRequiresTextResponse] = useState(false);
    const [symbol, setSymbol] = useState('');

    const numericKind = Number(taskKind);

    // Parse initial symbol when it is loaded (e.g. edit mode)
    useEffect(() => {
        if (!initialValue) return;

        if (numericKind === TaskTypes.TASK) {
            // TASK_T1
            const match = initialValue.match(/^TASK_T(\d+)$/);
            if (match) {
                setRequiresFileUpload(false);
                setRequiresTextResponse(false);
            }
        } else {
            // SUB_T1_S2_FILE_TEXT or similar
            const match = initialValue.match(/^SUB_T(\d+)_S(\d+)(_.*)?$/);
            if (match) {
                const suffix = match[3] || '';
                if (suffix === '_FILE_TEXT') {
                    setRequiresFileUpload(true);
                    setRequiresTextResponse(true);
                } else if (suffix === '_FILE') {
                    setRequiresFileUpload(true);
                    setRequiresTextResponse(false);
                } else if (suffix === '_TEXT') {
                    setRequiresFileUpload(false);
                    setRequiresTextResponse(true);
                } else {
                    setRequiresFileUpload(false);
                    setRequiresTextResponse(false);
                }
            }
        }
    }, [initialValue, numericKind]);

    // Generate symbol when parameters change
    useEffect(() => {
        if (numericKind === TaskTypes.TASK) {
            setSymbol(`TASK_T${taskOrder}`);
        } else {
            let suffix = 'INFO';
            if (requiresFileUpload && requiresTextResponse) {
                suffix = 'FILE_TEXT';
            } else if (requiresFileUpload) {
                suffix = 'FILE';
            } else if (requiresTextResponse) {
                suffix = 'TEXT';
            }
            setSymbol(`SUB_T${parentOrder}_S${taskOrder}_${suffix}`);
        }
    }, [numericKind, parentOrder, taskOrder, requiresFileUpload, requiresTextResponse]);

    return {
        symbol,
        requiresFileUpload,
        setRequiresFileUpload,
        requiresTextResponse,
        setRequiresTextResponse,
    };
};
