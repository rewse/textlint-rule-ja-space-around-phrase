/**
 * @fileoverview Rule to check spacing between full-width and half-width strings
 *
 * Rules:
 * - No space between full-width and single half-width word (e.g., "これはtestです")
 * - Space required between full-width and half-width phrase (e.g., "これは hello world です")
 * - Space required between full-width and plain URL (e.g., "詳細は https://example.com を参照")
 * - Space required between full-width and email (e.g., "メアドは foo@example.com です")
 * - No space required around markdown links (e.g., "これは[リンク](https://example.com)です")
 * - A boundary next to a full-width symbol is not checked (e.g., "「hello world」")
 *
 * Implementation notes:
 * - Only ASCII spaces and tabs count as boundary spaces. A line break or an
 *   ideographic space (U+3000) is a separator on its own, so the boundary next
 *   to it is not checked and the fixer never joins lines.
 * - Markdown parser (textlint-plugin-markdown) auto-detects plain URLs and email addresses
 *   and converts them to Link nodes. The text may include trailing full-width characters
 *   because the parser doesn't correctly detect boundaries with Japanese text.
 *   (e.g., "https://example.comを参照" or "foo@example.comです" becomes a single Link node)
 * - To handle this, extractUrlOrEmail() parses the actual URL/email from the Link node's
 *   text and checks for full-width characters after it.
 * - Markdown links like [text](url) and <url> are handled differently - they don't
 *   require surrounding spaces because the brackets provide visual separation.
 * - Str nodes that are children of Link nodes are skipped to avoid duplicate checks.
 */

import {RuleHelper} from 'textlint-rule-helper';

const PHRASE_MESSAGE =
  '全角文字とスペースを含む半角文字列の間にはスペースを入れる必要があります';
const WORD_MESSAGE =
  '全角文字とスペースを含まない半角文字列の間にはスペースを入れないでください';

/**
 * Code point ranges treated as full-width. Half-width katakana (U+FF61-U+FF9F)
 * and the ideographic space (U+3000) are deliberately excluded.
 */
const FULL_WIDTH_RANGES = Object.freeze([
  [0x3001, 0x303f], // CJK Symbols and Punctuation
  [0x3040, 0x309f], // Hiragana
  [0x30a0, 0x30ff], // Katakana
  [0x3400, 0x4dbf], // CJK Unified Ideographs Extension A
  [0x4e00, 0x9fff], // CJK Unified Ideographs
  [0xf900, 0xfaff], // CJK Compatibility Ideographs
  [0xff01, 0xff60], // Fullwidth ASCII variants
  [0xffe0, 0xffe6], // Fullwidth signs
  [0x20000, 0x3ffff], // CJK Unified Ideographs Extension B and later
]);

/**
 * Full-width symbols whose adjacent boundary is not checked. Only full-width
 * characters need listing, because a boundary next to any other character is
 * never checked.
 */
const FULL_WIDTH_SYMBOLS = new Set(
    '（）「」『』【】〈〉《》〔〕［］｛｝〝〟、。！？：；・〜～');

/**
 * A half-width sequence starts and ends with an ASCII letter or digit and may
 * contain any printable ASCII in between. Surrounding spaces are captured so
 * that the boundary spacing can be inspected.
 */
const HALF_WIDTH_SEQUENCE =
  /[ \t]*[a-zA-Z0-9](?:[\x20-\x7e\t]*[a-zA-Z0-9])?[ \t]*/g;

const BOUNDARY_SPACE = /[ \t]/;

// Any scheme made of letters and "+" (e.g., http, https, ftp, git+https).
const URL_PREFIX = /^[a-zA-Z][a-zA-Z+]*:\/\/[a-zA-Z0-9\-._~:/?#[\]@!'()*+,;=%]+/;
const EMAIL_PREFIX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const EMAIL_EXACT = new RegExp(`${EMAIL_PREFIX.source}$`);

/**
 * Returns the full character (code point) that starts at the given index.
 * @param {string} text - Text to read.
 * @param {number} index - UTF-16 index of the character.
 * @return {string} The character, or an empty string when out of range.
 */
function charAt(text, index) {
  const codePoint = text.codePointAt(index);
  return codePoint === undefined ? '' : String.fromCodePoint(codePoint);
}

/**
 * Returns the full character (code point) that ends right before the index.
 * @param {string} text - Text to read.
 * @param {number} index - UTF-16 index right after the character.
 * @return {string} The character, or an empty string when out of range.
 */
function charBefore(text, index) {
  if (index <= 0) {
    return '';
  }
  const last = text.charCodeAt(index - 1);
  const isLowSurrogate = last >= 0xdc00 && last <= 0xdfff;
  return charAt(text, isLowSurrogate && index >= 2 ? index - 2 : index - 1);
}

/**
 * Checks whether a character is full-width.
 * @param {string} char - Character to check.
 * @return {boolean}
 */
function isFullWidth(char) {
  if (!char) {
    return false;
  }
  const codePoint = char.codePointAt(0);
  return FULL_WIDTH_RANGES.some(
      ([start, end]) => codePoint >= start && codePoint <= end);
}

/**
 * Checks whether a boundary next to the character is subject to spacing rules,
 * that is, whether the character is full-width and not a symbol.
 * @param {string} char - Character adjacent to a half-width string.
 * @return {boolean}
 */
function isSpacingTarget(char) {
  return isFullWidth(char) && !FULL_WIDTH_SYMBOLS.has(char);
}

/**
 * Finds all half-width sequences with their boundaries.
 * @param {string} text - Text to analyze.
 * @return {!Array<!Object>} Sequence objects.
 */
function findHalfWidthSequences(text) {
  const sequences = [];
  for (const match of text.matchAll(HALF_WIDTH_SEQUENCE)) {
    const raw = match[0];
    const trimmed = raw.replace(/^[ \t]+|[ \t]+$/g, '');
    const leadingSpaces = raw.indexOf(trimmed);
    const trailingSpaces = raw.length - leadingSpaces - trimmed.length;

    sequences.push({
      text: trimmed,
      start: match.index + leadingSpaces,
      end: match.index + leadingSpaces + trimmed.length,
      rawStart: match.index,
      rawEnd: match.index + raw.length,
      isPhrase: BOUNDARY_SPACE.test(trimmed) || URL_PREFIX.test(trimmed) ||
        EMAIL_EXACT.test(trimmed),
      hasLeadingSpace: leadingSpaces > 0,
      hasTrailingSpace: trailingSpaces > 0,
    });
  }
  return sequences;
}

/**
 * Checks the boundary between a sequence and the character before it.
 * @param {string} text - Text containing the sequence.
 * @param {!Object} seq - Sequence from findHalfWidthSequences().
 * @return {?Object} Error with message, index, fix range and replacement.
 */
function checkBefore(text, seq) {
  const neighbor = charBefore(text, seq.rawStart);
  if (!isSpacingTarget(neighbor)) {
    return null;
  }
  if (seq.isPhrase && !seq.hasLeadingSpace) {
    return {
      message: `${PHRASE_MESSAGE}: "${neighbor}${seq.text.slice(0, 10)}..."`,
      index: seq.start,
      range: [seq.start, seq.start],
      replacement: ' ',
    };
  }
  if (!seq.isPhrase && seq.hasLeadingSpace) {
    return {
      message: `${WORD_MESSAGE}: "${neighbor} ${seq.text}"`,
      index: seq.rawStart,
      range: [seq.rawStart, seq.start],
      replacement: '',
    };
  }
  return null;
}

/**
 * Checks the boundary between a sequence and the character after it.
 * @param {string} text - Text containing the sequence.
 * @param {!Object} seq - Sequence from findHalfWidthSequences().
 * @return {?Object} Error with message, index, fix range and replacement.
 */
function checkAfter(text, seq) {
  const neighbor = charAt(text, seq.rawEnd);
  if (!isSpacingTarget(neighbor)) {
    return null;
  }
  if (seq.isPhrase && !seq.hasTrailingSpace) {
    return {
      message: `${PHRASE_MESSAGE}: "...${seq.text.slice(-10)}${neighbor}"`,
      index: seq.end,
      range: [seq.end, seq.end],
      replacement: ' ',
    };
  }
  if (!seq.isPhrase && seq.hasTrailingSpace) {
    return {
      message: `${WORD_MESSAGE}: "${seq.text} ${neighbor}"`,
      index: seq.end,
      range: [seq.end, seq.rawEnd],
      replacement: '',
    };
  }
  return null;
}

/**
 * Checks whether a Link node is a plain URL/email (bare auto-link) rather
 * than a bracketed link such as [text](url) or <url>.
 * @param {string} source - Source text of the Link node.
 * @param {string} parentText - Source text of the parent node.
 * @param {number} linkStart - Start of the Link node within parentText.
 * @return {boolean}
 */
function isBareAutoLink(source, parentText, linkStart) {
  if (source.startsWith('[') || source.startsWith('<')) {
    return false;
  }
  return parentText.slice(Math.max(0, linkStart - 2), linkStart) !== '](';
}

/**
 * Extracts a URL or email from text that may contain trailing characters.
 * @param {string} text - Text that starts with a URL or email.
 * @return {{content: string, trailing: string, type: string}}
 */
function extractUrlOrEmail(text) {
  const patterns = [['url', URL_PREFIX], ['email', EMAIL_PREFIX]];
  for (const [type, pattern] of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        content: match[0],
        trailing: text.slice(match[0].length),
        type,
      };
    }
  }
  return {content: text, trailing: '', type: 'unknown'};
}

/**
 * textlint rule reporter function.
 * @param {import('@textlint/types').TextlintRuleContext} context
 * @return {!Object} Rule handlers.
 */
export function reporter(context) {
  const {Syntax, RuleError, report, getSource, locator, fixer} = context;
  const helper = new RuleHelper(context);
  // Descendants of these nodes are not checked.
  const skippedNodeTypes = [
    Syntax.BlockQuote,
    Syntax.Code,
    Syntax.Header,
    Syntax.Image,
    Syntax.Link,
  ];

  /**
   * Reports a missing space at the given index of a node.
   * @param {!Object} node - Node to report on.
   * @param {number} index - Index within the node's source.
   * @param {string} message - Error message.
   */
  const reportMissingSpace = (node, index, message) => {
    report(node, new RuleError(message, {
      padding: locator.at(index),
      fix: fixer.replaceTextRange([index, index], ' '),
    }));
  };

  return {
    [Syntax.Link](node) {
      const parent = node.parent;
      if (!parent || helper.isChildNode(node, skippedNodeTypes)) {
        return;
      }

      const source = getSource(node);
      const parentText = getSource(parent);
      const linkStart = node.range[0] - parent.range[0];
      const linkEnd = node.range[1] - parent.range[0];
      if (!isBareAutoLink(source, parentText, linkStart)) {
        return;
      }

      const {content, trailing, type} = extractUrlOrEmail(source);
      const label = type === 'email' ? 'メールアドレス' : 'URL';
      const afterMessage = `${label}と全角文字の間にはスペースを入れる必要があります`;

      if (isSpacingTarget(charBefore(parentText, linkStart))) {
        reportMissingSpace(parent, linkStart,
            `全角文字と${label}の間にはスペースを入れる必要があります`);
      }

      if (trailing) {
        // The parser included the trailing characters in the Link node.
        if (isSpacingTarget(charAt(trailing, 0))) {
          reportMissingSpace(node, content.length, afterMessage);
        }
      } else if (isSpacingTarget(charAt(parentText, linkEnd))) {
        reportMissingSpace(parent, linkEnd, afterMessage);
      }
    },

    [Syntax.Str](node) {
      if (helper.isChildNode(node, skippedNodeTypes)) {
        return;
      }

      const text = getSource(node);
      for (const seq of findHalfWidthSequences(text)) {
        for (const error of [checkBefore(text, seq), checkAfter(text, seq)]) {
          if (error) {
            report(node, new RuleError(error.message, {
              padding: locator.at(error.index),
              fix: fixer.replaceTextRange(error.range, error.replacement),
            }));
          }
        }
      }
    },
  };
}

export default {
  linter: reporter,
  fixer: reporter,
};
