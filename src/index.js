/**
 * @fileoverview Rule to check spacing between full-width and half-width strings
 *
 * Rules:
 * - No space between full-width and single half-width word (e.g., "これはtestです")
 * - Space required between full-width and half-width phrase (e.g., "これは hello world です")
 * - Space required between full-width and plain URL (e.g., "詳細は https://example.com を参照")
 * - Space required between full-width and email (e.g., "メアドは foo@example.com です")
 * - No space required around markdown links (e.g., "これは[リンク](https://example.com)です")
 *
 * Implementation notes:
 * - Markdown parser (textlint-plugin-markdown) auto-detects plain URLs and email addresses
 *   and converts them to Link nodes. The text may include trailing full-width characters
 *   because the parser doesn't correctly detect boundaries with Japanese text.
 *   (e.g., "https://example.comを参照" or "foo@example.comです" becomes a single Link node)
 * - To handle this, extractUrlOrEmail() parses the actual URL/email from the Link node's
 *   text and checks for full-width characters after it.
 * - Markdown links like [text](url) are handled differently - they don't require
 *   surrounding spaces because the brackets provide visual separation.
 * - Str nodes that are children of Link nodes are skipped to avoid duplicate checks.
 */

import {RuleHelper} from 'textlint-rule-helper';

/**
 * Check if a character is full-width
 * @param {string} char - Character to check
 * @return {boolean}
 */
function isFullWidth(char) {
  if (!char) return false;
  const code = char.charCodeAt(0);
  return (
    (code >= 0x3000 && code <= 0x303f) || // CJK Symbols and Punctuation
    (code >= 0x3040 && code <= 0x309f) || // Hiragana
    (code >= 0x30a0 && code <= 0x30ff) || // Katakana
    (code >= 0x4e00 && code <= 0x9fff) || // CJK Unified Ideographs
    (code >= 0xff00 && code <= 0xffef)    // Full-width forms
  );
}

/**
 * Check if a character is a symbol/punctuation
 * @param {string} char - Character to check
 * @return {boolean}
 */
function isSymbol(char) {
  if (!char) return false;
  const symbolPattern = new RegExp([
    '[.,;:!?()\\[\\]{}<>\'"\\`"\\-=+*\\/\\\\|~@#$%^&_]',
    '[¥$€£]',
    '[（）「」『』【】〈〉《》〔〕［］｛｝〝〟≪≫]',
    '[、。！？：；・…‥〜～※]',
    '[→←↑↓⇒⇐⇔]',
    '[●○◎◆◇■□▲△▼▽★☆]',
    '[×÷±]',
    '[°′″®™©§¶〒♪♫]',
  ].join('|'));
  return symbolPattern.test(char);
}

/**
 * Check if a string is a URL
 * Matches any scheme with alphabets and + (e.g., http, https, ftp, file, git+https)
 * @param {string} str - String to check
 * @return {boolean}
 */
function isUrl(str) {
  return /^[a-zA-Z][a-zA-Z+]*:\/\//.test(str);
}

/**
 * Check if a string is an email address
 * @param {string} str - String to check
 * @return {boolean}
 */
function isEmail(str) {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(str);
}

/**
 * Find all half-width sequences with their boundaries
 * @param {string} text - Text to analyze
 * @return {Array<Object>} Array of sequence objects
 */
function findHalfWidthSequences(text) {
  const sequences = [];
  const regex =
    /\s*[a-zA-Z0-9][a-zA-Z0-9\s.:/?#&=_%+@-]*[a-zA-Z0-9]\s*|\s*[a-zA-Z0-9]\s*/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];
    const trimmed = raw.trim();
    if (!trimmed) continue;

    const leadingSpaces = raw.length - raw.trimStart().length;
    const trailingSpaces = raw.length - raw.trimEnd().length;

    sequences.push({
      text: trimmed,
      start: match.index + leadingSpaces,
      end: match.index + raw.length - trailingSpaces,
      rawStart: match.index,
      rawEnd: match.index + raw.length,
      isPhrase: /\s/.test(trimmed) || isUrl(trimmed) || isEmail(trimmed),
      hasLeadingSpace: leadingSpaces > 0,
      hasTrailingSpace: trailingSpaces > 0,
    });
  }

  return sequences;
}

/**
 * Check spacing at a boundary between full-width and half-width
 * @param {Object} params - Check parameters
 * @return {Object|null} Error object or null
 */
function checkBoundary({text, seq, position}) {
  const {isPhrase, hasLeadingSpace, hasTrailingSpace} = seq;

  if (position === 'before') {
    const checkIndex = seq.rawStart - 1;
    if (checkIndex < 0) return null;
    const charBefore = text[checkIndex];
    if (!isFullWidth(charBefore) || isSymbol(charBefore)) return null;

    if (isPhrase && !hasLeadingSpace) {
      const preview = seq.text.substring(0, 10);
      return {
        hasError: true,
        message: '全角文字とスペースを含む半角文字列の間にはスペースを入れる必要があります: ' +
          '"' + charBefore + preview + '..."',
        index: seq.start,
      };
    }
    if (!isPhrase && hasLeadingSpace) {
      return {
        hasError: true,
        message: '全角文字とスペースを含まない半角文字列の間にはスペースを入れないでください: ' +
          '"' + charBefore + ' ' + seq.text + '"',
        index: seq.rawStart,
      };
    }
  }

  if (position === 'after') {
    const checkIndex = seq.rawEnd;
    if (checkIndex >= text.length) return null;
    const charAfter = text[checkIndex];
    if (!isFullWidth(charAfter) || isSymbol(charAfter)) return null;

    if (isPhrase && !hasTrailingSpace) {
      const preview = seq.text.substring(seq.text.length - 10);
      return {
        hasError: true,
        message: '全角文字とスペースを含む半角文字列の間にはスペースを入れる必要があります: ' +
          '"...' + preview + charAfter + '"',
        index: seq.end,
      };
    }
    if (!isPhrase && hasTrailingSpace) {
      return {
        hasError: true,
        message: '全角文字とスペースを含まない半角文字列の間にはスペースを入れないでください: ' +
          '"' + seq.text + ' ' + charAfter + '"',
        index: seq.end,
      };
    }
  }

  return null;
}

/**
 * Check if a Link node is a plain URL/email (auto-link) vs markdown link
 * @param {string} source - Source text of the node
 * @return {boolean}
 */
function isAutoLink(source) {
  return !source.startsWith('[');
}

/**
 * Extract URL or email from text that may contain trailing non-URL characters
 * @param {string} text - Text that starts with URL or email
 * @return {Object} Object with content, trailing text, and type
 */
function extractUrlOrEmail(text) {
  // Try URL first
  const urlPattern = /^([a-zA-Z][a-zA-Z+]*:\/\/[a-zA-Z0-9\-._~:/?#\[\]@!'()*+,;=%]+)/;
  const urlMatch = text.match(urlPattern);
  if (urlMatch) {
    return {
      content: urlMatch[1],
      trailing: text.slice(urlMatch[1].length),
      type: 'url',
    };
  }

  // Try email
  const emailPattern = /^([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
  const emailMatch = text.match(emailPattern);
  if (emailMatch) {
    return {
      content: emailMatch[1],
      trailing: text.slice(emailMatch[1].length),
      type: 'email',
    };
  }

  return {content: text, trailing: '', type: 'unknown'};
}

/**
 * textlint rule reporter function
 * @param {import('@textlint/types').TextlintRuleContext} context
 * @return {Object} Rule handlers
 */
export function reporter(context) {
  const {Syntax, RuleError, report, getSource, locator} = context;
  const helper = new RuleHelper(context);

  return {
    [Syntax.Link](node) {
      const parent = node.parent;
      if (!parent) return;

      const source = getSource(node);
      if (!isAutoLink(source)) return;

      const parentText = getSource(parent);
      const linkStart = node.range[0] - parent.range[0];

      // Check before link
      if (linkStart > 0) {
        const beforeChar = parentText[linkStart - 1];
        if (isFullWidth(beforeChar) && !isSymbol(beforeChar)) {
          const {type} = extractUrlOrEmail(source);
          const label = type === 'email' ? 'メールアドレス' : 'URL';
          report(parent, new RuleError(
            '全角文字と' + label + 'の間にはスペースを入れる必要があります',
            {padding: locator.at(linkStart)}
          ));
        }
      }

      // Check after link
      const linkEnd = node.range[1] - parent.range[0];
      const {content, trailing, type} = extractUrlOrEmail(source);

      // Case 1: Parser included trailing chars in Link node
      if (trailing.length > 0) {
        const firstTrailingChar = trailing[0];
        if (isFullWidth(firstTrailingChar) && !isSymbol(firstTrailingChar)) {
          const label = type === 'email' ? 'メールアドレス' : 'URL';
          report(node, new RuleError(
            label + 'と全角文字の間にはスペースを入れる必要があります',
            {padding: locator.at(content.length)}
          ));
        }
      } else if (linkEnd < parentText.length) {
        // Case 2: Parser correctly separated, check char after Link node
        const afterChar = parentText[linkEnd];
        if (isFullWidth(afterChar) && !isSymbol(afterChar)) {
          const label = type === 'email' ? 'メールアドレス' : 'URL';
          report(parent, new RuleError(
            label + 'と全角文字の間にはスペースを入れる必要があります',
            {padding: locator.at(linkEnd)}
          ));
        }
      }
    },

    [Syntax.Str](node) {
      const skipNodes = [
        Syntax.Link,
        Syntax.Image,
        Syntax.BlockQuote,
        Syntax.Code,
        Syntax.Header,
      ];
      if (helper.isChildNode(node, skipNodes)) return;

      const text = getSource(node);
      const sequences = findHalfWidthSequences(text);

      for (const seq of sequences) {
        if (seq.rawStart > 0 && isSymbol(text[seq.rawStart - 1])) continue;

        const beforeError = checkBoundary({text, seq, position: 'before'});
        if (beforeError) {
          report(node, new RuleError(beforeError.message, {
            padding: locator.at(beforeError.index),
          }));
        }

        const afterError = checkBoundary({text, seq, position: 'after'});
        if (afterError) {
          report(node, new RuleError(afterError.message, {
            padding: locator.at(afterError.index),
          }));
        }
      }
    },
  };
}

export default reporter;
