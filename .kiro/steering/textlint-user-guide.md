---
inclusion: always
---

# textlint ユーザーガイド

## 概要
textlintは、テキストやMarkdownファイルの文章をチェックするためのリンターです。プラグイン可能なルールシステムを採用しており、様々な文章規則を適用できます。

## 基本的な使い方

### インストール
```bash
# textlint本体のインストール
npm install --save-dev textlint

# ルールのインストール（例）
npm install --save-dev textlint-rule-no-todo
```

### 設定ファイル
textlintは以下の設定ファイルをサポートしています：

- `.textlintrc` - JSON、YAML、またはJSとして解析
- `.textlintrc.json` - JSON形式（コメント対応）
- `.textlintrc.js` - JavaScript形式
- `.textlintrc.yml` / `.textlintrc.yaml` - YAML形式
- `package.json`の`textlint`フィールド

### 設定ファイルの初期化
```bash
npx textlint --init
```

### 基本的な実行
```bash
# 特定のファイルをチェック
npx textlint file.md

# ディレクトリ全体をチェック
npx textlint docs/

# Globパターンを使用
npx textlint "**/*.md"

# 自動修正
npx textlint --fix file.md

# ドライラン（修正内容の確認のみ）
npx textlint --fix --dry-run file.md
```

## 設定ファイルの構造

### ルールの設定
```json
{
  "rules": {
    "no-todo": true,
    "max-comma": {
      "max": 3
    },
    "very-nice-rule": false
  }
}
```

- `true`: ルールを有効化
- `false`: ルールを無効化
- オブジェクト: ルールを有効化し、オプションを渡す

### ルール名の省略形
以下の形式がサポートされています：

- `textlint-rule-<name>` → `<name>`
- `@scope/textlint-rule-<name>` → `@scope/<name>`

例：`"cool": true` は `"textlint-rule-cool": true` と同じ

### 重要度の設定
```json
{
  "rules": {
    "no-todo": {
      "severity": "warning"
    }
  }
}
```

- `"error"`: エラー（赤）- 終了ステータス1
- `"warning"`: 警告（黄）- 終了ステータス0
- `"info"`: 情報（緑）- 終了ステータス0（v15.1.0以降）

### プリセットの使用
```json
{
  "rules": {
    "preset-ja-technical-writing": true,
    "preset-ja-technical-writing": {
      "no-exclamation-question-mark": false
    }
  }
}
```

### フィルタールール
特定のエラーを無視するためのフィルタールール：

```json
{
  "filters": {
    "comments": true,
    "node-types": {
      "nodeTypes": ["BlockQuote"]
    }
  },
  "rules": {
    "very-nice-rule": true
  }
}
```

### プラグイン
デフォルトでMarkdownとテキストファイルをサポート。他の形式はプラグインで対応：

```json
{
  "plugins": {
    "@textlint/markdown": {
      "extensions": [".hown"]
    }
  }
}
```

## CLIオプション

### 主要なオプション
- `-h, --help`: ヘルプを表示
- `-c, --config <path>`: 設定ファイルのパスを指定
- `--init`: 設定ファイルを作成
- `--fix`: 自動修正
- `--dry-run`: 修正内容の確認のみ（ファイルは変更しない）
- `--debug`: デバッグ情報を出力
- `-v, --version`: バージョンを表示

### 出力関連
- `-o, --output-file <path>`: レポートをファイルに出力
- `-f, --format <formatter>`: 出力フォーマットを指定
  - 利用可能: `stylish`, `compact`, `json`, `junit`, `tap`, `unix`, `checkstyle`, `jslint-xml`, `pretty-error`, `table`
- `--no-color`: 色を無効化
- `--quiet`: エラーのみ表示

### ルール・プラグイン指定
- `--no-textlintrc`: `.textlintrc`を無視
- `--rule <rule>`: ルールを指定
- `--preset <preset>`: プリセットを指定
- `--plugin <plugin>`: プラグインを指定
- `--rulesdir <path>`: 追加のルールディレクトリ

### キャッシュ
- `--cache`: 変更されたファイルのみチェック
- `--cache-location <path>`: キャッシュファイルの場所（デフォルト: `.textlintcache`）

### 標準入力
- `--stdin`: 標準入力からテキストを受け取る
- `--stdin-filename <filename>`: 標準入力のファイル名を指定

## ファイルの無視

### .textlintignore
プロジェクトルートに`.textlintignore`ファイルを作成：

```
# ファイルを無視
ignored.md

# Globパターンで無視
vendor/**
node_modules/**
```

### 部分的な無視
[textlint-filter-rule-comments](https://github.com/textlint/textlint-filter-rule-comments)を使用：

```markdown
<!-- textlint-disable -->
この部分はチェックされません
<!-- textlint-enable -->

<!-- textlint-disable rule-name -->
特定のルールのみ無効化
<!-- textlint-enable rule-name -->
```

設定：
```json
{
  "filters": {
    "comments": true
  }
}
```

## 共有可能な設定

設定をnpmパッケージとして共有できます：

```bash
# インストール
npm install --save-dev textlint-config-<name>

# 使用
npx textlint --config textlint-config-<name>
```

または`.textlintrc`で：
```json
{
  "extends": ["textlint-config-<name>"]
}
```

## MCPサーバとしての利用

textlint v14.8.0以降では、MCPサーバとして利用することで、Claude CodeやVSCode CopilotなどのAIツールと連携できます。

```bash
npx textlint --mcp
```

MCPサーバの詳しい設定方法は [textlint MCP documentation](https://textlint.org/docs/mcp/) を参照してください。

このMCPサーバ機能を使うことで、AIツールとtextlintを組み合わせた次のようなフィードバックループが実現できます：

1. AIツールが文章を生成する
2. 生成した文章をtextlint MCPサーバでチェックする
3. チェック結果をもとにAIツールが改善提案や修正を行う

## フィルタールール

### textlint-filter-rule-allowlist

許可リスト機能を提供します。特定の単語やパターンをチェック対象から除外できます。

設定例：
```json
{
  "filters": {
    "allowlist": {
      "allow": [
        "特定の単語",
        "/正規表現パターン/"
      ]
    }
  }
}
```

### textlint-filter-rule-comments

コメントによる無効化機能を提供します。

```markdown
<!-- textlint-disable -->
この部分はチェックされません
<!-- textlint-enable -->

<!-- textlint-disable rule-name -->
特定のルールのみ無効化
<!-- textlint-enable rule-name -->
```

設定：
```json
{
  "filters": {
    "comments": true
  }
}
```

## 参考リンク
- [公式ドキュメント](https://textlint.org/)
- [ルール一覧](https://github.com/textlint/textlint/wiki/Collection-of-textlint-rule)
- [プラグイン一覧](https://github.com/textlint/textlint/wiki/Collection-of-textlint-rule#processor-plugin-list)
