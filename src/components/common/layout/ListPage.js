import { Card, Spin } from 'antd';
import React from 'react';

import styles from './ListPage.module.scss';

function ListPage({ searchForm, actionBar, baseTable, loading = false, children, title, style }) {
    return (
        <Card className={styles.baseListPage} style={style}>
            <Spin spinning={loading}>
                <div className={styles.title}>{title}</div>
                <div className={styles.baseListPageList}>
                    {searchForm}
                    <div className={styles.actionBar}>{actionBar}</div>
                    <div className={styles.actionBar}>{baseTable}</div>
                </div>
                {children}
            </Spin>
        </Card>
    );
}

export default ListPage;