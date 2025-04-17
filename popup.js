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
    if (fontData) {
      statusDiv.textContent = 'Analysis complete!';
      resultDiv.textContent = fontData;
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
  const text = resultDiv.textContent;
  
  navigator.clipboard.writeText(text).then(() => {
    const copyBtn = document.getElementById('copy-btn');
    copyBtn.textContent = 'Copied!';
    
    setTimeout(() => {
      copyBtn.textContent = 'Copy Results';
    }, 2000);
  }).catch(err => {
    console.error('Could not copy text: ', err);
  });
});
