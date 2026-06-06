import React from 'react';
import Layout from '@/components/layouts/Layout';

import styles from './Forbidden.module.scss';

function Forbidden() {
    return (
        <Layout.Root>
            <Layout.Body className={styles.body}>
                <h5 className={styles.title}>Không có quyền truy cập!</h5>
                <p className={styles.description}>
                    Bạn không có quyền truy cập trang này, hãy kiểm tra lại hoặc liên hệ quản trị viên để được hỗ trợ!
                </p>
            </Layout.Body>
            <Layout.Footer className={styles.footer} />
        </Layout.Root>
    );
}

export default Forbidden;
