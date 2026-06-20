import useFetch from './useFetch';
import apiConfig from '@constants/apiConfig';

const useRegisterEducator = () => {
    const { loading, execute } = useFetch(apiConfig.educator.register, {
        immediate: false,
    });

    const register = async (payload, onSuccess, onError) => {
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
        register,
        loading,
    };
};

export default useRegisterEducator;
