import {connect, LotteryState} from 'umi';
import {MetaMaskInpageProvider} from "@metamask/providers";
import {Button, Col, Form, Input, InputNumber, Layout, Menu, Row, Switch, Tabs} from 'antd'
import {useRef, useState} from "react";
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
    const inputRef = useRef<HTMLInputElement>(null)
    let [needConsent, setNeedConsent] = useState(true)
    const onFinish = (values: any) => {
        props.dispatch({type:'funding/createFunding',payload:values})
    };

    const onFinishFailed = (errorInfo: any) => {
        console.log('Failed:', errorInfo);
    };
    return (
        <Content>
            <Row>
                <Col span={16}>
                    <Form
                        name="basic"
                        labelCol={{span: 8}}
                        wrapperCol={{span: 16}}
                        initialValues={{remember: true}}
                        onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                        autoComplete="off"
                    >
                        <Form.Item
                            label="Name"
                            name="name"
                            rules={[{required: true, message: 'Please input  project name!'}]}
                        >
                            <Input/>
                        </Form.Item>
                        <Form.Item
                            label="Manager address"
                            name="manager"
                            rules={[{required: true, message: 'Please input  manager!'}]}
                        >
                            <Input/>
                        </Form.Item>
                        <Form.Item
                            label="Target"
                            name="target"
                            initialValue={10000}
                            rules={[{required: true, message: 'Please input  tartget amount!'}]}
                        >
                            <InputNumber addonAfter="Finney" />
                        </Form.Item>
                        <Form.Item
                            label="Spent Need Consent"
                            name="consent"
                            valuePropName="checked"
                            initialValue={true}
                            help={'If this option enabled,you need file a expense apply and 50%  consent of the voters'}
                            rules={[{required: true, message: 'Please input  tartget amount!'}]}>
                            <Switch defaultChecked={needConsent} onChange={(c) => {
                                setNeedConsent(c);
                            }}/>
                        </Form.Item>
                        <Form.Item
                            label="Price"
                            name="price"
                            rules={[{required: needConsent, message: 'Please input  tartget amount!'}]}
                            help={'Skip this if you dont need consent'}
                        >
                            <InputNumber disabled={!needConsent} addonAfter="Finney" />
                        </Form.Item>
                        <Form.Item
                            label="Raising period"
                            name="period"
                            initialValue={10}
                            rules={[{required: true, message: 'Please input raising period!'}]}
                        >
                            <InputNumber addonAfter="Days" />
                        </Form.Item>
                        <Form.Item wrapperCol={{offset: 8, span: 16}}>
                            <Button type="primary" htmlType="submit">
                                Submit
                            </Button>
                        </Form.Item>
                    </Form>
                </Col>
            </Row>

        </Content>
    )
        ;
}

export default connect(({funding}: { funding: CrowdfundingState }) => {
    return {funding}
})(Crowdfunding)