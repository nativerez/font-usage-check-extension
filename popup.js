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
    
    // Display the results
    const fontData = results[0].result;
    
    if (fontData && fontData.length > 0) {
      statusDiv.textContent = 'Analysis complete!';
      
      // Create table
      const table = document.createElement('table');
      table.className = 'font-table';
      
      // Create table header
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');
      
      const headers = ['Font Family', 'Font Size', 'Font Weight', 'Line Height', 'Element tag', 'Text Examples'];
      
      headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
      });
      
      thead.appendChild(headerRow);
      table.appendChild(thead);
      
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
      copyBtn.style.display = 'block';
    } else {
      statusDiv.textContent = 'No font data found.';
    }
  } catch (error) {
    statusDiv.textContent = 'Error: ' + error.message;
    console.error(error);
  }
});

// Add copy to clipboard functionality
document.getElementById('copy-btn').addEventListener('click', () => {
  const resultDiv = document.getElementById('result');
  
  // Convert table to CSV format for copying
  let csvContent = 'Font Family\tFont Size\tFont Weight\tLine Height\tElement tag\tText Examples\n';
  
  const table = resultDiv.querySelector('table');
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
