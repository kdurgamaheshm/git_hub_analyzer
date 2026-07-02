// API Base URL (blank means relative to current host)
const API_BASE = '';

// Programming language color mapping (GitHub defaults)
const LANGUAGE_COLORS = {
  'JavaScript': '#f1e05a',
  'TypeScript': '#3178c6',
  'Python': '#3572A5',
  'HTML': '#e34c26',
  'CSS': '#563d7c',
  'Ruby': '#701516',
  'Go': '#00ADD8',
  'Java': '#b07219',
  'C++': '#f34b7d',
  'C#': '#178600',
  'PHP': '#4F5D95',
  'Rust': '#dea584',
  'Shell': '#89e051',
  'Swift': '#F05138',
  'Kotlin': '#a97bff',
  'Objective-C': '#438eff',
  'C': '#555555',
  'None': '#64748b'
};

// Returns color for a language, dynamically generating one if not mapped
const getLanguageColor = (lang) => {
  if (!lang || lang === 'None') return LANGUAGE_COLORS['None'];
  if (LANGUAGE_COLORS[lang]) return LANGUAGE_COLORS[lang];
  
  // Simple hashing algorithm to generate a consistent hex color code
  let hash = 0;
  for (let i = 0; i < lang.length; i++) {
    hash = lang.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).slice(-2);
  }
  return color;
};

// Formats UTC date string to relative time (e.g., "Analyzed 2 hours ago" or standard format)
const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (isNaN(seconds) || seconds < 0) {
    return 'Just now';
  }
  
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  
  // Return month day representation
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

// DOM Elements
const analyzeForm = document.getElementById('analyze-form');
const usernameInput = document.getElementById('username-input');
const submitBtn = document.getElementById('submit-btn');
const btnText = document.getElementById('btn-text');
const btnSpinner = document.getElementById('btn-spinner');
const messageContainer = document.getElementById('message-container');
const profilesGrid = document.getElementById('profiles-grid');
const profilesCount = document.getElementById('profiles-count');
const refreshBtn = document.getElementById('refresh-btn');
const insightsModal = document.getElementById('insights-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalBodyContent = document.getElementById('modal-body-content');

// Helper to show API status message
const showStatusMessage = (text, isSuccess) => {
  messageContainer.textContent = text;
  messageContainer.className = `message-container ${isSuccess ? 'message-success' : 'message-error'}`;
  
  // Auto-hide error messages after 10 seconds, success after 5 seconds
  setTimeout(() => {
    messageContainer.style.display = 'none';
  }, isSuccess ? 5000 : 10000);
};

// Fetch and render profiles from MySQL
const fetchAndRenderProfiles = async () => {
  // Render skeleton loading cards
  profilesGrid.innerHTML = Array(3).fill(0).map(() => `
    <div class="glass-card skeleton-card"></div>
  `).join('');
  
  try {
    const res = await fetch(`${API_BASE}/api/profiles`);
    if (!res.ok) throw new Error('Failed to retrieve profiles database entries.');
    
    const data = await res.json();
    profilesCount.textContent = `${data.count} Profile${data.count === 1 ? '' : 's'}`;
    
    if (data.count === 0) {
      profilesGrid.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-database empty-icon"></i>
          <p>No profiles analyzed yet. Use the search bar above to fetch your first GitHub profile.</p>
        </div>
      `;
      return;
    }
    
    // Sort profiles by analyzed_at descending (handled in API, but safety first)
    profilesGrid.innerHTML = data.profiles.map(profile => {
      const langColor = getLanguageColor(profile.primary_language);
      const relativeTime = formatTimeAgo(profile.analyzed_at);
      
      return `
        <div class="glass-card profile-card" onclick="viewProfileDetails('${profile.username}')">
          <div class="card-header">
            <img class="card-avatar" src="${profile.avatar_url}" alt="${profile.username} Avatar">
            <div class="card-title-area">
              <h3>${profile.name || profile.username}</h3>
              <p>@${profile.username}</p>
            </div>
            <button class="card-delete-btn" onclick="deleteProfileRecord(event, '${profile.username}')" title="Delete record">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
          
          <div class="card-bio">
            ${profile.bio || '<i>No biography provided.</i>'}
          </div>
          
          <div class="card-stats">
            <div class="stat-item">
              <span class="stat-val">${profile.public_repos}</span>
              <span class="stat-lbl">Repos</span>
            </div>
            <div class="stat-item">
              <span class="stat-val">${profile.followers}</span>
              <span class="stat-lbl">Followers</span>
            </div>
            <div class="stat-item">
              <span class="stat-val">${profile.total_stars}</span>
              <span class="stat-lbl">Stars</span>
            </div>
          </div>
          
          <div class="card-footer">
            <div class="language-badge">
              <span class="lang-dot" style="background-color: ${langColor};"></span>
              <span>${profile.primary_language || 'None'}</span>
            </div>
            <span class="time-ago">${relativeTime}</span>
          </div>
        </div>
      `;
    }).join('');
    
  } catch (error) {
    console.error(error);
    profilesGrid.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-triangle-exclamation empty-icon" style="color: var(--color-danger);"></i>
        <p>Error connecting to database APIs: ${error.message}</p>
      </div>
    `;
  }
};

// Handle Form Submission (Analyze New User)
analyzeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = usernameInput.value.trim();
  if (!username) return;
  
  // Set UI Loading State
  usernameInput.disabled = true;
  submitBtn.disabled = true;
  btnText.textContent = 'Analyzing...';
  btnSpinner.classList.remove('hidden');
  messageContainer.style.display = 'none';
  
  try {
    const res = await fetch(`${API_BASE}/api/analyze/${encodeURIComponent(username)}`, {
      method: 'POST'
    });
    
    const result = await res.json();
    
    if (!res.ok) {
      throw new Error(result.error || result.details || 'Analysis execution failed');
    }
    
    showStatusMessage(result.message, true);
    usernameInput.value = '';
    
    // Refresh List
    await fetchAndRenderProfiles();
    
  } catch (error) {
    console.error(error);
    showStatusMessage(error.message, false);
  } finally {
    // Restore UI State
    usernameInput.disabled = false;
    submitBtn.disabled = false;
    btnText.textContent = 'Analyze Profile';
    btnSpinner.classList.add('hidden');
  }
});

// Delete a Stored Record
const deleteProfileRecord = async (e, username) => {
  e.stopPropagation(); // Prevent card click opening the modal
  
  if (!confirm(`Are you sure you want to delete the local analysis data for '${username}'?`)) {
    return;
  }
  
  try {
    const res = await fetch(`${API_BASE}/api/profiles/${encodeURIComponent(username)}`, {
      method: 'DELETE'
    });
    const result = await res.json();
    
    if (!res.ok) throw new Error(result.error || 'Delete failed');
    
    showStatusMessage(`Successfully deleted record for '${username}'.`, true);
    await fetchAndRenderProfiles();
    
  } catch (error) {
    console.error(error);
    showStatusMessage(error.message, false);
  }
};

// Fetch & View Detailed Insights Modal
const viewProfileDetails = async (username) => {
  try {
    const res = await fetch(`${API_BASE}/api/profiles/${encodeURIComponent(username)}`);
    if (!res.ok) throw new Error('Could not fetch insights details.');
    
    const result = await res.json();
    const profile = result.profile;
    
    // Process Language Distribution Percentage
    const languages = profile.languages_json || {};
    const totalReposWithLang = Object.values(languages).reduce((sum, count) => sum + count, 0);
    
    let languageHtml = '';
    if (Object.keys(languages).length > 0) {
      languageHtml = Object.entries(languages)
        .sort((a, b) => b[1] - a[1]) // Sort by highest count
        .map(([lang, count]) => {
          const pct = totalReposWithLang > 0 ? Math.round((count / totalReposWithLang) * 100) : 0;
          const color = getLanguageColor(lang);
          return `
            <div class="lang-row">
              <div class="lang-row-header">
                <span>${lang} (${count} repo${count === 1 ? '' : 's'})</span>
                <span class="lang-percentage">${pct}%</span>
              </div>
              <div class="progress-bar-container">
                <div class="progress-bar-fill" style="width: ${pct}%; background-color: ${color};"></div>
              </div>
            </div>
          `;
        }).join('');
    } else {
      languageHtml = '<p style="color: var(--text-dark); font-style: italic;">No repository programming languages detected.</p>';
    }
    
    // Inject Content into Modal Body
    modalBodyContent.innerHTML = `
      <div class="modal-profile-header">
        <img class="modal-avatar" src="${profile.avatar_url}" alt="${profile.username} Avatar">
        <div class="modal-profile-meta">
          <h2>${profile.name || profile.username}</h2>
          <a href="https://github.com/${profile.username}" target="_blank" class="modal-username-link">
            @${profile.username} <i class="fa-solid fa-up-right-from-square"></i>
          </a>
          <p class="modal-bio">${profile.bio || 'No bio available.'}</p>
          <div class="modal-location-blog">
            ${profile.location ? `<span><i class="fa-solid fa-location-dot"></i> ${profile.location}</span>` : ''}
            ${profile.blog ? `<span><i class="fa-solid fa-link"></i> <a href="${profile.blog.startsWith('http') ? profile.blog : 'https://' + profile.blog}" target="_blank">${profile.blog}</a></span>` : ''}
          </div>
        </div>
      </div>
      
      <!-- Stats Summary -->
      <div class="modal-stats-grid">
        <div class="modal-stat-card">
          <i class="fa-solid fa-book-bookmark modal-stat-icon"></i>
          <div class="modal-stat-value">${profile.public_repos}</div>
          <div class="modal-stat-label">Public Repos</div>
        </div>
        <div class="modal-stat-card">
          <i class="fa-solid fa-users modal-stat-icon"></i>
          <div class="modal-stat-value">${profile.followers}</div>
          <div class="modal-stat-label">Followers</div>
        </div>
        <div class="modal-stat-card">
          <i class="fa-solid fa-star modal-stat-icon" style="color: #f59e0b;"></i>
          <div class="modal-stat-value">${profile.total_stars}</div>
          <div class="modal-stat-label">Total Stars</div>
        </div>
        <div class="modal-stat-card">
          <i class="fa-solid fa-code-fork modal-stat-icon" style="color: #a855f7;"></i>
          <div class="modal-stat-value">${profile.total_forks}</div>
          <div class="modal-stat-label">Total Forks</div>
        </div>
      </div>
      
      <!-- Calculated Insights -->
      <div>
        <h3 class="insights-section-title">
          <i class="fa-solid fa-chart-pie"></i> Calculated Profile Insights
        </h3>
        
        <div class="highlight-grid">
          <div class="highlight-card">
            <h4>Primary Language</h4>
            <span class="repo-name" style="color: ${getLanguageColor(profile.primary_language)}">
              <span class="lang-dot" style="display:inline-block; margin-right: 6px; background-color: ${getLanguageColor(profile.primary_language)}"></span>
              ${profile.primary_language}
            </span>
            <p class="repo-lang">Most frequently used language in public repositories.</p>
          </div>
          
          <div class="highlight-card">
            <h4>Most Starred Repo</h4>
            <span class="repo-name">
              <a href="https://github.com/${profile.username}/${profile.most_starred_repo}" target="_blank" style="color: var(--color-primary); text-decoration: none;">
                ${profile.most_starred_repo}
              </a>
            </span>
            <p class="repo-lang">Repository with the highest number of stars.</p>
          </div>
        </div>
        
        <h3 class="insights-section-title">
          <i class="fa-solid fa-chart-column"></i> Programming Language Distribution
        </h3>
        
        <div class="languages-distribution">
          ${languageHtml}
        </div>
      </div>
    `;
    
    // Display Modal
    insightsModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Disable scroll under modal
    
  } catch (error) {
    console.error(error);
    alert(`Could not display insights modal: ${error.message}`);
  }
};

// Modal Operations
const closeModal = () => {
  insightsModal.classList.add('hidden');
  document.body.style.overflow = 'auto'; // Re-enable scroll
};

closeModalBtn.addEventListener('click', closeModal);
document.querySelector('.modal-backdrop').addEventListener('click', closeModal);

// Escape key to close modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !insightsModal.classList.contains('hidden')) {
    closeModal();
  }
});

// Refresh button trigger
refreshBtn.addEventListener('click', fetchAndRenderProfiles);

// Initial Load
window.addEventListener('DOMContentLoaded', fetchAndRenderProfiles);
