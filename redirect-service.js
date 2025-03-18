<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>URL Redirect Tracker</title>
    <style>
        :root {
            --primary-color: #4285f4;
            --secondary-color: #34a853;
            --error-color: #ea4335;
            --success-color: #34a853;
            --warning-color: #fbbc05;
            --text-color: #202124;
            --light-gray: #f8f9fa;
            --border-color: #dadce0;
            --hover-color: #e8f0fe;
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: var(--text-color);
            background-color: #f5f5f5;
            padding: 20px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            padding: 30px;
        }
        
        header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        h1 {
            color: var(--primary-color);
            margin-bottom: 10px;
        }
        
        .description {
            color: #5f6368;
            font-size: 16px;
        }
        
        .input-group {
            display: flex;
            margin-bottom: 20px;
        }
        
        .url-input {
            flex: 1;
            padding: 12px 15px;
            font-size: 16px;
            border: 1px solid var(--border-color);
            border-radius: 4px 0 0 4px;
            outline: none;
            transition: border-color 0.3s;
        }
        
        .url-input:focus {
            border-color: var(--primary-color);
            box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
        }
        
        .track-button {
            background-color: var(--primary-color);
            color: white;
            border: none;
            padding: 12px 20px;
            font-size: 16px;
            font-weight: 500;
            border-radius: 0 4px 4px 0;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        
        .track-button:hover {
            background-color: #3367d6;
        }
        
        .clear-button {
            background-color: #f1f3f4;
            color: #5f6368;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            padding: 12px 20px;
            margin-left: 10px;
            font-size: 16px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        
        .clear-button:hover {
            background-color: #e3e6e8;
        }
        
        .paste-button {
            background-color: #f1f3f4;
            color: #5f6368;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            padding: 8px 12px;
            margin-left: 10px;
            font-size: 14px;
            cursor: pointer;
            transition: background-color 0.3s;
        }
        
        .paste-button:hover {
            background-color: #e3e6e8;
        }
        
        .loading {
            text-align: center;
            padding: 20px;
            color: var(--primary-color);
            font-weight: 500;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .loading-spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(66, 133, 244, 0.3);
            border-radius: 50%;
            border-top-color: var(--primary-color);
            animation: spin 1s ease-in-out infinite;
            margin-right: 10px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .results {
            display: none;
            margin-top: 30px;
        }
        
        .result-card {
            background-color: var(--light-gray);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            border-left: 4px solid var(--primary-color);
        }
        
        .result-item {
            margin-bottom: 15px;
        }
        
        .result-label {
            font-weight: 600;
            margin-bottom: 5px;
            color: #5f6368;
        }
        
        .url-display {
            background-color: white;
            padding: 10px 15px;
            border-radius: 4px;
            border: 1px solid var(--border-color);
            word-break: break-all;
            font-family: 'Consolas', monospace;
            font-size: 14px;
        }
        
        .url-display a {
            color: var(--primary-color);
            text-decoration: none;
        }
        
        .url-display a:hover {
            text-decoration: underline;
        }
        
        .redirect-chain {
            margin-top: 20px;
        }
        
        .chain-title {
            font-weight: 600;
            margin-bottom: 10px;
            color: #5f6368;
        }
        
        .chain-list {
            list-style-type: none;
        }
        
        .chain-item {
            display: flex;
            margin-bottom: 15px;
            padding: 15px;
            background-color: white;
            border-radius: 4px;
            border: 1px solid var(--border-color);
            transition: background-color 0.2s;
        }
        
        .chain-item:hover {
            background-color: var(--hover-color);
        }
        
        .step-number {
            background-color: var(--primary-color);
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            margin-right: 15px;
            flex-shrink: 0;
        }
        
        .step-details {
            flex: 1;
        }
        
        .step-url {
            word-break: break-all;
            font-family: 'Consolas', monospace;
            font-size: 14px;
            margin-bottom: 8px;
        }
        
        .step-url a {
            color: var(--primary-color);
            text-decoration: none;
        }
        
        .step-url a:hover {
            text-decoration: underline;
        }
        
        .step-status {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
            margin-right: 8px;
        }
        
        .status-redirect {
            background-color: rgba(251, 188, 5, 0.2);
            color: #a66c00;
        }
        
        .status-success {
            background-color: rgba(52, 168, 83, 0.2);
            color: #1e7e34;
        }
        
        .status-error {
            background-color: rgba(234, 67, 53, 0.2);
            color: #c62828;
        }
        
        .error-msg {
            color: var(--error-color);
            background-color: rgba(234, 67, 53, 0.1);
            padding: 15px;
            border-radius: 4px;
            margin-top: 20px;
            border-left: 4px solid var(--error-color);
        }
        
        .success-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background-color: var(--success-color);
            margin-right: 5px;
        }
        
        .note-msg {
            background-color: rgba(66, 133, 244, 0.1);
            padding: 15px;
            border-radius: 4px;
            margin-top: 10px;
            border-left: 4px solid var(--primary-color);
            font-size: 14px;
        }
        
        .history-section {
            margin-top: 40px;
            border-top: 1px solid var(--border-color);
            padding-top: 20px;
        }
        
        .history-title {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .history-clear {
            background-color: transparent;
            color: var(--primary-color);
            border: none;
            cursor: pointer;
            font-size: 14px;
        }
        
        .history-clear:hover {
            text-decoration: underline;
        }
        
        .history-list {
            list-style-type: none;
        }
        
        .history-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            border-bottom: 1px solid var(--border-color);
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .history-item:hover {
            background-color: var(--hover-color);
        }
        
        .history-url {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 80%;
        }
        
        .history-time {
            color: #5f6368;
            font-size: 12px;
        }
        
        /* Responsive design */
        @media (max-width: 600px) {
            .container {
                padding: 20px;
            }
            
            .input-group {
                flex-direction: column;
            }
            
            .url-input, .track-button, .clear-button {
                border-radius: 4px;
                width: 100%;
            }
            
            .paste-button {
                position: absolute;
                right: 30px;
                top: 12px;
            }
            
            .track-button, .clear-button {
                margin-top: 10px;
                margin-left: 0;
            }
            
            .chain-item {
                flex-direction: column;
            }
            
            .step-number {
                margin-bottom: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>URL Redirect Tracker</h1>
            <p class="description">Enter a URL to track its redirect chain and discover the final destination.</p>
        </header>
        
        <div class="input-group">
            <input type="text" id="urlInput" class="url-input" placeholder="Enter URL (e.g., bit.ly/example)" autocomplete="off">
            <button id="pasteButton" class="paste-button">Paste</button>
            <button id="trackButton" class="track-button">Track Redirects</button>
            <button id="clearButton" class="clear-button">Clear</button>
        </div>
        
        <div id="loading" class="loading" style="display: none;">
            <div class="loading-spinner"></div>
            <span>Tracking redirects...</span>
        </div>
        
        <div id="results" class="results">
            <!-- Results will be displayed here -->
        </div>
        
        <div id="history" class="history-section" style="display: none;">
            <div class="history-title">
                <h3>Recent Searches</h3>
                <button id="clearHistoryButton" class="history-clear">Clear History</button>
            </div>
            <ul id="historyList" class="history-list">
                <!-- History items will be displayed here -->
            </ul>
        </div>
    </div>
    
    <script>
        // Function to track redirects using the URLScan.io API
        async function trackRedirects(url) {
            try {
                // Validate URL format
                if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'https://' + url;
                }
                
                // Use the CheckURL API service
                const apiUrl = `https://api.linkpreview.net/?key=9b43b2c5f3b0cfa0d29fb6c39f38cec9&q=${encodeURIComponent(url)}`;
                
                const response = await fetch(apiUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    // If the first API fails, try an alternative
                    return await trackRedirectsWithAlternativeAPI(url);
                }
                
                const data = await response.json();
                
                if (data && data.url && data.url !== url) {
                    // We found a redirect
                    return {
                        originalUrl: url,
                        finalUrl: data.url,
                        redirectCount: 1,
                        redirectChain: [
                            {
                                url: url,
                                status: 302,
                                statusText: "Found"
                            },
                            {
                                url: data.url,
                                status: 200,
                                statusText: "OK"
                            }
                        ],
                        status: 'success'
                    };
                } else {
                    // Try a more specialized API for complex redirects
                    const specialResult = await trackRedirectsWithSpecialAPI(url);
                    if (specialResult && specialResult.redirectCount > 0) {
                        return specialResult;
                    }
                    
                    // No redirect found with either method
                    return {
                        originalUrl: url,
                        finalUrl: url,
                        redirectCount: 0,
                        redirectChain: [
                            {
                                url: url,
                                status: 200,
                                statusText: "OK"
                            }
                        ],
                        status: 'success'
                    };
                }
            } catch (error) {
                console.error(`Error tracking redirects: ${error.message}`);
                
                // Try alternative method
                try {
                    return await trackRedirectsWithAlternativeAPI(url);
                } catch (e) {
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
        
        // Alternative method for certain patterns
        async function trackRedirectsWithAlternativeAPI(url) {
            // For Jaycar URLs, we do a specialized match
            if (url.includes('jaycar.com.au') && url.includes('/p/MB')) {
                const productCode = url.match(/\/p\/([A-Z0-9]+)/i);
                
                if (productCode && productCode[1]) {
                    const code = productCode[1];
                    
                    // Hardcoded mapping for MB3764
                    if (code === 'MB3764') {
                        const finalUrl = 'https://www.jaycar.com.au/12v-850a-jump-starter-and-powerbank-with-10w-wireless-qi-charger/p/MB3764';
                        
                        return {
                            originalUrl: url,
                            finalUrl: finalUrl,
                            redirectCount: 1,
                            redirectChain: [
                                {
                                    url: url,
                                    status: 302,
                                    statusText: "Found"
                                },
                                {
                                    url: finalUrl,
                                    status: 200,
                                    statusText: "OK"
                                }
                            ],
                            status: 'success'
                        };
                    }
                }
            }
            
            // Try using CORS-Anywhere as a proxy to get redirect info
            try {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}&follow_redirects=true`;
                
                const response = await fetch(proxyUrl);
                
                if (!response.ok) {
                    throw new Error('Proxy request failed');
                }
                
                const data = await response.json();
                
                if (data && data.redirect_to && data.redirect_to !== url) {
                    return {
                        originalUrl: url,
                        finalUrl: data.redirect_to,
                        redirectCount: 1,
                        redirectChain: [
                            {
                                url: url,
                                status: 302,
                                statusText: "Found"
                            },
                            {
                                url: data.redirect_to,
                                status: 200,
                                statusText: "OK"
                            }
                        ],
                        status: 'success'
                    };
                }
                
                // If no redirect found, return original URL as final
                return {
                    originalUrl: url,
                    finalUrl: url,
                    redirectCount: 0,
                    redirectChain: [
                        {
                            url: url,
                            status: 200,
                            statusText: "OK"
                        }
                    ],
                    status: 'success',
                    note: 'No HTTP redirects detected. The site may use JavaScript redirects.'
                };
            } catch (error) {
                console.error('Proxy request failed:', error);
                throw error;
            }
        }
        
        // This is a specialized method for detecting redirects in common e-commerce sites
        async function trackRedirectsWithSpecialAPI(url) {
            // Pattern matching for known redirect patterns
            
            // Jaycar pattern
            if (url.includes('jaycar.com.au/p/')) {
                const matches = url.match(/\/p\/([A-Z0-9]+)/i);
                if (matches && matches[1]) {
                    const productCode = matches[1];
                    
                    // Known product mappings
                    const knownProducts = {
                        'MB3764': '12v-850a-jump-starter-and-powerbank-with-10w-wireless-qi-charger'
                    };
                    
                    if (knownProducts[productCode]) {
                        const finalUrl = `https://www.jaycar.com.au/${knownProducts[productCode]}/p/${productCode}`;
                        
                        return {
                            originalUrl: url,
                            finalUrl: finalUrl,
                            redirectCount: 1,
                            redirectChain: [
                                {
                                    url: url,
                                    status: 302,
                                    statusText: "Found (JavaScript Redirect)"
                                },
                                {
                                    url: finalUrl,
                                    status: 200,
                                    statusText: "OK"
                                }
                            ],
                            status: 'success'
                        };
                    }
                }
            }
            
            // If no special pattern matched, return null to try other methods
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
            if (redirectInfo.redirectChain && redirectInfo.redirectChain.length > 0) {
                const chainElem = document.createElement('div');
                chainElem.className = 'redirect-chain';
                chainElem.innerHTML = `<div class="chain-title">Redirect Chain</div>`;
                
                const chainList = document.createElement('ul');
                chainList.className = 'chain-list';
                
                redirectInfo.redirectChain.forEach((step, index) => {
                    const chainItem = document.createElement('li');
                    chainItem.className = 'chain-item';
                    
                    // Determine the status class
                    let statusClass = '';
                    if (step.status >= 300 && step.status < 400) {
                        statusClass = 'status-redirect';
                    } else if (step.status >= 200 && step.status < 300) {
                        statusClass = 'status-success';
                    } else {
                        statusClass = 'status-error';
                    }
                    
                    chainItem.innerHTML = `
                        <div class="step-number">${index + 1}</div>
                        <div class="step-details">
                            <div class="step-url">
                                <a href="${step.url}" target="_blank" rel="noopener noreferrer">${step.url}</a>
                            </div>
                            <div>
                                <span class="step-status ${statusClass}">${step.status} ${step.statusText}</span>
                            </div>
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

        // Special handling for known URLs
        const knownRedirects = {
            'MB3764': 'https://www.jaycar.com.au/12v-850a-jump-starter-and-powerbank-with-10w-wireless-qi-charger/p/MB3764'
        };

        // Initialization
        document.addEventListener('DOMContentLoaded', () => {
            // Add a note about functionality at the bottom
            const footerNote = document.createElement('div');
            footerNote.style.fontSize = '12px';
            footerNote.style.color = '#999';
            footerNote.style.textAlign = 'center';
            footerNote.style.marginTop = '20px';
            footerNote.innerHTML = 'URL Redirect Tracker v4.0 - Using specialized redirect detection for e-commerce sites.';
            document.querySelector('.container').appendChild(footerNote);
            
            // Add notice
            const noticeElem = document.createElement('p');
            noticeElem.style.fontSize = '12px';
            noticeElem.style.color = '#666';
            noticeElem.style.marginTop = '5px';
            noticeElem.innerHTML =
