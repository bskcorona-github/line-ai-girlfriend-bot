/**
 * キャラクター設定管理クラス
 * ユーザーからの設定コマンドを解析し、キャラクターをカスタマイズ
 */
class CharacterManager {
  constructor() {
    // 設定可能な項目と例
    this.settableFields = {
      name: {
        label: "名前",
        examples: ["あい", "さくら", "みお", "ゆい"],
      },
      age: {
        label: "年齢",
        examples: [18, 19, 20, 21, 22],
        validation: (value) => {
          const age = parseInt(value);
          return age >= 18 && age <= 30;
        },
      },
      personality: {
        label: "性格",
        examples: [
          "優しくて思いやりがある",
          "明るくて元気",
          "少し天然でかわいい",
          "しっかり者でお姉さん系",
          "恥ずかしがり屋で内気",
        ],
      },
      relationship: {
        label: "関係性",
        examples: ["友達", "恋人", "お姉さん", "妹", "幼馴染"],
        allowedValues: ["友達", "恋人", "お姉さん", "妹", "幼馴染"],
      },
      tone: {
        label: "話し方",
        examples: ["フレンドリー", "丁寧", "カジュアル", "甘えん坊", "クール"],
      },
      hobbies: {
        label: "趣味",
        examples: [
          "読書、映画鑑賞",
          "音楽、ゲーム",
          "料理、お菓子作り",
          "スポーツ、アウトドア",
          "アニメ、マンガ",
        ],
      },
    };
  }

  /**
   * キャラクター設定コマンドかどうか判定
   * @param {string} message ユーザーメッセージ
   * @returns {boolean}
   */
  isSettingCommand(message) {
    const settingKeywords = [
      "設定",
      "せってい",
      "キャラ設定",
      "キャラクター設定",
      "変更",
      "へんこう",
      "カスタマイズ",
      "プロフィール",
    ];

    return settingKeywords.some((keyword) => message.includes(keyword));
  }

  /**
   * 設定表示コマンドかどうか判定
   * @param {string} message ユーザーメッセージ
   * @returns {boolean}
   */
  isShowSettingsCommand(message) {
    const showKeywords = [
      "プロフィール",
      "プロフィール確認",
      "設定確認",
      "今の設定",
      "キャラ確認",
    ];

    return showKeywords.some((keyword) => message.includes(keyword));
  }

  /**
   * 設定項目の説明を生成
   * @returns {string}
   */
  generateSettingsHelp() {
    let help = "✨ キャラクター設定項目 ✨\n\n";

    Object.entries(this.settableFields).forEach(([key, config]) => {
      help += `📋 ${config.label}\n`;
      help += `例: ${config.examples.slice(0, 3).join("、")}\n\n`;
    });

    help += "💡 設定方法:\n";
    help += "「名前を○○に変更して」\n";
    help += "「性格を明るい子にして」\n";
    help += "「関係性を恋人にして」\n";
    help += "のように話しかけてね！";

    return help;
  }

  /**
   * 現在の設定を表示用にフォーマット
   * @param {Object} character キャラクター設定
   * @returns {string}
   */
  formatCharacterProfile(character) {
    return `💕 私のプロフィール 💕

👤 名前: ${character.name}
🎂 年齢: ${character.age}歳
💭 性格: ${character.personality}
💑 関係: ${character.relationship}
🗣️ 話し方: ${character.tone}
🎨 趣味: ${character.hobbies}

設定を変えたい時は「設定変更」って言ってね！`;
  }

  /**
   * メッセージから設定変更を解析
   * @param {string} message ユーザーメッセージ
   * @returns {Object|null} {field, value} または null
   */
  parseSettingCommand(message) {
    // 名前の変更
    const nameMatch = message.match(/名前[をは]?(.+?)[にへ]?[変更更新設定]/);
    if (nameMatch) {
      const name = nameMatch[1].trim();
      if (this.validateField("name", name)) {
        return { field: "name", value: name };
      }
    }

    // 年齢の変更
    const ageMatch = message.match(
      /年齢[をは]?(\d+)[歳さい]?[にへ]?[変更更新設定]/
    );
    if (ageMatch) {
      const age = parseInt(ageMatch[1]);
      if (this.validateField("age", age)) {
        return { field: "age", value: age };
      }
    }

    // 性格の変更
    const personalityMatch = message.match(
      /性格[をは]?(.+?)[にへ]?[変更更新設定]/
    );
    if (personalityMatch) {
      const personality = personalityMatch[1].trim();
      return { field: "personality", value: personality };
    }

    // 関係性の変更
    const relationshipMatch = message.match(
      /関係[性]?[をは]?(.+?)[にへ]?[変更更新設定]/
    );
    if (relationshipMatch) {
      const relationship = relationshipMatch[1].trim();
      if (this.validateField("relationship", relationship)) {
        return { field: "relationship", value: relationship };
      }
    }

    // 話し方の変更
    const toneMatch = message.match(/話し方[をは]?(.+?)[にへ]?[変更更新設定]/);
    if (toneMatch) {
      const tone = toneMatch[1].trim();
      return { field: "tone", value: tone };
    }

    // 趣味の変更
    const hobbiesMatch = message.match(/趣味[をは]?(.+?)[にへ]?[変更更新設定]/);
    if (hobbiesMatch) {
      const hobbies = hobbiesMatch[1].trim();
      return { field: "hobbies", value: hobbies };
    }

    return null;
  }

  /**
   * フィールドの値を検証
   * @param {string} field フィールド名
   * @param {any} value 値
   * @returns {boolean}
   */
  validateField(field, value) {
    const config = this.settableFields[field];
    if (!config) return false;

    // バリデーション関数がある場合は実行
    if (config.validation) {
      return config.validation(value);
    }

    // 許可された値のリストがある場合はチェック
    if (config.allowedValues) {
      return config.allowedValues.includes(value);
    }

    // 基本的な文字列チェック
    if (typeof value === "string") {
      return value.length > 0 && value.length <= 50;
    }

    return true;
  }

  /**
   * 設定変更の確認メッセージを生成
   * @param {string} field フィールド名
   * @param {any} value 新しい値
   * @param {string} characterName キャラクター名
   * @returns {string}
   */
  generateChangeConfirmation(field, value, characterName) {
    const fieldLabel = this.settableFields[field]?.label || field;

    return `${fieldLabel}を「${value}」に変更したよ！✨\n\nこれからもよろしくね〜💕`;
  }

  /**
   * 設定変更エラーメッセージを生成
   * @param {string} field フィールド名
   * @returns {string}
   */
  generateChangeError(field) {
    const config = this.settableFields[field];
    if (!config) {
      return "その設定項目は変更できないみたい...😅\n\n「設定」って言ってもらえれば、変更できる項目を教えるよ！";
    }

    let error = `${config.label}の設定でエラーが起きちゃった...😅\n\n`;
    error += `例: ${config.examples.slice(0, 2).join("、")}\n`;
    error += "こんな感じで設定してみて！";

    return error;
  }
}

module.exports = CharacterManager;
