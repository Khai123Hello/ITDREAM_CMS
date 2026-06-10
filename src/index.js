import React from 'react';
import { Provider } from 'react-redux';
import { render } from 'react-dom';

// Suppress benign ResizeObserver error overlay in development
const preventResizeObserverError = (e) => {
    if (e.message === 'ResizeObserver loop limit exceeded' || e.message === 'ResizeObserver loop completed with undelivered notifications.') {
        const errOverlay = document.getElementById('webpack-dev-server-client-overlay');
        if (errOverlay) {
            errOverlay.style.display = 'none';
        }
    }
};
window.addEventListener('error', preventResizeObserverError);

import store from '@store';
import reportWebVitals from './reportWebVitals';

import App from './App';
import LanguageProvider from '@locales/LanguageProvider';

import '@assets/scss/index.scss';

render(
    <React.StrictMode>
        <Provider store={store}>
            <LanguageProvider>
                <App />
            </LanguageProvider>
        </Provider>
    </React.StrictMode>,
    document.getElementById('root'),
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
