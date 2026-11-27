/**
 * Loads the textlint Markdown plugin.
 *
 * The plugin is ESM, and textlint-tester starts an `import()` of it while
 * example-test.js registers its cases. textlint-scripts' Babel setup compiles
 * a static import to `require()`, which throws ERR_REQUIRE_ESM_RACE_CONDITION
 * when that load is still in flight; a native `import()` waits for it instead.
 * @return {Promise<Object>} The plugin.
 */
export async function loadMarkdownPlugin() {
  const {default: plugin} = await import('@textlint/textlint-plugin-markdown');
  return plugin;
}
