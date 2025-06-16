const SubscriptionManager = require("../lib/subscription-manager");
const line = require("@line/bot-sdk");

// LINE Bot設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);
const subscriptionManager = new SubscriptionManager();

/**
 * Stripe Webhook処理
 */
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // Stripe署名検証
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: "Invalid signature" });
  }

  try {
    // イベントタイプ別処理
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await handlePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
};

/**
 * チェックアウト完了時の処理
 */
async function handleCheckoutCompleted(session) {
  const lineUserId = session.metadata.lineUserId;
  const planType = session.metadata.planType || "basic";

  if (!lineUserId) {
    console.error("No LINE User ID in session metadata");
    return;
  }

  try {
    // サブスクリプション情報をStripeから取得
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription
    );

    // サブスクリプション有効化
    await subscriptionManager.activateSubscription(lineUserId, {
      ...subscription,
      planType: planType,
    });

    // ユーザーにウェルカムメッセージ送信
    const character = await subscriptionManager.kv.getUserCharacter(lineUserId);
    const welcomeMessage = subscriptionManager.generateWelcomeMessage(
      character.name
    );

    await client.pushMessage(lineUserId, {
      type: "text",
      text: welcomeMessage,
    });

    console.log(`Subscription activated for user: ${lineUserId}`);
  } catch (error) {
    console.error("Checkout completion handling error:", error);
  }
}

/**
 * サブスクリプション作成時の処理
 */
async function handleSubscriptionCreated(subscription) {
  console.log(`Subscription created: ${subscription.id}`);
  // 必要に応じて追加処理
}

/**
 * サブスクリプション更新時の処理
 */
async function handleSubscriptionUpdated(subscription) {
  console.log(`Subscription updated: ${subscription.id}`);

  // LINE User IDを取得
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  const customer = await stripe.customers.retrieve(subscription.customer);
  const lineUserId = customer.metadata.lineUserId;

  if (!lineUserId) return;

  // サブスクリプション状態が変更された場合の処理
  if (subscription.status === "active") {
    await subscriptionManager.activateSubscription(lineUserId, subscription);
  } else if (
    subscription.status === "canceled" ||
    subscription.status === "unpaid"
  ) {
    await subscriptionManager.cancelSubscription(lineUserId);
  }
}

/**
 * サブスクリプション削除時の処理
 */
async function handleSubscriptionDeleted(subscription) {
  console.log(`Subscription deleted: ${subscription.id}`);

  // LINE User IDを取得
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  const customer = await stripe.customers.retrieve(subscription.customer);
  const lineUserId = customer.metadata.lineUserId;

  if (!lineUserId) return;

  // サブスクリプションキャンセル
  await subscriptionManager.cancelSubscription(lineUserId);

  // ユーザーに通知
  await client.pushMessage(lineUserId, {
    type: "text",
    text: "😢 サブスクリプションがキャンセルされました。\nまたいつでもお話しできることを楽しみにしています💕",
  });
}

/**
 * 支払い成功時の処理
 */
async function handlePaymentSucceeded(invoice) {
  console.log(`Payment succeeded: ${invoice.id}`);

  // 継続課金の場合の処理
  if (invoice.subscription) {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const subscription = await stripe.subscriptions.retrieve(
      invoice.subscription
    );
    const customer = await stripe.customers.retrieve(subscription.customer);
    const lineUserId = customer.metadata.lineUserId;

    if (lineUserId) {
      // サブスクリプション期限を更新
      await subscriptionManager.activateSubscription(lineUserId, subscription);

      // ユーザーに感謝メッセージ
      await client.pushMessage(lineUserId, {
        type: "text",
        text: "💕 お支払いありがとうございます！\n今月もたくさんお話ししましょうね〜✨",
      });
    }
  }
}

/**
 * 支払い失敗時の処理
 */
async function handlePaymentFailed(invoice) {
  console.log(`Payment failed: ${invoice.id}`);

  if (invoice.subscription) {
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    const customer = await stripe.customers.retrieve(invoice.customer);
    const lineUserId = customer.metadata.lineUserId;

    if (lineUserId) {
      // ユーザーに支払い失敗を通知
      await client.pushMessage(lineUserId, {
        type: "text",
        text: "⚠️ お支払いに問題が発生しました。\nクレジットカード情報をご確認ください。\n\nサポートが必要でしたらお気軽にお声かけくださいね！",
      });
    }
  }
}
