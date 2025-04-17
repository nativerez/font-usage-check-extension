// Using the Script in DevTools
// 1. Open DevTools: Right-click on your webpage and select ‘Inspect’ or press Ctrl+Shift+I (Windows/Linux) or Cmd+Opt+I (Mac) to open DevTools.
// 2. Navigate to Console: Click on the ‘Console’ tab. This is where we will be working.
// 3. Copy and Paste the Script: Below is the JavaScript snippet. Copy it.

(() => {
    const fontStyles = {};

    document.querySelectorAll('*').forEach(node => {
        const computedStyle = window.getComputedStyle(node);

        const fontSize = `${parseFloat(computedStyle.getPropertyValue('font-size'))}px`;
        const fontFamily = computedStyle.getPropertyValue('font-family'); // Preserve full font list
        const fontWeight = computedStyle.getPropertyValue('font-weight');
        const lineHeight = computedStyle.getPropertyValue('line-height');

        if (!fontStyles[fontFamily]) {
            fontStyles[fontFamily] = new Set();
        }

        fontStyles[fontFamily].add(`font-size: ${fontSize}; font-weight: ${fontWeight}; line-height: ${lineHeight};`);
    });

    const sortedFontStyles = [];

    Object.keys(fontStyles).sort().forEach(key => {
        const rules = Array.from(fontStyles[key]).sort((a, b) => a.localeCompare(b)); // Sort alphabetically
        const className = CSS.escape(key).replace(/\s+/g, '-').toLowerCase(); // Safe CSS class name

        sortedFontStyles.push(`.font-family-${className} {\n font-family: '${key}';\n ${rules.join('\n ')}\n}`);
    });

    const output = sortedFontStyles.join('\n\n');

    console.log("%cExtracted Font Styles:", "color: cyan; font-weight: bold;");
    console.log(output);

    return output;
})();