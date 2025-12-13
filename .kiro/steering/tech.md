# 技術スタック

## 言語とランタイム

- **Node.js**: 最小バージョン要件あり（package.json参照）
- **JavaScript**: ES6 import/export（ソース）、CommonJS（ビルド後）
- **モジュールシステム**: CommonJS (`type: "commonjs"`)

## 主要ライブラリ

### 本番依存

- **textlint**: peerDependency
- **textlint-rule-helper**: ルール開発用ヘルパー

### 開発依存

- **@textlint/types**: TypeScript型定義
- **@textlint/textlint-plugin-markdown**: テスト用Markdownプラグイン
- **textlint-scripts**: ビルドとテストのスクリプト
- **fast-check**: プロパティベーステスト

## ビルドシステム

textlint-scriptsを使用してビルドとテストを管理。

### 共通コマンド

```bash
# ビルド（src/ → lib/）
npm run build

# テスト実行
npm test

# 公開前のビルド
npm run prepublish
```

## プロジェクト構造

- **src/**: ソースコード（ES6 import/export使用）
- **lib/**: ビルド済みコード（CommonJS形式）
- **test/**: テストコード（例示ベース + プロパティベース）
- **package.json**: メインエントリーポイントは `lib/index.js`

## 開発フロー

1. `src/index.js`でルールを実装
2. `test/example-test.js`で例示ベースのテストを記述
3. `test/pbt-test.js`でプロパティベーステストを記述
4. `npm test`でテスト実行
5. `npm run build`でビルド
6. 公開時は`lib/`と`src/`の両方を含める

## 自動修正機能のテスト

このルールは自動修正機能（auto-fix）を実装している。以下の方法でテストできる。

### Kernelを使った直接テスト

`test/kernel-test.js`を使用して、textlintのKernelを直接使ったテストが可能：

```bash
# ビルド後にKernelテストを実行
npm run build
node test/kernel-test.js
```

#### テストファイル構造

```
test/
├── kernel-test.js           # Kernelテストスクリプト
├── fixtures/
│   ├── test-input.md       # テスト入力ファイル（スペーシングエラーあり）
│   └── test-expected.md    # 期待される修正結果
├── example-test.js         # 例示ベーステスト
└── pbt-test.js            # プロパティベーステスト
```

このテストでは以下を確認できる：
- エラー検出の動作
- 自動修正の動作
- 修正前後のテキスト比較
- 期待される結果との一致確認
- 適用された修正の数
- 残存するエラーの数

### テスト内容

Kernelテストでは以下のスペーシングルールをテストする：

1. **単語（スペースなし）**: `これは test です。` → `これはtestです。`
2. **フレーズ（スペースあり）**: `日本語hello worldテスト。` → `日本語 hello world テスト。`
3. **URL**: `詳細はhttps://example.comを参照。` → `詳細は https://example.com を参照。`
4. **メールアドレス**: `メアドはfoo@example.comです。` → `メアドは foo@example.com です。`

### 自動修正の仕組み

- `fixer.replaceTextRange()`を使用してテキストの範囲を置換
- スペースの挿入: `fixer.replaceTextRange([index, index], ' ')`
- スペースの削除: `fixer.replaceTextRange([start, end], '')`
- 各エラーメッセージに`fix`プロパティを含めることで自動修正を有効化

## リリース方法

このプロジェクトはGitHub ActionsとTrusted Publishingを使用した自動リリースを採用している。

### リリース手順

1. **バージョンの更新**
   ```bash
   # package.jsonのバージョンを更新
   npm version patch  # パッチバージョン（例: 1.0.0 → 1.0.1）
   npm version minor  # マイナーバージョン（例: 1.0.0 → 1.1.0）
   npm version major  # メジャーバージョン（例: 1.0.0 → 2.0.0）
   ```

2. **タグのプッシュ**
   ```bash
   git push origin main --tags
   ```

3. **自動リリース**
   - `v*`形式のタグがプッシュされると、GitHub Actionsが自動的に実行される
   - ワークフローは以下を実行：
     - 依存関係のインストール
     - ビルド（`npm run build`）
     - テスト（`npm test`）
     - GitHubリリースの作成（リリースノート自動生成）
     - npmへの公開（Trusted Publishing経由）

### Trusted Publishing

- npmへの公開はTrusted Publishingを使用
- トークン不要で安全に公開可能
- `--provenance`フラグで来歴情報を付与
- `--access public`でパブリックパッケージとして公開

### 注意事項

- リリース前に必ずテストが通ることを確認
- セマンティックバージョニング（SemVer）に従う
- タグは`v`プレフィックス付き（例: `v1.0.0`）
