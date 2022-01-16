import {AppState, Effect, history, ImmerReducer} from 'umi';
import {FactoryContract, GetFundingContract, Web3Instance} from "@/utils/web3";
import {getDvaApp} from "@@/plugin-dva/exports";


export interface Funding {
    address: string,
    manager: string,
    name: string,
    target: number,
    price: number,
    endAt: number,
    investors: Investor[],
    investorsCount: number,
    expensesCount: 0,
    expenses: Expense[],
    needConsent: boolean,
    ended: boolean,
    current: number,
    balance: number

}


interface Investor {
    addr: string,
    amount: number
}

export enum ExpenseStatus {
    Pending, Approved, Rejected
}

export interface Expense {
    reason: string,
    amount: number,
    receiver: string,
    status: ExpenseStatus,
    approveCount: number,
    index: number
}

export interface CrowdfundingState {
    fundings: Funding[],
    joinedFundings: Funding[],
    ownedFundings: Funding[],
    account: string,
    processing: boolean,
    detail: Funding,
}

export interface CrowdfundingType {
    namespace: 'funding';
    state: CrowdfundingState;
    effects: {
        getFundings: Effect;
        createFunding: Effect;
        invest: Effect;
        getInvestors: Effect;
        getDetail: Effect;
        applyExpense: Effect;
        getExpenses: Effect;
        execExpense: Effect;
        transfer: Effect;
        vote: Effect;
    };
    reducers: {
        setFundings: ImmerReducer<CrowdfundingState>;
        setProcessing: ImmerReducer<CrowdfundingState>;
        setInvestors: ImmerReducer<CrowdfundingState>;
        setDetail: ImmerReducer<CrowdfundingState>;
        setExpenses: ImmerReducer<CrowdfundingState>;

    };
}

const CrowdfundingModel: CrowdfundingType = {
    namespace: 'funding',
    state: {
        fundings: [],
        joinedFundings: [],
        ownedFundings: [],
        account: '',
        processing: false,
        detail: {
            manager: '',
            name: '',
            target: 0,
            current: 0,
            price: 0,
            endAt: 0,
            investors: [],
            expensesCount: 0,
            investorsCount: 0,
            needConsent: false,
            ended: false,
            expenses: [],
            address: '',
            balance: 0
        }
    },
    reducers: {
        setFundings(state, action) {
            switch (action.payload.type) {
                case 'all':
                    return {
                        ...state,
                        fundings: action.payload.details
                    }
                case 'joined':
                    return {
                        ...state,
                        joinedFundings: action.payload.details
                    }
                case 'owned':
                    return {
                        ...state,
                        ownedFundings: action.payload.details
                    }
            }
        },
        setProcessing(state, action) {
            return {...state, processing: action.payload}
        },
        setDetail(state, action) {
            return {...state, detail: action.payload}
        },
        setInvestors(state, action) {
            let detail = Object.assign({}, state.detail)
            detail.investors = action.payload
            return {...state, detail: detail}
        },
        setExpenses(state, action) {
            let detail = Object.assign({}, state.detail)
            detail.expenses = action.payload
            return {...state, detail: detail}
        }

    },
    effects: {
        * getFundings({payload}, {call, put, select}) {
            let {type} = payload
            let fundings: any;
            let app = yield select((s: { app: AppState }) => s.app)

            switch (type) {
                case 'all':
                    fundings = yield FactoryContract.methods.getFundings().call()
                    break;
                case 'joined':
                    fundings = yield FactoryContract.methods.getJoinedfundings().call({from: app.account})
                    break;
                case 'owned':
                    fundings = yield FactoryContract.methods.getOwnedFundings().call({from: app.account})
                    break;
            }

            if (fundings && fundings.length) {
                let ps = fundings.map((f: string) => {
                    return GetFundingContract(f).methods.getInfo().call()
                });
                let infos = yield Promise.all(ps)
                let details = infos.reverse().map((info: any) => {
                    let funding: Funding = {
                        manager: info[0],
                        name: info[1],
                        target: info[2] / 10 ** 15,
                        current: parseFloat(info[3]) / 10 ** 15,
                        price: parseFloat(info[4]) / 10 ** 15,
                        endAt: parseInt(info[5]) * 1000,
                        investors: info[6],
                        investorsCount: parseInt(info[7]),
                        expensesCount: info[8],
                        needConsent: info[9],
                        ended: info[10],
                        expenses: [],
                        address: info[11],
                        balance: 0
                    }
                    return funding;
                })
                yield put({type: 'setFundings', payload: {details, type}})
            }

        },
        * createFunding({payload}, {call, put, select}) {
            let app = yield select((s: { app: AppState }) => s.app)
            let res = yield FactoryContract.methods.createFunding(payload.name, payload.target, payload.manager, payload.price ? payload.price : 1, payload.period, payload.consent).send({from: app.account})
            getDvaApp()._store.dispatch({
                type: 'app/setNotify',
                payload: {show: true, type: 'success', message: 'success', description: `fund raising create success`}
            })
            yield history.push('/crowdfunding')

        },
        * invest({payload}, {call, put, select}) {
            const {amount, funding} = payload
            let state = yield select()
            let notified: boolean = false
            yield GetFundingContract(funding.address).methods.invest().send({
                from: state.app.account,
                to: funding.address,
                value: amount * 10 ** 15,
            }).on('sent', function (hash: string) {
                console.log('sent')
            }).on('sending', function (hash: string) {
                console.log('sending')
            }).on('transactionHash', function (hash: string) {
                console.log('transactionHash')
            }).on('confirmation', function (confirmationNumber: number, receipt: any) {
                if (!notified) {
                    notified = true
                    getDvaApp()._store.dispatch({
                        type: 'app/setNotify',
                        payload: {show: true, type: 'success', message: 'success', description: `support ${amount} Finney confirmed`}
                    })
                    getDvaApp()._store.dispatch({
                        type: 'funding/setProcessing',
                        payload: false
                    })
                }

            }).on('receipt', function (receipt: any) {
                console.log('receipt');
                console.log(receipt);

            }).on('error', function (error: Error, receipt: object) {
                put({
                    type: 'app/setNotify',
                    payload: {show: true, type: 'error', message: 'transaction failed', description: error.message}
                })
            });
            yield put({type: 'getDetail', payload: funding.address})
            yield put({type: 'getFundings', payload: 'joined'})


        },

        * getInvestors({payload}, {call, put, select}) {
            let rawInvestors = yield GetFundingContract(payload).methods.getInvstors().call()
            let investors: Investor[] = rawInvestors.map((r: any) => {
                return {
                    addr: r[0],
                    amount: parseFloat(r[1]) / 10 ** 15
                }
            })
            if (investors) {
                investors = investors.reverse()
            }
            yield put({type: 'setInvestors', payload: investors})
        },
        * getDetail({payload}, {call, put, select}) {
            let info = yield GetFundingContract(payload).methods.getInfo().call()
            let funding: Funding = {
                manager: info[0],
                name: info[1],
                target: parseFloat(info[2]) / 10 ** 15,
                current: parseFloat(info[3]) / 10 ** 15,
                price: parseFloat(info[4]) / 10 ** 15,
                endAt: parseInt(info[5]) * 1000,
                investors: info[6],
                investorsCount: info[7],
                expensesCount: info[8],
                needConsent: info[9],
                ended: info[10],
                expenses: [],
                address: info[11],
                balance: 0

            }
            funding.balance = yield Web3Instance.eth.getBalance(payload).then((i) => {
                return parseFloat(i) / 10 ** 15
            })

            yield put({type: 'setDetail', payload: funding})
            yield put({type: 'getInvestors', payload})
            yield put({type: 'getExpenses', payload})
        },
        * applyExpense({payload}, {call, put, select}) {
            let {reason, amount, receiver} = payload
            let state = yield select()

            yield GetFundingContract(payload.address).methods.applyExpense(reason, amount, receiver).send({from: state.app.account})
            yield put({
                type: 'app/setNotify',
                payload: {show: true, type: 'success', message: 'success', description: `apply ${amount} Finney for ${reason} submitted`}
            })
            yield put({
                type: 'setProcessing',
                payload: false
            })
            return true;
        },
        * getExpenses({payload}, {call, put, select}) {
            let total = yield GetFundingContract(payload).methods.getExpenseCount().call()
            let expenses: Expense[] = [];
            for (let i = 0; i < total; i++) {
                let r = yield GetFundingContract(payload).methods.getExpnseByIndex(i).call()
                expenses.push({
                    reason: r[0],
                    amount: parseFloat(r[1]) / 10 ** 15,
                    receiver: r[2],
                    status: r[3],
                    approveCount: parseInt(r[4]),
                    index: i
                })
            }
            yield put({type: 'setExpenses', payload: expenses ? expenses.reverse() : expenses})

        },
        * execExpense({payload}, {call, put, select}) {
            let state = yield select()

            yield GetFundingContract(state.funding.detail.address).methods.execExpense(payload).send({from: state.app.account})
            yield put({
                type: 'app/setNotify',
                payload: {show: true, type: 'success', message: 'success', description: `execute expense processed`}
            })
            yield put({type: 'getDetail', payload: payload})

        },
        * vote({payload}, {call, put, select}) {
            let state = yield select()

            yield GetFundingContract(state.funding.detail.address).methods.vote(payload, ExpenseStatus.Approved).send({from: state.app.account})
            yield put({
                type: 'app/setNotify',
                payload: {show: true, type: 'success', message: 'success', description: `Approve expense processed`}
            })
            yield put({type: 'getExpenses', payload: state.funding.detail.address})
        },
        * transfer({payload}, {call, put, select}) {
            let state = yield select()

            yield GetFundingContract(state.funding.detail.address).methods.applyExpense('transfer', (payload * 10 ** 15).toString(), state.funding.detail.manager).send({from: state.app.account})
            yield put({
                type: 'app/setNotify',
                payload: {
                    show: true,
                    type: 'success',
                    message: 'success',
                    description: `transfer ${payload} Finney to ${state.funding.detail.manager} processed`
                }
            })
            yield put({
                type: 'setProcessing',
                payload: false
            })
            return false;
        },

    }
};
export default CrowdfundingModel