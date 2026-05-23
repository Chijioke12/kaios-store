const DB_URL = "https://kaios-hub-default-rtdb.firebaseio.com/directory.json";

let state = {
    view: 'LOADING',
    items: [],
    filteredItems: [],
    tab: 'App',
    isSearchOpen: false, // Tracks if the search bar is visible
    searchQuery: '',
    listIndex: 0, 
    modalIndex: 0,
    activeItem: null
};

const appRoot = document.getElementById('app-root');

async function fetchDirectory() {
    try {
        const response = await fetch(DB_URL);
        if (!response.ok) throw new Error("Network response was not ok");
        
        const data = await response.json();
        
        if (data) {
            state.items = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        } else {
            state.items = [];
        }
        
        state.view = 'HUB';
        renderHubFull(); 
        updateHubUI();   
    } catch (error) {
        state.view = 'ERROR';
        appRoot.innerHTML = `<div class="header">KaiOS Store</div><div class="message">Connection failed.<br>Press Enter to retry.</div>`;
    }
}

function generateIconHtml(item) {
    let domain = "";
    try { domain = new URL(item.url).hostname; } catch(e) { }
    if (domain) {
        const autoIconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        return `<div class="item-icon-wrapper"><img src="${autoIconUrl}" class="item-icon-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div class="item-icon-wrapper item-icon-fallback fallback-${item.category.toLowerCase()}" style="display:none; margin:0; width:100%; height:100%;">${item.category.charAt(0)}</div></div>`;
    } else {
        return `<div class="item-icon-wrapper item-icon-fallback fallback-${item.category.toLowerCase()}">${item.category.charAt(0)}</div>`;
    }
}

// --- RENDER LOGIC ---

function renderHubFull() {
    appRoot.innerHTML = `
        <div class="header">KaiOS Store</div>
        <div class="tabs">
            <div class="tab" id="tab-apps">Apps</div>
            <div class="tab" id="tab-games">Games</div>
        </div>
        <div class="search-container" id="search-container" style="display: none;">
            <input type="text" id="search-box" placeholder="Search..." value="${state.searchQuery}">
        </div>
        <div class="list-container" id="list-container"></div>
        
        <!-- Dynamic Softkey Bar -->
        <div class="softkey-bar" id="softkey-bar">
            <div class="sk-left" id="sk-left"></div>
            <div class="sk-center" id="sk-center">SELECT</div>
            <div class="sk-right" id="sk-right">SEARCH</div>
        </div>
    `;

    document.getElementById('search-box').addEventListener('input', (e) => {
        state.searchQuery = e.target.value.toLowerCase();
        state.listIndex = -1; 
        updateHubUI();
    });
}

function updateHubUI() {
    if (state.view !== 'HUB') return;

    // 1. Update Tabs & Search Visibility
    document.getElementById('tab-apps').className = state.tab === 'App' ? 'tab active' : 'tab';
    document.getElementById('tab-games').className = state.tab === 'Game' ? 'tab active' : 'tab';
    document.getElementById('search-container').style.display = state.isSearchOpen ? 'block' : 'none';

    // 2. Filter Items
    state.filteredItems = state.items.filter(item => 
        item.category === state.tab && 
        item.name.toLowerCase().includes(state.searchQuery)
    );

    // 3. Render List
    const listContainer = document.getElementById('list-container');
    if (state.filteredItems.length === 0) {
        listContainer.innerHTML = `<div class="message">No ${state.tab.toLowerCase()}s found.</div>`;
    } else {
        listContainer.innerHTML = state.filteredItems.map((item, index) => {
            const isFocused = index === state.listIndex ? 'focused' : '';
            return `
                <div class="item ${isFocused}" id="item-${index}">
                    ${generateIconHtml(item)}
                    <div class="item-text-container">
                        <span class="item-name">${item.name}</span>
                        <span class="item-category">${item.category}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 4. Update Softkeys based on state
    document.getElementById('sk-center').textContent = "SELECT";
    document.getElementById('sk-right').textContent = state.isSearchOpen ? "CLOSE" : "SEARCH";

    // 5. Handle D-pad Focus Visually
    const searchBox = document.getElementById('search-box');
    if (state.listIndex === -1 && state.isSearchOpen) {
        searchBox.focus();
        searchBox.classList.add('focused');
    } else {
        searchBox.blur();
        searchBox.classList.remove('focused');
        scrollToFocus('list-container', `item-${state.listIndex}`);
    }
}

function renderModal() {
    const modalHtml = `
        <div class="modal-overlay" id="modal-overlay">
            <div class="modal-content">
                <h3 class="modal-title">Open ${state.activeItem.name}</h3>
                <div class="modal-btn ${state.modalIndex === 0 ? 'focused' : ''}">Play Inside App</div>
                <div class="modal-btn ${state.modalIndex === 1 ? 'focused' : ''}">Open in Browser</div>
            </div>
        </div>
    `;
    appRoot.insertAdjacentHTML('beforeend', modalHtml);
    
    // Update Softkeys for Modal
    document.getElementById('sk-center').textContent = "SELECT";
    document.getElementById('sk-right').textContent = "CANCEL";
}

function removeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.remove();
    updateHubUI(); // Restores the HUB softkey labels
}

function scrollToFocus(containerId, elementId) {
    const container = document.getElementById(containerId);
    const el = document.getElementById(elementId);
    if (container && el) {
        const top = el.offsetTop;
        const bottom = top + el.offsetHeight;
        const viewTop = container.scrollTop;
        const viewBottom = viewTop + container.offsetHeight;

        if (top < viewTop) {
            container.scrollTop = top;
        } else if (bottom > viewBottom) {
            container.scrollTop = bottom - container.offsetHeight;
        }
    }
}

// --- LAUNCH LOGIC ---
function launchExternal(url) {
    if (window.MozActivity) {
        let activity = new window.MozActivity({ name: "view", data: { type: "url", url: url } });
        activity.onerror = function() { window.open(url, '_blank'); };
    } else {
        window.open(url, '_blank'); 
    }
    state.view = 'HUB';
    removeModal();
}

function launchInternal() {
    state.view = 'IFRAME';
    // RAM SAVE: Wipes everything, including the softkeys, out of the DOM
    appRoot.innerHTML = `<iframe src="${state.activeItem.url}" class="iframe-container" mozbrowser="true" remote="true"></iframe>`;
}


// --- HARDWARE KEYBOARD EVENT LISTENER ---
window.addEventListener('keydown', (e) => {
    const key = e.key;

    if (state.view === 'LOADING') return;

    if (state.view === 'ERROR') {
        if (key === 'Enter') { state.view = 'LOADING'; fetchDirectory(); }
        return;
    }

    if (state.view === 'IFRAME') {
        if (key === 'Backspace' || key === 'BrowserBack' || key === 'Escape') {
            e.preventDefault(); 
            state.view = 'HUB';
            renderHubFull(); 
            updateHubUI();
        }
        return;
    }

    if (state.view === 'HUB') {
        // RIGHT SOFT KEY: Toggle Search
        if (key === 'SoftRight' || key === 'F2') {
            e.preventDefault();
            if (state.isSearchOpen) {
                // Close Search
                state.isSearchOpen = false;
                state.searchQuery = '';
                document.getElementById('search-box').value = '';
                state.listIndex = state.filteredItems.length > 0 ? 0 : -1;
            } else {
                // Open Search
                state.isSearchOpen = true;
                state.listIndex = -1; // Focus the search box
            }
            updateHubUI();
            return;
        }

        // Tab Switching (Left/Right)
        if (key === 'ArrowRight' || key === 'ArrowLeft') {
            e.preventDefault();
            state.tab = state.tab === 'App' ? 'Game' : 'App';
            state.listIndex = 0;
            state.isSearchOpen = false; // Auto-close search when changing tabs
            state.searchQuery = '';
            document.getElementById('search-box').value = '';
            updateHubUI();
        }
        // Navigate Down
        else if (key === 'ArrowDown') {
            if (state.listIndex < state.filteredItems.length - 1) {
                e.preventDefault();
                state.listIndex++;
                updateHubUI();
            }
        }
        // Navigate Up
        else if (key === 'ArrowUp') {
            if (state.listIndex > -1) {
                e.preventDefault();
                state.listIndex--;
                updateHubUI();
            }
        }
        // CENTER KEY / Selection (Enter)
        else if (key === 'Enter') {
            if (state.listIndex === -1) {
                // Drop focus down to the first result after typing
                e.preventDefault();
                if (state.filteredItems.length > 0) {
                    state.listIndex = 0;
                    updateHubUI();
                }
            } 
            else if (state.filteredItems.length > 0) {
                e.preventDefault();
                state.activeItem = state.filteredItems[state.listIndex];
                state.modalIndex = 0; 
                state.view = 'MODAL';
                renderModal();
            }
        }
        return;
    }

    if (state.view === 'MODAL') {
        if (key === 'ArrowDown') { e.preventDefault(); state.modalIndex = 1; removeModal(); renderModal(); }
        else if (key === 'ArrowUp') { e.preventDefault(); state.modalIndex = 0; removeModal(); renderModal(); }
        
        // CENTER KEY: Launch
        else if (key === 'Enter') {
            e.preventDefault();
            if (state.modalIndex === 0) launchInternal();
            else launchExternal(state.activeItem.url);
        }
        
        // RIGHT SOFT KEY / BACK: Cancel Modal
        else if (key === 'SoftRight' || key === 'F2' || key === 'Backspace' || key === 'BrowserBack' || key === 'Escape') {
            e.preventDefault();
            state.view = 'HUB';
            removeModal();
        }
        return;
    }
});

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => { fetchDirectory(); });
} else {
    fetchDirectory();
}
