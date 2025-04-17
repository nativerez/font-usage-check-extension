document.getElementById('analyze-btn').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  const resultDiv = document.getElementById('result');
  const copyBtn = document.getElementById('copy-btn');
  
  statusDiv.textContent = 'Analyzing fonts...';
  resultDiv.textContent = '';
  copyBtn.style.display = 'none';
  
  try {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Execute the content script in the current tab
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    
    // Store font data globally for sorting
    window.fontData = results[0].result;
    
    if (window.fontData && window.fontData.length > 0) {
      statusDiv.textContent = 'Analysis complete!';
      displayFontTable(window.fontData);
      copyBtn.style.display = 'block';
    } else {
      statusDiv.textContent = 'No font data found.';
    }
  } catch (error) {
    statusDiv.textContent = 'Error: ' + error.message;
    console.error(error);
  }
});

// Function to display font data in a sortable table
function displayFontTable(fontData, sortColumn = null, sortDirection = 'asc') {
  const resultDiv = document.getElementById('result');
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
  
  fontData.forEach(item => {
    const row = document.createElement('tr');
    
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
}

// Function to sort font data and redisplay table
function sortFontData(column, direction) {
  if (window.fontData && window.fontData.length > 0) {
    displayFontTable(window.fontData, column, direction);
  }
}

// Add copy to clipboard functionality
document.getElementById('copy-btn').addEventListener('click', () => {
  // Convert table to CSV format for copying
  let csvContent = 'Font Family\tFont Size\tFont Weight\tLine Height\tElement tag\tText Examples\n';
  
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
  } else {
    const table = document.querySelector('.font-table');
    if (table) {
      const rows = table.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        let rowData = [];
        cells.forEach(cell => {
          // Handle tab characters in the cell content
          let cellText = cell.textContent.replace(/\t/g, ' ');
          rowData.push(cellText);
        });
        csvContent += rowData.join('\t') + '\n';
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
