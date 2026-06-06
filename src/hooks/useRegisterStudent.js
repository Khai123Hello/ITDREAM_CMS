import useFetch from './useFetch';
import apiConfig from '@constants/apiConfig';
import { message } from 'antd';

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
                    message.success(res.message || 'Đăng ký thành công');
                    onSuccess?.(res);
                } else {
                    message.error(res.message || 'Đăng ký thất bại');
                    onError?.(res);
                }
            },
            onError: (err) => {
                const errorMessage = err?.response?.data?.message 
                    || err?.message 
                    || 'Lỗi không xác định';
                message.error(errorMessage);
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
