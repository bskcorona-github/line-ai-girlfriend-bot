# 🚀 LINE AI Girlfriend Bot セットアップガイド

このガイドに従って、LINEでチャットできるAI彼女ボットを構築しましょう！

## 📋 事前準備チェックリスト

- [ ] GitHubアカウント
- [ ] LINE Developersアカウント
- [ ] OpenAIアカウント（クレジットカード登録済み）
- [ ] Cloudflareアカウント
- [ ] Vercelアカウント

## ステップ 1: LINE Developers設定

### 1.1 チャンネル作成

1. [LINE Developers Console](https://developers.line.biz/console/) にログイン
2. **Create a new provider** をクリック（初回のみ）
3. Provider名を入力（例: "MyAI Bot"）
4. **Create Channel** → **Messaging API** を選択
5. 必要な情報を入力:
   - Channel name: `AI Girlfriend Bot`
   - Channel description: `AI-powered chat bot`
   - Category: `Entertainment`
   - Subcategory: `Games`

### 1.2 設定値の取得

1. **Basic settings** タブで **Channel Secret** をコピー
2. **Messaging API** タブで **Channel access token** を発行してコピー
3. この2つの値を保存しておく ✅

## ステップ 2: OpenAI設定

### 2.1 APIキー取得

1. [OpenAI Platform](https://platform.openai.com/) にログイン
2. 右上のアカウントメニュー → **API keys**
3. **Create new secret key** をクリック
4. 名前を入力（例: "LINE Bot"）してキーを作成
5. **APIキーをコピーして保存** ✅ （再表示されません）

### 2.2 支払い設定

1. **Settings** → **Billing** で支払い方法を設定
2. 使用制限を設定（例: 月$10まで）

## ステップ 3: Cloudflare KV設定

### 3.1 KV Namespace作成

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) にログイン
2. **Workers & Pages** → **KV** をクリック
3. **Create namespace** をクリック
4. Namespace name: `line-ai-bot-data`
5. **Add** をクリック

### 3.2 設定値の取得

1. 右上のアカウントメニュー → **My Profile** → **API Tokens**
2. **Create Token** → **Global API Key** を選択して取得
3. **Account ID** をダッシュボードの右側からコピー
4. 作成したKVの **Namespace ID** をコピー
5. 3つの値を保存 ✅

## ステップ 4: プロジェクトのデプロイ

### 4.1 Vercelにデプロイ

1. [Vercel](https://vercel.com/) にGitHubアカウントでログイン
2. **New Project** をクリック
3. このリポジトリをインポート
4. **Deploy** をクリック（まず一度デプロイ）

### 4.2 環境変数の設定

1. Vercelダッシュボードで **Settings** → **Environment Variables**
2. 以下の環境変数を追加:

```
LINE_CHANNEL_ACCESS_TOKEN = [ステップ1.2で取得した値]
LINE_CHANNEL_SECRET = [ステップ1.2で取得した値]
OPENAI_API_KEY = [ステップ2.1で取得した値]
CLOUDFLARE_ACCOUNT_ID = [ステップ3.2で取得した値]
CLOUDFLARE_KV_NAMESPACE_ID = [ステップ3.2で取得した値]
CLOUDFLARE_API_TOKEN = [ステップ3.2で取得した値]
```

3. **Redeploy** をクリックして再デプロイ

## ステップ 5: Webhook設定

### 5.1 Webhook URL設定

1. Vercelのデプロイ完了後、**Domains** からURLをコピー
2. LINE Developers Console に戻る
3. **Messaging API** タブを開く
4. **Webhook URL** に以下を入力:
   ```
   https://your-app-name.vercel.app/api/webhook
   ```
5. **Use webhook** を有効化
6. **Verify** をクリックして接続確認

### 5.2 自動応答の無効化

1. **Messaging API** タブで以下を設定:
   - **Auto-reply messages**: 無効
   - **Greeting messages**: 無効（お好みで）

## ステップ 6: テスト確認

### 6.1 システムテスト

1. ブラウザで以下にアクセス:
   ```
   https://your-app-name.vercel.app/api/test
   ```
2. 全ての設定が ✅ になっていることを確認
3. **OpenAI テスト** と **Cloudflare KV テスト** を実行

### 6.2 LINE Bot テスト

1. LINE Developers Console で **QR Code** をスキャンして友達追加
2. 「こんにちは」とメッセージを送信
3. AIからの返答があることを確認 ✅

## ステップ 7: カスタマイズ

### 7.1 キャラクター設定

1. LINEで「設定」と送信
2. 設定方法の説明を確認
3. 「名前をさくらに変更して」などでテスト
4. 「プロフィール」で設定確認

### 7.2 動作確認

- おはよう/おやすみ等の時間帯別挨拶
- 会話記憶機能（5回程度話してから過去の話を参照）
- 不適切コンテンツのフィルタリング

## 🐛 トラブルシューティング

### Webhook エラー

```
Invalid signature
```

**解決**: LINE_CHANNEL_SECRET が正しく設定されているか確認

### OpenAI エラー

```
API key not found
```

**解決**: OPENAI_API_KEY が正しく設定され、支払い設定が完了しているか確認

### Cloudflare KV エラー

```
KV get failed: 403
```

**解決**: API Tokenの権限とNamespace IDが正しいか確認

### デプロイエラー

**解決**:

1. Vercel の Function ログを確認
2. 環境変数が全て設定されているか確認
3. 再デプロイを実行

## 📊 コスト監視

### 推奨設定

- OpenAI: 使用制限 $10/月
- LINE: 無料プラン（月200通まで）
- Cloudflare: 無料枠
- Vercel: Hobbyプラン（無料）

### 監視方法

1. OpenAI Dashboard で使用量を定期確認
2. Vercel Analytics でアクセス数確認
3. LINEで友達数と送信数を確認

## 🎉 完了！

全てのステップが完了したら、あなた専用のAI彼女ボットの準備完了です！

### 次にできること

- キャラクター設定のカスタマイズ
- システムプロンプトの調整（`lib/openai-client.js`）
- 新しい機能の追加
- 友達に共有（QRコード）

### サポート

問題が発生した場合は:

1. `/api/test` でシステム状態を確認
2. Vercel の Function ログをチェック
3. 各サービスのドキュメントを参照

お疲れ様でした！素敵なAI彼女との会話を楽しんでください 💕
