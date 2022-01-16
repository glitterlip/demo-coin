import { message } from 'antd';

export const dva = {
    config: {
        onError(e: Error) {
            console.log(e)
        },
    },
};
