import {connect, LotteryState,AppState} from 'umi';
import {MetaMaskInpageProvider} from "@metamask/providers";
import {Avatar, Badge, Button, Card, Col, Divider, InputNumber, Layout, List, Menu, Modal, notification, Progress, Row, Tabs, Tag} from 'antd'
import {DollarOutlined, UserOutlined} from '@ant-design/icons';
import {useEffect, useRef, useState} from "react";
import { ConnectProps, Dispatch} from "@@/plugin-dva/connect";
import web3 from 'web3'
import {ETH_SITES, LotteryContractAddress, TAG_COLORS} from "@/consts";

const {TabPane} = Tabs;
const {SubMenu} = Menu;
declare global {
    interface Window {
        ethereum: MetaMaskInpageProvider
    }
}
const {Header, Footer, Sider, Content} = Layout;

interface PageProps extends ConnectProps {
    lottery: LotteryState;
    dispatch: Dispatch;
    app: AppState;
}

function IndexPage(props: PageProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    let [visible, setVisible] = useState(false)
    let [amount, setAmount] = useState(0)
    useEffect(() => {
        props.dispatch({type: 'lottery/getManager'});
        props.dispatch({type: 'lottery/getBettors'});
        props.dispatch({type: 'lottery/getTarget'});
        props.dispatch({type: 'lottery/getCurrent'});
        props.dispatch({type: 'lottery/getWinners'});
        props.dispatch({type: 'lottery/getMinimum'});
        props.dispatch({type: 'lottery/getRound'});

    }, [props.lottery.current])

    const bet = () => {
        props.dispatch({type: 'lottery/setProcessing', payload: true})
        props.dispatch({type: 'lottery/bet', payload: amount})
        setVisible(false)
    }
    return (
        <Content>
            <Row justify={'center'}>
                <Col span={8}>
                    <Card title="1 Finney Lottery"
                          extra={<a target={'_blank'} href={`https://ropsten.etherscan.io/bytecode-decompiler?a=${LotteryContractAddress}`}>Contract
                              Source Code</a>}>
                        <p>Manager:{props.lottery.manager}</p>
                        <p>Prize Pool:{props.lottery.target / (10 ** 15)} Finney</p>
                        <p>Current:{props.lottery.current / (10 ** 15)} Finney</p>
                        <p>Round:{props.lottery.round}</p>
                        <p>Minimum Bet:{props.lottery.minimum / 10 ** 15} Finney</p>
                        <Progress percent={parseInt((props.lottery.current / props.lottery.target * 100).toFixed())} status="active"/>
                        <Button type="primary" loading={props.lottery.processing} icon={<DollarOutlined/>} onClick={() => {
                            setVisible(!visible)
                        }}>
                            {props.lottery.processing ? 'Processing' : 'Place a bet'}
                        </Button>
                        <Modal
                            visible={visible}
                            title="Confirm your bet"
                            okText="Confirm"
                            cancelText="Cancel"
                            onCancel={() => {
                                setVisible(false)
                            }}
                            onOk={() => {
                                bet()
                            }}
                        >
                            <InputNumber value={amount} onChange={(v) => {
                                setAmount(v)
                            }} ref={inputRef} addonAfter="Finney" addonBefore={"$"} defaultValue={1} step={1} min={1} max={100}/>
                        </Modal>
                    </Card>

                </Col>
            </Row>
            <Row justify={'center'}>
                <Col span={16}>
                    <Tabs defaultActiveKey="1" centered>
                        <TabPane tab="Bettors" key="1">
                            <List
                                header={<div>Bettors</div>}
                                footer={<div>Bet details at <a target={'_blank'}
                                                               href={`https://ropsten.etherscan.io/address/${LotteryContractAddress}`}>ropsten.etherscan.io</a>
                                </div>}
                                bordered
                                dataSource={props.lottery.bettors}
                                locale={{emptyText: `no bettors in round ${props.lottery.round} yet`}}
                                renderItem={item => {
                                    return item.addr == web3.utils.toChecksumAddress(props.app.account) ?
                                        <Badge.Ribbon text="Me" color="purple">
                                            <List.Item>
                                                {`${item.addr} bet ${item.value / (10 ** 15)} Finney`} <Avatar size="small"
                                                                                                               style={{backgroundColor: '#87d068'}}
                                                                                                               icon={<UserOutlined/>}/>
                                            </List.Item>
                                        </Badge.Ribbon>
                                        : <List.Item>
                                            {`${item.addr} bet ${item.value / (10 ** 15)} Finney`}
                                        </List.Item>
                                }}
                            />
                        </TabPane>
                        <TabPane tab="Winners" key="2">
                            <List
                                header={<div>Latest Winners</div>}
                                footer={<div>More winner details at <a target={'_blank'}
                                                                       href={`https://ropsten.etherscan.io/address/${LotteryContractAddress}#internaltx`}>ropsten.etherscan.io</a>
                                </div>}
                                bordered
                                dataSource={props.lottery.winners}
                                renderItem={item => {
                                    return item.addr == web3.utils.toChecksumAddress(props.app.account) ?
                                        <Badge.Ribbon text="Me" color="purple">
                                            <List.Item>
                                                {`Round ${item.round} : Winner [${item.addr}] Prize [100 Finney]`}
                                                <Avatar size="small" style={{backgroundColor: '#87d068'}}
                                                        icon={<UserOutlined/>}/>
                                            </List.Item>

                                        </Badge.Ribbon>
                                        : <List.Item>
                                            {`Round ${item.round} : Winner [${item.addr}] Prize [100 Finney]`}
                                        </List.Item>

                                }

                                }
                            />
                        </TabPane>
                        <TabPane tab="Free ETH" key="3">
                            <Divider orientation="left">Free ETH Websites</Divider>
                            <div>
                                {ETH_SITES.map((item, index) => {
                                    return <Tag key={item.name} color={TAG_COLORS[index % TAG_COLORS.length]}><a href={item.address}
                                                                                                                 target={"_blank"}>{item.name}</a></Tag>

                                })}

                            </div>
                        </TabPane>

                    </Tabs>
                </Col>
            </Row>
        </Content>
    );
}

export default connect(({lottery, app}: { lottery: LotteryState, app: AppState }) => {
    return {lottery, app}
})(IndexPage)