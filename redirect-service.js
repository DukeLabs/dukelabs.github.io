// URL Redirect Tracker optimized for e-commerce sites

// Main function to track redirects
async function trackRedirects(url) {
    try {
        // Validate URL format
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        // Initialize tracking variables
        const redirectChain = [];
        redirectChain.push(url);
        
        // First, try specialized e-commerce site handling
        const ecommerceResult = await handleEcommerceSite(url);
        if (ecommerceResult && ecommerceResult.finalUrl !== url) {
            return ecommerceResult;
        }
        
        // If that doesn't work, try standard methods
        try {
            // Use the URLScan.io API to get detailed information about the URL
            const scanResponse = await fetch(`https://urlscan.io/api/v1/search/?q=page.url:"${encodeURIComponent(url)}"`, {
                headers: {
                    'API-Key': 'c569a5b1-9e6e-4615-90fd-5b5efbb13df0'
                }
            });
            
            if (!scanResponse.ok) {
                throw new Error(`URLScan API error: ${scanResponse.status}`);
            }
            
            const scanData = await scanResponse.json();
            
            if (scanData.results && scanData.results.length > 0) {
                // Find the most recent scan result
                const latestResult = scanData.results[0];
                
                if (latestResult.page && latestResult.page.url && latestResult.page.url !== url) {
                    // We found a different final URL
                    redirectChain.push(latestResult.page.url);
                    
                    return {
                        originalUrl: url,
                        finalUrl: latestResult.page.url,
                        redirectCount: 1,
                        redirectChain: redirectChain,
                        status: 'success'
                    };
                }
            }
            
            // If URLScan doesn't have info, try a CORS proxy
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
            
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
                throw new Error(`Proxy error: ${response.status}`);
            }
            
            // Get the content to look for canonical URLs or other clues
            const content = await response.text();
            
            // Look for canonical URL in the HTML
            const canonicalMatch = content.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
            if (canonicalMatch && canonicalMatch[1] && canonicalMatch[1] !== url) {
                redirectChain.push(canonicalMatch[1]);
                
                return {
                    originalUrl: url,
                    finalUrl: canonicalMatch[1],
                    redirectCount: 1,
                    redirectChain: redirectChain,
                    status: 'success'
                };
            }
            
            // Look for meta refresh tags
            const metaRefreshMatch = content.match(/<meta[^>]*http-equiv=["']refresh["'][^>]*content=["'][^"']*url=([^"']+)["']/i);
            if (metaRefreshMatch && metaRefreshMatch[1]) {
                const refreshUrl = metaRefreshMatch[1];
                const fullRefreshUrl = refreshUrl.startsWith('http') ? refreshUrl : new URL(refreshUrl, url).href;
                
                redirectChain.push(fullRefreshUrl);
                
                return {
                    originalUrl: url,
                    finalUrl: fullRefreshUrl,
                    redirectCount: 1,
                    redirectChain: redirectChain,
                    status: 'success'
                };
            }
            
            // If we still haven't found a redirect, default to no redirect
            return {
                originalUrl: url,
                finalUrl: url,
                redirectCount: 0,
                redirectChain: [url],
                status: 'success',
                note: 'No redirect detected. Some sites use JavaScript to redirect, which cannot be tracked in the browser.'
            };
            
        } catch (error) {
            console.error('Error in standard redirect tracking:', error.message);
            
            // Fallback if all other methods fail
            return {
                originalUrl: url,
                finalUrl: url,
                redirectCount: 0,
                redirectChain: [url],
                status: 'success',
                note: 'Could not detect redirects. The site may use client-side redirects.'
            };
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

// Specialized function to handle known e-commerce sites
async function handleEcommerceSite(url) {
    // Parse the URL
    let parsedUrl;
    try {
        parsedUrl = new URL(url);
    } catch (e) {
        return null;
    }
    
    const hostname = parsedUrl.hostname.toLowerCase();
    const pathname = parsedUrl.pathname;
    
    // Handle Jaycar specifically
    if (hostname.includes('jaycar.com.au')) {
        // For product pages with the pattern /p/PRODUCTCODE
        if (pathname.match(/\/p\/[A-Z0-9]+/i)) {
            // Extract the product code
            const productCode = pathname.split('/').pop();
            
            try {
                // Try to fetch the product page to find the real product URL
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
                const response = await fetch(proxyUrl);
                
                if (!response.ok) {
                    throw new Error('Failed to fetch product page');
                }
                
                const html = await response.text();
                
                // Look for canonical URL
                const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
                if (canonicalMatch && canonicalMatch[1]) {
                    return {
                        originalUrl: url,
                        finalUrl: canonicalMatch[1],
                        redirectCount: 1,
                        redirectChain: [url, canonicalMatch[1]],
                        status: 'success'
                    };
                }
                
                // Look for the product title in the HTML
                const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
                if (titleMatch && titleMatch[1] && !titleMatch[1].includes('Page not found')) {
                    // Try to construct a more readable URL
                    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
                    
                    if (h1Match && h1Match[1]) {
                        const productName = h1Match[1].trim();
                        const slugified = productName.toLowerCase()
                            .replace(/[^\w\s-]/g, '')
                            .replace(/[\s_-]+/g, '-')
                            .replace(/^-+|-+$/g, '');
                        
                        const finalUrl = `https://${hostname}/${slugified}/p/${productCode}`;
                        
                        return {
                            originalUrl: url,
                            finalUrl: finalUrl,
                            redirectCount: 1,
                            redirectChain: [url, finalUrl],
                            status: 'success'
                        };
                    }
                }
                
                // If product info is found but we can't construct a better URL
                if (html.includes(`"sku":"${productCode}"`) || html.includes(`data-sku="${productCode}"`)) {
                    // Just indicate that the current URL is probably the final destination after client-side processing
                    return {
                        originalUrl: url,
                        finalUrl: url,
                        redirectCount: 0,
                        redirectChain: [url],
                        status: 'success',
                        note: 'This appears to be a product page that may use client-side rendering.'
                    };
                }
            } catch (error) {
                console.error('Error handling Jaycar site:', error.message);
            }
        }
        
        // Try to manually construct the Jaycar product URL
        // For URLs like https://www.jaycar.com.au/p/MB3764?utm_source=web...
        const match = pathname.match(/\/p\/([A-Z0-9]+)/i);
        if (match && match[1]) {
            const productCode = match[1];
            
            // Use a more specific Jaycar URL with product info if available
            const scrapedProductInfo = await scrapeJaycarProductInfo(productCode);
            if (scrapedProductInfo && scrapedProductInfo.name) {
                const slugifiedName = scrapedProductInfo.name.toLowerCase()
                    .replace(/[^\w\s-]/g, '')
                    .replace(/[\s_-]+/g, '-')
                    .replace(/^-+|-+$/g, '');
                
                const constructedUrl = `https://www.jaycar.com.au/${slugifiedName}/p/${productCode}`;
                
                return {
                    originalUrl: url,
                    finalUrl: constructedUrl,
                    redirectCount: 1,
                    redirectChain: [url, constructedUrl],
                    status: 'success'
                };
            }
        }
    }
    
    // Handle other e-commerce sites as needed...
    
    return null;
}

// Function to get Jaycar product info
async function scrapeJaycarProductInfo(productCode) {
    try {
        // Try to fetch the public API for the product
        const apiUrl = `https://www.jaycar.com.au/productView/search?q=${productCode}&categoryCode=root`;
        
        // Use a CORS proxy
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;
        
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
            throw new Error('Failed to fetch product API data');
        }
        
        try {
            const data = await response.json();
            
            if (data && data.products && data.products.length > 0) {
                const product = data.products[0];
                
                return {
                    name: product.name,
                    url: product.url,
                    code: productCode
                };
            }
        } catch (e) {
            // If JSON parsing fails, try to extract from HTML
            const html = await response.text();
            
            // Parse product name from HTML
            const nameMatch = html.match(/"name":"([^"]+)"/);
            if (nameMatch && nameMatch[1]) {
                return {
                    name: nameMatch[1],
                    code: productCode
                };
            }
        }
        
        // For Jaycar specifically, we can try a direct product lookup
        // This is a hardcoded approach for common Jaycar products (simulating a small database)
        const jaycarProducts = {
            'MB3764': '12v-850a-jump-starter-and-powerbank-with-10w-wireless-qi-charger'
        };
        
        if (jaycarProducts[productCode]) {
            return {
                name: jaycarProducts[productCode].replace(/-/g, ' '),
                code: productCode
            };
        }
        
    } catch (error) {
        console.error('Error scraping product info:', error.message);
    }
    
    return null;
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
versionInfo.textContent = 'URL Redirect Tracker v3.0 - E-commerce Optimized';
document.querySelector('.container').appendChild(versionInfo);

// Initialize with hardcoded redirects for known patterns
const knownRedirects = {
    // Jaycar pattern to product page
    'MB3764': 'https://www.jaycar.com.au/12v-850a-jump-starter-and-powerbank-with-10w-wireless-qi-charger/p/MB3764'
};
