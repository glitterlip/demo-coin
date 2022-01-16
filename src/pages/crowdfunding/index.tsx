import {connect, history, LotteryState} from 'umi';
import {MetaMaskInpageProvider} from "@metamask/providers";
import {Button, Card, Col, Layout, Menu, Progress, Row, Tabs} from 'antd'
import {useEffect} from "react";
import {ConnectProps, CrowdfundingState, Dispatch} from "@@/plugin-dva/connect";

const {TabPane} = Tabs;
const {SubMenu} = Menu;
declare global {
    interface Window {
        ethereum: MetaMaskInpageProvider
    }
}
const {Content} = Layout;

interface PageProps extends ConnectProps {
    lottery: LotteryState;
    funding: CrowdfundingState,
    dispatch: Dispatch
}

function Crowdfunding(props: PageProps) {

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

    return (
        <Content>
            <Tabs defaultActiveKey="1" centered tabBarExtraContent={<Button onClick={() => {
                props.history.push('/crowdfunding/create')
            }}>Create</Button>}>
                <TabPane tab="All" key="1">
                    <Row justify={'center'} gutter={16}>
                        {props.funding.fundings.map((funding) => {
                            let now = Date.now();
                            let percent = parseInt((funding.current / funding.target * 100).toFixed());
                            return <Col sm={20} md={10} lg={8} key={`all-${funding.address}`}>
                                <Card title={funding.name} bordered={false} key={`allc-${funding.address}`} onClick={() => {
                                    props.dispatch({type: 'funding/getDetail', payload: funding.address})
                                    history.push({pathname: `/crowdfunding/detail`, query: {address: funding.address}})
                                }}>
                                    <p>Will End At: {now > funding.endAt ? 'Ended' : (new Date(funding.endAt).toLocaleString())}</p>
                                    <p>Target :{funding.target} Finney</p>
                                    <p>Raied :{funding.current} Finney</p>
                                    <p>Supported :{funding.investors ? funding.investors.length : 0}</p>
                                    <p>Will End At: {now > funding.endAt ? 'Ended' : (new Date(funding.endAt).toLocaleString())}</p>
                                    <Progress percent={percent} status="active"/>
                                </Card>
                            </Col>
                        })}
                    </Row>
                </TabPane>
                <TabPane tab="Owned" key="2">
                    <Row justify={'center'} gutter={16}>
                        {props.funding.ownedFundings.map((funding) => {
                            let now = Date.now();
                            let percent = parseInt((funding.current / funding.target * 100).toFixed());
                            return <Col sm={20} md={10} lg={8} key={`owned-${funding.address}`}>
                                <Card title={funding.name} bordered={false} key={`ownedc-${funding.address}`} onClick={() => {
                                    history.push({pathname: `/crowdfunding/detail`, query: {address: funding.address}})
                                }}>
                                    <p>Will End At: {now > funding.endAt ? 'Ended' : (new Date(funding.endAt).toLocaleString())}</p>
                                    <p>Target :{funding.target} Finney</p>
                                    <p>Raied :{funding.current} Finney</p>
                                    <p>Supported :{funding.investors ? funding.investors.length : 0}</p>
                                    <p>Will End At: {now > funding.endAt ? 'Ended' : (new Date(funding.endAt).toLocaleString())}</p>
                                    <Progress percent={percent} status="active"/>
                                </Card>
                            </Col>
                        })}
                    </Row>
                </TabPane>
                <TabPane tab="Joined" key="3">
                    <Row justify={'center'} gutter={16}>
                        {props.funding.joinedFundings.map((funding) => {
                            let now = Date.now();
                            let percent = parseInt((funding.current / funding.target * 100).toFixed());
                            return <Col sm={20} md={10} lg={8} key={`joined-${funding.address}`}>
                                <Card title={funding.name} bordered={false} key={`joinedc-${funding.address}`} onClick={() => {
                                    history.push({pathname: `/crowdfunding/detail`, query: {address: funding.address}})
                                }}>
                                    <p>Will End At: {now > funding.endAt ? 'Ended' : (new Date(funding.endAt).toLocaleString())}</p>
                                    <p>Target :{funding.target} Finney</p>
                                    <p>Raied :{funding.current} Finney</p>
                                    <p>Supported :{funding.investors.length}</p>
                                    <p>Will End At: {now > funding.endAt ? 'Ended' : (new Date(funding.endAt).toLocaleString())}</p>
                                    <Progress percent={percent} status="active"/>
                                </Card>
                            </Col>
                        })}
                    </Row>
                </TabPane>
            </Tabs>

        </Content>
    );
}

export default connect(({funding}: { funding: CrowdfundingState }) => {
    return {funding}
})(Crowdfunding)