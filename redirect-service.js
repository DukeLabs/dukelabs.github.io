// URL Redirect Tracker

// Function to track redirects using the allorigins.win CORS proxy
async function trackRedirects(url) {
    try {
        // Validate URL format
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        // Initialize tracking variables
        const redirectChain = [];
        redirectChain.push(url);
        
        // Use the allorigins.win service as a CORS proxy
        // This proxy allows us to get information about the URL including status codes and headers
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}&full_headers=true`;
        
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
            throw new Error(`Error accessing URL: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Extract the current URL and status from the response
        const currentStatus = data.status;
        
        // If the status indicates a redirect (3xx)
        if (data.status >= 300 && data.status < 400) {
            // Parse the full headers to find the "location" header
            const headers = data.headers || {};
            const locationHeader = 
                headers.Location || 
                headers.location || 
                headers.LOCATION || 
                null;
                
            // If we have a location header, we've found a redirect
            if (locationHeader) {
                let nextUrl = locationHeader;
                
                // Handle relative URLs
                if (nextUrl.startsWith('/')) {
                    const baseUrl = new URL(url);
                    nextUrl = `${baseUrl.protocol}//${baseUrl.host}${nextUrl}`;
                }
                
                // Add the redirect to our chain
                redirectChain.push(nextUrl);
                
                // Make recursive calls to follow the redirect chain
                // Limited to 5 to avoid infinite loops and stay within API limits
                if (redirectChain.length < 6) {
                    const nextRedirectInfo = await trackRedirects(nextUrl);
                    
                    // Add any subsequent redirects to our chain
                    for (let i = 1; i < nextRedirectInfo.redirectChain.length; i++) {
                        if (!redirectChain.includes(nextRedirectInfo.redirectChain[i])) {
                            redirectChain.push(nextRedirectInfo.redirectChain[i]);
                        }
                    }
                }
            }
        }
        
        // After all redirects are followed
        return {
            originalUrl: url,
            finalUrl: redirectChain[redirectChain.length - 1],
            redirectCount: redirectChain.length - 1,
            redirectChain: redirectChain,
            status: 'success'
        };
    } catch (error) {
        console.error(`Error tracking redirects: ${error.message}`);
        
        // Try an alternative API if the primary one fails
        try {
            return await trackRedirectsAlternative(url);
        } catch (altError) {
            return {
                originalUrl: url,
                finalUrl: null,
                redirectCount: 0,
                redirectChain: [],
                status: 'error',
                errorMessage: error.message
            };
        }
    }
}

// Alternative method using a different service for fallback
async function trackRedirectsAlternative(url) {
    try {
        // Validate URL format
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        // Initialize tracking variables
        const redirectChain = [];
        redirectChain.push(url);
        
        // Use the LinkPreview API as a fallback
        const apiUrl = `https://api.linkpreview.net/?key=123456789&q=${encodeURIComponent(url)}`;
        
        // This is using a demo key - for production use, you'd need to sign up for a real key
        // You can replace this with a similar free service
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // If the URL from the preview doesn't match our input, we found a redirect
        if (data.url && data.url !== url) {
            redirectChain.push(data.url);
            
            return {
                originalUrl: url,
                finalUrl: data.url,
                redirectCount: 1,
                redirectChain: redirectChain,
                status: 'success'
            };
        } else {
            // No redirects found
            return {
                originalUrl: url,
                finalUrl: url,
                redirectCount: 0,
                redirectChain: [url],
                status: 'success'
            };
        }
    } catch (error) {
        console.error(`Error in alternative tracking: ${error.message}`);
        throw error; // Re-throw to be handled by the primary function
    }
}

// DOM elements
const urlInput = document.getElementById('urlInput');
const trackButton = document.getElementById('trackButton');
const clearButton = document.getElementById('clearButton');
const pasteButton = document.getElementById('pasteButton');
const loadingElem = document.getElementById('loading');
const resultsElem = document.getElementById('results');
const historySection = document.getElementById('history');
const historyList = document.getElementById('historyList');
const clearHistoryButton = document.getElementById('clearHistoryButton');

// Search history management with localStorage
let searchHistory = [];
try {
    const savedHistory = localStorage.getItem('redirectTrackerHistory');
    if (savedHistory) {
        searchHistory = JSON.parse(savedHistory);
    }
} catch (e) {
    console.log('localStorage not available, using session memory only');
}

// Function to save URL to history
function saveToHistory(url, finalUrl) {
    const historyItem = {
        originalUrl: url,
        finalUrl: finalUrl,
        timestamp: new Date().toISOString()
    };
    
    // Add to the beginning of the array
    searchHistory.unshift(historyItem);
    
    // Limit history to 10 items
    if (searchHistory.length > 10) {
        searchHistory = searchHistory.slice(0, 10);
    }
    
    // Try to save to localStorage
    try {
        localStorage.setItem('redirectTrackerHistory', JSON.stringify(searchHistory));
    } catch (e) {
        console.log('Could not save to localStorage');
    }
    
    // Update history display
    updateHistoryDisplay();
}

// Function to update history display
function updateHistoryDisplay() {
    if (searchHistory.length === 0) {
        historySection.style.display = 'none';
        return;
    }
    
    historySection.style.display = 'block';
    historyList.innerHTML = '';
    
    searchHistory.forEach((item) => {
        const historyItem = document.createElement('li');
        historyItem.className = 'history-item';
        historyItem.setAttribute('data-url', item.originalUrl);
        
        const timestamp = new Date(item.timestamp);
        const formattedTime = timestamp.toLocaleString();
        
        historyItem.innerHTML = `
            <div class="history-url">${item.originalUrl}</div>
            <div class="history-time">${formattedTime}</div>
        `;
        
        historyItem.addEventListener('click', () => {
            urlInput.value = item.originalUrl;
            trackRedirectsFromInput();
        });
        
        historyList.appendChild(historyItem);
    });
}

// Function to display results
function displayResults(redirectInfo) {
    resultsElem.style.display = 'block';
    resultsElem.innerHTML = '';
    
    const resultCard = document.createElement('div');
    resultCard.className = 'result-card';
    
    // Original URL
    const originalUrlElem = document.createElement('div');
    originalUrlElem.className = 'result-item';
    originalUrlElem.innerHTML = `
        <div class="result-label">Original URL</div>
        <div class="url-display">
            <a href="${redirectInfo.originalUrl}" target="_blank">${redirectInfo.originalUrl}</a>
        </div>
    `;
    resultCard.appendChild(originalUrlElem);
    
    // Final URL
    const finalUrlElem = document.createElement('div');
    finalUrlElem.className = 'result-item';
    
    if (redirectInfo.status === 'success') {
        finalUrlElem.innerHTML = `
            <div class="result-label">
                <span class="success-indicator"></span>
                Final Destination URL
            </div>
            <div class="url-display">
                <a href="${redirectInfo.finalUrl}" target="_blank">${redirectInfo.finalUrl}</a>
            </div>
        `;
        
        // Save to history only if successful
        saveToHistory(redirectInfo.originalUrl, redirectInfo.finalUrl);
    } else {
        finalUrlElem.innerHTML = `
            <div class="error-msg">
                <strong>Error:</strong> ${redirectInfo.errorMessage}
            </div>
        `;
    }
    
    resultCard.appendChild(finalUrlElem);
    
    // Redirect count
    const redirectCountElem = document.createElement('div');
    redirectCountElem.className = 'result-item';
    redirectCountElem.innerHTML = `
        <div class="result-label">Number of redirects</div>
        <div>${redirectInfo.redirectCount}</div>
    `;
    resultCard.appendChild(redirectCountElem);
    
    // Redirect chain
    if (redirectInfo.redirectChain.length > 1) {
        const chainElem = document.createElement('div');
        chainElem.className = 'redirect-chain';
        chainElem.innerHTML = `<div class="chain-title">Redirect Chain</div>`;
        
        const chainList = document.createElement('ul');
        chainList.className = 'chain-list';
        
        redirectInfo.redirectChain.forEach((chainUrl, index) => {
            const chainItem = document.createElement('li');
            chainItem.className = 'chain-item';
            
            chainItem.innerHTML = `
                <div class="step-number">${index + 1}</div>
                <div class="step-url">
                    <a href="${chainUrl}" target="_blank">${chainUrl}</a>
                </div>
            `;
            
            chainList.appendChild(chainItem);
        });
        
        chainElem.appendChild(chainList);
        resultCard.appendChild(chainElem);
    }
    
    resultsElem.appendChild(resultCard);
}

// Function to track redirects from input
async function trackRedirectsFromInput() {
    const url = urlInput.value.trim();
    if (!url) {
        return;
    }
    
    // Show loading state
    loadingElem.style.display = 'flex';
    resultsElem.style.display = 'none';
    
    try {
        const redirectInfo = await trackRedirects(url);
        
        // Hide loading and display results
        loadingElem.style.display = 'none';
        displayResults(redirectInfo);
    } catch (error) {
        loadingElem.style.display = 'none';
        
        // Display error
        resultsElem.style.display = 'block';
        resultsElem.innerHTML = `
            <div class="error-msg">
                <strong>Error:</strong> ${error.message}
            </div>
        `;
    }
}

// Event listeners
trackButton.addEventListener('click', trackRedirectsFromInput);

urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        trackRedirectsFromInput();
    }
});

clearButton.addEventListener('click', () => {
    urlInput.value = '';
    resultsElem.style.display = 'none';
    urlInput.focus();
});

pasteButton.addEventListener('click', async () => {
    try {
        const clipboardText = await navigator.clipboard.readText();
        urlInput.value = clipboardText;
        urlInput.focus();
    } catch (error) {
        console.error('Failed to read clipboard:', error);
        alert('Unable to access clipboard. Please paste manually or check browser permissions.');
    }
});

clearHistoryButton.addEventListener('click', () => {
    searchHistory = [];
    try {
        localStorage.setItem('redirectTrackerHistory', JSON.stringify(searchHistory));
    } catch (e) {
        console.log('Could not clear localStorage');
    }
    updateHistoryDisplay();
});

// Initialize history display
updateHistoryDisplay();

// Add debug information at the bottom of the page
const debugInfo = document.createElement('div');
debugInfo.style.marginTop = '20px';
debugInfo.style.fontSize = '12px';
debugInfo.style.color = '#999';
debugInfo.style.textAlign = 'center';
debugInfo.innerHTML = 'Using AllOrigins API for redirect tracking. Version 1.2';
document.querySelector('.container').appendChild(debugInfo);
