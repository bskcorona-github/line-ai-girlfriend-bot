# 💰 サブスクリプション機能セットアップ手順

## 📋 前提条件

✅ LINE AIガールフレンドボットが動作済み  
✅ Vercelにデプロイ済み  
✅ Stripeアカウント作成済み

## 🔧 Stripe設定

### 1. Stripeダッシュボードでの設定

1. **Stripeアカウントにログイン**

   - https://dashboard.stripe.com/

2. **商品・価格設定**

   ```
   商品名: AIガールフレンド ベーシックプラン
   価格: ¥980/月
   請求間隔: 毎月
   ```

3. **価格IDをコピー**

   - `price_xxxxxxxxxx` 形式の価格IDをメモ

4. **Webhookエンドポイント追加**
   ```
   URL: https://your-domain.vercel.app/api/stripe-webhook
   イベント:
   - checkout.session.completed
   - customer.subscription.created
   - customer.subscription.updated
   - customer.subscription.deleted
   - invoice.payment_succeeded
   - invoice.payment_failed
   ```

### 2. Vercel環境変数追加

Vercelダッシュボードで以下の環境変数を追加：

```env
# 既存の環境変数に追加
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
STRIPE_PRICE_ID=price_xxxxxxxxxxxxxxxx
```

## 🚀 デプロイと動作確認

### 1. デプロイ

```bash
npm run deploy
```

### 2. 動作確認

LINEで以下をテスト：

1. **未課金ユーザー**: 任意のメッセージ送信
   → サブスクリプション誘導メッセージが表示

2. **サブスクリプション確認**: "サブスク"と送信
   → 決済リンクが表示

3. **テスト決済**: 決済リンクからテスト決済実行
   → 決済完了後にウェルカムメッセージ

4. **課金ユーザー**: 通常のチャットが可能

## 🎯 料金プラン詳細

### ベーシックプラン (¥980/月)

- ✅ 無制限チャット
- ✅ キャラクターカスタマイズ
- ✅ 会話履歴保存
- ✅ 24時間サポート

## 📊 売上管理

### Stripeダッシュボードで確認可能:

- 月間売上
- アクティブサブスクリプション数
- 解約率 (チャーン率)
- 顧客一覧

### KVストレージでのデータ:

- `subscription:{userId}` - ユーザー課金状況
- `stats:subscriber_count` - 購読者数

## 🔄 継続課金フロー

1. **初回登録**: Stripe Checkout → Webhook → KV保存
2. **継続課金**: 毎月自動請求 → Webhook → 期限延長
3. **決済失敗**: Webhook → ユーザーに通知
4. **解約**: Stripe → Webhook → データ削除

## 🛡️ セキュリティ対策

- ✅ Stripe署名検証済み
- ✅ LINE署名検証済み
- ✅ 環境変数での機密情報管理
- ✅ サーバーサイドでのサブスクリプション状況確認

## 💡 収益化のコツ

### 1. **料金設定**

- 月額980円は手頃な価格帯
- 年額プランで割引提供も検討

### 2. **ユーザー体験**

- 無料トライアル期間の設定
- 段階的な機能制限

### 3. **マーケティング**

- 友達紹介キャンペーン
- SNSでの拡散施策

## ⚠️ 注意事項

- テスト環境では実際の決済は発生しません
- 本番環境移行時はStripeの本番キーに変更が必要
- 特定商取引法に基づく表記が必要
- 利用規約・プライバシーポリシーの整備推奨

---

💰 **これでサブスクリプション制AIガールフレンドボットの完成です！**
