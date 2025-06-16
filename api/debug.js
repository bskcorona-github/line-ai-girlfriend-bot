/**
 * デバッグ用エンドポイント - 環境変数の確認
 */
module.exports = async (req, res) => {
  try {
    const env = {
      LINE_CHANNEL_ACCESS_TOKEN: process.env.LINE_CHANNEL_ACCESS_TOKEN
        ? "SET"
        : "NOT SET",
      LINE_CHANNEL_SECRET: process.env.LINE_CHANNEL_SECRET ? "SET" : "NOT SET",
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? "SET" : "NOT SET",
      CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID
        ? "SET"
        : "NOT SET",
      CLOUDFLARE_KV_NAMESPACE_ID: process.env.CLOUDFLARE_KV_NAMESPACE_ID
        ? "SET"
        : "NOT SET",
      CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN
        ? "SET"
        : "NOT SET",
      // 間違った名前も確認
      CLOUDFLARE_APT_TOKEN: process.env.CLOUDFLARE_APT_TOKEN
        ? "SET (WRONG NAME)"
        : "NOT SET",
    };

    return res.status(200).json({
      message: "Environment Variables Debug",
      environment: env,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Debug error:", error);
    return res.status(500).json({
      error: "Debug failed",
      message: error.message,
    });
  }
};
