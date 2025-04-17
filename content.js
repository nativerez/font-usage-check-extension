// Font Usage Analysis Script
function analyzeFontUsage() {
    const fontData = [];
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
        const elementTag = node.tagName.toLowerCase();
        
        // Format text example (limit length to avoid huge outputs)
        const formattedText = textContent.length <= 50 ? 
            textContent : 
            textContent.substring(0, 47) + '...';
        
        // Add as structured data
        fontData.push({
            fontFamily,
            fontSize,
            fontWeight,
            lineHeight,
            elementTag,
            textExample: formattedText
        });
    });

    return fontData;
}

// Return the results of the font analysis to be displayed in popup
return analyzeFontUsage();
