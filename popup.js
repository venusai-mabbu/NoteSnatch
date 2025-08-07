document.getElementById('injectIframe').addEventListener('click', async () => {
  // Get the active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab) {
    console.error('No active tab found');
    return;
  }

  try {
    // Execute the content script in the active tab
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['injectIframe.js']
    });
    
    // Update button text to show success
    const button = document.getElementById('injectIframe');
    const originalText = button.textContent;
    button.textContent = 'Launched Successfully!';
    button.style.backgroundColor = '#34a853';
    
    // Reset button after 2 seconds
    setTimeout(() => {
      button.textContent = originalText;
      button.style.backgroundColor = '';
      window.close();
    }, 500);
    
    // Optional: Close popup after injection
    
  } catch (error) {
    console.error('Error Launching Extension:', error);
    
    // Show error on button
    const button = document.getElementById('injectIframe');
    button.textContent = 'Error - Try Again';
    button.style.backgroundColor = '#ea4335';
    
    setTimeout(() => {
      button.textContent = 'Launch Extension';
      button.style.backgroundColor = '';
    }, 2000);
  }
});