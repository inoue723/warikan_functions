import * as functions from "firebase-functions";
import * as line from "@line/bot-sdk";
import * as express from "express";
import * as admin from "firebase-admin";
import * as moment from "moment";

const config = {
  channelAccessToken: functions.config().linebot.token,
  channelSecret: functions.config().linebot.secret,
};

const app = express();

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

// test functions
// app.post("/test", (req, res) => {
//   return Promise.all(req.body.events.map(handleEventTest)).then((result) =>
//     res.json(result)
//   );
// });

// async function handleEventTest(event: line.WebhookEvent) {
//   if (event.type !== "message" || event.message.type !== "text") {
//     return Promise.resolve(null);
//   }

//   const userId = event.source.userId;
//   if (userId == null) return Promise.resolve("userId is null");

//   const userRef = admin.firestore().collection("users").doc(userId);

//   const user = await userRef.get();
//   if (!user.exists) {
//     await admin.firestore().collection("users").doc(userId).set({});
//   }

//   const amount = Number(event.message.text);
//   if (!amount) return Promise.resolve("amount is not a number");

//   await userRef
//     .collection("costs")
//     .doc(moment().utcOffset(0).format("YYYY-MM-DDTHH:mm:ss.SSSSSS"))
//     .set({
//       amount: amount,
//       burdenRate: 0.5,
//       paymentDate: admin.firestore.Timestamp.fromDate(moment().toDate()),
//     });

//   return Promise.resolve(null);
// }

app.post("/costs", line.middleware(config), (req, res) => {
  return Promise.all(req.body.events.map(handleEvent)).then((result) =>
    res.json(result)
  );
});

const client = new line.Client(config);
async function handleEvent(event: line.WebhookEvent) {
  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
  }

  const userId = event.source.userId;
  if (userId == null) return Promise.resolve(null);

  const userRef = admin.firestore().collection("users").doc(userId);

  const user = await userRef.get();
  if (!user.exists) {
    await admin.firestore().collection("users").doc(userId).set({});
  }

  const amount = Number(event.message.text);
  if (!amount) return replyWithText("半角数字で入力してください", event);

  await userRef
    .collection("costs")
    .doc(moment().utcOffset(0).format("YYYY-MM-DDTHH:mm:ss.SSSSSS"))
    .set({
      amount: amount,
      burdenRate: 0.5,
      paymentDate: admin.firestore.Timestamp.fromDate(moment().toDate()),
    });

  return replyWithText("記録しました！", event);
}

function replyWithText(message: string, event: line.MessageEvent) {
  return client.replyMessage(event.replyToken, {
    type: "text",
    text: message,
  });
}

export const lineBot = functions.https.onRequest(app);
