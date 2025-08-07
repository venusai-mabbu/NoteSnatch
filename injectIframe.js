(function () {
  // Prevent multiple instances
  if (document.getElementById('noteSnatchWrapper')) {
    document.getElementById('noteSnatchWrapper').remove();
  }

  const NOTES_KEY = 'noteSnatch_notes';
  const DARK_MODE_KEY = 'noteSnatch_darkMode';
  
  // Safe localStorage operations with error handling
  function safeGetItem(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? item : defaultValue;
    } catch (e) {
      console.warn('localStorage getItem failed:', e);
      return defaultValue;
    }
  }

  function safeSetItem(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.warn('localStorage setItem failed:', e);
      return false;
    }
  }

  function safeRemoveItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.warn('localStorage removeItem failed:', e);
      return false;
    }
  }

  // Initialize variables with safe defaults
  let darkMode = safeGetItem(DARK_MODE_KEY) === 'true';
  let minimized = false;
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;
  let dragSrc = null;

  const wrapper = document.createElement('div');
  wrapper.id = 'noteSnatchWrapper';
  wrapper.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 0px;
    height : 300px;
    width:260px;
    min-height: 300px;
    min-width: 260px;
     
   
    background: ${darkMode ? '#1e1e1e' : '#fff'};
    color: ${darkMode ? '#f5f5f5' : '#222'};
    border-radius: 10px;
    box-shadow: 0 0 20px rgba(0,0,0,0.2);
    z-index: 99;
    display: flex;
    flex-direction: column;
    font-family: 'Segoe UI', sans-serif;
    transition: opacity 0.3s ease;
    resize: both;
    overflow: hidden;
     user-select: none;
    -webkit-user-select: none; /* Safari */
    -moz-user-select: none;    /* Firefox */
    -ms-user-select: none;     /* IE/Edge */
  `;

  const header = document.createElement('div');
  header.style.cssText = `
    background: ${darkMode ? '#333' : '#4a90e2'};
    color: white;
    padding: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
    cursor: move;
    user-select: none;
  `;
  header.innerHTML = `
    <span>NoteSnatch</span>
    <div style="margin-left:5px;">
      <button id="minimizeBtn" style="background:none; border:none; color:white; font-size:20px; cursor:pointer;padding:0px">−</button>
      <button id="closeBtn" style="background:none; border:none; color:white; font-size:20px; cursor:pointer;margin:0px;">×</button>
    </div>
  `;
  wrapper.appendChild(header);

  const controls = document.createElement('div');
  controls.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    background: ${darkMode ? '#2a2a2a' : '#f7f7f7'};
    gap: 2px;
    min-width: 270px;
  `;

  // Custom Dark Mode Toggle
  const darkModeContainer = document.createElement('div');
  darkModeContainer.style.cssText = 'display: flex; align-items: center; gap: 8px;';

  const darkText = document.createElement('span');
  darkText.textContent = 'Dark Mode';
  darkText.style.fontSize = '13px';
  darkText.style.margin = '0px';

  const darkToggle = document.createElement('div');
  darkToggle.style.cssText = `
    width: 40px;
    height: 20px;
    background: ${darkMode ? '#4a90e2' : '#ccc'};
    border-radius: 10px;
    position: relative;
    cursor: pointer;
    margin:0px;
  `;

  const darkKnob = document.createElement('div');
  darkKnob.style.cssText = `
    width: 18px;
    height: 18px;
    background: white;
    border-radius: 50%;
    position: absolute;
    top: 1px;
    left: ${darkMode ? '21px' : '1px'};
    transition: left 0.3s ease;
    box-shadow: 0 1px 3px rgba(0,0,0,0.4);
  `;
  darkToggle.appendChild(darkKnob);
  darkModeContainer.appendChild(darkText);
  darkModeContainer.appendChild(darkToggle);

  // Opacity Control
  const opacityLabel = document.createElement('label');
  opacityLabel.style.cssText = 'display: flex; align-items: center; gap: 5px;width:150px';
  opacityLabel.innerHTML = `
    Opacity
    <input type="range" min="0.2" max="1" step="0.1" value="1" id="opacitySlider" style="width:40%">
  `;

  controls.appendChild(darkModeContainer);
  controls.appendChild(opacityLabel);
  wrapper.appendChild(controls);

  const content = document.createElement('div');
  content.id = 'noteContent';
  content.style.cssText = `
    flex: 1;
    padding: 10px;
    overflow-y: auto;
    background: ${darkMode ? '#2a2a2a' : '#fff'};
  `;

  const noteList = document.createElement('ul');
  noteList.style.cssText = 'list-style:none;padding:0;margin:0;';
  content.appendChild(noteList);
  wrapper.appendChild(content);

  const footer = document.createElement('div');
  footer.style.cssText = `
    display: flex;
    justify-content: space-between;
    padding: 5px;
    border-top: 1px solid #ccc;
    background: ${darkMode ? '#333' : '#f0f0f0'};
  `;
  const downloadBtn = document.createElement('button');
  downloadBtn.textContent = '⬇ Download';
  downloadBtn.style.cssText = 'padding:6px 12px';
  // downloadBtn.style.cssText = 'cursor:pointer';
  const clearBtn = document.createElement('button');
  clearBtn.textContent = 'Clear';
  clearBtn.style.cssText = 'padding:6px 12px';
  //  clearBtn.style.cssText = 'cursor:pointer';
  footer.appendChild(downloadBtn);
  footer.appendChild(clearBtn);
  wrapper.appendChild(footer);

  document.body.appendChild(wrapper);

  // Load notes with error handling
  function loadNotes() {
    try {
      const storedNotes = safeGetItem(NOTES_KEY, '[]');
      const parsed = JSON.parse(storedNotes);
      if (Array.isArray(parsed)) {
        parsed.forEach(note => {
          if (typeof note === 'string' && note.trim()) {
            addNote(note);
          }
        });
      }
    } catch (e) {
      console.warn('Error loading notes:', e);
    }
  }

  function saveNotes() {
    try {
      const notes = Array.from(noteList.children)
        .map(li => {
          const textElement = li.querySelector('.note-text');
          return textElement ? textElement.textContent.trim() : '';
        })
        .filter(note => note !== ''); // Remove empty notes
      
      safeSetItem(NOTES_KEY, JSON.stringify(notes));
    } catch (e) {
      console.warn('Error saving notes:', e);
    }
  }

  function applyDarkModeStyles() {
    wrapper.style.background = darkMode ? '#1e1e1e' : '#fff';
    wrapper.style.color = darkMode ? '#f5f5f5' : '#222';
    header.style.background = darkMode ? '#333' : '#4a90e2';
    content.style.background = darkMode ? '#2a2a2a' : '#fff';
    footer.style.background = darkMode ? '#333' : '#f0f0f0';
    controls.style.backgroundColor = darkMode ? '#2a2a2a' : '#f7f7f7';
    darkToggle.style.background = darkMode ? '#4a90e2' : '#ccc';
    darkKnob.style.left = darkMode ? '21px' : '1px';

    // Update existing notes
    Array.from(noteList.children).forEach(li => {
      li.style.background = darkMode ? '#333' : '#f9f9f9';
      li.style.color = darkMode ? '#eee' : '#222';
    });
  }

 


  function addNote(text) {
  if (!text || typeof text !== 'string' || !text.trim()) return;

  const noteText = text.trim();
  const li = document.createElement('li');
  li.style.cssText = `
    background: ${darkMode ? '#333' : '#f9f9f9'};
    color: ${darkMode ? '#eee' : '#222'};
    margin-bottom: 6px;
    padding: 6px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
    position: relative;
    overflow: visible;
    font-size:10px;
  `;
  li.draggable = true;

  const drag = document.createElement('span');
  drag.textContent = '☰';
  drag.style.cssText = 'cursor:move; user-select:none;';

  const span = document.createElement('span');
  span.className = 'note-text';
  span.textContent = noteText;
  span.style.cssText = `
    flex: 1;
    outline: none;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    white-space: normal;
    cursor: pointer;
  `;

  const del = document.createElement('button');
  del.textContent = '✖';
  del.style.cssText = 'background:none; border:none; color:#c00; cursor:pointer; font-size:14px;';
  del.onclick = (e) => {
    e.stopPropagation();
    if (li.parentNode) {
      li.remove();
      saveNotes();
    }
  };

  // Create floating bubble editor (outside widget)
  const bubble = document.createElement('div');
  bubble.contentEditable = true;
  bubble.textContent = noteText;
  bubble.style.cssText = `
    position: fixed;
    z-index: 9999;
    background: ${darkMode ? '#444' : '#fff'};
    color: ${darkMode ? '#eee' : '#222'};
    border: 1px solid ${darkMode ? '#666' : '#ccc'};
    padding: 10px;
    border-radius: 6px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    width: 250px;
    max-height: 150px;
    overflow-y: auto;
    display: none;
    font-size: 12px;
  `;
  document.body.appendChild(bubble); // append to body so it can overflow widget

  // On span click, show and position bubble
  span.onclick = (e) => {
    e.stopPropagation();
    const rect = span.getBoundingClientRect();

    // Decide left or right based on available space
    const spaceRight = window.innerWidth - rect.right;
    const bubbleWidth = 270; // including padding/margin

    if (spaceRight > bubbleWidth) {
      bubble.style.left = `${rect.right + 8}px`;
    } else {
      bubble.style.left = `${rect.left - bubbleWidth - 8}px`;
    }

    bubble.style.top = `${rect.top}px`;
    bubble.style.display = 'block';
    bubble.focus();
  };

  // Close bubble on outside click & sync content
  document.addEventListener('click', (e) => {
    if (bubble.style.display === 'block' &&
        !bubble.contains(e.target) &&
        e.target !== span) {
      bubble.style.display = 'none';
      const newText = bubble.textContent.trim();
      if (newText !== span.textContent.trim()) {
        span.textContent = newText;
        saveNotes();
      }
    }
  });

  li.append(drag, span, del);
  noteList.appendChild(li);
  saveNotes();
}

  //Enhanced drag and drop logic with better error handling
 
 

 
 
 
  function handleDragStart(e) {
    if (e.target.closest('li')) {
      dragSrc = e.target.closest('li');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', dragSrc.innerHTML);
      dragSrc.style.opacity = '0.5';
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(e) {
    e.preventDefault();
    if (dragSrc && e.target.closest('li') && dragSrc !== e.target.closest('li')) {
      const target = e.target.closest('li');
      const dragIndex = Array.from(noteList.children).indexOf(dragSrc);
      const targetIndex = Array.from(noteList.children).indexOf(target);
      
      if (dragIndex < targetIndex) {
        noteList.insertBefore(dragSrc, target.nextSibling);
      } else {
        noteList.insertBefore(dragSrc, target);
      }
      saveNotes();
    }
  }

  function handleDragEnd() {
    if (dragSrc) {
      dragSrc.style.opacity = '1';
      dragSrc = null;
    }
  }

  // Add event listeners with proper cleanup
  noteList.addEventListener('dragstart', handleDragStart);
  noteList.addEventListener('dragover', handleDragOver);
  noteList.addEventListener('drop', handleDrop);
  noteList.addEventListener('dragend', handleDragEnd);

  // Text selection handler with throttling
  let selectionTimeout;
  function handleTextSelection() {
    clearTimeout(selectionTimeout);
    selectionTimeout = setTimeout(() => {
      const selected = window.getSelection().toString().trim();
      if (selected && selected.length > 0 && selected.length < 1000) {
        addNote(selected);
        window.getSelection();
        window.getSelection().removeAllRanges();
      }
    }, 100);
  }

  document.addEventListener('mouseup', handleTextSelection);

  // Button handlers with proper cleanup
  function handleClose() {
    // Clean up event listeners
    document.removeEventListener('mouseup', handleTextSelection);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Remove the wrapper
    if (wrapper.parentNode) {
      wrapper.remove();
    }
  }

  function handleMinimize() {
    minimized = !minimized;
    const minimizeBtn = document.getElementById('minimizeBtn');
    
    if (minimized) {
      content.style.display = 'none';
      footer.style.display = 'none';
      controls.style.display = 'none';
       
      wrapper.style.height = '40px';
      wrapper.style.width = '145px';
      
      wrapper.style.minHeight = '40px';
      wrapper.style.minWidth = '145px'; 
      wrapper.style.maxHeight = '40px';
      wrapper.style.maxWidth = '145px';
      
      
      
      
      if (minimizeBtn) minimizeBtn.textContent = '+';
    } else {
      content.style.display = 'block';
      footer.style.display = 'flex';
      controls.style.display = 'flex';
      wrapper.style.height = '300px';
      wrapper.style.width='260px';
      
      wrapper.style.minHeight = '300px';
      wrapper.style.minWidth='260px';
      wrapper.style.maxHeight = '80%';
      wrapper.style.maxWidth = '80%';
      

      if (minimizeBtn) minimizeBtn.textContent = '−';
    }
  }

  // Safe event handler assignment
  const closeBtn = document.getElementById('closeBtn');
  const minimizeBtn = document.getElementById('minimizeBtn');
  const opacitySlider = document.getElementById('opacitySlider');

  if (closeBtn) closeBtn.onclick = handleClose;
  if (minimizeBtn) minimizeBtn.onclick = handleMinimize;

  // Opacity handler
  if (opacitySlider) {
    opacitySlider.oninput = (e) => {
      const value = parseFloat(e.target.value);
      if (!isNaN(value)) {
        wrapper.style.opacity = value.toString();
      }
    };
  }

  // Dark toggle handler
  darkToggle.onclick = () => {
    darkMode = !darkMode;
    safeSetItem(DARK_MODE_KEY, darkMode.toString());
    applyDarkModeStyles();
  };

  // Download handler
  downloadBtn.onclick = () => {
    try {
      const notes = Array.from(noteList.children)
        .map(li => {
          const textElement = li.querySelector('.note-text');
          return textElement ? `.${textElement.textContent.trim()}\n\n` : '';
        })
        .filter(note => note !== '')
        .join('\n');
      
      if (notes) {
        const blob = new Blob([notes], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'NoteSnatch_Notes.doc';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.warn('Error downloading notes:', e);
      alert('Error downloading notes. Please try again.');
    }
  };

  // Clear handler
  clearBtn.onclick = () => {
    if (confirm('Clear all notes?')) {
      noteList.innerHTML = '';
      safeRemoveItem(NOTES_KEY);
    }
  };

  // Enhanced drag wrapper logic
  function handleMouseDown(e) {
    if (e.target.closest('#minimizeBtn') || e.target.closest('#closeBtn')) {
      return;
    }
    isDragging = true;
    const rect = wrapper.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    e.preventDefault();
  }

  function handleMouseMove(e) {
    if (isDragging) {
      const newLeft = e.clientX - offsetX;
      const newTop = e.clientY - offsetY;
      
      // Keep within viewport
      const maxLeft = window.innerWidth - wrapper.offsetWidth;
      const maxTop = window.innerHeight - wrapper.offsetHeight;
      
      wrapper.style.left = `${Math.max(0, Math.min(newLeft, maxLeft))}px`;
      wrapper.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`;
      wrapper.style.right = 'auto';
      wrapper.style.bottom = 'auto';
    }
  }

  function handleMouseUp() {
    isDragging = false;
  }

  header.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  // Load notes and apply styles
  loadNotes();
  applyDarkModeStyles();

})();