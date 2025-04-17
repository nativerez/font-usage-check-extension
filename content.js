// Font Usage Analysis Script
function analyzeFontUsage() {
    const fontStyles = {};
    const fontTextExamples = {};
    const textToElement = new Map(); // Map to track unique text and their most specific elements

    // First pass: Collect all texts and their deepest elements (depth-first traversal)
    function processNode(node, depth = 0) {
        // Process children first (deeper nodes)
        for (const child of node.childNodes) {
            processNode(child, depth + 1);
        }

        // Then process current node
        if (node.nodeType === Node.TEXT_NODE) {
            const textContent = node.textContent?.trim();
            if (textContent) {
                const parentElement = node.parentElement;
                if (parentElement) {
                    const existingEntry = textToElement.get(textContent);
                    // Update only if this is deeper or we haven't seen this text
                    if (!existingEntry || depth > existingEntry.depth) {
                        textToElement.set(textContent, {
                            element: parentElement,
                            depth: depth
                        });
                    }
                }
            }
        }
    }

    // Process the entire document
    processNode(document.body);

    // Second pass: Collect font styles
    textToElement.forEach((entry, textContent) => {
        const node = entry.element;
        const computedStyle = window.getComputedStyle(node);
        
        // Skip if not visible
        if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
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
        
        // Add the text content as an example with the element tag (limit length to avoid huge outputs)
        const elementTag = node.tagName.toLowerCase();
        const formattedText = textContent.length <= 50 ? 
            textContent : 
            textContent.substring(0, 47) + '...';
        
        // Store both text and element tag
        fontTextExamples[fontFamily][styleSignature].add(`<${elementTag}> ${formattedText}`);
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
            
            // Add text examples as comments with their element tags
            const examples = Array.from(fontTextExamples[key][rule]).slice(0, 3); // Limit to 3 examples
            if (examples.length > 0) {
                fontOutput += ` /* Text examples: \n`;
                examples.forEach(example => {
                    fontOutput += `    ${example}\n`;
                });
                fontOutput += ` */\n`;
            }
        });
        
        fontOutput += `}`;
        sortedFontStyles.push(fontOutput);
    });

    return sortedFontStyles.join('\n\n');
}

// Return the results of the font analysis to be displayed in popup
return analyzeFontUsage();
