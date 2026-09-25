import assert from 'assert';
import {readFile} from 'fs/promises';
import path from 'path';
import {TextlintKernel} from '@textlint/kernel';
import MarkdownPlugin from '@textlint/textlint-plugin-markdown';
import rule from '../src/index';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

describe('auto-fix through TextlintKernel', function() {
  it('should fix test-input.md into test-expected.md', async function() {
    const inputFilePath = path.join(FIXTURES_DIR, 'test-input.md');
    const input = await readFile(inputFilePath, 'utf8');
    const expected = await readFile(
        path.join(FIXTURES_DIR, 'test-expected.md'), 'utf8');

    const result = await new TextlintKernel().fixText(input, {
      filePath: inputFilePath,
      ext: '.md',
      plugins: [{pluginId: 'markdown', plugin: MarkdownPlugin}],
      rules: [{ruleId: 'ja-space-around-phrase', rule: rule}],
    });

    assert.strictEqual(result.output, expected);
    assert.deepStrictEqual(result.remainingMessages, []);
  });
});
