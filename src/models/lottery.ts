import {Effect, ImmerReducer} from 'umi';
import {LotteryContract } from "@/utils/web3";
import {LotteryContractAddress} from '@/consts';
import {getDvaApp} from "@@/plugin-dva/exports";

const app = getDvaApp()

export interface LotteryState {
    minimum: number,
    target: number,
    current: number,
    manager: string,
    players: string[],
    winners: Array<{ addr: string, round: number }>,
    round: number,
    bettors: Array<{ addr: string, value: number }>,
    account: string,
    processing: boolean,

}

export interface LotteryType {
    namespace: 'lottery';
    state: LotteryState;
    effects: {
        getManager: Effect;
        getMinimum: Effect;
        getTarget: Effect;
        getCurrent: Effect;
        getPlayers: Effect;
        getBettors: Effect;
        getWinners: Effect;
        getRound: Effect;
        bet: Effect;
    };
    reducers: {
        setManager: ImmerReducer<LotteryState>;
        setMinimum: ImmerReducer<LotteryState>;
        setTarget: ImmerReducer<LotteryState>;
        setCurrent: ImmerReducer<LotteryState>;
        setPlayers: ImmerReducer<LotteryState>;
        setBettors: ImmerReducer<LotteryState>;
        setWinners: ImmerReducer<LotteryState>;
        setRound: ImmerReducer<LotteryState>;
        setAccount: ImmerReducer<LotteryState>;
        setProcessing: ImmerReducer<LotteryState>;
    };
}

const LotteryModel: LotteryType = {
    namespace: 'lottery',
    state: {
        minimum: 0,
        target: 0,
        current: 0,
        manager: '',
        players: [],
        winners: [],
        bettors: [],
        round: 0,
        account: '',
        processing: false,



    },
    reducers: {
        setManager(state, action) {
            return {
                ...state,
                manager: action.payload
            };
        },
        setMinimum(state, action) {
            return {
                ...state,
                minimum: action.payload
            };
        },
        setTarget(state, action) {
            return {
                ...state,
                target: action.payload
            };
        },
        setCurrent(state, action) {
            return {
                ...state,
                current: action.payload
            };
        },
        setPlayers(state, action) {
            return {
                ...state,
                players: action.payload
            };
        },
        setBettors(state, action) {
            return {
                ...state,
                bettors: action.payload
            };
        },
        setWinners(state, action) {
            return {
                ...state,
                winners: action.payload
            };
        },
        setRound(state, action) {
            return {
                ...state,
                round: action.payload
            };
        },
        setAccount(state, action) {
            return {
                ...state,
                account: action.payload
            };
        },

        setProcessing(state, action) {
            return {...state, processing: action.payload}
        }
    },
    effects: {
        * getManager({payload}, {call, put, select}) {
            let manager = yield LotteryContract.methods.manager().call()
            yield put({type: 'setManager', payload: manager})

        },
        * getMinimum({payload}, {call, put, select}) {
            let minimum = yield LotteryContract.methods.minimum().call()
            yield put({type: 'setMinimum', payload: minimum})
        },
        * getTarget({payload}, {call, put, select}) {
            let target = yield LotteryContract.methods.target().call()
            yield put({type: 'setTarget', payload: target})
        },
        * getCurrent({payload}, {call, put, select}) {
            let current = yield LotteryContract.methods.current().call()
            yield put({type: 'setCurrent', payload: current})
        },
        * getPlayers({payload}, {call, put, select}) {
            let players = yield LotteryContract.methods.players().call()
            yield put({type: 'setPlayers', payload: players})
        },
        * getBettors({payload}, {call, put, select}) {
            let bettors = yield LotteryContract.methods.getBettors().call()
            bettors = [...bettors].reverse();

            yield put({type: 'setBettors', payload: bettors})
        },
        * getWinners({payload}, {call, put, select}) {
            let winners = yield LotteryContract.methods.getWinners().call()
            winners = [...winners].reverse();
            yield put({type: 'setWinners', payload: winners})
        },
        * getRound({payload}, {call, put, select}) {
            let round = yield LotteryContract.methods.round().call()
            yield put({type: 'setRound', payload: round})
        },
        * bet({payload}, {call, put, select}) {
            const state = yield select(({lottery}: { lottery: LotteryState }) => lottery)
            yield LotteryContract.methods.bet().send({
                from: state.account,
                to: LotteryContractAddress,
                value: payload * 10 ** 15,
            }).on('sent', function (hash: string) {
                console.log('sent')
            }).on('sending', function (hash: string) {
                console.log('sending')
            }).on('transactionHash', function (hash: string) {
                console.log('transactionHash')
            }).on('confirmation', function (confirmationNumber: number, receipt: any) {
                console.log('confirmation', confirmationNumber)
                console.log('confirmation', receipt)
                if (getDvaApp()._store.getState().lottery.processing){
                    getDvaApp()._store.dispatch({
                        type: 'app/setNotify',
                        payload: {show: true, type: 'success', message: 'bet success', description: `bet ${payload} Finney confirmed`}
                    })
                    getDvaApp()._store.dispatch({
                        type: 'lottery/setProcessing',
                        payload: false
                    })
                }

            }).on('receipt', function (receipt: any) {
                console.log('receipt');
                console.log(receipt);

            }).on('error', function (error: Error, receipt: object) {
                console.log('error', receipt)
                app._store.dispatch({
                    type: 'app/setNotify',
                    payload: {show: true, type: 'error', message: 'bet failed', description: error.message}
                })
            });
            yield put({type: 'getCurrent'})

        }
    }
};
export default LotteryModel