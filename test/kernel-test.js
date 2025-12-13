const { TextlintKernel } = require('@textlint/kernel');
const rule = require('../lib/index.js');
const fs = require('fs');
const path = require('path');

/**
 * Test the rule using textlint kernel directly
 * This is useful for testing auto-fix functionality
 */
async function testRuleWithKernel() {
  try {
    const kernel = new TextlintKernel();
    
    // Read test input from external file
    const inputFilePath = path.join(__dirname, 'fixtures', 'test-input.md');
    const expectedFilePath = path.join(__dirname, 'fixtures', 'test-expected.md');
    
    const testText = fs.readFileSync(inputFilePath, 'utf8');
    const expectedText = fs.readFileSync(expectedFilePath, 'utf8');
    
    const options = {
      filePath: inputFilePath,
      ext: '.md',
      plugins: [
        {
          pluginId: 'markdown',
          plugin: require('@textlint/textlint-plugin-markdown').default
        }
      ],
      rules: [
        {
          ruleId: 'ja-space-around-phrase',
          rule: rule.default
        }
      ]
    };

    console.log('Original text:');
    console.log('---');
    console.log(testText);
    console.log('---\n');

    // Test linting
    const lintResults = await kernel.lintText(testText, options);
    
    console.log('Lint Results:');
    if (lintResults.messages.length > 0) {
      console.log(`Found ${lintResults.messages.length} errors:`);
      lintResults.messages.forEach((message, index) => {
        console.log(`${index + 1}. ${message.message} (line ${message.line}, column ${message.column})`);
      });
      
      // Test auto-fix functionality
      console.log('\n--- Testing Auto-Fix ---');
      const fixResults = await kernel.fixText(testText, options);
      console.log('Fixed text:');
      console.log('---');
      console.log(fixResults.output);
      console.log('---');
      
      console.log(`\nApplied ${fixResults.applyingMessages.length} fixes`);
      console.log(`Remaining ${fixResults.remainingMessages.length} errors`);
      
      // Compare with expected result
      console.log('\n--- Comparing with Expected Result ---');
      if (fixResults.output === expectedText) {
        console.log('✅ Fixed text matches expected result');
      } else {
        console.log('❌ Fixed text does not match expected result');
        console.log('\nExpected:');
        console.log('---');
        console.log(expectedText);
        console.log('---');
        console.log('\nActual:');
        console.log('---');
        console.log(fixResults.output);
        console.log('---');
      }
      
      if (fixResults.remainingMessages.length > 0) {
        console.log('\nRemaining errors:');
        fixResults.remainingMessages.forEach((message, index) => {
          console.log(`${index + 1}. ${message.message}`);
        });
      }
    } else {
      console.log('No errors found.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testRuleWithKernel();
}

module.exports = { testRuleWithKernel };
