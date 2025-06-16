# LINE AI Girlfriend Bot 💕

カスタマイズ可能なAI彼女とLINEでチャットできるボットです。  
GPT-4oを使用し、キャラクター設定や会話記憶機能を搭載しています。

## ✨ 機能

- 🤖 **AI チャット**: GPT-4o-miniによる自然な会話
- 👤 **キャラクター設定**: 名前、性格、関係性など完全カスタマイズ可能
- 🧠 **記憶機能**: 過去の会話を覚えて一貫した対話
- 🛡️ **安全性**: OpenAI Moderation APIによる不適切コンテンツフィルタ
- 💰 **低コスト**: サーバーレス + 無料枠活用で月額数百円から

## 🏗️ システム構成

```
LINE Messaging API
    ↓
Vercel Functions (Webhook)
    ↓
OpenAI GPT-4o API
    ↓
Cloudflare Workers KV (データ保存)
```

## 📋 必要な準備

### 1. LINE Developers アカウント

1. [LINE Developers](https://developers.line.biz/) でアカウント作成
2. **新しいチャンネル** → **Messaging API** を選択
3. 以下の情報を取得:
   - `Channel Access Token`
   - `Channel Secret`

### 2. OpenAI アカウント

1. [OpenAI Platform](https://platform.openai.com/) でアカウント作成
2. API キーを取得
3. 支払い方法を設定（GPT-4o-mini使用のため）

### 3. Cloudflare アカウント

1. [Cloudflare](https://www.cloudflare.com/) でアカウント作成
2. **Workers & Pages** → **KV** でNamespaceを作成
3. 以下の情報を取得:
   - `Account ID`
   - `Namespace ID`
   - `API Token`

## 🚀 デプロイ手順

### 1. リポジトリのクローン

```bash
git clone <this-repository>
cd line-ai-girlfriend-bot
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

`env.example` を参考に環境変数を設定:

```bash
# Vercelの場合
vercel env add LINE_CHANNEL_ACCESS_TOKEN
vercel env add LINE_CHANNEL_SECRET
vercel env add OPENAI_API_KEY
vercel env add CLOUDFLARE_ACCOUNT_ID
vercel env add CLOUDFLARE_KV_NAMESPACE_ID
vercel env add CLOUDFLARE_API_TOKEN
```

### 4. Vercelにデプロイ

```bash
npm run deploy
```

### 5. LINE Webhook URLの設定

1. LINE Developersコンソールに戻る
2. **Messaging API設定** → **Webhook URL** に以下を設定:
   ```
   https://your-app.vercel.app/api/webhook
   ```
3. **Webhook の利用** を有効化
4. **自動応答メッセージ** を無効化

## 💬 使用方法

### 基本的な会話

普通にメッセージを送ると、設定されたキャラクターが応答します。

### キャラクター設定

- **設定確認**: 「プロフィール」
- **設定変更**: 「設定」
- **名前変更**: 「名前をさくらに変更して」
- **性格変更**: 「性格を明るい子にして」
- **関係変更**: 「関係性を恋人にして」

### 特別な挨拶

- 「おはよう」「おやすみ」「ただいま」「お疲れ様」
- 時間帯に応じた適切な応答

## 🎛️ カスタマイズ項目

| 項目   | 例                             |
| ------ | ------------------------------ |
| 名前   | あい、さくら、みお             |
| 年齢   | 18-30歳                        |
| 性格   | 優しい、明るい、天然           |
| 関係性 | 友達、恋人、お姉さん、妹       |
| 話し方 | フレンドリー、丁寧、カジュアル |
| 趣味   | 読書、音楽、料理、ゲーム       |

## 💰 コスト試算

### 無料枠活用プラン (月額500円程度)

- LINE: コミュニケーションプラン (無料)
- Vercel: Hobby (無料)
- Cloudflare: 無料枠
- OpenAI: GPT-4o-mini使用量のみ

### 本格運用プラン (月額7,000円程度)

- LINE: ライトプラン (5,000円)
- その他: 約2,000円

## 🛠️ 開発・カスタマイズ

### ローカル開発

```bash
npm run dev
```

### ファイル構成

```
├── api/
│   └── webhook.js          # メインのWebhook処理
├── lib/
│   ├── cloudflare-kv.js   # KVデータ管理
│   ├── openai-client.js   # OpenAI API操作
│   └── character-manager.js # キャラ設定管理
├── package.json
├── vercel.json
└── README.md
```

### キャラクター設定のカスタマイズ

`lib/character-manager.js` の `settableFields` を編集することで、設定項目を追加・変更できます。

### システムプロンプトのカスタマイズ

`lib/openai-client.js` の `generateSystemPrompt` 関数を編集することで、AIの personality を調整できます。

## ⚠️ 注意事項

### セキュリティ

- 環境変数は必ず適切に設定
- APIキーは絶対にコミットしない
- 18歳未満への配慮を忘れずに

### LINE利用規約

- 大量・無差別送信は禁止
- 不適切なコンテンツの送信禁止
- 利用規約を必ず確認

### OpenAI利用規約

- APIの適切な使用
- レート制限の遵守
- コンテンツポリシーの遵守

## 🐛 トラブルシューティング

### Webhook が動作しない

1. Vercelのデプロイが成功しているか確認
2. 環境変数が正しく設定されているか確認
3. LINE Webhook URLが正しいか確認

### AIが応答しない

1. OpenAI API キーが有効か確認
2. API クォータが残っているか確認
3. Vercel のログを確認

### 設定が保存されない

1. Cloudflare KV の設定を確認
2. API トークンの権限を確認

## 📞 サポート

問題が発生した場合は、以下を確認してください:

1. Vercel のFunction ログ
2. OpenAI の使用量
3. Cloudflare KV の状態

## 📝 ライセンス

MIT License

---

**注意**: このプロジェクトは教育・個人利用目的です。商用利用する場合は、各サービスの利用規約を十分に確認してください。
