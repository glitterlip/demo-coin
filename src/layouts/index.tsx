import { IRouteComponentProps,useDispatch } from 'umi'
import {Avatar, Badge, Button, Card, Col, Divider, InputNumber, Layout, List, Menu, Modal, notification, Progress, Row, Tabs, Tag} from "antd";
import {DollarOutlined, RedEnvelopeOutlined, UsergroupAddOutlined, UserOutlined} from "@ant-design/icons";
import {Link} from "dva/router";
const {Header, Footer, Sider, Content} = Layout;

export default function Default({ children, location, route, history, match }: IRouteComponentProps) {
    let provider = window.ethereum
    const dispatch = useDispatch()

    if (typeof provider !== 'undefined') {
        provider.request({method: 'eth_requestAccounts'}).then((accounts: any) => {
            dispatch({type: 'app/setAccount', payload: accounts[0]})
        })
        window.ethereum.on('accountsChanged', (accounts: any) => {
            dispatch({type: 'app/setAccount', payload: accounts[0]})
        })
    }
    return <Layout>
        <Header>
            <Menu mode="horizontal" theme={'dark'}>
                <Menu.Item key="mail" icon={<RedEnvelopeOutlined/>}>
                    <Link to={'/lottery'}>Lottery</Link>
                </Menu.Item>
                <Menu.Item key="app" icon={<UsergroupAddOutlined/>}>
                    <Link to={'/vote'}>Vote</Link>
                </Menu.Item>
                <Menu.Item key="alipay" icon={<DollarOutlined/>}>
                    <Link to={'/crowdfunding'}>Crowdfunding</Link>
                </Menu.Item>
            </Menu>
        </Header>
        {children}
        <Footer>page footer</Footer>
    </Layout>
}