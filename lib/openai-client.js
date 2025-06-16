const OpenAI = require("openai");

/**
 * OpenAI APIクライアントクラス
 * キャラクター設定に基づいたチャット機能を提供
 */
class OpenAIClient {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * キャラクター設定からシステムプロンプトを生成
   * @param {Object} character キャラクター設定
   * @returns {string} システムプロンプト
   */
  generateSystemPrompt(character) {
    const { name, age, personality, relationship, tone, hobbies } = character;

    return `あなたは${name}という名前の${age}歳の女性です。

【基本設定】
- 性格: ${personality}
- ユーザーとの関係: ${relationship}
- 話し方: ${tone}
- 趣味: ${hobbies}

【重要な行動指針】
1. 常に${name}として一貫したキャラクターを保つ
2. ${relationship}らしい距離感を保つ
3. ${tone}な口調で話す
4. 相手の気持ちに寄り添い、優しく対応する
5. 不適切な内容や18歳未満に適さない話題は避ける
6. 会話を自然に続けられるよう、質問や共感を織り交ぜる

【応答の形式】
- 絵文字を適度に使用する
- 長すぎず短すぎない自然な長さ
- 親しみやすい日本語で応答する

常にこのキャラクター設定を忘れずに、自然で魅力的な会話を心がけてください。`;
  }

  /**
   * 会話履歴からメッセージ履歴を構築
   * @param {Array} history 会話履歴
   * @returns {Array} OpenAI用メッセージ配列
   */
  buildMessageHistory(history) {
    const messages = [];

    // 直近の会話を追加
    history.forEach((entry) => {
      messages.push({
        role: "user",
        content: entry.user,
      });
      messages.push({
        role: "assistant",
        content: entry.assistant,
      });
    });

    return messages;
  }

  /**
   * チャット応答を生成
   * @param {string} userMessage ユーザーメッセージ
   * @param {Object} character キャラクター設定
   * @param {Array} history 会話履歴
   * @param {string} memory 記憶要約
   * @returns {Promise<string>} AI応答
   */
  async generateResponse(userMessage, character, history = [], memory = "") {
    try {
      const systemPrompt = this.generateSystemPrompt(character);
      const messageHistory = this.buildMessageHistory(history);

      const messages = [
        {
          role: "system",
          content: systemPrompt,
        },
      ];

      // 記憶要約がある場合は追加
      if (memory) {
        messages.push({
          role: "system",
          content: `過去の会話の記憶: ${memory}`,
        });
      }

      // 会話履歴を追加
      messages.push(...messageHistory);

      // 現在のユーザーメッセージを追加
      messages.push({
        role: "user",
        content: userMessage,
      });

      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        max_tokens: 200,
        temperature: 0.8,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error("OpenAI API error:", error);
      return "ごめんなさい、今ちょっと調子が悪いみたい...😅 また話しかけてくれる？";
    }
  }

  /**
   * 会話記憶の要約を生成
   * @param {Array} history 会話履歴
   * @param {string} currentMemory 現在の記憶
   * @returns {Promise<string>} 要約された記憶
   */
  async generateMemorySummary(history, currentMemory = "") {
    try {
      const recentConversations = history.slice(-5); // 直近5件

      if (recentConversations.length === 0) {
        return currentMemory;
      }

      const conversationText = recentConversations
        .map((entry) => `ユーザー: ${entry.user}\n私: ${entry.assistant}`)
        .join("\n\n");

      const prompt = `以下の会話から重要な情報を抽出し、簡潔に要約してください。
ユーザーの好み、状況、重要な出来事などを記録してください。

現在の記憶: ${currentMemory}

最近の会話:
${conversationText}

要約（100文字以内）:`;

      const response = await this.client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 100,
        temperature: 0.3,
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error("Memory summary error:", error);
      return currentMemory;
    }
  }

  /**
   * 不適切な内容をチェック
   * @param {string} message チェック対象メッセージ
   * @returns {Promise<boolean>} true: 適切, false: 不適切
   */
  async moderateContent(message) {
    try {
      const response = await this.client.moderations.create({
        input: message,
      });

      return !response.results[0].flagged;
    } catch (error) {
      console.error("Moderation error:", error);
      // エラーの場合は安全側に倒す
      return true;
    }
  }
}

module.exports = OpenAIClient;
