import {AppState, connect} from 'umi';
import {MetaMaskInpageProvider} from "@metamask/providers";
import {Avatar, Badge, Button, Card, Col, Collapse, Form, Input, InputNumber, Layout, List, Menu, Modal, Progress, Row, Tabs} from 'antd'
import {useEffect, useState} from "react";
import {ConnectProps, CrowdfundingState, Dispatch, ExpenseStatus, Funding} from "@@/plugin-dva/connect";
import {CheckOutlined, DollarOutlined, ExclamationCircleOutlined, SendOutlined, UserOutlined} from "@ant-design/icons";
import web3 from "web3";

const {Panel} = Collapse;
const {confirm} = Modal;
const {TabPane} = Tabs;
const {SubMenu} = Menu;
declare global {
    interface Window {
        ethereum: MetaMaskInpageProvider
    }
}
const {Content} = Layout;

interface PageProps extends ConnectProps {
    funding: CrowdfundingState,
    dispatch: Dispatch,
    app: AppState
}

function Crowdfunding(props: PageProps) {
    let [visible, setVisible] = useState(false)
    let [transferVisible, setTransferVisible] = useState(false)
    let [applyModel, setApplyModel] = useState(false)
    let [amount, setAmount] = useState(100)
    let [transferAmount, setTransferAmount] = useState(100)
    let funding: Funding = props.funding.detail
    const [form] = Form.useForm();
    useEffect(() => {
        if (!props.funding.detail.manager) {
            props.dispatch({type: 'funding/getDetail', payload: (props.location.query as any).address})

        }
    })

    useEffect(() => {
        props.dispatch({
            type: 'funding/getFundings', payload: {type: 'all'}
        })
        props.dispatch({
            type: 'funding/getFundings', payload: {type: 'owned'}
        })
        props.dispatch({
            type: 'funding/getFundings', payload: {type: 'joined'}
        })
    }, [])


    let now = Date.now();
    let percent = parseFloat((funding.current / funding.target * 100).toFixed(2));

    const share = (funding: Funding) => {
        console.log(funding)
    }
    const invest = () => {
        console.log(amount)
        props.dispatch({type: 'funding/setProcessing', payload: true})
        props.dispatch({type: 'funding/invest', payload: {amount, funding}})
        setVisible(false)
    }
    const apply = (values: any) => {
        values.address = funding.address
        props.dispatch({type: 'funding/applyExpense', payload: values}).then((v: boolean) => {
            setApplyModel(!v)
        })
    }
    const transfer = () => {
        props.dispatch({type: 'funding/transfer', payload: transferAmount}).then(setTransferVisible)
    }
    const execExpense = (index: number) => {
        props.dispatch({type: 'funding/execExpense', payload: index})

    }
    const approve = (index: number) => {
        props.dispatch({type: 'funding/vote', payload: index})
    }
    return (
        <Content>
            <Row justify={'center'}>
                <Col span={16}>
                    <Card title={funding.name} bordered={false} key={funding.address}>
                        <p>Will End At: {now > funding.endAt ? 'Ended' : (new Date(funding.endAt).toLocaleString())}</p>
                        <p>Target :{funding.target} Finney</p>
                        <p>Raised :{funding.current} Finney</p>
                        <p>Balance :{funding.balance} Finney</p>
                        <p>Manager :{funding.manager} </p>
                        <p>Supporters :{funding.investors ? funding.investors.length : 0}</p>
                        <Progress percent={percent} status="active"/>
                        <Button type="primary" icon={<SendOutlined/>} onClick={() => {
                            share(funding)
                        }}>
                            Share
                        </Button>
                        <Button type="primary" loading={props.funding.processing} icon={<DollarOutlined/>} onClick={() => {
                            setVisible(!visible)
                        }}>{props.funding.processing ? 'processing' : 'Support'}
                        </Button>
                        {
                            funding.manager.toLowerCase() === props.app.account.toLowerCase() && funding.needConsent ?
                                <Button type="primary" icon={<DollarOutlined/>} onClick={() => {
                                    setApplyModel(!applyModel)
                                }}>Apply Expense
                                </Button> : null
                        }
                        {
                            funding.manager.toLowerCase() === props.app.account.toLowerCase() && !funding.needConsent ?
                                <Button type="primary" icon={<DollarOutlined/>} onClick={() => {
                                    setTransferVisible(true)
                                }}>Transfer
                                </Button> : null
                        }
                        {
                            funding.manager.toLowerCase() === props.app.account.toLowerCase() && !funding.ended ?
                                <Button type="primary" icon={<DollarOutlined/>} onClick={() => {
                                    confirm({
                                        title: 'Are you sure terminate this fund raising?once terminated cant restart',
                                        icon: <ExclamationCircleOutlined/>,
                                        content: `this fund for [${funding.name}] has raised ${funding.current} `,
                                        okText: 'Yes',
                                        okType: 'danger',
                                        cancelText: 'No',
                                        onOk() {
                                            console.log('OK');
                                        },
                                        onCancel() {
                                            console.log('Cancel');
                                        },
                                    });
                                }}>Terminate
                                </Button> : null
                        }
                        <Modal
                            visible={visible}
                            title="Support"
                            okText="Confirm"
                            cancelText="Cancel"
                            onCancel={() => {
                                setVisible(false)
                            }}
                            onOk={() => {
                                invest()
                            }}
                        >
                            <InputNumber onChange={(v) => {
                                setAmount(v)
                            }} addonAfter="Finney" addonBefore={"$"} min={funding.needConsent ? funding.price : 0}/>
                        </Modal>
                        <Modal
                            visible={transferVisible}
                            title="Transfer"
                            okText="Confirm"
                            cancelText="Cancel"
                            onCancel={() => {
                                setTransferVisible(false)
                            }}
                            onOk={() => {
                                transfer()
                            }}
                        >
                            <InputNumber onChange={(v: number) => {
                                setTransferAmount(v)
                            }} addonAfter="Finney" addonBefore={"$"}/>
                        </Modal>
                        <Modal
                            visible={applyModel}
                            title="Create a new collection"
                            okText="Create"
                            confirmLoading={props.funding.processing}
                            cancelText="Cancel"
                            onCancel={() => {
                                setApplyModel(false)
                            }}
                            onOk={() => {
                                form
                                    .validateFields()
                                    .then(values => {
                                        form.resetFields();
                                        apply(values);
                                    })
                                    .catch(info => {
                                        console.log('Validate Failed:', info);
                                    });
                            }}
                        >
                            <Form
                                form={form}
                                layout="vertical"
                                name="form_in_modal"
                                initialValues={{modifier: 'public'}}
                            >
                                <Form.Item
                                    name="reason"
                                    label="Reason"
                                    rules={[{required: true, message: 'Please input the Reason of expense!'}]}
                                >
                                    <Input/>
                                </Form.Item>
                                <Form.Item name="amount" label="Amount" rules={[{required: true}, {type: 'number', min: 1}]}>
                                    <InputNumber addonAfter="Finney" addonBefore={"$"}/>
                                </Form.Item>
                                <Form.Item name="receiver" label='receiver address' rules={[{required: true}]}>
                                    <Input/>
                                </Form.Item>
                            </Form>
                        </Modal>
                    </Card>
                </Col>
            </Row>
            <Tabs defaultActiveKey="1" centered>
                <TabPane tab="Investors" key="1">
                    <Row justify={'center'}>
                        <Col span={18}>
                            <List
                                header={<div>Supporters</div>}
                                footer={<div>Transaction details at <a target={'_blank'}
                                                                       href={`https://ropsten.etherscan.io/address/${funding.address}`}>ropsten.etherscan.io</a>
                                </div>}
                                bordered
                                dataSource={props.funding.detail.investors}
                                locale={{emptyText: `no Supporters yet`}}
                                renderItem={item => {
                                    return item.addr == web3.utils.toChecksumAddress(props.app.account) ?
                                        <Badge.Ribbon text="Me" color="purple">
                                            <List.Item>
                                                {`${item.addr} support ${item.amount} Finney`} <Avatar size="small"
                                                                                                       style={{backgroundColor: '#87d068'}}
                                                                                                       icon={<UserOutlined/>}/>
                                            </List.Item>
                                        </Badge.Ribbon>
                                        : <List.Item>
                                            {`${item.addr} support ${item.amount} Finney`}
                                        </List.Item>
                                }}
                            />
                        </Col>
                    </Row>
                </TabPane>
                {funding.needConsent ? <TabPane tab="Expense" key="2">
                    <Row justify={'center'}>
                        <Col span={18}>
                            <Collapse defaultActiveKey={['1']}>
                                {funding.expenses.map((e, i) => {
                                    let percent = parseFloat((e.approveCount / funding.investorsCount * 100).toFixed(2))
                                    let owned = funding.manager.toLowerCase() === props.app.account.toLowerCase()
                                    let joined = funding.investors ? funding.investors.some(v => {
                                        return v.addr.toLowerCase() === props.app.account.toLowerCase()
                                    }) : false
                                    return <Panel header={e.reason} key={i}>
                                        <p>Amount : {e.amount} Finney</p>
                                        <p>Address : {e.receiver}</p>
                                        <p>Status : {e.status == 0 ? 'Pending' : 'Approved'}</p>
                                        <p>Approval Count : {e.approveCount}</p>
                                        <p>Approval Percent : {percent}%</p>
                                        {owned ? <p><Button type="primary" icon={<SendOutlined/>} disabled={percent < 0.5||e.status!=ExpenseStatus.Pending} onClick={() => {
                                            execExpense(e.index)
                                        }}>Transfer</Button></p> : null}
                                        {joined && e.status == ExpenseStatus.Pending ?
                                            <p><Button type="primary" icon={<CheckOutlined/>} onClick={() => {
                                                approve(e.index)
                                            }}>Approve</Button></p> : null}
                                    </Panel>
                                })}
                            </Collapse>
                        </Col>
                    </Row>
                </TabPane> : null}
                <TabPane tab="More" key="3">
                    Content of Tab Pane 3
                </TabPane>
            </Tabs>

        </Content>
    );
}

export default connect(({funding, app}: { funding: CrowdfundingState, app: AppState }) => {
    return {funding, app}
})(Crowdfunding)