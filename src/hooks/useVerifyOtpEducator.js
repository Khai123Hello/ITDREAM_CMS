import useFetch from './useFetch';
import apiConfig from '@constants/apiConfig';

const useVerifyOtpEducator = () => {
    const { loading, execute } = useFetch(apiConfig.account.verifyOtp, {
        immediate: false,
    });

    const verifyOtp = async (payload, onSuccess, onError) => {
        await execute({
            method: 'POST',
            data: payload,
            onCompleted: (res) => {
                if (res?.result === true) {
                    onSuccess?.(res);
                } else {
                    onError?.(res);
                }
            },
            onError: (err) => {
                onError?.(err);
            },
        });
    };

    return {
        verifyOtp,
        loading,
    };
};

export default useVerifyOtpEducator;
