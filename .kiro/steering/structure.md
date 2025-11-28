# プロジェクト構造

## ディレクトリ構成

```
.
├── src/              # ソースコード
│   └── index.js      # メインルール実装
├── lib/              # ビルド済みコード（自動生成）
│   ├── index.js      # ビルド済みルール
│   └── index.js.map  # ソースマップ
├── test/             # テストコード
│   └── index-test.js # ルールのテスト
├── node_modules/     # 依存パッケージ
├── .git/             # Gitリポジトリ
├── .kiro/            # Kiro設定
│   └── steering/     # ステアリングルール
├── package.json      # プロジェクト設定
├── package-lock.json # 依存関係ロック
├── .gitignore        # Git除外設定
├── LICENSE           # ライセンス
└── README.md         # プロジェクトドキュメント
```

## ファイルの役割

### src/index.js

textlintルールの実装。以下の構造を持つ：

- **reporter関数**: ルールのエントリーポイント
- **ヘルパー関数**: 文字判定、シーケンス抽出など
- **ノードハンドラ**: `Syntax.Link`と`Syntax.Str`を処理

### test/index-test.js

textlint-testerを使用したテスト。以下を含む：

- **valid**: 正しい例（エラーなし）
- **invalid**: 誤った例（エラーあり）

### lib/

ビルド済みコード。`npm run build`で自動生成される。公開時に含まれる。

## 命名規則

- **ファイル名**: kebab-case（例: `index-test.js`）
- **関数名**: camelCase（例: `containsSpaces`, `isFullWidth`）
- **定数**: UPPER_SNAKE_CASE（該当なし）

## コーディング規約

- コメントは英語で記述
- JSDocコメントを関数に付ける
- エラーメッセージは日本語
