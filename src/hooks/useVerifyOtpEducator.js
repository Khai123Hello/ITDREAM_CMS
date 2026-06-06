import useFetch from './useFetch';
import apiConfig from '@constants/apiConfig';
import { message } from 'antd';

const useVerifyOtpEducator = () => {
    const { loading, execute } = useFetch(apiConfig.educator.otp, {
        immediate: false,
    });

    const verifyOtp = async (payload, onSuccess, onError) => {
        await execute({
            method: 'POST',
            data: payload,
            onCompleted: (res) => {
                if (res?.result === true) {
                    message.success(res.message || 'Xác thực OTP thành công');
                    onSuccess?.(res);
                } else {
                    message.error(res.message || 'Xác thực OTP thất bại');
                    onError?.(res);
                }
            },
            onError: (err) => {
                message.error(err?.message || 'Lỗi xác thực OTP');
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
