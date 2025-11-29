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
