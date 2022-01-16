import {defineConfig} from 'umi';

export default defineConfig({
    dva: {
        immer: {
            enableAllPlugins: true
        },
        hmr: true,
    },
    history:{
        type:'hash'
    },
    nodeModulesTransform: {
        type: 'none',
    },
    mfsu: {},
    routes: [
        {
            path: "/*",
            component: "@/layouts/index",
            exact: true,
            routes: [
                {
                    path: "/lottery",
                    component: "lottery/index",
                    exact: true
                },
                {
                    path: "/crowdfunding",
                    component: "crowdfunding/index",
                    exact: true
                },
                {
                    path: "/crowdfunding/create",
                    component: "crowdfunding/create",
                    exact: true
                },
                {

                    path: "/crowdfunding/detail",
                    component: "crowdfunding/detail",
                    exact: true
                }
            ]
        }
    ],
    fastRefresh: {},
});
