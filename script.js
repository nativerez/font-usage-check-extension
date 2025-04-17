// Using the Script in DevTools
// 1. Open DevTools: Right-click on your webpage and select 'Inspect' or press Ctrl+Shift+I (Windows/Linux) or Cmd+Opt+I (Mac) to open DevTools.
// 2. Navigate to Console: Click on the 'Console' tab. This is where we will be working.
// 3. Copy and Paste the Script: Below is the JavaScript snippet. Copy it.

(() => {
    const fontStyles = {};
    const fontTextExamples = {};

    document.querySelectorAll('*').forEach(node => {
        const computedStyle = window.getComputedStyle(node);
        
        // Skip elements with no text content or that are not visible
        const textContent = node.textContent?.trim();
        if (!textContent || computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
            return;
        }
        
        const fontSize = `${parseFloat(computedStyle.getPropertyValue('font-size'))}px`;
        const fontFamily = computedStyle.getPropertyValue('font-family'); // Preserve full font list
        const fontWeight = computedStyle.getPropertyValue('font-weight');
        const lineHeight = computedStyle.getPropertyValue('line-height');
        
        // Create a style signature to group by
        const styleSignature = `font-size: ${fontSize}; font-weight: ${fontWeight}; line-height: ${lineHeight};`;

        if (!fontStyles[fontFamily]) {
            fontStyles[fontFamily] = new Set();
            fontTextExamples[fontFamily] = {};
        }

        fontStyles[fontFamily].add(styleSignature);
        
        // Store text examples for each style combination
        if (!fontTextExamples[fontFamily][styleSignature]) {
            fontTextExamples[fontFamily][styleSignature] = new Set();
        }
        
        // Add the text content as an example (limit length to avoid huge outputs)
        if (textContent.length <= 50) {
            fontTextExamples[fontFamily][styleSignature].add(textContent);
        } else {
            fontTextExamples[fontFamily][styleSignature].add(textContent.substring(0, 47) + '...');
        }
    });

    const sortedFontStyles = [];

    Object.keys(fontStyles).sort().forEach(key => {
        const rules = Array.from(fontStyles[key]).sort((a, b) => a.localeCompare(b)); // Sort alphabetically
        const className = CSS.escape(key).replace(/\s+/g, '-').toLowerCase(); // Safe CSS class name
        
        // Start with font family CSS
        let fontOutput = `.font-family-${className} {\n font-family: '${key}';\n`;
        
        // For each style combination, add the style and text examples
        rules.forEach(rule => {
            fontOutput += ` ${rule}\n`;
            
            // Add text examples as comments
            const examples = Array.from(fontTextExamples[key][rule]).slice(0, 3); // Limit to 3 examples
            if (examples.length > 0) {
                fontOutput += ` /* Text examples: \n`;
                examples.forEach(example => {
                    fontOutput += `    "${example}"\n`;
                });
                fontOutput += ` */\n`;
            }
        });
        
        fontOutput += `}`;
        sortedFontStyles.push(fontOutput);
    });

    const output = sortedFontStyles.join('\n\n');

    console.log("%cExtracted Font Styles with Text Examples:", "color: cyan; font-weight: bold;");
    console.log(output);

    return output;
})();