// API Base URL
const API_BASE = '/api';

// Confirmation Modal
function showConfirmModal(message, title = 'Confirm Action') {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const confirmBtn = document.getElementById('modal-confirm');
        const cancelBtn = document.getElementById('modal-cancel');

        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modal.classList.add('show');

        const handleConfirm = () => {
            modal.classList.remove('show');
            cleanup();
            resolve(true);
        };

        const handleCancel = () => {
            modal.classList.remove('show');
            cleanup();
            resolve(false);
        };

        const cleanup = () => {
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            modal.removeEventListener('click', handleClickOutside);
        };

        const handleClickOutside = (e) => {
            if (e.target === modal) {
                handleCancel();
            }
        };

        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        modal.addEventListener('click', handleClickOutside);
    });
}

// Tab Navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update active tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
        
        // Load data for the tab
        if (tabName === 'manage') {
            loadQuizzes();
        } else if (tabName === 'pdf') {
            loadGeminiApiKey();
        }
    });
});

// Show status message
function showStatus(elementId, message, type = 'info') {
    const statusEl = document.getElementById(elementId);
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        statusEl.className = 'status-message';
    }, 5000);
}

// Load Gemini API Key from environment
async function loadGeminiApiKey() {
    const keyInput = document.getElementById('geminiApiKey');
    const keyInfo = document.getElementById('gemini-key-info');
    
    try {
        const response = await fetch(`${API_BASE}/gemini-key`);
        if (response.ok) {
            const data = await response.json();
            if (data.hasKey && data.apiKey) {
                keyInput.value = data.apiKey;
                keyInput.placeholder = 'API key loaded from .env file';
                keyInfo.innerHTML = `<span style="color: #059669;"><i class="fas fa-check-circle"></i> API key loaded from .env file (${data.maskedKey})</span>`;
            } else {
                keyInput.placeholder = 'Enter your Gemini API key or set GEMINI_API_KEY in .env';
                keyInfo.innerHTML = 'Get your free API key from <a href="https://makersuite.google.com/app/apikey" target="_blank">Google AI Studio</a> or set it in .env file';
            }
        } else {
            keyInput.placeholder = 'Enter your Gemini API key';
        }
    } catch (error) {
        // Silently fail - user can enter key manually
        keyInput.placeholder = 'Enter your Gemini API key';
        console.log('Could not load API key from environment');
    }
}

// Configuration Form
document.getElementById('config-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        projectPath: document.getElementById('projectPath').value,
        templateFile: document.getElementById('templateFile').value,
        allQuizzezJsonPath: document.getElementById('allQuizzezJsonPath').value
    };
    
    try {
        const response = await fetch(`${API_BASE}/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showStatus('config-status', '✅ Configuration saved successfully!', 'success');
        } else {
            showStatus('config-status', `❌ Error: ${data.error}`, 'error');
        }
    } catch (error) {
        showStatus('config-status', `❌ Error: ${error.message}`, 'error');
    }
});

// Load Configuration
document.getElementById('load-config-btn').addEventListener('click', async () => {
    try {
        const response = await fetch(`${API_BASE}/config`);
        
        if (response.ok) {
            const config = await response.json();
            document.getElementById('projectPath').value = config.projectPath || '';
            document.getElementById('templateFile').value = config.templateFile || '';
            document.getElementById('allQuizzezJsonPath').value = config.allQuizzezJsonPath || '';
            showStatus('config-status', '✅ Configuration loaded successfully!', 'success');
        } else {
            const data = await response.json();
            showStatus('config-status', `⚠️ ${data.error}`, 'info');
        }
    } catch (error) {
        showStatus('config-status', `❌ Error: ${error.message}`, 'error');
    }
});

// Add Quiz Form
document.getElementById('add-quiz-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('quizName', document.getElementById('quizName').value);
    formData.append('year', document.getElementById('year').value);
    formData.append('quizFor', document.getElementById('quizFor').value);
    formData.append('questionType', document.getElementById('questionType').value);
    formData.append('published', document.getElementById('published').checked);
    
    const fileInput = document.getElementById('jsonFile');
    if (fileInput.files.length > 0) {
        formData.append('jsonFile', fileInput.files[0]);
    }
    
    try {
        showStatus('add-status', '⏳ Adding quiz...', 'info');
        
        const response = await fetch(`${API_BASE}/quizzes`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showStatus('add-status', 
                `✅ Quiz added successfully! (${data.questionsCount} questions)`, 
                'success'
            );
            document.getElementById('add-quiz-form').reset();
        } else {
            showStatus('add-status', `❌ Error: ${data.error}`, 'error');
        }
    } catch (error) {
        showStatus('add-status', `❌ Error: ${error.message}`, 'error');
    }
});

// PDF to Quiz Form
document.getElementById('pdf-quiz-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('quizName', document.getElementById('pdfQuizName').value);
    formData.append('year', document.getElementById('pdfYear').value);
    formData.append('quizFor', document.getElementById('pdfQuizFor').value);
    formData.append('questionType', document.getElementById('pdfQuestionType').value);
    formData.append('published', document.getElementById('pdfPublished').checked);
    
    const apiKey = document.getElementById('geminiApiKey').value;
    if (apiKey) {
        formData.append('geminiApiKey', apiKey);
    }
    
    const fileInput = document.getElementById('pdfFile');
    if (fileInput.files.length > 0) {
        formData.append('pdfFile', fileInput.files[0]);
    }
    
    try {
        showStatus('pdf-status', '⏳ Extracting questions from PDF... This may take a minute.', 'info');
        
        const response = await fetch(`${API_BASE}/quizzes/from-pdf`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showStatus('pdf-status', 
                `✅ Quiz created successfully! Extracted ${data.questionsCount} questions from PDF.`, 
                'success'
            );
            document.getElementById('pdf-quiz-form').reset();
        } else {
            showStatus('pdf-status', `❌ Error: ${data.error}`, 'error');
        }
    } catch (error) {
        showStatus('pdf-status', `❌ Error: ${error.message}`, 'error');
    }
});

// Load and Display Quizzes
async function loadQuizzes(filterYear = '') {
    const container = document.getElementById('quizzes-list');
    container.innerHTML = '<p class="loading">Loading quizzes...</p>';
    
    try {
        const response = await fetch(`${API_BASE}/quizzes`);
        
        if (!response.ok) {
            const data = await response.json();
            container.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${data.error}</p></div>`;
            return;
        }
        
        const allQuizzes = await response.json();
        
        if (!allQuizzes || allQuizzes.length === 0 || !allQuizzes[0].Year) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No Quizzes Found</h3>
                    <p>Add your first quiz using the "Add Quiz" tab.</p>
                </div>
            `;
            return;
        }
        
        const yearData = allQuizzes[0].Year;
        const years = Object.keys(yearData).sort();
        
        if (years.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>No Quizzes Found</h3>
                    <p>Add your first quiz using the "Add Quiz" tab.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        years.forEach(year => {
            if (filterYear && year !== filterYear) return;
            
            const yearSection = document.createElement('div');
            yearSection.className = 'year-section';
            
            const yearTitle = document.createElement('h3');
            yearTitle.className = 'year-title';
            yearTitle.textContent = `${year} Year`;
            yearSection.appendChild(yearTitle);
            
            const subjects = yearData[year];
            
            Object.keys(subjects).forEach(subject => {
                const subjectGroup = document.createElement('div');
                subjectGroup.className = 'subject-group';
                
                const subjectName = document.createElement('div');
                subjectName.className = 'subject-name';
                subjectName.textContent = subject;
                subjectGroup.appendChild(subjectName);
                
                const examTypes = subjects[subject];
                
                Object.keys(examTypes).forEach(examType => {
                    const quizzes = examTypes[examType];
                    
                    quizzes.forEach(quiz => {
                        const quizItem = document.createElement('div');
                        quizItem.className = 'quiz-item';
                        
                        quizItem.innerHTML = `
                            <input type="checkbox" class="quiz-checkbox" 
                                   data-year="${year}"
                                   data-subject="${subject}"
                                   data-examtype="${examType}"
                                   data-quiztype="${quiz.type}"
                                   data-path="${quiz.path || ''}">
                            <div class="quiz-info">
                                <div class="quiz-title">${subject} - ${examType} - ${quiz.type}</div>
                                <div class="quiz-meta">
                                    <span class="quiz-badge badge-type">${quiz.type}</span>
                                    <span class="quiz-badge ${quiz.published ? 'badge-published' : 'badge-unpublished'}">
                                        ${quiz.published ? 'Published' : 'Unpublished'}
                                    </span>
                                    ${quiz.path ? `<span>Path: ${quiz.path}</span>` : ''}
                                </div>
                            </div>
                        `;
                        
                        subjectGroup.appendChild(quizItem);
                    });
                });
                
                yearSection.appendChild(subjectGroup);
            });
            
            container.appendChild(yearSection);
        });
        
        // Update remove button visibility
        updateRemoveButtonVisibility();
        
        // Add event listeners to checkboxes
        document.querySelectorAll('.quiz-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', updateRemoveButtonVisibility);
        });
        
    } catch (error) {
        container.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${error.message}</p></div>`;
    }
}

// Update remove button visibility based on selection
function updateRemoveButtonVisibility() {
    const selectedCheckboxes = document.querySelectorAll('.quiz-checkbox:checked');
    const removeBtn = document.getElementById('remove-selected-btn');
    
    if (selectedCheckboxes.length > 0) {
        removeBtn.style.display = 'block';
        removeBtn.textContent = `🗑️ Remove Selected (${selectedCheckboxes.length})`;
    } else {
        removeBtn.style.display = 'none';
    }
}

// Filter quizzes by year
document.getElementById('filter-year').addEventListener('change', (e) => {
    loadQuizzes(e.target.value);
});

// Remove selected quizzes
document.getElementById('remove-selected-btn').addEventListener('click', async () => {
    const selectedCheckboxes = document.querySelectorAll('.quiz-checkbox:checked');
    
    if (selectedCheckboxes.length === 0) return;
    
    const confirmed = await showConfirmModal(
        `Are you sure you want to remove ${selectedCheckboxes.length} quiz(zes)? This action cannot be undone.`,
        'Remove Quizzes'
    );
    
    if (!confirmed) return;
    
    const quizzesToRemove = Array.from(selectedCheckboxes).map(checkbox => ({
        year: checkbox.dataset.year,
        subject: checkbox.dataset.subject,
        examType: checkbox.dataset.examtype,
        quizType: checkbox.dataset.quiztype,
        path: checkbox.dataset.path
    }));
    
    try {
        showStatus('manage-status', '⏳ Removing quizzes...', 'info');
        
        const response = await fetch(`${API_BASE}/quizzes`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quizzes: quizzesToRemove })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showStatus('manage-status', 
                `✅ Successfully removed ${data.removed} quiz(zes)!`, 
                'success'
            );
            loadQuizzes();
        } else {
            showStatus('manage-status', `❌ Error: ${data.error}`, 'error');
        }
    } catch (error) {
        showStatus('manage-status', `❌ Error: ${error.message}`, 'error');
    }
});

// Load configuration on page load
document.getElementById('load-config-btn').click();
