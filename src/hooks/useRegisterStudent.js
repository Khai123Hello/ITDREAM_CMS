import useFetch from './useFetch';
import apiConfig from '@constants/apiConfig';

const useRegisterStudent = () => {
    const { loading, execute } = useFetch(apiConfig.student.register, {
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

export default useRegisterStudent;
