import { createFailureActionType, createReducer } from '@store/utils';
import { accountActions } from '@store/actions';
import { getData, setData, removeItem } from '@utils/localStorage';
import { storageKeys, UserTypes } from '@constants';


const {
    logout,
    getProfileSuccess,
    getProfile,
    setUserType,
} = accountActions;

const initialState = {
    profile: null,
};

const accountReducer = createReducer(
    {
        reducerName: 'account',
        initialState,
        // storage: true,
        storage: false,
    },
    {
        [getProfileSuccess.type]: (state, { payload }) => {
            state.profile = payload?.data || null;
            if (getData(storageKeys.USER_KIND) === UserTypes.MANAGER) {
                setData(storageKeys.TENANT_API_URL, payload?.data?.serverProviderDto?.url);
                setData(storageKeys.TENANT_HEADER, payload?.data?.tenantId);
                setData(storageKeys.TENANT_ID, payload?.data?.id);
            }

            state.profile = payload?.data || null;
        },
        [createFailureActionType(getProfile.type)]: (state, { payload }) => {
            console.log({ payload });
        },
        [setUserType.type]: (state, { payload }) => {
            state.userType = payload;
            setData(storageKeys.USER_TYPE, payload);
        },
        [logout.type]: (state) => {
            state.profile = null;
            state.userType = null; 
            removeItem(storageKeys.USER_TYPE);
            removeItem(storageKeys.PARENT_TASK_INFO);
        },
    },
);

export default accountReducer;
