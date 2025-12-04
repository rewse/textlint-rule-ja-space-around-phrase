# セキュリティガイドライン

## 要求レベルについて

この文書における次の各キーワード「しなければならない (MUST)」、「してはならない (MUST NOT)」、「要求されている (REQUIRED)」、「することになる (SHALL)」、「することはない (SHALL NOT)」、「する必要がある (SHOULD)」、「しないほうがよい (SHOULD NOT)」、「推奨される (RECOMMENDED)」、「してもよい (MAY)」、「選択できる (OPTIONAL)」は、RFC 2119 で述べられているように解釈されるべきものです。

## 基本方針

このプロジェクトは、npmサプライチェーン攻撃に対する多層防御を実装しなければなりません (MUST)。

## 多層防御アプローチ

### 層1: 入れない（Aikido Safe Chain）

新しすぎるパッケージや怪しいパッケージをインストールさせない対策を実装しなければなりません (MUST)。

公開から96時間（4日）以内のパッケージのインストールをブロックすることで、ゼロデイ攻撃の多くを回避できます。

このプロジェクトでは、デフォルトの24時間ではなく96時間に設定しています。これにより、より多くの攻撃を検知できる可能性が高まります。

#### CI/CDでの実装

GitHub Actionsワークフローには、Aikido Safe Chainのセットアップを含めなければなりません (MUST)：

```yaml
- name: Setup Aikido Safe Chain
  run: curl -fsSL https://raw.githubusercontent.com/AikidoSec/safe-chain/main/install-scripts/install-safe-chain.sh | sh -s -- --ci

- name: Install dependencies
  env:
    SAFE_CHAIN_MINIMUM_PACKAGE_AGE_HOURS: 96
  run: npm ci
```

環境変数`SAFE_CHAIN_MINIMUM_PACKAGE_AGE_HOURS`で最小パッケージ年齢を設定しなければなりません (MUST)。このプロジェクトでは96時間（4日）に設定しています。

#### ローカル開発

開発者は、Aikido Safe Chainをローカル環境にインストールする必要があります (SHOULD)。

**Unix/Linux/macOS:**

```bash
curl -fsSL https://raw.githubusercontent.com/AikidoSec/safe-chain/main/install-scripts/install-safe-chain.sh | sh
```

**Windows (PowerShell):**

```powershell
iex (iwr "https://raw.githubusercontent.com/AikidoSec/safe-chain/main/install-scripts/install-safe-chain.ps1" -UseBasicParsing)
```

インストール後、ターミナルを再起動しなければなりません (MUST)。

#### 最小パッケージ年齢の設定

ローカル開発環境で96時間の設定を使用する場合は、環境変数を設定する必要があります (SHOULD)：

```bash
# 環境変数を設定
export SAFE_CHAIN_MINIMUM_PACKAGE_AGE_HOURS=96

# または、コマンドごとに指定
npm install express --safe-chain-minimum-package-age-hours=96
```

または、設定ファイル（`~/.aikido/config.json`）で永続的に設定できます (MAY)：

```json
{
  "minimumPackageAgeHours": 96
}
```

詳細: [Aikido Safe Chain](https://github.com/AikidoSec/safe-chain)

### 層2: 実行させない（ignore-scripts）

`.npmrc`ファイルで`ignore-scripts=true`を設定しなければなりません (MUST)。

```
# .npmrc
ignore-scripts=true
```

この設定により、パッケージのインストールスクリプト（preinstall、postinstallなど）の実行を防ぎます。

#### 現在のプロジェクトへの影響

このプロジェクトは、インストールスクリプトを必要とする依存関係を持っていません。そのため、この設定による影響はありません。

#### ネイティブモジュールの扱い

ネイティブモジュール（bcrypt、sqlite3、sharpなど）を追加する場合は、[@lavamoat/allow-scripts](https://github.com/LavaMoat/LavaMoat/tree/main/packages/allow-scripts)を使用してホワイトリスト方式で許可しなければなりません (MUST)。

##### ネイティブモジュールとは

ネイティブモジュールは、C/C++で書かれたコードをNode.jsから使用できるようにしたパッケージです。これらのパッケージは、インストール時にpostinstallスクリプトでネイティブコードをコンパイルする必要があります。

代表的なネイティブモジュール：
- **bcrypt**: パスワードハッシュ化
- **sqlite3**: SQLiteデータベース
- **sharp**: 画像処理
- **node-sass**: Sassコンパイラ
- **canvas**: Canvas API実装

##### @lavamoat/allow-scriptsの導入手順

1. **パッケージのインストール**

   ```bash
   npm install --save-dev @lavamoat/allow-scripts
   ```

2. **package.jsonの設定**

   `package.json`に許可するパッケージを明示的に指定しなければなりません (MUST)：

   ```json
   {
     "scripts": {
       "preinstall": "npx allow-scripts auto",
       "postinstall": "npx allow-scripts"
     },
     "lavamoat": {
       "allowScripts": {
         "sharp": true,
         "bcrypt": true,
         "sqlite3": true
       }
     }
   }
   ```

3. **自動検出機能の使用**

   初回セットアップ時は、`auto`コマンドで必要なパッケージを自動検出できます (MAY)：

   ```bash
   npx allow-scripts auto
   ```

   このコマンドは、`node_modules`内のパッケージをスキャンし、ライフサイクルスクリプトを持つパッケージを検出して、`package.json`に追加します。

4. **動作確認**

   ```bash
   # 依存関係を再インストール
   npm ci

   # 許可されたパッケージのみスクリプトが実行される
   ```

##### pnpm v10を使用する場合

pnpm v10以降では、デフォルトで依存パッケージのライフサイクルスクリプトが実行されません。ネイティブモジュールを使用する場合は、`package.json`で明示的に許可しなければなりません (MUST)：

```json
{
  "pnpm": {
    "onlyBuiltDependencies": ["sharp", "bcrypt", "sqlite3"]
  }
}
```

##### セキュリティ上の注意点

- **最小権限の原則**: 必要なパッケージのみを許可リストに追加しなければなりません (MUST)
- **定期的な見直し**: 依存関係を更新する際は、許可リストも見直さなければなりません (MUST)
- **信頼できるパッケージのみ**: 許可するパッケージは、メンテナンスが活発で信頼できるものに限定しなければなりません (MUST)
- **代替手段の検討**: ネイティブモジュールを使わない代替パッケージがある場合は、そちらを検討する必要があります (SHOULD)

##### トラブルシューティング

**問題: ネイティブモジュールのビルドが失敗する**

```bash
# allow-scriptsを一時的に無効化してインストール
npm install --ignore-scripts

# 特定のパッケージのみビルド
npx allow-scripts
```

**問題: 許可リストに追加したのにスクリプトが実行されない**

1. `.npmrc`の`ignore-scripts=true`が優先されていないか確認する
2. `package.json`の`lavamoat.allowScripts`の設定を確認する
3. `node_modules`を削除して再インストールする

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

### 層3: 見逃さない（OSV-Scanner）

Googleが運営するOSV（Open Source Vulnerabilities）データベースを使用して、既知の脆弱性をスキャンしなければなりません (MUST)。

#### CI/CDでの実装

GitHub Actionsワークフローには、OSV-Scannerによる脆弱性スキャンを含めなければなりません (MUST)：

```yaml
osv-scan:
  uses: google/osv-scanner-action/.github/workflows/osv-scanner-reusable.yml@v2.3.0
```

#### ローカルでの使用

開発者は、ローカル環境でもOSV-Scannerを使用する必要があります (SHOULD)：

```bash
# インストール（macOS）
brew install osv-scanner

# スキャン実行
osv-scanner --lockfile package-lock.json
```

詳細: [OSV-Scanner](https://google.github.io/osv-scanner/)

## 依存関係の管理

### 新しい依存関係の追加

新しい依存関係を追加する際は、以下を確認しなければなりません (MUST)：

1. パッケージの公開日（最低24時間経過していること）
2. パッケージのメンテナンス状況
3. GitHubスター数やダウンロード数
4. 既知の脆弱性の有無

### 依存関係の更新

依存関係を更新する際は、以下を実行しなければなりません (MUST)：

1. 変更内容の確認（CHANGELOGやリリースノート）
2. OSV-Scannerによるスキャン
3. テストの実行

## セキュリティインシデントへの対応

### 脆弱性の発見

セキュリティ上の問題を発見した場合は、以下の手順に従わなければなりません (MUST)：

1. 公開のIssueではなく、GitHubのSecurity Advisoryを使用して報告する
2. 影響範囲を特定する
3. 修正パッチを作成する
4. セキュリティアドバイザリを公開する

#### 報告手順

1. リポジトリの「Security」タブを開く
2. 「Report a vulnerability」をクリックする
3. 詳細を記入して送信する

### 依存関係の脆弱性

依存関係に脆弱性が発見された場合は、以下の手順に従わなければなりません (MUST)：

1. 影響範囲を評価する
2. 修正版が利用可能な場合は、速やかに更新する
3. 修正版が利用できない場合は、代替パッケージを検討する
4. ユーザーに通知する

## 参考リンク

- [Shai-Hulud 2.0 解説記事](https://zenn.dev/hand_dot/articles/04542a91bc432e)
- [OWASP NPM Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/NPM_Security_Cheat_Sheet.html)
- [Aikido Safe Chain](https://github.com/AikidoSec/safe-chain)
- [OSV-Scanner](https://google.github.io/osv-scanner/)
- [@lavamoat/allow-scripts](https://github.com/LavaMoat/LavaMoat/tree/main/packages/allow-scripts)
