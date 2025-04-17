// Font Usage Analysis Script
(function() {
    function analyzeFontUsage() {
        const fontData = [];
        const textToElement = new Map(); // Map to track unique text and their most specific elements
    
        // First pass: Collect all texts and their deepest elements (depth-first traversal)
        function processNode(node, depth = 0) {
            if (!node) return;
            
            // Process children first (deeper nodes)
            if (node.childNodes) {
                for (let i = 0; i < node.childNodes.length; i++) {
                    processNode(node.childNodes[i], depth + 1);
                }
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
    
        try {
            // Process the entire document
            processNode(document.body);
            
            // Debugging - log how many text elements we found
            console.log(`Found ${textToElement.size} text elements to analyze`);
    
            // Second pass: Collect font styles
            textToElement.forEach((entry, textContent) => {
                try {
                    const node = entry.element;
                    if (!node) return;
                    
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
                } catch (err) {
                    console.error("Error processing a text element:", err);
                }
            });
            
            console.log(`Collected ${fontData.length} font data entries`);
            
            // Make sure we have data
            if (fontData.length === 0) {
                // Fallback: collect at least some font data from visible elements
                const allElements = document.querySelectorAll('body *');
                console.log(`Fallback: scanning ${allElements.length} DOM elements`);
                
                for (let i = 0; i < Math.min(allElements.length, 100); i++) {
                    const element = allElements[i];
                    const textContent = element.textContent?.trim();
                    
                    if (textContent && textContent.length > 0) {
                        const computedStyle = window.getComputedStyle(element);
                        
                        // Skip if not visible
                        if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
                            continue;
                        }
                        
                        const fontSize = `${parseFloat(computedStyle.getPropertyValue('font-size'))}px`;
                        const fontFamily = computedStyle.getPropertyValue('font-family');
                        const fontWeight = computedStyle.getPropertyValue('font-weight');
                        const lineHeight = computedStyle.getPropertyValue('line-height');
                        const elementTag = element.tagName.toLowerCase();
                        
                        // Format text example
                        const formattedText = textContent.length <= 50 ? 
                            textContent : 
                            textContent.substring(0, 47) + '...';
                        
                        fontData.push({
                            fontFamily,
                            fontSize,
                            fontWeight,
                            lineHeight,
                            elementTag,
                            textExample: formattedText
                        });
                    }
                }
            }
            
            return fontData;
        } catch (error) {
            console.error("Error in font analysis:", error);
            // Return minimal data to prevent "No font data found" error
            return [{
                fontFamily: "Error occurred",
                fontSize: "-",
                fontWeight: "-",
                lineHeight: "-",
                elementTag: "-",
                textExample: "Error analyzing fonts: " + error.message
            }];
        }
    }
    
    // Analyze and return the results
    return analyzeFontUsage();
})();
