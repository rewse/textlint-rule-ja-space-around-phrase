# textlint-rule-ja-space-around-phrase

日本語テキスト内の全角文字と半角文字列の間のスペースをチェックするtextlintルールです。

## ルール

このルールは以下のスペーシング規則を適用します：

1. **単語（スペースを含まない半角文字列）の場合**
   - 全角文字と単語の間にはスペースを入れない
   - ✅ `これはtestです`
   - ❌ `これは testです`

2. **フレーズ（スペースを含む半角文字列）の場合**
   - 全角文字とフレーズの間にはスペースを入れる
   - ✅ `これは hello world です`
   - ❌ `これはhello worldです`

3. **URLの場合**
   - 全角文字とURLの間には常にスペースを入れる
   - ✅ `詳細は https://example.com を参照`
   - ❌ `詳細はhttps://example.comを参照`

4. **記号の前後**
   - 記号の直前・直後の半角文字列はスペースチェックの対象外
   - ✅ `（test）は正しい`
   - ✅ `（hello world）と書く`
   - ✅ `「test」や。test、！test`
   - 対象記号: `.,;:!?()[]{}「」『』【】、。！？` など

## Install

Install with [npm](https://www.npmjs.com/):

    npm install textlint-rule-ja-space-around-phrase

## Usage

`.textlintrc.json`で設定（推奨）

```json
{
    "rules": {
        "ja-space-around-phrase": true
    }
}
```

CLIで直接使用

```bash
textlint --rule ja-space-around-phrase README.md
```

## Examples

### 正しい例

```markdown
これはtestです
日本語textを含む
これは hello world です
日本語 test case を含む
詳細は https://example.com を参照

# 記号の前後はチェック対象外
（test）は正しい
（hello world）と書く
「test」や。test、！test
```

### 誤った例

```markdown
これは testです
→ 全角文字とスペースを含まない半角文字列の間にはスペースを入れないでください

これはhello worldです
→ 全角文字とスペースを含む半角文字列の間にはスペースを入れる必要があります

詳細はhttps://example.comを参照
→ 全角文字とURLの間にはスペースを入れる必要があります
```

## Development

### Build

`src/`フォルダのソースコードを`lib/`フォルダにビルドします。

```bash
npm run build
```

### Tests

`test/`フォルダのテストコードを実行します。
[textlint-tester](https://github.com/textlint/textlint-tester)を使用してルールをテストします。

```bash
npm test
```
