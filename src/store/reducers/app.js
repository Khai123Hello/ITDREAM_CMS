import { createReducer } from '@store/utils';
import { appActions } from '@store/actions';
import { defaultLocale } from '@constants';

const {
    hideAppLoading,
    showAppLoading,
    toggleActionLoading,
    changeLanguage,
} = appActions;

const initialState = {
    appLoading: 0,
    locale: defaultLocale,
};

const appReducer = createReducer(
    {
        reducerName: 'app',
        initialState,
        storage: {
            whiteList: [ 'theme', 'locale' ],
        },
    },
    {
        [showAppLoading.type]: (state) => {
            state.appLoading++;
        },
        [hideAppLoading.type]: (state) => {
            state.appLoading = Math.max(0, state.appLoading - 1);
        },
        [toggleActionLoading.type]: (state, action) => {
            if (action.payload.isLoading) {
                state[action.payload.type] = true;
            } else {
                delete state[action.payload.type];
            }
        },
        [changeLanguage.type]: (state, { payload }) => {
            state.locale = payload;
        },
    },
);

export default appReducer;
