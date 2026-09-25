# AGENTS.md

## Product

`textlint-rule-ja-space-around-phrase` is a fixable textlint rule that checks spacing between full-width (Japanese) characters and half-width strings. The spacing semantics are the core of the project:

- A single half-width word takes no surrounding space: `これはtestです`.
- A half-width phrase (a half-width string that contains spaces) takes a space on both sides: `日本語 hello world テスト`.
- A plain URL or email address always takes a space on both sides: `詳細は https://example.com を参照`.
- A Markdown link `[text](url)` needs no space, because the brackets already separate it visually.
- A half-width string directly before or after a symbol is not checked.

User-facing error messages are written in Japanese; everything else in code (comments, identifiers) is English.

## Implementation notes

- `src/index.js` holds the whole rule. It exports `reporter` and a default `{linter, fixer}` object; the default export is what textlint loads, so keep it even though the style guide prefers named exports.
- The Markdown parser turns plain URLs and emails into `Link` nodes whose text may swallow trailing Japanese (`https://example.comを参照` becomes one node). `extractUrlOrEmail()` recovers the real URL/email and checks the character after it. `Str` nodes inside `Link` nodes are skipped to avoid duplicate reports.
- Only ASCII spaces and tabs count as boundary spaces; a line break or an ideographic space is not checked, so fixes never join lines.
- Fixes go through `fixer.replaceTextRange()`, and positions are reported with `padding: locator.at(...)`.

## Build and test

- `src/` is ESM source; `npm run build` (textlint-scripts) emits CommonJS to `lib/`, which is git-ignored and is the published entry point. Both `lib/` and `src/` are published.
- `npm test` runs `test/example-test.js` (textlint-tester valid/invalid cases), `test/pbt-test.js` (fast-check property-based tests), and `test/kernel-test.js`, which fixes `test/fixtures/test-input.md` through `@textlint/kernel` and compares the result with `test/fixtures/test-expected.md`. Add cases to the example and property tests when changing spacing behavior, and update the expected fixture when fix output intentionally changes.
- Test files are transpiled by textlint-scripts' Babel setup, which rejects `fs` calls it cannot evaluate statically; read files with `fs/promises` in tests.

## Coding style

Follow the [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html). Beyond it, this project uses single quotes, trailing commas in multiline literals, parentheses around every arrow-function parameter, `.js` extensions in `src/` import paths, and JSDoc on every function.

## Release

Releases are automated. Bump the version with `npm run release:patch` (or `release:minor` / `release:major`), which runs `npm version` and pushes the commit and the `v*` tag. The tag triggers `.github/workflows/release.yml`, which builds, tests, generates notes with git-cliff, creates the GitHub release, and publishes to npm through Trusted Publishing (`--provenance`, no token). Follow SemVer and make sure tests pass before tagging.

## Supply-chain security

The project defends against npm supply-chain attacks in three layers; keep all of them intact when editing workflows or dependencies.

1. Aikido Safe Chain blocks packages published less than 96 hours ago. Workflows that install dependencies set it up and pass `SAFE_CHAIN_MINIMUM_PACKAGE_AGE_HOURS: 96` to `npm ci` (the scheduled security scan deliberately skips the age check). Use the same 96-hour threshold when choosing a version to add or update locally.
2. `.npmrc` sets `ignore-scripts=true`, so dependency lifecycle scripts never run. No current dependency needs one. If a dependency that requires install scripts (typically a native module) is ever added, allow it explicitly with [@lavamoat/allow-scripts](https://github.com/LavaMoat/LavaMoat/tree/main/packages/allow-scripts) and keep that allowlist minimal; prefer a pure-JS alternative when one exists.
3. OSV-Scanner checks known vulnerabilities in CI (`security-scan.yml`). Run `osv-scanner --lockfile package-lock.json` locally whenever `package-lock.json` changes. Vulnerable transitive dependencies are pinned through `overrides` in `package.json`.

Before adding a dependency, check its maintenance status, adoption, and known vulnerabilities. When updating one, read its changelog, run OSV-Scanner, and run the tests. Report security issues in this project through a GitHub Security Advisory, not a public issue.
