import { sendRequest } from '@services/api';
import { useCallback, useEffect, useState } from 'react';
import apiUrl from '@constants/apiConfig';
import useIsMounted from './useIsMounted';

const useFetch = (
    apiConfig,
    {
        immediate = false,
        mappingData,
        params = {},
        pathParams = {},
        onCompleted: defaultOnCompleted,
        onError: defaultOnError,
    } = {},
) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const isMounted = useIsMounted();
    const execute = useCallback(
        async ({ onCompleted, onError, ...payload } = {}, cancelType) => {
            if (isMounted()) {
                setLoading(true);
                setError(null);
            }
            try {
                console.log('[useFetch] calling sendRequest. apiConfig:', apiConfig, 'payload:', { params, pathParams, ...payload });
                const { data } = await sendRequest(apiConfig, { params, pathParams, ...payload }, cancelType);
                console.log('[useFetch] sendRequest response data:', data);
                if (
                    !data.result &&
                    data.statusCode !== 200 &&
                    apiConfig.baseURL != apiUrl.account.loginBasic.baseURL
                ) {
                    throw data;
                }
                if (isMounted()) {
                    !cancelType && setData(mappingData ? mappingData(data) : data);
                }
                const finalOnCompleted = onCompleted || defaultOnCompleted;
                if (finalOnCompleted) {
                    console.log('[useFetch] invoking finalOnCompleted callback');
                    finalOnCompleted(data);
                }
                return data;
            } catch (error) {
                if (isMounted()) {
                    !cancelType && setError(error);
                }
                const finalOnError = onError || defaultOnError;
                if (finalOnError) {
                    finalOnError(error);
                }
                return error;
            } finally {
                if (isMounted()) {
                    !cancelType && setLoading(false);
                }
            }
        },
        [apiConfig, defaultOnCompleted, defaultOnError, isMounted, mappingData, JSON.stringify(params), JSON.stringify(pathParams)],
    );
    useEffect(() => {
        if (immediate) {
            execute();
        }
    }, [execute, immediate]);

    return { loading, execute, data, error, setData };
};

export default useFetch;
