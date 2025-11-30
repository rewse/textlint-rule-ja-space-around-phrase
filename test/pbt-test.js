import {TextlintKernel} from '@textlint/kernel';
import MarkdownPlugin from '@textlint/textlint-plugin-markdown';
import fc from 'fast-check';
import rule from '../src/index';

const kernel = new TextlintKernel();

/**
 * Run textlint rule on text
 * @param {string} text - Text to lint
 * @return {Promise<Array>} Array of lint messages
 */
async function lint(text) {
  const result = await kernel.lintText(text, {
    filePath: 'test.md',
    ext: '.md',
    plugins: [
      {
        pluginId: 'markdown',
        plugin: MarkdownPlugin,
      },
    ],
    rules: [
      {
        ruleId: 'ja-space-around-phrase',
        rule: rule,
      },
    ],
  });
  return result.messages;
}

// Character generators
const hiragana = fc.integer({min: 0x3041, max: 0x3096}).map((c) => String.fromCharCode(c));
const katakana = fc.integer({min: 0x30a1, max: 0x30f6}).map((c) => String.fromCharCode(c));
const kanji = fc.integer({min: 0x4e00, max: 0x9faf}).map((c) => String.fromCharCode(c));
const fullWidth = fc.oneof(hiragana, katakana, kanji);

const asciiLower = fc.integer({min: 97, max: 122}).map((c) => String.fromCharCode(c));
const asciiUpper = fc.integer({min: 65, max: 90}).map((c) => String.fromCharCode(c));
const digit = fc.integer({min: 48, max: 57}).map((c) => String.fromCharCode(c));
const halfWidth = fc.oneof(asciiLower, asciiUpper, digit);

// Word and phrase generators
const word = fc.array(halfWidth, {minLength: 1, maxLength: 10}).map((arr) => arr.join(''));
const fullWidthStr = fc.array(fullWidth, {minLength: 1, maxLength: 5}).map((arr) => arr.join(''));

const phrase = fc
  .array(word, {minLength: 2, maxLength: 4})
  .map((words) => words.join(' '));


describe('ja-space-around-phrase', function() {
  this.timeout(30000);

  describe('Property: Single word without space', function() {
    it('should not report error for full-width + word + full-width (no spaces)', async function() {
      await fc.assert(
        fc.asyncProperty(
          fullWidthStr,
          word,
          fullWidthStr,
          async (before, w, after) => {
            const text = `${before}${w}${after}`;
            const messages = await lint(text);
            const hasSpacingError = messages.some(
              (m) => m.message.includes('スペースを含まない半角文字列')
            );
            return !hasSpacingError;
          }
        ),
        {numRuns: 100}
      );
    });

    it('should report error for full-width + space + word + full-width', async function() {
      await fc.assert(
        fc.asyncProperty(
          fullWidthStr,
          word,
          fullWidthStr,
          async (before, w, after) => {
            const text = `${before} ${w}${after}`;
            const messages = await lint(text);
            return messages.some(
              (m) => m.message.includes('スペースを入れないでください')
            );
          }
        ),
        {numRuns: 100}
      );
    });

    it('should report error for full-width + word + space + full-width', async function() {
      await fc.assert(
        fc.asyncProperty(
          fullWidthStr,
          word,
          fullWidthStr,
          async (before, w, after) => {
            const text = `${before}${w} ${after}`;
            const messages = await lint(text);
            return messages.some(
              (m) => m.message.includes('スペースを入れないでください')
            );
          }
        ),
        {numRuns: 100}
      );
    });
  });

  describe('Property: Phrase with space', function() {
    it('should not report error for full-width + space + phrase + space + full-width', async function() {
      await fc.assert(
        fc.asyncProperty(
          fullWidthStr,
          phrase,
          fullWidthStr,
          async (before, p, after) => {
            const text = `${before} ${p} ${after}`;
            const messages = await lint(text);
            const hasSpacingError = messages.some(
              (m) => m.message.includes('スペースを含む半角文字列')
            );
            return !hasSpacingError;
          }
        ),
        {numRuns: 100}
      );
    });

    it('should report error for full-width + phrase + full-width (no spaces)', async function() {
      await fc.assert(
        fc.asyncProperty(
          fullWidthStr,
          phrase,
          fullWidthStr,
          async (before, p, after) => {
            const text = `${before}${p}${after}`;
            const messages = await lint(text);
            return messages.some(
              (m) => m.message.includes('スペースを入れる必要があります')
            );
          }
        ),
        {numRuns: 100}
      );
    });

    it('should report error for full-width + space + phrase + full-width (missing trailing)', async function() {
      await fc.assert(
        fc.asyncProperty(
          fullWidthStr,
          phrase,
          fullWidthStr,
          async (before, p, after) => {
            const text = `${before} ${p}${after}`;
            const messages = await lint(text);
            return messages.some(
              (m) => m.message.includes('スペースを入れる必要があります')
            );
          }
        ),
        {numRuns: 100}
      );
    });

    it('should report error for full-width + phrase + space + full-width (missing leading)', async function() {
      await fc.assert(
        fc.asyncProperty(
          fullWidthStr,
          phrase,
          fullWidthStr,
          async (before, p, after) => {
            const text = `${before}${p} ${after}`;
            const messages = await lint(text);
            return messages.some(
              (m) => m.message.includes('スペースを入れる必要があります')
            );
          }
        ),
        {numRuns: 100}
      );
    });
  });

  describe('Property: Only full-width or only half-width', function() {
    it('should not report error for full-width only text', async function() {
      await fc.assert(
        fc.asyncProperty(fullWidthStr, async (text) => {
          const messages = await lint(text);
          return messages.length === 0;
        }),
        {numRuns: 100}
      );
    });

    it('should not report error for half-width only text', async function() {
      await fc.assert(
        fc.asyncProperty(
          fc.array(word, {minLength: 1, maxLength: 5}).map((w) => w.join(' ')),
          async (text) => {
            const messages = await lint(text);
            return messages.length === 0;
          }
        ),
        {numRuns: 100}
      );
    });
  });

  describe('Property: Symbols boundary', function() {
    const symbols = fc.constantFrom(
      '（', '）', '「', '」', '、', '。', '！', '？', '：', '；'
    );

    it('should not report error for symbol + word + full-width', async function() {
      await fc.assert(
        fc.asyncProperty(
          symbols,
          word,
          fullWidthStr,
          async (sym, w, after) => {
            const text = `${sym}${w}${after}`;
            const messages = await lint(text);
            return messages.length === 0;
          }
        ),
        {numRuns: 100}
      );
    });

    it('should not report error for full-width + word + symbol', async function() {
      await fc.assert(
        fc.asyncProperty(
          fullWidthStr,
          word,
          symbols,
          async (before, w, sym) => {
            const text = `${before}${w}${sym}`;
            const messages = await lint(text);
            return messages.length === 0;
          }
        ),
        {numRuns: 100}
      );
    });

    it('should not report error for symbol + phrase + symbol', async function() {
      await fc.assert(
        fc.asyncProperty(
          symbols,
          phrase,
          symbols,
          async (sym1, p, sym2) => {
            const text = `${sym1}${p}${sym2}`;
            const messages = await lint(text);
            return messages.length === 0;
          }
        ),
        {numRuns: 100}
      );
    });
  });

  describe('Property: URL and links', function() {
    const pathSegment = fc.array(halfWidth, {minLength: 1, maxLength: 8})
      .map((arr) => arr.join(''));

    const urlPath = fc.array(pathSegment, {minLength: 1, maxLength: 3})
      .map((parts) => parts.join('/'));

    const domain = fc.constantFrom(
      'example.com', 'test.org', 'sample.net', 'demo.io'
    );

    const url = fc.tuple(domain, urlPath).map(([d, p]) => `https://${d}/${p}`);

    it('should not report error for full-width + space + URL + space + full-width', async function() {
      await fc.assert(
        fc.asyncProperty(
          fullWidthStr,
          url,
          fullWidthStr,
          async (before, u, after) => {
            const text = `${before} ${u} ${after}`;
            const messages = await lint(text);
            return messages.length === 0;
          }
        ),
        {numRuns: 100}
      );
    });

    it('should report error for full-width + URL (no space before)', async function() {
      await fc.assert(
        fc.asyncProperty(
          fullWidthStr,
          url,
          fullWidthStr,
          async (before, u, after) => {
            const text = `${before}${u} ${after}`;
            const messages = await lint(text);
            return messages.some(
              (m) => m.message.includes('スペースを入れる必要があります')
            );
          }
        ),
        {numRuns: 100}
      );
    });

    it('should not report error for markdown link without space', async function() {
      await fc.assert(
        fc.asyncProperty(
          fullWidthStr,
          word,
          url,
          fullWidthStr,
          async (before, linkText, u, after) => {
            const text = `${before}[${linkText}](${u})${after}`;
            const messages = await lint(text);
            return messages.length === 0;
          }
        ),
        {numRuns: 100}
      );
    });

    it('should report error for plain URL without space after', async function() {
      await fc.assert(
        fc.asyncProperty(
          fullWidthStr,
          url,
          fullWidthStr,
          async (before, u, after) => {
            const text = `${before} ${u}${after}`;
            const messages = await lint(text);
            return messages.some(
              (m) => m.message.includes('スペースを入れる必要があります')
            );
          }
        ),
        {numRuns: 100}
      );
    });
  });

  describe('Property: Email addresses', function() {
    const localPart = fc.array(halfWidth, {minLength: 1, maxLength: 8})
      .map((arr) => arr.join(''));

    const emailDomain = fc.constantFrom(
      'example.com', 'test.org', 'sample.co.jp', 'demo.io'
    );

    const email = fc.tuple(localPart, emailDomain)
      .map(([local, domain]) => `${local}@${domain}`);

    it('should not report error for full-width + space + email + space + full-width', async function() {
      await fc.assert(
        fc.asyncProperty(
          fullWidthStr,
          email,
          fullWidthStr,
          async (before, e, after) => {
            const text = `${before} ${e} ${after}`;
            const messages = await lint(text);
            return messages.length === 0;
          }
        ),
        {numRuns: 100}
      );
    });

    it('should report error for full-width + email (no space before)', async function() {
      await fc.assert(
        fc.asyncProperty(
          fullWidthStr,
          email,
          fullWidthStr,
          async (before, e, after) => {
            const text = `${before}${e} ${after}`;
            const messages = await lint(text);
            return messages.some(
              (m) => m.message.includes('スペースを入れる必要があります')
            );
          }
        ),
        {numRuns: 100}
      );
    });

    it('should report error for full-width + email + full-width (no space after)', async function() {
      await fc.assert(
        fc.asyncProperty(
          fullWidthStr,
          email,
          fullWidthStr,
          async (before, e, after) => {
            const text = `${before} ${e}${after}`;
            const messages = await lint(text);
            return messages.some(
              (m) => m.message.includes('スペースを入れる必要があります')
            );
          }
        ),
        {numRuns: 100}
      );
    });
  });
});
