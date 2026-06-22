import { takeLatest, put } from 'redux-saga/effects';
import { accountActions } from '@store/actions';
import { processAction, createFailureActionType } from '@store/utils';
import apiConfig from '@constants/apiConfig';
import { removeCacheToken } from '@services/userService';
import { removeItem } from '@utils/localStorage';
import { storageKeys } from '@constants';

const loginSaga = (payload) => processAction(apiConfig.account.login, payload);

const getProfileSaga = (payload) => processAction(apiConfig.account.getProfile, payload);

function* getProfileFailureSaga() {
    removeCacheToken();
    removeItem(storageKeys.USER_TYPE);
    removeItem(storageKeys.PARENT_TASK_INFO);
    yield put(accountActions.logout());
    window.location.href = '/login';
}

const sagas = [
    takeLatest(accountActions.login.type, loginSaga),
    takeLatest(accountActions.getProfile.type, getProfileSaga),
    takeLatest(createFailureActionType(accountActions.getProfile.type), getProfileFailureSaga),
];

export default sagas;

