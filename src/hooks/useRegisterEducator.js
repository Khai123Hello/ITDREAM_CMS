import useFetch from './useFetch';
import apiConfig from '@constants/apiConfig';
import { message } from 'antd';

const useRegisterEducator = () => {
    const { loading, execute } = useFetch(apiConfig.educator.register, {
        immediate: false,
    });

    const register = async (payload, onSuccess, onError) => {
        await execute({
            method: 'POST',
            data: payload,
            onCompleted: (res) => {
                // Kiểm tra result từ API
                if (res?.result === true) {
                    // Thành công
                    message.success(res.message || 'Đăng ký thành công');
                    onSuccess?.(res);
                } else {
                    // Thất bại - API trả về result: false
                    message.error(res.message || 'Đăng ký thất bại');
                    onError?.(res);
                }
            },
            onError: (err) => {
                // Lỗi network hoặc lỗi khác
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

export default useRegisterEducator;