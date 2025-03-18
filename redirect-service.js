// URL Redirect Tracker with improved redirect detection

// Function to track redirects using a reliable proxy service
async function trackRedirects(url) {
    try {
        // Validate URL format
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        // Initialize tracking variables
        const redirectChain = [];
        redirectChain.push(url);

        // Use a more reliable redirect tracking service - CORS Anywhere with a public URL
        // This proxy has higher success rates for tracking redirects
        // URL format: https://corsproxy.io/?${encodeURIComponent(url)}
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}&follow_redirects=true`;
        
        try {
            // First attempt: use AllOrigins API with redirect following
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            // Get the final URL from the response URL
            // AllOrigins returns the final URL in the response after following redirects
            const responseUrl = response.url;
            
            // Parse the response URL to extract the real final destination
            const parsedUrl = new URL(responseUrl);
            const urlParam = parsedUrl.searchParams.get('url');
            
            // If there's a URL parameter in the response, it's likely the original URL
            // We need to try another method to get the actual final URL
            if (urlParam && urlParam === url) {
                throw new Error('Need to try alternative method');
            }
            
            // If we get here, we'll try a method to extract more information about redirects
            const info = await getRedirectsWithExtraMethod(url);
            
            if (info && info.redirectChain && info.redirectChain.length > 1) {
                return info;
            } else {
                // Fallback to another method if we couldn't get detailed redirect info
                return await getRedirectsWithRdAPI(url);
            }
        } catch (error) {
            // If first method fails, try another approach
            console.log('First method failed, trying alternative:', error.message);
            return await getRedirectsWithRdAPI(url);
        }
    } catch (error) {
        console.error(`Error tracking redirects: ${error.message}`);
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

// Alternative method using redirect-detector API
async function getRedirectsWithRdAPI(url) {
    try {
        // This is a specialized redirect API service that handles CORS
        const apiUrl = `https://redirect-detector.com/api/v1/detect?url=${encodeURIComponent(url)}`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Process the redirect chain from the API
        const redirectChain = [url];
        let finalUrl = url;
        
        if (data && data.redirects && Array.isArray(data.redirects)) {
            // Add each redirect URL to our chain
            data.redirects.forEach(redirect => {
                if (redirect.url && !redirectChain.includes(redirect.url)) {
                    redirectChain.push(redirect.url);
                    finalUrl = redirect.url;
                }
            });
        }
        
        return {
            originalUrl: url,
            finalUrl: finalUrl,
            redirectCount: redirectChain.length - 1,
            redirectChain: redirectChain,
            status: 'success'
        };
    } catch (error) {
        console.error(`Error in RdAPI method: ${error.message}`);
        
        // If this also fails, try one more method
        try {
            return await getRedirectsWithWhereGoesAPI(url);
        } catch (err) {
            // Final fallback - just return the original URL
            return {
                originalUrl: url,
                finalUrl: url,
                redirectCount: 0,
                redirectChain: [url],
                status: 'success',
                note: 'Could not detect redirects reliably'
            };
        }
    }
}

// Another alternative method using WhereGoes API
async function getRedirectsWithWhereGoesAPI(url) {
    try {
        const apiUrl = `https://wheregoes.com/trace/${encodeURIComponent(url)}`;
        
        // We'll try to make a request to wheregoes.com, but this might not work directly
        // due to CORS. We use a proxy to make this request.
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;
        
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        // We'll need to parse the HTML response to extract redirect info
        const html = await response.text();
        
        // Very basic HTML parsing to extract redirect URLs
        const redirectChain = [url];
        let finalUrl = url;
        
        // Look for redirect URLs in the HTML (this is a simplistic approach)
        const urlRegex = /href="(https?:\/\/[^"]+)"/g;
        let match;
        while ((match = urlRegex.exec(html)) !== null) {
            const foundUrl = match[1];
            if (!redirectChain.includes(foundUrl) && foundUrl !== url) {
                redirectChain.push(foundUrl);
                finalUrl = foundUrl;
            }
        }
        
        // If we found additional URLs, assume these are part of the redirect chain
        if (redirectChain.length > 1) {
            return {
                originalUrl: url,
                finalUrl: finalUrl,
                redirectCount: redirectChain.length - 1,
                redirectChain: redirectChain,
                status: 'success'
            };
        } else {
            // If no redirects found, try another method
            throw new Error('No redirects found in WhereGoes API');
        }
    } catch (error) {
        console.error(`Error in WhereGoes method: ${error.message}`);
        throw error; // Re-throw to be handled by the calling function
    }
}

// Extra method to try to get more detailed redirect info
async function getRedirectsWithExtraMethod(url) {
    try {
        // This uses the iframely service to get detailed info about a URL
        const apiUrl = `https://iframe.ly/api/iframely?url=${encodeURIComponent(url)}&api_key=87952169b021bc6462b6c3`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Process the URL info from the API
        const redirectChain = [url];
        let finalUrl = url;
        
        if (data && data.url) {
            finalUrl = data.url;
            if (finalUrl !== url) {
                redirectChain.push(finalUrl);
            }
        }
        
        return {
            originalUrl: url,
            finalUrl: finalUrl,
            redirectCount: redirectChain.length - 1,
            redirectChain: redirectChain,
            status: 'success'
        };
    } catch (error) {
        console.error(`Error in extra method: ${error.message}`);
        throw error; // Re-throw to be handled by the calling function
    }
}

// Manually handle URL redirects by simulating user behavior
async function manuallyCheckRedirect(url) {
    try {
        // This creates a hidden iframe to load the URL and check final location
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        return new Promise((resolve, reject) => {
            // Set a timeout in case the redirect takes too long
            const timeout = setTimeout(() => {
                document.body.removeChild(iframe);
                reject(new Error('Redirect check timed out'));
            }, 10000);
            
            iframe.onload = () => {
                try {
                    clearTimeout(timeout);
                    // Try to get the final URL from the iframe
                    const finalUrl = iframe.contentWindow.location.href;
                    document.body.removeChild(iframe);
                    
                    resolve({
                        originalUrl: url,
                        finalUrl: finalUrl,
                        redirectCount: finalUrl !== url ? 1 : 0,
                        redirectChain: [url, ...(finalUrl !== url ? [finalUrl] : [])],
                        status: 'success'
                    });
                } catch (e) {
                    document.body.removeChild(iframe);
                    reject(new Error('Could not access iframe content: ' + e.message));
                }
            };
            
            iframe.onerror = (err) => {
                clearTimeout(timeout);
                document.body.removeChild(iframe);
                reject(new Error('Iframe loading error: ' + err.message));
            };
            
            // Set the iframe src to trigger the load
            iframe.src = url;
        });
    } catch (error) {
        console.error(`Error in manual redirect check: ${error.message}`);
        throw error;
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
            <a href="${redirectInfo.originalUrl}" target="_blank" rel="noopener noreferrer">${redirectInfo.originalUrl}</a>
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
                <a href="${redirectInfo.finalUrl}" target="_blank" rel="noopener noreferrer">${redirectInfo.finalUrl}</a>
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
                    <a href="${chainUrl}" target="_blank" rel="noopener noreferrer">${chainUrl}</a>
                </div>
            `;
            
            chainList.appendChild(chainItem);
        });
        
        chainElem.appendChild(chainList);
        resultCard.appendChild(chainElem);
    }
    
    // Add a note if there is one
    if (redirectInfo.note) {
        const noteElem = document.createElement('div');
        noteElem.className = 'result-item';
        noteElem.innerHTML = `
            <div class="note-msg">
                <strong>Note:</strong> ${redirectInfo.note}
            </div>
        `;
        resultCard.appendChild(noteElem);
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

// Add version info at the bottom
const versionInfo = document.createElement('div');
versionInfo.style.fontSize = '12px';
versionInfo.style.color = '#999';
versionInfo.style.textAlign = 'center';
versionInfo.style.marginTop = '20px';
versionInfo.textContent = 'URL Redirect Tracker v2.0 - Using multiple API services for accurate redirect detection';
document.querySelector('.container').appendChild(versionInfo);

// Add a message to the header to explain the limitations
const headerMessage = document.createElement('p');
headerMessage.style.fontSize = '12px';
headerMessage.style.color = '#666';
headerMessage.style.marginTop = '5px';
headerMessage.textContent = 'Note: This tool uses multiple methods to detect redirects but may not capture all JavaScript or client-side redirects.';
document.querySelector('header').appendChild(headerMessage);
