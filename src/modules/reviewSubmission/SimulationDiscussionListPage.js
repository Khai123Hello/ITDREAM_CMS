import React from 'react';
import useTranslate from '@hooks/useTranslate';
import { commonMessage } from '@locales/intl';
import PageWrapper from '@components/common/layout/PageWrapper';
import SimulationListForDiscussion from './SimulationListForDiscussion';

const SimulationDiscussionListPage = ({ pageOptions }) => {
    const translate = useTranslate();
    const breadcrumbs = pageOptions
        ? pageOptions.renderBreadcrumbs(commonMessage, translate)
        : [{ breadcrumbName: 'Thảo luận bài mô phỏng' }];

    return (
        <PageWrapper routes={breadcrumbs}>
            <SimulationListForDiscussion />
        </PageWrapper>
    );
};

export default SimulationDiscussionListPage;
