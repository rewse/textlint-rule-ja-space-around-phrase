---
inclusion: always
---

# textlintルール開発ガイド

## ルールの基本構造

textlintのルールは、AST（抽象構文木）のノードタイプに対応するメソッドを持つオブジェクトを返す関数として定義されます。

```javascript
/**
 * @param {RuleContext} context
 */
export default function (context) {
    const { Syntax, getSource, report, RuleError } = context;
    return {
        [Syntax.Str](node) {
            const text = getSource(node);
            if (/found wrong use-case/.test(text)) {
                report(node, new RuleError("Found wrong"));
            }
        }
    };
}
```

## AST（抽象構文木）

textlintは[TxtNode](https://textlint.org/docs/txtnode)で定義されたASTを使用します。

- [AST explorer for textlint](https://textlint.org/astexplorer/)でASTの構造を確認できます
- [visualize-txt-traverse](https://github.com/azu/visualize-txt-traverse)でトラバース（走査）の動作を視覚化できます

## ノードの訪問タイミング

デフォルトでは、ノードに入る時（Enter）にメソッドが呼ばれます。ノードから出る時（Leave）に処理したい場合は、`Exit`を付けます：

```javascript
export default function (context) {
    const { Syntax } = context;
    return {
        // ノードに入る時
        [Syntax.Str](node) {
            // 処理
        },
        // ノードから出る時
        [Syntax.StrExit](node) {
            // 処理
        }
    };
}
```

## RuleContext API

RuleContextオブジェクトは以下のプロパティとメソッドを提供します：

- `Syntax.*`: TxtNodeの型定数（例: `Syntax.Str`, `Syntax.Paragraph`）
- `report(node, ruleError)`: エラーを報告
- `getSource(node)`: ノードのソースコードを取得
- `getFilePath()`: リント対象のファイルパスを取得
- `getConfigBaseDir()`: 設定ファイル（`.textlintrc`）のあるディレクトリパスを取得（v9.0.0以降）
- `fixer`: 自動修正用のオブジェクト（詳細は[Fixable Rule](https://textlint.org/docs/rule-fixable)を参照）
- `locator`: エラー位置を指定するためのユーティリティ（v12.2.0以降）

## RuleError

`RuleError`はエラー報告用のオブジェクトです。`report`関数と組み合わせて使用します。

### 基本的な使い方

```javascript
// ノード全体をエラー箇所として報告
report(node, new RuleError("Found a typo"));
```

### padding を使った詳細な位置指定（v12.2.0以降推奨）

`padding`プロパティと`locator`オブジェクトを使うと、ノード内の特定の位置をエラー箇所として指定できます：

```javascript
const { Syntax, report, RuleError, getSource, locator } = context;

[Syntax.Str](node) {
    const text = getSource(node);
    const match = text.match(/typo/);
    if (match) {
        // "typo"という文字列の位置を正確に指定
        report(node, new RuleError("Found a typo", {
            padding: locator.range([match.index, match.index + match[0].length])
        }));
    }
}
```

### locator オブジェクトのメソッド

- `locator.at(index)`: 単一の位置を指定（0ベース）
- `locator.range([startIndex, endIndex])`: 範囲を指定（0ベース）
- `locator.loc({ start: { line, column }, end: { line, column } })`: 行と列で位置を指定（相対位置、0ベース）

```javascript
// 単一位置の指定
report(node, new RuleError(message, {
    padding: locator.at(11)
}));

// 範囲の指定
report(node, new RuleError(message, {
    padding: locator.range([5, 10])
}));

// 行と列での指定
report(node, new RuleError(message, {
    padding: locator.loc({
        start: { line: 1, column: 1 },
        end: { line: 2, column: 2 }
    })
}));
```

## 非同期処理

ルール内で非同期処理を行う場合は、Promiseを返します：

```javascript
export default function (context) {
    const { Syntax } = context;
    return {
        [Syntax.Str](node) {
            // textlintはPromiseの解決を待ちます
            return new Promise((resolve, reject) => {
                // 非同期処理
            });
        }
    };
}
```

## ルールの作成

[create-textlint-rule](https://github.com/textlint/create-textlint-rule)を使うと、ルールプロジェクトを簡単にセットアップできます：

```bash
# npxを使用（推奨）
npx create-textlint-rule no-todo

# TypeScriptで作成する場合
npx create-textlint-rule no-todo --typescript
```

生成されたプロジェクトには以下が含まれます：

- ビルドスクリプト: `npm run build`
- テストスクリプト: `npm test`
- [textlint-scripts](https://github.com/textlint/textlint-scripts)による開発環境

## ルールのテスト

[textlint-tester](https://www.npmjs.com/package/textlint-tester)を使ってルールをテストできます。`create-textlint-rule`で生成したプロジェクトには、テスト環境が既にセットアップされています。

```bash
npm test
```

## 終了ステータス
- `0`: エラーなし、または警告のみ
- `1`: リントエラーあり
- `2`: ファイル検索エラー（v15以降）

## 参考リンク
- [公式ドキュメント](https://textlint.org/)
- [ルール開発ガイド](https://textlint.org/docs/rule)
- [Fixable Rule（自動修正可能なルール）](https://textlint.org/docs/rule-fixable)
- [TxtNode（AST仕様）](https://textlint.org/docs/txtnode)
- [AST explorer for textlint](https://textlint.org/astexplorer/)
- [create-textlint-rule](https://github.com/textlint/create-textlint-rule)
- [textlint-tester](https://www.npmjs.com/package/textlint-tester)
