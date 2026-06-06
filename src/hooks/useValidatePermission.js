import { validatePermission } from '@utils';
import { useCallback } from 'react';
import useAuth from './useAuth';

function useValidatePermission() {
    const { permissionCode, kind, profile } = useAuth();

    const hasPermission = useCallback(
        (requiredPermissions, requiredKind, excludeKind, onValidate, path, separate) => {
            const _onValidate = onValidate ?? validatePermission;
            return _onValidate(
                requiredPermissions,
                permissionCode,
                requiredKind,
                excludeKind,
                kind,
                profile,
                path,
                separate,
            );
        },
        [permissionCode, kind],
    );

    return hasPermission;
}

export default useValidatePermission;
