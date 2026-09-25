# textlint-rule-ja-space-around-phrase

日本語の文中で、全角文字と半角文字列の間のスペースをチェックする textlint ルールです。半角文字列がスペースを含まない単語か、スペースを含むフレーズかによって、スペースの要否を切り替えます。`--fix` による自動修正に対応しています。

## ルール

| 対象 | スペース | OK | NG |
|---|---|---|---|
| 単語（スペースを含まない半角文字列） | 入れない | `これはtestです` | `これは testです` |
| フレーズ（スペースを含む半角文字列） | 入れる | `これは hello world です` | `これはhello worldです` |
| URL | 入れる | `詳細は https://example.com を参照` | `詳細はhttps://example.comを参照` |
| メールアドレス | 入れる | `メアドは foo@example.com です` | `メアドはfoo@example.comです` |
| Markdown リンク `[テキスト](URL)` | 不要 | `これは[リンク](https://example.com)です` | なし |

Markdown リンクは括弧が区切りになるため、スペースを入れなくてもエラーになりません。

記号に隣接する側はチェックしません。たとえば `（test）は正しい`、`（hello world）と書く`、`「test」や。test、！test` はいずれもエラーになりません。対象となる記号は、`.,;:!?()[]{}` などの半角記号、`（）「」『』【】` などの括弧類、`、。！？・…` などの句読点、矢印や `●★` などの図形記号です。

## インストール

textlint 15 以降と Node.js 20 以降が必要です。

```bash
npm install --save-dev textlint textlint-rule-ja-space-around-phrase
```

## 使い方

`.textlintrc.json` でルールを有効にします。

```json
{
  "rules": {
    "ja-space-around-phrase": true
  }
}
```

設定ファイルを使わずに CLI で指定することもできます。

```bash
npx textlint --rule ja-space-around-phrase README.md
```

`--fix` を付けると、スペースの挿入と削除を自動で修正します。

```bash
npx textlint --fix README.md
```

## エラーメッセージ

| 入力 | メッセージ |
|---|---|
| `これは testです` | 全角文字とスペースを含まない半角文字列の間にはスペースを入れないでください |
| `これはhello worldです` | 全角文字とスペースを含む半角文字列の間にはスペースを入れる必要があります |
| `詳細はhttps://example.comを参照` | 全角文字とURLの間にはスペースを入れる必要があります / URLと全角文字の間にはスペースを入れる必要があります |
| `メアドはfoo@example.comです` | 全角文字とメールアドレスの間にはスペースを入れる必要があります / メールアドレスと全角文字の間にはスペースを入れる必要があります |

前後の両方が誤っている場合は、それぞれの位置でエラーを報告します。

## 開発

`src/` のソースを `lib/` にビルドします。

```bash
npm run build
```

[textlint-tester](https://github.com/textlint/textlint-tester) による例示テストと、[fast-check](https://github.com/dubzzz/fast-check) によるプロパティベーステストを実行します。

```bash
npm test
```

自動修正の結果は、ビルド後に textlint のカーネルを直接使って確認できます。`test/fixtures/test-input.md` を修正した結果を `test/fixtures/test-expected.md` と比較します。

```bash
npm run build
node test/kernel-test.js
```

## ライセンス

MIT
