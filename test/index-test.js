import TextLintTester from "textlint-tester";
import rule from "../src/index";

const tester = new TextLintTester();
// ruleName, rule, { valid, invalid }
tester.run("ja-space-around-phrase", rule, {
    valid: [
        // No space needed for single half-width words
        "これはtestです",
        "日本語textを含む",
        
        // Space required for phrases (multi-word half-width strings)
        "これは hello world です",
        "日本語 test case を含む",
        
        // URLs should have spaces
        "詳細は https://example.com を参照",
        
        // Only full-width or only half-width
        "これは日本語です",
        "This is English text",
        
        // Symbols - no space check before/after symbols
        "（test）は正しい",
        "（ test ）は正しい",
        "。testは正しい",
        "。 test は正しい",
        "！testは正しい",
        "（hello world）と書く",
        "「hello world」と書く",
        "、hello worldと書く",
        "？hello worldと書く",
        
        // Colon followed by single word - no space needed
        "Node.js: CommonJSモジュール",
        "- Node.js: CommonJSモジュール",
        "例: testを実行",
        "注意: warningが出る"
    ],
    invalid: [
        // Missing space before and after phrase
        {
            text: "これはhello worldです",
            errors: [
                {
                    message: "全角文字とスペースを含む半角文字列の間にはスペースを入れる必要があります: \"はhello worl...\"",
                },
                {
                    message: "全角文字とスペースを含む半角文字列の間にはスペースを入れる必要があります: \"...ello worldで\"",
                }
            ]
        },
        // Missing space after phrase
        {
            text: "これは hello worldです",
            errors: [
                {
                    message: "全角文字とスペースを含む半角文字列の間にはスペースを入れる必要があります: \"...ello worldで\"",
                }
            ]
        },
        // Unnecessary space before single word
        {
            text: "これは testです",
            errors: [
                {
                    message: "全角文字とスペースを含まない半角文字列の間にはスペースを入れないでください: \"は test\"",
                }
            ]
        },
        // Unnecessary space after single word
        {
            text: "これはtest です",
            errors: [
                {
                    message: "全角文字とスペースを含まない半角文字列の間にはスペースを入れないでください: \"test で\"",
                }
            ]
        },

    ]
});
