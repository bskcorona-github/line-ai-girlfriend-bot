/**
 * 決済成功ページ
 */
module.exports = async (req, res) => {
  const { session_id } = req.query;

  const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>決済完了 - AIガールフレンド</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
          padding: 20px;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .container {
          background: white;
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          max-width: 400px;
          width: 100%;
        }
        .success-icon {
          font-size: 60px;
          margin-bottom: 20px;
        }
        h1 {
          color: #333;
          margin-bottom: 20px;
          font-size: 24px;
        }
        p {
          color: #666;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .line-button {
          background: #00c300;
          color: white;
          padding: 15px 30px;
          border-radius: 10px;
          text-decoration: none;
          display: inline-block;
          font-weight: bold;
          transition: background 0.3s;
        }
        .line-button:hover {
          background: #00a000;
        }
        .details {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 10px;
          margin-top: 20px;
          font-size: 14px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success-icon">🎉</div>
        <h1>決済が完了しました！</h1>
        <p>
          ありがとうございます！<br>
          サブスクリプションが有効化されました。<br><br>
          LINEに戻って、AIガールフレンドと<br>
          無制限でチャットを楽しんでくださいね💕
        </p>
        
        <a href="https://line.me/R/ti/p/@your-line-bot-id" class="line-button">
          📱 LINEに戻る
        </a>
        
        <div class="details">
          <strong>✨ 利用可能な機能</strong><br>
          • 無制限チャット<br>
          • キャラクターカスタマイズ<br>
          • 会話履歴保存<br>
          • 24時間サポート
        </div>
      </div>
      
      <script>
        // 5秒後に自動でLINEアプリに戻る
        setTimeout(() => {
          if (window.confirm('LINEアプリに戻りますか？')) {
            window.location.href = 'https://line.me/R/ti/p/@your-line-bot-id';
          }
        }, 5000);
      </script>
    </body>
    </html>
  `;

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(html);
};
