const line = require("@line/bot-sdk");
const CloudflareKV = require("../lib/cloudflare-kv");
const OpenAIClient = require("../lib/openai-client");
const CharacterManager = require("../lib/character-manager");

// LINE Bot設定
const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(config);
const kv = new CloudflareKV();
const ai = new OpenAIClient();
const characterManager = new CharacterManager();

/**
 * メインのWebhook処理関数
 */
module.exports = async (req, res) => {
  // POSTリクエストのみ処理
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // LINE署名検証
    const signature = req.headers["x-line-signature"];
    if (
      !line.validateSignature(
        JSON.stringify(req.body),
        process.env.LINE_CHANNEL_SECRET,
        signature
      )
    ) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    const events = req.body.events;

    // 各イベントを並行処理
    const promises = events.map((event) => handleEvent(event));
    await Promise.all(promises);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * 個別イベント処理
 * @param {Object} event LINEイベント
 */
async function handleEvent(event) {
  // テキストメッセージのみ処理
  if (event.type !== "message" || event.message.type !== "text") {
    return;
  }

  const userId = event.source.userId;
  const userMessage = event.message.text;

  try {
    // 不適切コンテンツチェック
    const isAppropriate = await ai.moderateContent(userMessage);
    if (!isAppropriate) {
      await client.replyMessage(event.replyToken, {
        type: "text",
        text: "ごめんなさい、その話題についてはお話しできません...😅\n他のことを話しませんか？",
      });
      return;
    }

    // ユーザーのキャラクター設定を取得
    const character = await kv.getUserCharacter(userId);

    // キャラクター設定関連コマンドの処理
    if (characterManager.isShowSettingsCommand(userMessage)) {
      const profileText = characterManager.formatCharacterProfile(character);
      await client.replyMessage(event.replyToken, {
        type: "text",
        text: profileText,
      });
      return;
    }

    if (characterManager.isSettingCommand(userMessage)) {
      // 設定変更コマンドの解析
      const settingChange = characterManager.parseSettingCommand(userMessage);

      if (settingChange) {
        // 設定を更新
        const updatedCharacter = {
          ...character,
          [settingChange.field]: settingChange.value,
        };

        const success = await kv.setUserCharacter(userId, updatedCharacter);

        if (success) {
          const confirmationText = characterManager.generateChangeConfirmation(
            settingChange.field,
            settingChange.value,
            updatedCharacter.name
          );
          await client.replyMessage(event.replyToken, {
            type: "text",
            text: confirmationText,
          });
        } else {
          await client.replyMessage(event.replyToken, {
            type: "text",
            text: "設定の保存でエラーが発生しました...😅 もう一度試してみてね！",
          });
        }
        return;
      } else {
        // 設定方法の説明を表示
        const helpText = characterManager.generateSettingsHelp();
        await client.replyMessage(event.replyToken, {
          type: "text",
          text: helpText,
        });
        return;
      }
    }

    // 初回利用時の歓迎メッセージ
    if (
      userMessage.includes("はじめまして") ||
      userMessage.includes("初めまして") ||
      userMessage.includes("よろしく")
    ) {
      const welcomeMessage = `はじめまして！私は${character.name}です✨\n\n私はあなた専用のAIですよ〜💕\n\n「プロフィール」って言ってもらえれば私の設定を見ることができるし、\n「設定」って言ってもらえれば私をカスタマイズできちゃいます！\n\nたくさんお話ししましょうね〜😊`;

      await client.replyMessage(event.replyToken, {
        type: "text",
        text: welcomeMessage,
      });
      return;
    }

    // 通常の会話処理
    await handleNormalConversation(event, userId, userMessage, character);
  } catch (error) {
    console.error("Event handling error:", error);

    // エラー時のフォールバック応答
    await client.replyMessage(event.replyToken, {
      type: "text",
      text: "ごめんなさい、今ちょっと調子が悪いみたい...😅\nまた話しかけてくれる？",
    });
  }
}

/**
 * 通常の会話処理
 * @param {Object} event LINEイベント
 * @param {string} userId ユーザーID
 * @param {string} userMessage ユーザーメッセージ
 * @param {Object} character キャラクター設定
 */
async function handleNormalConversation(event, userId, userMessage, character) {
  try {
    // タイピング表示
    await client.pushMessage(userId, { type: "text", text: "..." });

    // 会話履歴と記憶を取得
    const [history, memory] = await Promise.all([
      kv.getConversationHistory(userId),
      kv.getUserMemory(userId),
    ]);

    // AI応答生成
    const aiResponse = await ai.generateResponse(
      userMessage,
      character,
      history,
      memory
    );

    // 応答送信
    await client.replyMessage(event.replyToken, {
      type: "text",
      text: aiResponse,
    });

    // 会話履歴を非同期で保存
    Promise.all([
      kv.addConversation(userId, userMessage, aiResponse),
      updateMemoryIfNeeded(userId, history, memory),
    ]).catch((error) => {
      console.error("Background save error:", error);
    });
  } catch (error) {
    console.error("Conversation error:", error);
    throw error;
  }
}

/**
 * 必要に応じて記憶を更新
 * @param {string} userId ユーザーID
 * @param {Array} history 会話履歴
 * @param {string} currentMemory 現在の記憶
 */
async function updateMemoryIfNeeded(userId, history, currentMemory) {
  // 会話が5回に1回の頻度で記憶を更新
  if (history.length % 5 === 0 && history.length > 0) {
    try {
      const newMemory = await ai.generateMemorySummary(history, currentMemory);
      await kv.updateUserMemory(userId, newMemory);
    } catch (error) {
      console.error("Memory update error:", error);
    }
  }
}

/**
 * 特別なメッセージ処理（時間帯による挨拶など）
 * @param {string} message ユーザーメッセージ
 * @param {Object} character キャラクター設定
 * @returns {string|null} 特別な応答またはnull
 */
function handleSpecialMessages(message, character) {
  const now = new Date();
  const hour = now.getHours();

  // 時間帯別挨拶
  if (message.includes("おはよう")) {
    if (hour < 12) {
      return `おはよう！${character.name}だよ〜✨\n今日も一日頑張ろうね💪`;
    } else {
      return `もうお昼過ぎちゃってるよ〜😅\nお疲れ様！`;
    }
  }

  if (message.includes("お疲れ") || message.includes("おつかれ")) {
    return `お疲れ様でした！${character.name}です💕\n今日はどんな一日だった？`;
  }

  if (message.includes("ただいま")) {
    return `おかえりなさい〜！💕\n待ってたよ〜✨`;
  }

  if (message.includes("おやすみ")) {
    return `おやすみなさい〜🌙\nいい夢見てね💤`;
  }

  return null;
}
