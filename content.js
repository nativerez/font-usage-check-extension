// Font Usage Analysis Script
(function() {
    // Create a mapping to store references to analyzed elements by unique ID
    window.fontUsageElements = {};
    let elementIdCounter = 1;

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
                    
                    // Assign a unique ID to this element for later reference
                    const elementId = `font-element-${elementIdCounter++}`;
                    window.fontUsageElements[elementId] = node;
                    
                    // Add as structured data
                    fontData.push({
                        fontFamily,
                        fontSize,
                        fontWeight,
                        lineHeight,
                        elementTag,
                        textExample: formattedText,
                        elementId // Add the element ID to the data
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
                        
                        // Assign a unique ID to this element for later reference
                        const elementId = `font-element-${elementIdCounter++}`;
                        window.fontUsageElements[elementId] = element;
                        
                        fontData.push({
                            fontFamily,
                            fontSize,
                            fontWeight,
                            lineHeight,
                            elementTag,
                            textExample: formattedText,
                            elementId // Add the element ID to the data
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
                textExample: "Error analyzing fonts: " + error.message,
                elementId: null
            }];
        }
    }

    // Add message listener to handle element highlighting
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === "highlightElement") {
            const element = window.fontUsageElements[message.elementId];
            if (element) {
                // Store original outline
                const originalOutline = element.style.outline;
                const originalZIndex = element.style.zIndex;
                const originalPosition = element.style.position;
                
                // Apply highlight
                element.style.outline = "2px solid red";
                element.style.zIndex = "9999";
                
                // If the element is static, make it relative to ensure z-index works
                if (getComputedStyle(element).position === 'static') {
                    element.style.position = "relative";
                }
                
                sendResponse({success: true});
                
                // Record that we're highlighting this element
                window.currentlyHighlighted = {
                    element,
                    originalOutline,
                    originalZIndex,
                    originalPosition
                };
            } else {
                sendResponse({success: false, error: "Element not found"});
            }
            return true; // Required for async response
        }
        
        else if (message.action === "removeHighlight") {
            if (window.currentlyHighlighted) {
                const { element, originalOutline, originalZIndex, originalPosition } = window.currentlyHighlighted;
                
                // Restore original styles
                element.style.outline = originalOutline;
                element.style.zIndex = originalZIndex;
                element.style.position = originalPosition;
                
                window.currentlyHighlighted = null;
                sendResponse({success: true});
            } else {
                sendResponse({success: false, error: "No element currently highlighted"});
            }
            return true; // Required for async response
        }
    });
    
    // Analyze and return the results
    return analyzeFontUsage();
})();
