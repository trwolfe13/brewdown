const rule = state => {
  const blockTokens = state.tokens;

  // Add opening page.
  const pageStart = new state.Token("page_open", "", 0);
  pageStart.level = 0;
  blockTokens.splice(0, 0, pageStart);

  for (let j = 0, l = blockTokens.length; j < l; j++) {
    if (blockTokens[j].type !== "inline" || blockTokens[j].content.indexOf("/page") < 0) {
      continue;
    }

    let htmlLinkLevel = 0;
    let tokens = blockTokens[j].children;

    // We scan from the end, to keep position when new tags added.
    // Use reversed logic in links start/end match
    for (let i = tokens.length - 1; i >= 0; i--) {
      const currentToken = tokens[i];

      // Skip content of markdown links
      if (currentToken.type === "link_close") {
        i--;
        while (tokens[i].level !== currentToken.level && tokens[i].type !== "link_open") { i--; }
        continue;
      }

      // Skip content of html tag links
      if (currentToken.type === "html_inline") {
        if (state.md.utils.isLinkOpen(currentToken.content) && htmlLinkLevel > 0) { htmlLinkLevel--; }
        if (state.md.utils.isLinkClose(currentToken.content)) { htmlLinkLevel++; }
      }

      if (htmlLinkLevel > 0) { continue; }

      if (currentToken.type === "text" && currentToken.content.indexOf("/page") > -1) {
        const nodes = [];
        const parts = currentToken.content.split("/page");
        const level = currentToken.level;
        parts.forEach((part, idx) => {
          const token = new state.Token("text", "", 0);
          token.content = part;
          token.level = level;
          nodes.push(token);

          if (idx < parts.length - 1) {
            const pageClose = new state.Token("page_close", "", 0);
            pageClose.level = level;
            nodes.push(pageClose);

            const pageOpen = new state.Token("page_open", "", 0);
            pageOpen.level = level;
            nodes.push(pageOpen);
          }
        });

        // replace current node
        blockTokens[j].children = tokens = state.md.utils.arrayReplaceAt(tokens, i, nodes);
      }
    }
  }

  // Add closing page.
  const pageEnd = new state.Token("page_close", "", 0);
  pageStart.level = 0;
  blockTokens.splice(blockTokens.length, 0, pageEnd);
};

module.exports = function (md) {
  md.core.ruler.push("page_break", rule);
  md.renderer.rules.page_open = () => "\n<div class=\"page\">\n";
  md.renderer.rules.page_close = () => "\n</div>\n";
};