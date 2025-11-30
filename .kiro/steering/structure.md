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
│   ├── example-test.js # 例示ベースのテスト
│   └── pbt-test.js     # プロパティベーステスト
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
- **ヘルパー関数**: 文字判定（`isFullWidth`, `isSymbol`, `isUrl`, `isEmail`）、シーケンス抽出など
- **ノードハンドラ**: `Syntax.Link`（URL/メールアドレス）と`Syntax.Str`（テキスト）を処理

### test/example-test.js

textlint-testerを使用した例示ベースのテスト。以下を含む：

- **valid**: 正しい例（エラーなし）
- **invalid**: 誤った例（エラーあり）

### test/pbt-test.js

fast-checkを使用したプロパティベーステスト。以下のプロパティを検証：

- 単語（スペースなし）のスペーシング
- フレーズ（スペースあり）のスペーシング
- 全角のみ/半角のみのテキスト
- 記号境界の処理
- URL/メールアドレスの処理
- Markdownリンクの処理

### lib/

ビルド済みコード。`npm run build`で自動生成される。公開時に含まれる。

## 命名規則

- **ファイル名**: kebab-case（例: `example-test.js`）
- **関数名**: camelCase（例: `isFullWidth`, `isSymbol`, `extractUrlOrEmail`）
- **定数**: UPPER_SNAKE_CASE（該当なし）

## コーディング規約

- コメントは英語で記述
- JSDocコメントを関数に付ける
- エラーメッセージは日本語
