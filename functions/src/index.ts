import * as functions from 'firebase-functions';
import * as line from '@line/bot-sdk';
import * as express from 'express';

const config = {
    channelAccessToken: functions.config().linebot.token,
    channelSecret: functions.config().linebot.secret,
};

const app = express();

app.post("/costs", line.middleware(config), (req, res) => {
    return Promise
        .all(req.body.events.map(handleEvent))
        .then((result) => res.json(result));
})

const client = new line.Client(config);
function handleEvent(event: line.WebhookEvent) {
    if (event.type !== 'message' || event.message.type !== 'text') {
        return Promise.resolve(null);
    }

    return client.replyMessage(event.replyToken, {
        type: 'text',
        text: event.message.text
    });
}

export const lineBot = functions.https.onRequest(app);
