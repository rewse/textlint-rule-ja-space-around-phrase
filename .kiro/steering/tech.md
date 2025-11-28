# 技術スタック

## 言語とランタイム

- **Node.js**: 最小バージョン要件あり（package.json参照）
- **JavaScript**: CommonJS形式
- **モジュールシステム**: CommonJS (`type: "commonjs"`)

## 主要ライブラリ

- **textlint**: peerDependency
- **textlint-rule-helper**: ルール開発用ヘルパー
- **@textlint/types**: TypeScript型定義
- **textlint-tester**: ルールのテストフレームワーク
- **textlint-scripts**: ビルドとテストのスクリプト

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
- **test/**: テストコード
- **package.json**: メインエントリーポイントは `lib/index.js`

## 開発フロー

1. `src/index.js`でルールを実装
2. `test/index-test.js`でテストを記述
3. `npm test`でテスト実行
4. `npm run build`でビルド
5. 公開時は`lib/`と`src/`の両方を含める
