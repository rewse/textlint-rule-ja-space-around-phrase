---
inclusion: always
---

# JavaScript コーディング標準

このプロジェクトは Google JavaScript Style Guide に準拠する。

## ソースファイルの基本

### ファイル名
- すべて小文字でなければならない (MUST)
- アンダースコア (`_`) またはダッシュ (`-`) を含めてもよい (MAY)
- 拡張子は `.js` でなければならない (MUST)

### エンコーディング
- UTF-8 でなければならない (MUST)

### インデント
- スペース2つを使用しなければならない (MUST)
- タブ文字を使用してはならない (MUST NOT)

## フォーマット

### 波括弧
- すべての制御構造（`if`, `else`, `for`, `do`, `while` など）で波括弧を使用しなければならない (MUST)
- K&R スタイル（Egyptian brackets）に従わなければならない (MUST)
  - 開き波括弧の前で改行しない
  - 開き波括弧の後で改行する
  - 閉じ波括弧の前で改行する

```javascript
// Good
if (condition) {
  doSomething();
} else {
  doOther();
}

// Bad
if (condition)
  doSomething();
```

### セミコロン
- すべての文はセミコロンで終了しなければならない (MUST)
- 自動セミコロン挿入に依存してはならない (MUST NOT)

### 行の長さ
- 80文字を超えないほうがよい (SHOULD)
- 長いURLやコピー用のコマンドは例外としてもよい (MAY)

### 1行1文
- 各文の後に改行しなければならない (MUST)

## 命名規則

### 変数・関数
- `lowerCamelCase` を使用しなければならない (MUST)

```javascript
// Good
const myVariable = 1;
function doSomething() {}

// Bad
const my_variable = 1;
function do_something() {}
```

### 定数
- `CONSTANT_CASE`（大文字スネークケース）を使用しなければならない (MUST)
- 深くイミュータブルで、プログラム実行中に変更されない値に使用する

```javascript
// Good
const MAX_COUNT = 100;
const DEFAULT_OPTIONS = Object.freeze({timeout: 1000});
```

### クラス
- `UpperCamelCase` を使用しなければならない (MUST)

```javascript
// Good
class MyClass {}

// Bad
class myClass {}
class my_class {}
```

### プライベートメンバー
- 末尾にアンダースコアを付けてはならない (MUST NOT)
- プライベートフィールドには `#` プレフィックスを使用する必要がある (SHOULD)

## モジュール

### ES Modules
- `import` / `export` を使用する必要がある (SHOULD)
- デフォルトエクスポートを使用しないほうがよい (SHOULD NOT)
- 名前付きエクスポートを使用しなければならない (MUST)

```javascript
// Good
export function myFunction() {}
export class MyClass {}

// Bad
export default class MyClass {}
```

### インポートパス
- `.js` 拡張子を含めなければならない (MUST)

```javascript
// Good
import {helper} from './helper.js';

// Bad
import {helper} from './helper';
```

## 変数宣言

### const と let
- 再代入しない変数には `const` を使用しなければならない (MUST)
- 再代入する変数には `let` を使用しなければならない (MUST)
- `var` を使用してはならない (MUST NOT)

```javascript
// Good
const immutable = 1;
let mutable = 2;
mutable = 3;

// Bad
var oldStyle = 1;
```

### 1宣言1変数
- 各変数宣言は独立した文にしなければならない (MUST)

```javascript
// Good
const a = 1;
const b = 2;

// Bad
const a = 1, b = 2;
```

## 配列とオブジェクト

### 末尾カンマ
- 複数行の配列・オブジェクトリテラルでは末尾カンマを付けなければならない (MUST)

```javascript
// Good
const arr = [
  'first',
  'second',
];

const obj = {
  a: 1,
  b: 2,
};

// Bad
const arr = [
  'first',
  'second'
];
```

### スプレッド演算子
- 配列のコピーには `Array.prototype.slice` より `...` を使用する必要がある (SHOULD)

```javascript
// Good
const copy = [...original];

// Avoid
const copy = original.slice();
```

## 関数

### アロー関数
- 無名関数にはアロー関数を使用する必要がある (SHOULD)

```javascript
// Good
const fn = (x) => x * 2;
arr.map((item) => item.value);

// Avoid
const fn = function(x) { return x * 2; };
```

### パラメータ
- アロー関数のパラメータが1つでも括弧を付けなければならない (MUST)

```javascript
// Good
const fn = (x) => x * 2;

// Bad
const fn = x => x * 2;
```

### デフォルトパラメータ
- デフォルト値はパラメータリストの最後に配置しなければならない (MUST)

```javascript
// Good
function greet(name, greeting = 'Hello') {}

// Bad
function greet(greeting = 'Hello', name) {}
```

## 文字列

### クォート
- シングルクォート (`'`) を使用しなければならない (MUST)
- テンプレートリテラルを使用してもよい (MAY)

```javascript
// Good
const str = 'Hello';
const template = `Hello, ${name}!`;

// Bad
const str = "Hello";
```

### 文字列連結
- 複数行や変数を含む場合はテンプレートリテラルを使用する必要がある (SHOULD)

```javascript
// Good
const message = `Hello, ${name}!
Welcome to our site.`;

// Avoid
const message = 'Hello, ' + name + '!\n' +
    'Welcome to our site.';
```

## 等価比較

### 厳密等価
- `===` と `!==` を使用しなければならない (MUST)
- `==` と `!=` を使用してはならない (MUST NOT)

```javascript
// Good
if (value === null) {}
if (value !== undefined) {}

// Bad
if (value == null) {}
```

## コメント

### JSDoc
- エクスポートされる関数・クラスには JSDoc コメントを付けなければならない (MUST)
- `@param`, `@return`, `@throws` などのタグを使用する

```javascript
/**
 * Calculates the sum of two numbers.
 * @param {number} a - First number.
 * @param {number} b - Second number.
 * @return {number} The sum of a and b.
 */
function add(a, b) {
  return a + b;
}
```

### 実装コメント
- 英語で記述しなければならない (MUST)
- `//` を使用し、コードの上の行に配置する

```javascript
// Calculate the total price including tax.
const total = price * (1 + taxRate);
```

## エラーハンドリング

### 例外
- 空の catch ブロックを避けなければならない (MUST)
- catch した例外を無視する場合はコメントで理由を説明しなければならない (MUST)

```javascript
// Good
try {
  riskyOperation();
} catch (e) {
  // Expected to fail when file doesn't exist.
}

// Bad
try {
  riskyOperation();
} catch (e) {}
```

## 参考リンク

- [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html)
