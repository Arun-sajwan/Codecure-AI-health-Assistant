// AI Health Assistant - JavaScript Functionality
// Nav, Chatbot (API integration), Forms, Responsive Toggle

// DOM Elements
const sidebar = document.getElementById('sidebar');
const topNavbar = document.getElementById('top-navbar');
const menuToggle = document.querySelector('.menu-toggle');
const closeSidebarBtn = document.querySelector('.close-sidebar');
const navLinks = document.querySelectorAll('#sidebar a[data-page]');
// Ensure themeToggle is available
const themeToggle = document.getElementById('theme-toggle');
const pages = document.querySelectorAll('.page');
const startChatBtn = document.getElementById('start-chat');
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatMessages = document.getElementById('chat-messages');
const typingIndicator = document.getElementById('typing-indicator');
const clearChatBtn = document.getElementById('clear-chat');
const medicineForm = document.getElementById('medicine-form');
const medicineGrid = document.getElementById('medicine-grid');
const timelineList = document.getElementById('timeline-list');
const emptyState = document.getElementById('empty-state');
const todayMedsEl = document.getElementById('today-meds');
const upcomingMedsEl = document.getElementById('upcoming-meds');

// Symptom Checker Elements
const symptomForm = document.getElementById('symptom-form');
const symptomResponse = document.getElementById('symptom-response');
const responseContent = document.getElementById('response-content');
const responseLoading = document.querySelector('.response-loading');
const newAnalysisBtn = document.getElementById('new-analysis');
const severitySlider = document.getElementById('severity-slider');
const severityValue = document.getElementById('severity-value');
const symptomDesc = document.getElementById('symptom-desc');
const symptomHistoryCount = document.getElementById('symptom-history-count');
const historyList = document.getElementById('symptom-history-count-small');
const historyCountSmall = document.getElementById('history-list');
const apiKeyInput = document.getElementById('api-key');

// State
let chatHistory = JSON.parse(sessionStorage.getItem('chatHistory')) || [];

// Init
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    initNav();
    loadChatHistory();
    initApiKey();
    initChat();
    initForms();
    showPage('home');
});

function initTheme() {
  // Force light mode as default
  document.body.dataset.theme = 'light';
  localStorage.setItem('theme', 'light');
  
  // Set toggle button to show "Light Mode" initially (for switching to dark)
  themeToggle.innerHTML = `<i class="fas fa-moon"></i> Dark Mode`;
  
  themeToggle.addEventListener('click', (e) => {
    e.preventDefault();
    const currentIsDark = document.body.dataset.theme === 'dark';
    const newTheme = currentIsDark ? 'light' : 'dark';
    
    document.body.dataset.theme = newTheme;
    themeToggle.innerHTML = `<i class="fas fa-${newTheme === 'dark' ? 'sun' : 'moon'}"></i> ${newTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}`;
    
    localStorage.setItem('theme', newTheme);
  });
}

function initApiKey() {
  if (!apiKeyInput) return;

  const savedKey = localStorage.getItem(API_KEY_STORAGE_NAME);
  if (savedKey) {
    apiKeyInput.value = savedKey;
  }

  apiKeyInput.addEventListener('input', () => {
    const val = apiKeyInput.value.trim();
    if (val) {
      localStorage.setItem(API_KEY_STORAGE_NAME, val);
    } else {
      localStorage.removeItem(API_KEY_STORAGE_NAME);
    }
  });
}

// Navigation
function initNav() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.dataset.page;
            showPage(pageId);
            setActiveLink(link);
        });
    });

    hamburger.addEventListener('click', toggleSidebar);
    startChatBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('chatbot');
    });
}

function showPage(pageId) {
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

function setActiveLink(activeLink) {
    navLinks.forEach(link => link.classList.remove('active'));
    activeLink.classList.add('active');
}

function toggleSidebar() {
    sidebar.classList.toggle('sidebar-open');
    document.body.classList.toggle('sidebar-open');
}

function initNav() {
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.dataset.page;
            showPage(pageId);
            setActiveLink(link);
            // Close sidebar on mobile after selection
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('sidebar-open');
                document.body.classList.remove('sidebar-open');
            }
        });
    });

    menuToggle.addEventListener('click', toggleSidebar);
    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('sidebar-open');
        document.body.classList.remove('sidebar-open');
    });

    startChatBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('chatbot');
    });
}

// Chatbot Functionality
function initChat() {
    chatForm.addEventListener('submit', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage(e);
        }
    });
    clearChatBtn.addEventListener('click', clearChat);
    
    const exportChatBtn = document.getElementById('export-chat');
    if (exportChatBtn) {
        exportChatBtn.addEventListener('click', exportChat);
    }

    // Quick starters - move here from sendMessage
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            messageInput.value = btn.dataset.prompt || '';
            chatForm.requestSubmit();
        });
    });
}

function addMessage(content, isUser = false, timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    messageDiv.innerHTML = `
        <div class="avatar ${isUser ? 'user-avatar' : 'bot-avatar'}">
            <i class="fas fa-${isUser ? 'user' : 'robot'}"></i>
        </div>
        <div class="message-content">
            <div class="message-bubble">${content}</div>
            <small class="message-time">${timestamp}</small>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    autoScroll();
    
    // Typing animation for bot messages
    if (!isUser) {
        messageDiv.style.opacity = '0';
        setTimeout(() => {
            messageDiv.style.transition = 'opacity 0.3s ease';
            messageDiv.style.opacity = '1';
        }, 100);
    }
}

function showTyping() {
    typingIndicator.classList.remove('hidden');
}

function hideTyping() {
    typingIndicator.classList.add('hidden');
}

async function sendMessage(e) {
    e.preventDefault();
    const input = messageInput.value.trim();
    if (!input) return;

    // Add user message
    addMessage(input, true);
    const userMessage = input;
    messageInput.value = '';
    chatHistory.push({ type: 'user', content: userMessage });
    saveChatHistory();

    // Show typing
    showTyping();
    
    const healthPrompt = `You are AI Health Assistant - medical expert. User: "${userMessage}".
    
Respond as doctor:
1. Direct answer
2. Possible causes
3. When to seek help
4. Disclaimer: Not substitute for professional advice
    
Keep friendly, clear, concise.`;

    const localApiUrl = 'http://127.0.0.1:5000/chat';
    console.log('Sending user message to backend:', userMessage);

    try {
        const localResponse = await fetch(localApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMessage, feature: 'chat' })
        });

        if (!localResponse.ok) {
            throw new Error(`Local backend request failed: ${localResponse.status} ${localResponse.statusText}`);
        }

        const localData = await localResponse.json();
        const botMessage = localData.reply || localData.error || 'No response returned from backend';

        hideTyping();
        addMessage(botMessage, false);
        chatHistory.push({ type: 'bot', content: botMessage });
        saveChatHistory();
        return;
    } catch (error) {
        hideTyping();
        const errMsg = `Backend not reachable: ${error.message}`;
        addMessage(errMsg, false);
        console.error(errMsg);
        return;
    }
}


function startVoiceInput() {
    if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onresult = (e) => {
            messageInput.value = e.results[0][0].transcript;
        };
        
        recognition.onerror = () => alert('Voice recognition failed');
        recognition.start();
    } else {
        alert('Voice input not supported in this browser');
    }
}

function exportChat() {
    const chatText = chatHistory.map(msg => `${msg.type.toUpperCase()}: ${msg.content}`).join('\n\n');
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-chat-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

function toggleQuickStarters() {
    const panel = document.getElementById('quick-starters');
    panel.classList.toggle('hidden');
}

function clearChat() {
    chatMessages.innerHTML = '';
    chatHistory = [];
    sessionStorage.removeItem('chatHistory');
}

function loadChatHistory() {
    chatHistory.forEach(msg => {
        addMessage(msg.content, msg.type === 'user');
    });
}

function saveChatHistory() {
    sessionStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

function autoScroll() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function renderSymptomResponse(rawText, container, isError = false) {
    container.innerHTML = '';

    if (!rawText || rawText.trim().length === 0) {
        container.innerHTML = '<div class="symptom-response-card"><p>No results returned from the AI.</p></div>';
        return;
    }

    const normalized = rawText.replace(/\r\n/g, '\n').trim();

    const chunks = normalized.split(/\n{2,}/).map(c => c.trim()).filter(Boolean);

    if (chunks.length === 0) {
        container.innerHTML = `<div class="symptom-response-card ${isError ? 'error' : ''}"><p>${escapeHtml(normalized)}</p></div>`;
        return;
    }

    container.innerHTML = chunks.map((chunk, index) => {
        const lines = chunk.split('\n').map(l => l.trim()).filter(Boolean);
        let title = '';
        let body = '';

        if (lines.length > 1 && /^\s*(Direct answer|Possible causes|When to seek help|Disclaimer|Takeaway)/i.test(lines[0])) {
            title = lines[0];
            body = lines.slice(1).join('<br>');
        } else if (lines.length > 1) {
            title = `Insight ${index + 1}`;
            body = lines.join('<br>');
        } else {
            title = `Insight ${index + 1}`;
            body = escapeHtml(lines[0]);
        }

        return `
            <div class="symptom-response-card ${isError ? 'error' : ''}">
                <h4>${escapeHtml(title)}</h4>
                <p>${body}</p>
            </div>
        `;
    }).join('');
}

function escapeHtml(text) {
    const temp = document.createElement('div');
    temp.textContent = text;
    return temp.innerHTML;
}

// Forms
function initForms() {
    console.log('Initializing forms...');
    // Symptom checker - proper backend integration
    const symptomForm = document.getElementById('symptom-form');
    console.log('Symptom form element:', symptomForm);
    if (symptomForm) {
        symptomForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Symptom form submitted');

            const text = document.getElementById('symptom-desc').value.trim();
            console.log('Symptom text:', text);
            if (!text) {
                console.log('No symptom text provided');
                return;
            }

            const resultBox = document.getElementById('symptom-results');
            const loading = document.getElementById('symptom-loading');
            const analysisCard = document.getElementById('symptom-analysis');

            // Show loading
            loading.classList.remove('hidden');
            resultBox.innerText = '';
            console.log('Showing loading indicator');

            try {
                console.log('Sending request to backend...');
                const res = await fetch('http://127.0.0.1:5000/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: text,
                        feature: 'symptom'
                    })
                });

                console.log('Response status:', res.status);
                if (!res.ok) {
                    throw new Error(`Backend request failed: ${res.status}`);
                }

                const data = await res.json();
                console.log('Response data:', data);

                loading.classList.add('hidden');
                analysisCard.classList.remove('hidden');

                const replyText = typeof data === 'string' ? data : (data.reply || data.error || 'No response from backend');
                renderSymptomResponse(replyText, resultBox);
                console.log('Results displayed successfully');

            } catch (error) {
                console.error('Symptom analysis error:', error);
                loading.classList.add('hidden');
                analysisCard.classList.remove('hidden');
                renderSymptomResponse(`Error: ${error.message}. Please check if backend is running.`, resultBox, true);
            }
        });
        console.log('Symptom form event listener attached');
    } else {
        console.error('Symptom form not found');
    }

    // New analysis button
    const newAnalysisBtn = document.getElementById('new-symptom-analysis');
    if (newAnalysisBtn) {
        newAnalysisBtn.addEventListener('click', () => {
            document.getElementById('symptom-desc').value = '';
            document.getElementById('symptom-analysis').classList.add('hidden');
        });
    }

    // Enhanced Medicine tracker
    medicineForm.addEventListener('submit', addMedication);
    loadMedications();
}

function addMedication(e) {
    e.preventDefault();
    const formData = new FormData(medicineForm);
    const med = {
        id: Date.now(),
        name: document.getElementById('med-name').value,
        dosage: document.getElementById('med-dosage').value || 'N/A',
        time: document.getElementById('med-time').value,
        frequency: document.getElementById('med-frequency').value,
        notes: document.getElementById('med-notes').value,
        taken: false,
        created: new Date().toISOString()
    };
    
    if (!med.name || !med.time) return;
    
    const medications = JSON.parse(localStorage.getItem('medications') || '[]');
    medications.unshift(med);
    localStorage.setItem('medications', JSON.stringify(medications));
    
    medicineForm.reset();
    renderMedications();
    updateStats();
}

function renderMedications() {
    const medications = JSON.parse(localStorage.getItem('medications') || '[]');
    
    // Update grid
    medicineGrid.innerHTML = '';
    medications.forEach(med => {
        const card = createMedCard(med);
        medicineGrid.appendChild(card);
    });
    
    // Update timeline (upcoming today)
    const today = new Date().toDateString();
    const upcoming = medications.filter(med => {
        const medTime = new Date(med.time);
        return !med.taken && medTime.toDateString() === today;
    }).sort((a, b) => new Date('1970/01/01 ' + a.time) - new Date('1970/01/01 ' + b.time));
    
    timelineList.innerHTML = '';
    upcoming.forEach(med => {
        const timelineItem = document.createElement('div');
        timelineItem.className = 'med-time-badge due-soon';
        timelineItem.innerHTML = `<i class="fas fa-clock"></i> ${med.name} at ${med.time}`;
        timelineList.appendChild(timelineItem);
    });
    
    // Toggle empty state
    emptyState.style.display = medications.length === 0 ? 'block' : 'none';
}

function createMedCard(med) {
    const now = new Date();
    const medTime = new Date(now.toDateString() + ' ' + med.time);
    const timeDiff = medTime - now;
    const isDueSoon = timeDiff > 0 && timeDiff < 30 * 60 * 1000; // 30 min
    const relativeTime = timeDiff > 0 ? `${Math.round(timeDiff / 60000)}min` : 'Overdue';
    
    const card = document.createElement('div');
    card.className = `med-card ${isDueSoon ? 'due-soon' : ''}`;
    card.innerHTML = `
        <div class="med-icon"><i class="fas fa-pills"></i></div>
        <h3 class="med-name">${med.name}</h3>
        <div class="med-time-badge">
            <i class="fas fa-clock"></i> ${med.time} (${relativeTime})
        </div>
        <div class="med-details">
            <span class="dosage-pill">${med.dosage}</span>
            <span class="freq-badge">${med.frequency}</span>
        </div>
        ${med.notes ? `<p class="med-notes">${med.notes}</p>` : ''}
        <div class="card-actions">
            <button class="btn-take" onclick="markTaken(${med.id})">
                ${med.taken ? '✅ Taken' : '💊 Take Now'}
            </button>
            <button class="btn-delete" onclick="deleteMedication(${med.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    return card;
}

function markTaken(id) {
    const medications = JSON.parse(localStorage.getItem('medications') || '[]');
    const medIndex = medications.findIndex(m => m.id === id);
    if (medIndex !== -1) {
        medications[medIndex].taken = true;
        localStorage.setItem('medications', JSON.stringify(medications));
        renderMedications();
        updateStats();
        if (Notification.permission === 'granted') {
            new Notification('Medication Marked!', { body: medications[medIndex].name + ' logged.' });
        }
    }
}

function deleteMedication(id) {
    if (confirm('Delete this medication?')) {
        const medications = JSON.parse(localStorage.getItem('medications') || '[]');
        const filtered = medications.filter(m => m.id !== id);
        localStorage.setItem('medications', JSON.stringify(filtered));
        renderMedications();
        updateStats();
    }
}

function updateStats() {
    const meds = JSON.parse(localStorage.getItem('medications') || '[]');
    const today = new Date().toDateString();
    const todayMeds = meds.filter(med => new Date(med.created).toDateString() === today).length;
    const upcoming = meds.filter(med => {
        const medTime = new Date(new Date().toDateString() + ' ' + med.time);
        return !med.taken && medTime > new Date();
    }).length;
    
    todayMedsEl.textContent = todayMeds;
    upcomingMedsEl.textContent = upcoming;
}

function loadMedications() {
    renderMedications();
    updateStats();
    
    // Request notification permission
    if (Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Check for due meds every minute
    setInterval(() => {
        renderMedications();
        updateStats();
    }, 60000);
}

// Profile form
document.querySelector('#profile form').addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Profile saved!\n(Uses local storage in full version)');
});
