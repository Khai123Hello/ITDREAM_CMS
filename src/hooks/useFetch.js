import { sendRequest } from '@services/api';
import { useCallback, useEffect, useRef, useState } from 'react';
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

    // Dùng ref để lưu các callback/mappingData dạng inline function
    // Tránh chúng làm thay đổi deps của useCallback mỗi render → gây gọi API liên tục
    const mappingDataRef = useRef(mappingData);
    const defaultOnCompletedRef = useRef(defaultOnCompleted);
    const defaultOnErrorRef = useRef(defaultOnError);

    // Cập nhật ref mỗi render nhưng KHÔNG trigger re-create execute
    mappingDataRef.current = mappingData;
    defaultOnCompletedRef.current = defaultOnCompleted;
    defaultOnErrorRef.current = defaultOnError;

    const execute = useCallback(
        async ({ onCompleted, onError, ...payload } = {}, cancelType) => {
            if (isMounted()) {
                setLoading(true);
                setError(null);
            }
            try {
                const { data } = await sendRequest(apiConfig, { params, pathParams, ...payload }, cancelType);
                if (!data.result && data.statusCode !== 200 && apiConfig.baseURL != apiUrl.account.loginBasic.baseURL) {
                    throw data;
                }
                if (isMounted()) {
                    !cancelType && setData(mappingDataRef.current ? mappingDataRef.current(data) : data);
                }
                const finalOnCompleted = onCompleted || defaultOnCompletedRef.current;
                if (finalOnCompleted) {
                    finalOnCompleted(data);
                }
                return data;
            } catch (err) {
                if (isMounted()) {
                    !cancelType && setError(err);
                }
                const finalOnError = onError || defaultOnErrorRef.current;
                if (finalOnError) {
                    finalOnError(err);
                }
                return err;
            } finally {
                if (isMounted()) {
                    !cancelType && setLoading(false);
                }
            }
        },
        // Chỉ recreate execute khi apiConfig, params, pathParams thực sự thay đổi
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [apiConfig, isMounted, JSON.stringify(params), JSON.stringify(pathParams)],
    );

    useEffect(() => {
        if (immediate) {
            execute();
        }
    }, [execute, immediate]);

    return { loading, execute, data, error, setData };
};

export default useFetch;
