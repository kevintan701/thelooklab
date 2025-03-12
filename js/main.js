/**
 * LookLab - Main JavaScript
 * Handles navigation, dynamic content loading, and UI interactions
 */

document.addEventListener('DOMContentLoaded', function() {
    // Update the time in the status bar
    updateTime();
    setInterval(updateTime, 60000); // Update every minute
    
    // Set up navigation event listeners
    setupNavigation();
    
    // Initialize responsive iframe sizing
    adjustFrameHeight();
    window.addEventListener('resize', debounce(adjustFrameHeight, 100));
    
    // Check if in fullscreen mode and apply appropriate styles
    checkFullscreenMode();
    window.addEventListener('resize', debounce(checkFullscreenMode, 200));
    
    // Check browser compatibility and apply fixes if needed
    applyBrowserFixes();
});

/**
 * Applies specific fixes for different browsers to ensure proper rendering
 */
function applyBrowserFixes() {
    // Get browser info
    const userAgent = navigator.userAgent.toLowerCase();
    const isChrome = /chrome/.test(userAgent) && !/edge|edg/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|crmo/.test(userAgent);
    const isFirefox = /firefox/.test(userAgent);
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    
    const wrapper = document.querySelector('.mac-window-wrapper');
    
    // Apply Safari-specific fixes
    if (isSafari) {
        document.body.style.width = '100vw';
        document.body.style.height = '100vh';
        document.body.style.margin = '0';
        document.body.style.overflow = 'hidden';
        
        // Add Safari-specific class
        wrapper.classList.add('safari-browser');
    }
    
    // Apply iOS-specific fixes
    if (isIOS) {
        // Add iOS class for specific styling
        wrapper.classList.add('ios-device');
        
        // Handle iOS viewport issues
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        if (viewportMeta) {
            viewportMeta.setAttribute('content', 
                'width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0');
        }
    }
    
    // Log environment for debugging
    console.log('Browser environment:', {
        isChrome,
        isSafari,
        isFirefox,
        isIOS,
        viewport: {
            width: window.innerWidth,
            height: window.innerHeight
        }
    });
}

/**
 * Updates the current time in the status bar
 */
function updateTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    const timeString = `${formattedHours}:${formattedMinutes} ${ampm}`;
    
    document.getElementById('current-time').textContent = timeString;
}

/**
 * Debounce function to limit how often a function is called
 * @param {Function} func - The function to debounce
 * @param {number} wait - The time to wait in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

/**
 * Checks if the application is in fullscreen mode and applies appropriate styles
 */
function checkFullscreenMode() {
    const wrapper = document.querySelector('.mac-window-wrapper');
    if (!wrapper) return;
    
    // Check if window size matches screen size (fullscreen) or if window is small enough
    // to warrant fullscreen-like appearance
    const isFullScreen = 
        document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.mozFullScreenElement ||
        document.msFullscreenElement ||
        window.innerWidth <= 1440 ||
        window.matchMedia('(display-mode: fullscreen)').matches;
    
    if (isFullScreen) {
        wrapper.classList.add('fullscreen-mode');
        // Force body to be full size
        document.body.style.overflow = 'hidden';
        document.body.style.width = '100vw';
        document.body.style.height = '100vh';
        document.body.style.margin = '0';
        document.body.style.padding = '0';
    } else {
        if (window.innerWidth > 1440) {
            wrapper.classList.remove('fullscreen-mode');
        }
    }
    
    // Make sure frame is adjusted after mode change
    setTimeout(adjustFrameHeight, 100);
}

/**
 * Adjusts the iframe height to ensure it fills the available space
 */
function adjustFrameHeight() {
    const frame = document.getElementById('content-frame');
    const container = document.querySelector('.content-container');
    const appContainer = document.querySelector('.app-container');
    const statusBar = document.querySelector('.mac-status-bar');
    
    if (frame && container && appContainer && statusBar) {
        // Calculate heights based on viewport and elements
        const viewportHeight = window.innerHeight;
        const statusBarHeight = statusBar.offsetHeight || 30; // Fallback value
        const containerHeight = viewportHeight - statusBarHeight;
        
        // Apply calculated heights - use direct pixel values for more reliable rendering
        appContainer.style.height = `${containerHeight}px`;
        document.documentElement.style.setProperty('--status-bar-height', `${statusBarHeight}px`);
        
        // Set explicit dimensions for the frame
        frame.style.height = `${container.clientHeight}px`;
        frame.style.width = `${container.clientWidth}px`;
        
        // Try to access the iframe document to add scroll handling
        try {
            const frameDoc = frame.contentDocument || frame.contentWindow.document;
            
            // Add scroll event listeners to the iframe content if not already added
            if (!frameDoc.__scrollListenersAdded) {
                frameDoc.addEventListener('scroll', function() {
                    // Allow the iframe content to scroll independently
                    // No need to adjust frame height during scrolling
                });
                frameDoc.__scrollListenersAdded = true;
            }
            
            // Check if we need to make any specific elements scrollable
            const mainContent = frameDoc.querySelector('main, .main-content, .page-content, .content-container');
            if (mainContent) {
                mainContent.style.overflowY = 'auto';
                mainContent.style.height = 'auto';
                mainContent.style.minHeight = '100%';
            }
            
            // Ensure the body of the iframe can scroll
            frameDoc.body.style.overflowY = 'auto';
            frameDoc.body.style.height = 'auto';
            frameDoc.body.style.minHeight = '100%';
            
        } catch (e) {
            // Access might fail due to same-origin policy - that's ok, we've 
            // already injected styles on load
            console.log('Could not add scroll listeners to iframe content', e);
        }
    }
}

/**
 * Sets up navigation event listeners for sidebar items
 */
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const contentFrame = document.getElementById('content-frame');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Add loading state to iframe
            contentFrame.classList.add('loading');
            
            // Load corresponding page
            const pageName = this.getAttribute('data-page');
            
            // Special handling for AI Assistant page
            if (pageName === 'trends') {
                contentFrame.src = `pages/ai-assistant.html`;
            } else {
                contentFrame.src = `pages/${pageName}.html`;
            }
            
            // For all navigations, ensure the frame is properly sized after loading
            contentFrame.onload = function() {
                contentFrame.classList.remove('loading');
                adjustFrameHeight();
                
                // Also trigger a resize event in case any responsive elements need to adjust
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                }, 100);
            };
            
            // Handle special case for designers (integrated into discovery)
            if (pageName === 'designers') {
                contentFrame.src = 'pages/discovery.html';
                
                // Add a small delay to ensure the page is loaded before trying to access its content
                setTimeout(() => {
                    // Get the discovery page document
                    const discoveryDoc = contentFrame.contentDocument || contentFrame.contentWindow.document;
                    
                    // Find the designers tab and click it
                    const designersTab = discoveryDoc.querySelector('[data-target="designers-tab"]');
                    if (designersTab) {
                        designersTab.click();
                    }
                    
                    // Remove loading state
                    contentFrame.classList.remove('loading');
                }, 300);
            }
            
            // Handle special case for AI Assistant (formerly trends)
            if (pageName === 'trends') {
                // Update the page title to reflect AI Assistant
                document.title = 'LookLab - Fashion AI Assistant';
                
                // Add a small delay to ensure the page is loaded
                setTimeout(() => {
                    // Get the AI Assistant page document
                    const aiAssistantDoc = contentFrame.contentDocument || contentFrame.contentWindow.document;
                    
                    // Update any elements that might still reference "Trends"
                    const pageTitles = aiAssistantDoc.querySelectorAll('h1, h2');
                    pageTitles.forEach(title => {
                        if (title.textContent.includes('Trend')) {
                            // Keep "Trend Insights" as is since it's about trend data
                            if (!title.textContent.includes('Insights')) {
                                title.textContent = title.textContent.replace('Trend', 'AI Assistant');
                            }
                        }
                    });
                    
                    console.log('Navigated to AI Assistant page');
                    
                    // Remove loading state
                    contentFrame.classList.remove('loading');
                }, 300);
            }
        });
    });
    
    // Intercept navigation within the iframe to handle tab parameters
    contentFrame.addEventListener('load', function() {
        // Remove loading state when iframe content is fully loaded
        contentFrame.classList.remove('loading');
        
        const contentWindow = contentFrame.contentWindow;
        const href = contentWindow.location.href;
        
        // Check if the URL contains tab parameters
        if (href.includes('#')) {
            const tabId = href.split('#')[1];
            const tab = contentWindow.document.querySelector(`[data-target="${tabId}"]`);
            if (tab) {
                setTimeout(() => {
                    tab.click();
                }, 100);
            }
        }
        
        // Update active navigation item based on loaded page
        const pagePath = contentWindow.location.pathname;
        const pageFile = pagePath.split('/').pop();
        const pageName = pageFile.replace('.html', '');
        
        // Activate the corresponding nav item
        navItems.forEach(item => {
            if (item.getAttribute('data-page') === pageName) {
                // Remove active class from all items
                navItems.forEach(nav => nav.classList.remove('active'));
                // Add active class to this item
                item.classList.add('active');
            } else if (pageName === 'discovery' && item.getAttribute('data-page') === 'discovery') {
                // Special case for discovery page
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            } else if (pageName === 'trends' && item.getAttribute('data-page') === 'trends') {
                // Special case for AI Assistant (trends) page
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            }
        });
        
        // Ensure iframe height is adjusted after content loads
        adjustFrameHeight();
    });
}

/**
 * Shows a notification toast message
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, error, info)
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        </div>
        <div class="notification-message">${message}</div>
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Show with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

/**
 * Placeholder function for API calls (to be implemented with actual backend)
 * @param {string} endpoint - The API endpoint to call
 * @param {Object} data - The data to send with the request
 * @returns {Promise} - A promise that resolves with the response data
 */
async function apiCall(endpoint, data = {}) {
    return new Promise((resolve) => {
        // Simulate API delay
        setTimeout(() => {
            // This would be replaced with actual API calls in production
            console.log(`API call to ${endpoint} with data:`, data);
            
            // Return mock data for now
            resolve({
                success: true,
                message: 'Operation completed successfully',
                data: {
                    // Sample data would be here
                }
            });
        }, 500);
    });
}

// Function to handle tab interactions within pages
function initTabs() {
    const tabItems = document.querySelectorAll('.tab-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all tabs
            tabItems.forEach(tab => tab.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all tab contents
            tabContents.forEach(content => content.classList.add('hidden'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Show the corresponding tab content
            const target = this.getAttribute('data-target');
            document.getElementById(target).classList.remove('hidden');
            document.getElementById(target).classList.add('active');
        });
    });
} 