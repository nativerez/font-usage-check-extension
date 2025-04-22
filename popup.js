// Add tab switching functionality
document.querySelectorAll('.tab-button').forEach(tab => {
  tab.addEventListener('click', () => {
    // Remove active class from all tabs and content
    document.querySelectorAll('.tab-button').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Add active class to clicked tab and corresponding content
    tab.classList.add('active');
    const tabId = tab.dataset.tab;
    document.getElementById(tabId).classList.add('active');
  });
});

document.getElementById('analyze-btn').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  const detailResultDiv = document.getElementById('detail-result');
  const summaryResultDiv = document.getElementById('summary-result');
  const copyBtn = document.getElementById('copy-btn');
  const tabContainer = document.getElementById('tab-container');
  
  statusDiv.textContent = 'Analyzing fonts...';
  detailResultDiv.textContent = '';
  summaryResultDiv.textContent = '';
  copyBtn.style.display = 'none';
  
  try {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Get the state of the include hidden elements toggle
    const includeHidden = document.getElementById('include-hidden').checked;
    
    // First inject the function with the includeHidden parameter
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (includeHidden) => {
        // Store the preference on the window object so content.js can access it
        window.fontAnalysisIncludeHidden = includeHidden;
      },
      args: [includeHidden]
    });
    
    // Execute the content script in the current tab
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    
    // Store font data globally for sorting
    window.fontData = results[0].result;
    window.currentTabId = tab.id;
    
    if (window.fontData && window.fontData.length > 0) {
      statusDiv.textContent = 'Analysis complete!';
      displayFontTable(window.fontData);
      displaySummaryView(window.fontData);
      copyBtn.style.display = 'block';
      tabContainer.style.display = 'block'; // Show the tab container after analysis
    } else {
      statusDiv.textContent = 'No font data found.';
    }
  } catch (error) {
    statusDiv.textContent = 'Error: ' + error.message;
    console.error(error);
  }
});

// Function to display font data in a sortable table (Detailed View)
function displayFontTable(fontData, sortColumn = 'fontSize', sortDirection = 'desc') {
  const resultDiv = document.getElementById('detail-result');
  resultDiv.textContent = '';
  
  // Create table
  const table = document.createElement('table');
  table.className = 'font-table';
  
  // Create table header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  
  const headers = ['Font Family', 'Font Size', 'Font Weight', 'Line Height', 'Element tag', 'Text Examples'];
  const propertyMap = {
    'Font Family': 'fontFamily',
    'Font Size': 'fontSize',
    'Font Weight': 'fontWeight',
    'Line Height': 'lineHeight',
    'Element tag': 'elementTag',
    'Text Examples': 'textExample'
  };
  
  headers.forEach(headerText => {
    const th = document.createElement('th');
    th.textContent = headerText;
    th.classList.add('sortable');
    
    // Add sort indicator if this column is being sorted
    if (sortColumn === propertyMap[headerText]) {
      th.classList.add(sortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
    }
    
    // Add click handler for sorting
    th.addEventListener('click', () => {
      const property = propertyMap[headerText];
      const newDirection = sortColumn === property && sortDirection === 'asc' ? 'desc' : 'asc';
      sortFontData(property, newDirection);
    });
    
    headerRow.appendChild(th);
  });
  
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Sort data if requested
  if (sortColumn) {
    fontData.sort((a, b) => {
      // For font size, convert to numbers for proper sorting
      if (sortColumn === 'fontSize') {
        const sizeA = parseFloat(a[sortColumn]);
        const sizeB = parseFloat(b[sortColumn]);
        return sortDirection === 'asc' ? sizeA - sizeB : sizeB - sizeA;
      }
      // For font weight, convert to numbers for proper sorting
      else if (sortColumn === 'fontWeight') {
        const weightA = isNaN(parseInt(a[sortColumn])) ? 400 : parseInt(a[sortColumn]);
        const weightB = isNaN(parseInt(b[sortColumn])) ? 400 : parseInt(b[sortColumn]);
        return sortDirection === 'asc' ? weightA - weightB : weightB - weightA;
      } 
      // For text strings, use localeCompare
      else {
        const valueA = a[sortColumn] || '';
        const valueB = b[sortColumn] || '';
        return sortDirection === 'asc' ? 
          valueA.localeCompare(valueB) : 
          valueB.localeCompare(valueA);
      }
    });
  }
  
  // Create table body
  const tbody = document.createElement('tbody');
  
  // Track if we have any hoverable rows
  let hasHoverableRows = false;
  
  fontData.forEach(item => {
    const row = document.createElement('tr');
    
    // Add data attribute for element ID if available
    if (item.elementId) {
      row.dataset.elementId = item.elementId;
      
      // Add hover event listeners for highlighting
      row.addEventListener('mouseenter', () => {
        highlightElement(item.elementId);
      });
      
      row.addEventListener('mouseleave', () => {
        removeHighlight();
      });
      
      // Add visual indicator that this row is hoverable
      row.classList.add('hoverable');
      hasHoverableRows = true;
    }
    
    // Create cells for each column
    const familyCell = document.createElement('td');
    familyCell.textContent = item.fontFamily;
    row.appendChild(familyCell);
    
    const sizeCell = document.createElement('td');
    sizeCell.textContent = item.fontSize;
    row.appendChild(sizeCell);
    
    const weightCell = document.createElement('td');
    weightCell.textContent = item.fontWeight;
    row.appendChild(weightCell);
    
    const lineHeightCell = document.createElement('td');
    lineHeightCell.textContent = item.lineHeight;
    row.appendChild(lineHeightCell);
    
    const elementTagCell = document.createElement('td');
    elementTagCell.textContent = item.elementTag;
    row.appendChild(elementTagCell);
    
    const textExampleCell = document.createElement('td');
    textExampleCell.textContent = item.textExample;
    row.appendChild(textExampleCell);
    
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);
  resultDiv.appendChild(table);
  
  // Show the highlight status message if we have hoverable rows
  const highlightStatus = document.getElementById('detail-highlight-status');
  if (hasHoverableRows) {
    highlightStatus.style.display = 'block';
  } else {
    highlightStatus.style.display = 'none';
  }
}

// Function to display summary view
function displaySummaryView(fontData) {
  const summaryResultDiv = document.getElementById('summary-result');
  summaryResultDiv.textContent = '';
  
  // Create summary box with total count
  const totalBox = document.createElement('div');
  totalBox.className = 'summary-box';
  totalBox.innerHTML = `
    <div class="summary-title">Total Font Usage</div>
    <span class="summary-count">${fontData.length}</span> total font instances found
  `;
  summaryResultDiv.appendChild(totalBox);
  
  // Group fonts by family
  const fontFamilies = groupBy(fontData, 'fontFamily');
  
  // Create font families section
  const familiesBox = document.createElement('div');
  familiesBox.className = 'summary-box';
  familiesBox.innerHTML = `<div class="summary-title">Font Families (${Object.keys(fontFamilies).length})</div>`;
  
  // Sort font families by frequency (descending)
  const sortedFamilies = Object.keys(fontFamilies).sort((a, b) => 
    fontFamilies[b].length - fontFamilies[a].length
  );
  
  sortedFamilies.forEach(family => {
    const instances = fontFamilies[family];
    const familyDiv = document.createElement('div');
    familyDiv.className = 'font-group';
    familyDiv.innerHTML = `${family} <span class="font-group-count">${instances.length}</span>`;
    
    // Collect all element IDs for this family
    const elementIds = instances.map(instance => instance.elementId).filter(Boolean);
    
    // Add hover effect to highlight all elements with this font family
    familyDiv.addEventListener('mouseenter', () => {
      highlightMultipleElements(elementIds);
    });
    
    familyDiv.addEventListener('mouseleave', () => {
      removeHighlight();
    });
    
    familiesBox.appendChild(familyDiv);
  });
  
  summaryResultDiv.appendChild(familiesBox);
  
  // Group fonts by size
  const fontSizes = groupBy(fontData, 'fontSize');
  
  // Create font sizes section
  const sizesBox = document.createElement('div');
  sizesBox.className = 'summary-box';
  sizesBox.innerHTML = `<div class="summary-title">Font Sizes (${Object.keys(fontSizes).length})</div>`;
  
  // Sort font sizes numerically (descending)
  const sortedSizes = Object.keys(fontSizes).sort((a, b) => {
    const sizeA = parseFloat(a);
    const sizeB = parseFloat(b);
    return sizeB - sizeA;
  });
  
  sortedSizes.forEach(size => {
    const instances = fontSizes[size];
    const sizeDiv = document.createElement('div');
    sizeDiv.className = 'font-group';
    sizeDiv.innerHTML = `${size} <span class="font-group-count">${instances.length}</span>`;
    
    // Collect all element IDs for this size
    const elementIds = instances.map(instance => instance.elementId).filter(Boolean);
    
    // Add hover effect to highlight all elements with this font size
    sizeDiv.addEventListener('mouseenter', () => {
      highlightMultipleElements(elementIds);
    });
    
    sizeDiv.addEventListener('mouseleave', () => {
      removeHighlight();
    });
    
    sizesBox.appendChild(sizeDiv);
  });
  
  summaryResultDiv.appendChild(sizesBox);
  
  // Group fonts by weight
  const fontWeights = groupBy(fontData, 'fontWeight');
  
  // Create font weights section
  const weightsBox = document.createElement('div');
  weightsBox.className = 'summary-box';
  weightsBox.innerHTML = `<div class="summary-title">Font Weights (${Object.keys(fontWeights).length})</div>`;
  
  // Sort font weights numerically (descending)
  const sortedWeights = Object.keys(fontWeights).sort((a, b) => {
    const weightA = isNaN(parseInt(a)) ? 400 : parseInt(a);
    const weightB = isNaN(parseInt(b)) ? 400 : parseInt(b);
    return weightB - weightA;
  });
  
  sortedWeights.forEach(weight => {
    const instances = fontWeights[weight];
    const weightDiv = document.createElement('div');
    weightDiv.className = 'font-group';
    weightDiv.innerHTML = `${weight} <span class="font-group-count">${instances.length}</span>`;
    
    // Collect all element IDs for this weight
    const elementIds = instances.map(instance => instance.elementId).filter(Boolean);
    
    // Add hover effect to highlight all elements with this font weight
    weightDiv.addEventListener('mouseenter', () => {
      highlightMultipleElements(elementIds);
    });
    
    weightDiv.addEventListener('mouseleave', () => {
      removeHighlight();
    });
    
    weightsBox.appendChild(weightDiv);
  });
  
  summaryResultDiv.appendChild(weightsBox);
  
  // Set highlight status visibility
  document.getElementById('summary-highlight-status').style.display = 'block';
}

// Helper function to group items by a specific property
function groupBy(array, property) {
  return array.reduce((result, item) => {
    const key = item[property];
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
    return result;
  }, {});
}

// Function to highlight multiple elements on the page
function highlightMultipleElements(elementIds) {
  if (!window.currentTabId || !elementIds || elementIds.length === 0) return;
  
  // Remove any existing highlight first
  removeHighlight();
  
  chrome.tabs.sendMessage(window.currentTabId, {
    action: 'highlightMultipleElements',
    elementIds: elementIds
  }).catch(error => {
    console.error('Error highlighting elements:', error);
  });
}

// Function to highlight an element in the page
function highlightElement(elementId) {
  if (!window.currentTabId) return;
  
  chrome.tabs.sendMessage(window.currentTabId, {
    action: 'highlightElement',
    elementId: elementId
  }).catch(error => {
    console.error('Error highlighting element:', error);
  });
}

// Function to remove highlight
function removeHighlight() {
  if (!window.currentTabId) return;
  
  chrome.tabs.sendMessage(window.currentTabId, {
    action: 'removeHighlight'
  }).catch(error => {
    console.error('Error removing highlight:', error);
  });
}

// Function to sort font data and redisplay table
function sortFontData(column, direction) {
  if (window.fontData && window.fontData.length > 0) {
    displayFontTable(window.fontData, column, direction);
  }
}

// Add copy to clipboard functionality
document.getElementById('copy-btn').addEventListener('click', () => {
  // Determine which tab is active
  const isDetailView = document.getElementById('detail-view').classList.contains('active');
  let csvContent = '';
  
  if (isDetailView) {
    // Format detailed view for copying
    csvContent = 'Font Family\tFont Size\tFont Weight\tLine Height\tElement tag\tText Examples\n';
    
    if (window.fontData && window.fontData.length > 0) {
      window.fontData.forEach(item => {
        const rowData = [
          item.fontFamily.replace(/\t/g, ' '),
          item.fontSize.replace(/\t/g, ' '),
          item.fontWeight.replace(/\t/g, ' '),
          item.lineHeight.replace(/\t/g, ' '),
          item.elementTag.replace(/\t/g, ' '),
          item.textExample.replace(/\t/g, ' ')
        ];
        csvContent += rowData.join('\t') + '\n';
      });
    }
  } else {
    // Format summary view for copying
    csvContent = 'Summary of Font Usage\n\n';
    
    if (window.fontData && window.fontData.length > 0) {
      // Group by font family
      const fontFamilies = groupBy(window.fontData, 'fontFamily');
      csvContent += `Total Font Usage: ${window.fontData.length}\n`;
      csvContent += `Font Families: ${Object.keys(fontFamilies).length}\n\n`;
      
      csvContent += 'Font Families Breakdown:\n';
      Object.keys(fontFamilies).sort((a, b) => fontFamilies[b].length - fontFamilies[a].length).forEach(family => {
        csvContent += `${family}: ${fontFamilies[family].length}\n`;
      });
      
      // Group by font size
      const fontSizes = groupBy(window.fontData, 'fontSize');
      csvContent += '\nFont Sizes Breakdown:\n';
      Object.keys(fontSizes).sort((a, b) => parseFloat(b) - parseFloat(a)).forEach(size => {
        csvContent += `${size}: ${fontSizes[size].length}\n`;
      });
      
      // Group by font weight
      const fontWeights = groupBy(window.fontData, 'fontWeight');
      csvContent += '\nFont Weights Breakdown:\n';
      Object.keys(fontWeights).sort((a, b) => {
        const weightA = isNaN(parseInt(a)) ? 400 : parseInt(a);
        const weightB = isNaN(parseInt(b)) ? 400 : parseInt(b);
        return weightB - weightA;
      }).forEach(weight => {
        csvContent += `${weight}: ${fontWeights[weight].length}\n`;
      });
    }
  }
  
  navigator.clipboard.writeText(csvContent).then(() => {
    const copyBtn = document.getElementById('copy-btn');
    copyBtn.textContent = 'Copied!';
    
    setTimeout(() => {
      copyBtn.textContent = 'Copy Results';
    }, 2000);
  }).catch(err => {
    console.error('Could not copy text: ', err);
  });
});
