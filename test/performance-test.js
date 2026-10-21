import assert from 'assert';
import {TextlintKernel} from '@textlint/kernel';
import MarkdownPlugin from '@textlint/textlint-plugin-markdown';
import rule from '../src/index';

// A whitespace run of this length takes several seconds when the half-width
// sequence pattern can start a match at every position inside the run, and
// a few milliseconds when matching is linear in the input length.
const RUN_LENGTH = 100000;
const TIME_LIMIT_MS = 1500;

/**
 * Lints Markdown text with the rule and measures the elapsed time.
 * @param {string} text - Markdown text to lint.
 * @return {Promise<{messages: Array, elapsedMs: number}>} Lint messages and
 *     the time spent linting.
 */
async function timedLint(text) {
  const start = process.hrtime.bigint();
  const result = await new TextlintKernel().lintText(text, {
    filePath: 'test.md',
    ext: '.md',
    plugins: [{pluginId: 'markdown', plugin: MarkdownPlugin}],
    rules: [{ruleId: 'ja-space-around-phrase', rule: rule}],
  });
  const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
  return {messages: result.messages, elapsedMs};
}

describe('performance', function() {
  this.timeout(60000);

  for (const [name, space] of [['spaces', ' '], ['tabs', '\t']]) {
    it(`should lint a long run of ${name} in linear time`, async function() {
      const text = `あ${space.repeat(RUN_LENGTH)}い\n`;
      const {messages, elapsedMs} = await timedLint(text);
      assert.deepStrictEqual(messages, []);
      assert.ok(elapsedMs < TIME_LIMIT_MS,
          `linting took ${elapsedMs.toFixed(0)} ms (limit ${TIME_LIMIT_MS} ms)`);
    });
  }
});
