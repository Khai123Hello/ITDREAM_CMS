import React from 'react';
import { useParams } from 'react-router-dom';

import PageWrapper from '@components/common/layout/PageWrapper';
import apiConfig from '@constants/apiConfig';
import useFetch from '@hooks/useFetch';
import useSaveBase from '@hooks/useSaveBase';
import useTranslate from '@hooks/useTranslate';
import { commonMessage } from '@locales/intl';
import BlogForm from './BlogForm';
import { UserTypes, storageKeys } from '@constants';
import { getData } from '@utils/localStorage';

const categoryParams = { kind: 2 }; // Blog Category Kind
const categoryMappingData = (res) => res.data?.content?.map((item) => ({ value: item.id, label: item.name }));

const BlogSavePage = ({ pageOptions = {} }) => {
    const userType = getData(storageKeys.USER_TYPE);
    const isEducator = userType === UserTypes.EDUCATOR;

    const translate = useTranslate();
    const { id } = useParams();

    // Fetch categories for the blog category dropdown select field
    const { data: categories } = useFetch(apiConfig.category.autoComplete, {
        immediate: true,
        params: categoryParams,
        mappingData: categoryMappingData,
    });

    const apiConfiguration = isEducator
        ? {
              getById: apiConfig.blog.educatorGet,
              create: apiConfig.blog.create,
              update: apiConfig.blog.update,
          }
        : {
              getById: apiConfig.blog.getById,
              create: apiConfig.blog.create,
              update: apiConfig.blog.update,
          };

    const { detail, mixinFuncs, loading, onSave, setIsChangedFormValues, isEditing, title } = useSaveBase({
        apiConfig: apiConfiguration,
        options: {
            getListUrl: pageOptions.listPageUrl || '/blog',
            objectName: 'blog',
        },
        override: (funcs) => {
            // Prepare payload for update
            funcs.prepareUpdateData = (data) => {
                return {
                    ...data,
                    id: parseInt(id),
                    parentId: null,
                };
            };

            // Prepare payload for create
            funcs.prepareCreateData = (data) => {
                return {
                    ...data,
                    parentId: null,
                };
            };

            // Map details response
            funcs.mappingData = (res) => {
                const data = res.data;
                return {
                    ...data,
                    categoryId: data?.category?.id,
                };
            };
        },
    });

    return (
        <PageWrapper loading={loading} routes={pageOptions.renderBreadcrumbs(commonMessage, translate, title)}>
            <BlogForm
                setIsChangedFormValues={setIsChangedFormValues}
                dataDetail={detail || {}}
                formId={mixinFuncs.getFormId()}
                isEditing={isEditing}
                actions={mixinFuncs.renderActions()}
                onSubmit={onSave}
                categories={categories || []}
            />
        </PageWrapper>
    );
};

export default BlogSavePage;
