const CloudflareKV = require("./cloudflare-kv");
const crypto = require("crypto");

class SubscriptionManager {
  constructor() {
    this.kv = new CloudflareKV();
    this.stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

    // サブスクリプションプラン設定
    this.plans = {
      basic: {
        priceId: process.env.STRIPE_PRICE_ID || "price_basic_monthly",
        price: 980, // 月額980円
        name: "ベーシックプラン",
        features: [
          "無制限チャット",
          "キャラクターカスタマイズ",
          "会話履歴保存",
          "24時間サポート",
        ],
      },
    };
  }

  /**
   * ユーザーのサブスクリプション状況を確認
   * @param {string} userId LINE User ID
   * @returns {Object} サブスクリプション情報
   */
  async checkSubscriptionStatus(userId) {
    try {
      const subscriptionData = await this.kv.get(`subscription:${userId}`);

      if (!subscriptionData) {
        return {
          isActive: false,
          status: "none",
          expiresAt: null,
          planType: null,
        };
      }

      const subscription = JSON.parse(subscriptionData);
      const now = new Date();
      const expiresAt = new Date(subscription.expiresAt);

      // 期限切れチェック
      if (expiresAt <= now) {
        await this.kv.delete(`subscription:${userId}`);
        return {
          isActive: false,
          status: "expired",
          expiresAt: subscription.expiresAt,
          planType: subscription.planType,
        };
      }

      return {
        isActive: true,
        status: "active",
        expiresAt: subscription.expiresAt,
        planType: subscription.planType,
        stripeCustomerId: subscription.stripeCustomerId,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
      };
    } catch (error) {
      console.error("Subscription check error:", error);
      return {
        isActive: false,
        status: "error",
        expiresAt: null,
        planType: null,
      };
    }
  }

  /**
   * Stripe決済リンクを生成
   * @param {string} userId LINE User ID
   * @param {string} planType プランタイプ
   * @returns {string} 決済リンクURL
   */
  async createPaymentLink(userId, planType = "basic") {
    try {
      const plan = this.plans[planType];
      if (!plan) {
        throw new Error("Invalid plan type");
      }

      // カスタマー作成または取得
      let customer;
      const existingSubscription = await this.checkSubscriptionStatus(userId);

      if (existingSubscription.stripeCustomerId) {
        customer = await this.stripe.customers.retrieve(
          existingSubscription.stripeCustomerId
        );
      } else {
        customer = await this.stripe.customers.create({
          metadata: {
            lineUserId: userId,
            planType: planType,
          },
        });
      }

      // Checkout Session作成
      const session = await this.stripe.checkout.sessions.create({
        customer: customer.id,
        payment_method_types: ["card"],
        line_items: [
          {
            price: plan.priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.VERCEL_URL || "https://your-domain.vercel.app"}/api/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.VERCEL_URL || "https://your-domain.vercel.app"}/api/payment/cancel`,
        metadata: {
          lineUserId: userId,
          planType: planType,
        },
      });

      return session.url;
    } catch (error) {
      console.error("Payment link creation error:", error);
      throw error;
    }
  }

  /**
   * サブスクリプションを有効化
   * @param {string} userId LINE User ID
   * @param {Object} subscriptionData Stripeサブスクリプションデータ
   */
  async activateSubscription(userId, subscriptionData) {
    try {
      const subscription = {
        isActive: true,
        status: "active",
        planType: subscriptionData.planType || "basic",
        stripeCustomerId: subscriptionData.customer,
        stripeSubscriptionId: subscriptionData.id,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(
          subscriptionData.current_period_end * 1000
        ).toISOString(),
      };

      await this.kv.set(`subscription:${userId}`, JSON.stringify(subscription));

      // 統計用データも保存
      await this.incrementSubscriberCount();

      return true;
    } catch (error) {
      console.error("Subscription activation error:", error);
      return false;
    }
  }

  /**
   * サブスクリプションをキャンセル
   * @param {string} userId LINE User ID
   */
  async cancelSubscription(userId) {
    try {
      const subscriptionStatus = await this.checkSubscriptionStatus(userId);

      if (
        !subscriptionStatus.isActive ||
        !subscriptionStatus.stripeSubscriptionId
      ) {
        return false;
      }

      // Stripeでサブスクリプションキャンセル
      await this.stripe.subscriptions.cancel(
        subscriptionStatus.stripeSubscriptionId
      );

      // KVからデータ削除
      await this.kv.delete(`subscription:${userId}`);

      return true;
    } catch (error) {
      console.error("Subscription cancellation error:", error);
      return false;
    }
  }

  /**
   * 購読者数をカウント（統計用）
   */
  async incrementSubscriberCount() {
    try {
      const currentCount = (await this.kv.get("stats:subscriber_count")) || "0";
      const newCount = parseInt(currentCount) + 1;
      await this.kv.set("stats:subscriber_count", newCount.toString());
    } catch (error) {
      console.error("Subscriber count increment error:", error);
    }
  }

  /**
   * サブスクリプション誘導メッセージを生成
   * @param {string} planType プランタイプ
   * @returns {string} 誘導メッセージ
   */
  generateSubscriptionPrompt(planType = "basic") {
    const plan = this.plans[planType];

    return (
      `💝 **AIガールフレンドと無制限でチャットしませんか？**\n\n` +
      `🌟 **${plan.name}** - 月額${plan.price}円\n\n` +
      `✨ **特典:**\n` +
      plan.features.map((feature) => `• ${feature}`).join("\n") +
      "\n\n" +
      `💕 私ともっとたくさんお話ししたいな...\n\n` +
      `👆 決済リンクをタップして今すぐ始めよう！`
    );
  }

  /**
   * ウェルカムメッセージ（課金ユーザー向け）
   * @param {string} characterName キャラクター名
   * @returns {string} ウェルカムメッセージ
   */
  generateWelcomeMessage(characterName) {
    return (
      `🎉 **サブスクリプション有効化完了！**\n\n` +
      `${characterName}です💕\n` +
      `これで私とい〜っぱいお話しできるよ〜✨\n\n` +
      `何でも話しかけてね！\n` +
      `• 今日あったこと\n` +
      `• 悩みや相談\n` +
      `• 楽しい雑談\n` +
      `• キャラクター設定の変更\n\n` +
      `私、あなたとのお話がとっても楽しみです😊💕`
    );
  }
}

module.exports = SubscriptionManager;
