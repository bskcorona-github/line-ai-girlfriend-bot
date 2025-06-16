/**
 * Cloudflare Workers KV操作クラス
 * ユーザーのキャラクター設定と会話記憶を管理
 */
class CloudflareKV {
  constructor() {
    this.accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    this.namespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID;
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN;
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/storage/kv/namespaces/${this.namespaceId}`;
  }

  /**
   * KVからデータを取得
   * @param {string} key
   * @returns {Promise<any>}
   */
  async get(key) {
    try {
      const response = await fetch(`${this.baseUrl}/values/${key}`, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`KV get failed: ${response.status}`);
      }

      const data = await response.text();
      return JSON.parse(data);
    } catch (error) {
      console.error("KV get error:", error);
      return null;
    }
  }

  /**
   * KVにデータを保存
   * @param {string} key
   * @param {any} value
   * @returns {Promise<boolean>}
   */
  async put(key, value) {
    try {
      const response = await fetch(`${this.baseUrl}/values/${key}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(value),
      });

      return response.ok;
    } catch (error) {
      console.error("KV put error:", error);
      return false;
    }
  }

  /**
   * ユーザーのキャラクター設定を取得
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getUserCharacter(userId) {
    const character = await this.get(`user:${userId}:character`);

    // デフォルト設定
    return (
      character || {
        name: "あい",
        age: 20,
        personality: "優しくて話しやすい",
        relationship: "友達",
        tone: "フレンドリー",
        hobbies: "読書、映画鑑賞",
        created_at: new Date().toISOString(),
      }
    );
  }

  /**
   * ユーザーのキャラクター設定を保存
   * @param {string} userId
   * @param {Object} character
   * @returns {Promise<boolean>}
   */
  async setUserCharacter(userId, character) {
    const updatedCharacter = {
      ...character,
      updated_at: new Date().toISOString(),
    };
    return await this.put(`user:${userId}:character`, updatedCharacter);
  }

  /**
   * 会話履歴を取得
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async getConversationHistory(userId) {
    const history = await this.get(`user:${userId}:history`);
    return history || [];
  }

  /**
   * 会話履歴を保存（直近10件まで）
   * @param {string} userId
   * @param {string} userMessage
   * @param {string} assistantMessage
   * @returns {Promise<boolean>}
   */
  async addConversation(userId, userMessage, assistantMessage) {
    const history = await this.getConversationHistory(userId);

    const newEntry = {
      timestamp: new Date().toISOString(),
      user: userMessage,
      assistant: assistantMessage,
    };

    history.push(newEntry);

    // 直近10件まで保持
    if (history.length > 10) {
      history.shift();
    }

    return await this.put(`user:${userId}:history`, history);
  }

  /**
   * ユーザーの会話記憶要約を取得
   * @param {string} userId
   * @returns {Promise<string>}
   */
  async getUserMemory(userId) {
    const memory = await this.get(`user:${userId}:memory`);
    return memory || "";
  }

  /**
   * ユーザーの会話記憶要約を更新
   * @param {string} userId
   * @param {string} memorySummary
   * @returns {Promise<boolean>}
   */
  async updateUserMemory(userId, memorySummary) {
    return await this.put(`user:${userId}:memory`, memorySummary);
  }
}

module.exports = CloudflareKV;
