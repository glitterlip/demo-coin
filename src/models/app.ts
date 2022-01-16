import {Effect, ImmerReducer} from 'umi';
import {getDvaApp} from "@@/plugin-dva/exports";
import {notification} from "antd";

const app = getDvaApp()

export interface AppState {
    account: string,
    notify: {
        show: boolean,
        type: 'success' | 'info' | 'warning' | 'error',
        description: string,
        message: string
    }
}

export interface AppType {
    namespace: 'app';
    state: AppState;
    effects: {
        getAccount: Effect;
        setNotify: Effect;

    };
    reducers: {
        setAccount: ImmerReducer<AppState>;

    };
}

const AppModel: AppType = {
    namespace: 'app',
    state: {
        account: '',
        notify: {
            show: false,
            type: 'success',
            message: '',
            description: ''
        }
    },
    reducers: {
        setAccount(state, action) {
            return {
                ...state,
                account: action.payload
            };
        },

    },
    effects: {
        * getAccount({payload}, {call, put, select}) {
            let provider = window.ethereum
            let accounts = yield provider.request({method: 'eth_requestAccounts'})
            yield put({type: 'app/setAccount', payload: accounts[0]})
        },
        * setNotify({payload}, {call, put, select}) {
            let {message, description} = payload
            // @ts-ignore
            notification[payload.type]({
                message, description,
            })
        }
    }
};
export default AppModel