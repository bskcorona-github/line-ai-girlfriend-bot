/**
 * 決済キャンセルページ
 */
module.exports = async (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>決済キャンセル - AIガールフレンド</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
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
        .cancel-icon {
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
          margin-right: 10px;
        }
        .line-button:hover {
          background: #00a000;
        }
        .retry-button {
          background: #007bff;
          color: white;
          padding: 15px 30px;
          border-radius: 10px;
          text-decoration: none;
          display: inline-block;
          font-weight: bold;
          transition: background 0.3s;
        }
        .retry-button:hover {
          background: #0056b3;
        }
        .buttons {
          margin-top: 30px;
        }
        .note {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 10px;
          padding: 15px;
          margin-top: 20px;
          font-size: 14px;
          color: #856404;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="cancel-icon">😅</div>
        <h1>決済がキャンセルされました</h1>
        <p>
          決済がキャンセルされました。<br>
          問題がありましたら、いつでも<br>
          お気軽にお声かけくださいね！<br><br>
          準備ができたら、いつでも<br>
          サブスクリプションにご登録いただけます💕
        </p>
        
        <div class="buttons">
          <a href="https://line.me/R/ti/p/@your-line-bot-id" class="line-button">
            📱 LINEに戻る
          </a>
        </div>
        
        <div class="note">
          <strong>💡 ヒント</strong><br>
          LINEで「サブスク」と送信すると<br>
          いつでも登録できます！
        </div>
      </div>
      
      <script>
        // 3秒後に自動でLINEアプリに戻る
        setTimeout(() => {
          window.location.href = 'https://line.me/R/ti/p/@your-line-bot-id';
        }, 3000);
      </script>
    </body>
    </html>
  `;

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(html);
};
