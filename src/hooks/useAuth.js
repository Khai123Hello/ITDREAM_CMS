import { useSelector } from 'react-redux';

import accountSelectors from '@selectors/account';
import useFetchAction from './useFetchAction';
import { accountActions } from '@store/actions';
import useActionLoading from './useActionLoading';
import { getCacheAccessToken } from '@services/userService';
import { jwtDecode } from 'jwt-decode';

const useAuth = () => {
    const profile = useSelector(accountSelectors.selectProfile);
    const token = getCacheAccessToken();
    let permissionCode = [];
    if (token) {
        const decoded = jwtDecode(token);
        permissionCode =
            decoded?.authorities?.length > 0 ? decoded?.authorities.map((role) => role.replace(/^ROLE_/, '')) : [];
    }

    const immediate = !!token && !profile;

    useFetchAction(accountActions.getProfile, { immediate });

    const { loading } = useActionLoading(accountActions.getProfile.type);

    const kind = profile?.kind;

    // const permissionCode = profile?.authorities || [];

    return {
        isAuthenticated: !!profile,
        profile,
        kind,
        permissionCode,
        token,
        loading: immediate || loading,
    };
};

export default useAuth;
