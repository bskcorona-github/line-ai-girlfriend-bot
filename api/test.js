/**
 * テスト・デバッグ用エンドポイント
 * 環境変数の確認やAPIの動作テスト
 */

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const testResults = {
      timestamp: new Date().toISOString(),
      environment: "production",
      status: "running",
      config: {
        line: {
          hasAccessToken: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
          hasSecret: !!process.env.LINE_CHANNEL_SECRET,
        },
        openai: {
          hasApiKey: !!process.env.OPENAI_API_KEY,
        },
        cloudflare: {
          hasAccountId: !!process.env.CLOUDFLARE_ACCOUNT_ID,
          hasNamespaceId: !!process.env.CLOUDFLARE_KV_NAMESPACE_ID,
          hasApiToken: !!process.env.CLOUDFLARE_API_TOKEN,
        },
      },
      systemInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
      },
    };

    // APIテスト（環境変数が設定されている場合のみ）
    if (req.query.test === "openai" && process.env.OPENAI_API_KEY) {
      try {
        const OpenAIClient = require("../lib/openai-client");
        const ai = new OpenAIClient();

        const testResponse = await ai.generateResponse("こんにちは", {
          name: "テスト",
          age: 20,
          personality: "テスト用",
          relationship: "友達",
          tone: "フレンドリー",
          hobbies: "テスト",
        });

        testResults.openaiTest = {
          success: true,
          response: testResponse.substring(0, 100) + "...",
        };
      } catch (error) {
        testResults.openaiTest = {
          success: false,
          error: error.message,
        };
      }
    }

    if (req.query.test === "kv" && process.env.CLOUDFLARE_API_TOKEN) {
      try {
        const CloudflareKV = require("../lib/cloudflare-kv");
        const kv = new CloudflareKV();

        // テストデータの書き込み・読み込み
        const testKey = "test:" + Date.now();
        const testData = { test: true, timestamp: new Date().toISOString() };

        await kv.put(testKey, testData);
        const retrieved = await kv.get(testKey);

        testResults.kvTest = {
          success: true,
          written: testData,
          retrieved: retrieved,
          match: JSON.stringify(testData) === JSON.stringify(retrieved),
        };
      } catch (error) {
        testResults.kvTest = {
          success: false,
          error: error.message,
        };
      }
    }

    // HTML形式で結果を表示
    if (req.headers.accept && req.headers.accept.includes("text/html")) {
      const html = `
<!DOCTYPE html>
<html>
<head>
    <title>LINE AI Girlfriend Bot - テスト</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .status { padding: 15px; border-radius: 5px; margin: 15px 0; }
        .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .test-button { 
            display: inline-block; 
            background: #007bff; 
            color: white; 
            padding: 10px 20px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 5px;
        }
        .test-button:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 LINE AI Girlfriend Bot - システム状態</h1>
        
        <div class="status ${testResults.config.line.hasAccessToken && testResults.config.line.hasSecret ? "success" : "error"}">
            <strong>LINE設定:</strong> 
            ${testResults.config.line.hasAccessToken && testResults.config.line.hasSecret ? "✅ 設定済み" : "❌ 未設定"}
        </div>

        <div class="status ${testResults.config.openai.hasApiKey ? "success" : "error"}">
            <strong>OpenAI設定:</strong> 
            ${testResults.config.openai.hasApiKey ? "✅ 設定済み" : "❌ 未設定"}
        </div>

        <div class="status ${testResults.config.cloudflare.hasAccountId && testResults.config.cloudflare.hasNamespaceId && testResults.config.cloudflare.hasApiToken ? "success" : "error"}">
            <strong>Cloudflare KV設定:</strong> 
            ${testResults.config.cloudflare.hasAccountId && testResults.config.cloudflare.hasNamespaceId && testResults.config.cloudflare.hasApiToken ? "✅ 設定済み" : "❌ 未設定"}
        </div>

        <h2>🧪 APIテスト</h2>
        <a href="?test=openai" class="test-button">OpenAI テスト</a>
        <a href="?test=kv" class="test-button">Cloudflare KV テスト</a>

        ${
          testResults.openaiTest
            ? `
        <div class="status ${testResults.openaiTest.success ? "success" : "error"}">
            <strong>OpenAI テスト結果:</strong> 
            ${testResults.openaiTest.success ? "✅ 成功" : "❌ 失敗"}
            ${testResults.openaiTest.response ? `<br>応答: ${testResults.openaiTest.response}` : ""}
            ${testResults.openaiTest.error ? `<br>エラー: ${testResults.openaiTest.error}` : ""}
        </div>
        `
            : ""
        }

        ${
          testResults.kvTest
            ? `
        <div class="status ${testResults.kvTest.success ? "success" : "error"}">
            <strong>Cloudflare KV テスト結果:</strong> 
            ${testResults.kvTest.success ? "✅ 成功" : "❌ 失敗"}
            ${testResults.kvTest.match ? "<br>データ整合性: ✅" : "<br>データ整合性: ❌"}
            ${testResults.kvTest.error ? `<br>エラー: ${testResults.kvTest.error}` : ""}
        </div>
        `
            : ""
        }

        <h2>📋 システム情報</h2>
        <pre>${JSON.stringify(testResults, null, 2)}</pre>

        <h2>📚 次のステップ</h2>
        <ol>
            <li>全ての環境変数が設定されていることを確認</li>
            <li>LINE Developers で Webhook URL を設定: <code>${req.headers.host}/api/webhook</code></li>
            <li>OpenAI の支払い設定を確認</li>
            <li>Cloudflare KV Namespace が作成されていることを確認</li>
        </ol>
    </div>
</body>
</html>`;

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(200).send(html);
    }

    // JSON形式で結果を返す
    res.status(200).json(testResults);
  } catch (error) {
    console.error("Test endpoint error:", error);
    res.status(500).json({
      error: "Test failed",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};
