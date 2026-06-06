export default function usePasswordValidation(minLength = 8) {
    const passwordRules = [
        { required: true, message: 'Vui lòng nhập mật khẩu!' },
        { min: minLength, message: `Mật khẩu phải có ít nhất ${minLength} ký tự!` },
    ];

    const confirmPasswordRules = (getFieldValue, passwordField = 'newPassword') => [
        { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
        {
            validator(_, value) {
                if (!value || getFieldValue(passwordField) === value) {
                    return Promise.resolve();
                }
                return Promise.reject(new Error('Mật khẩu không trùng khớp!'));
            },
        },
    ];

    return { passwordRules, confirmPasswordRules };
}
