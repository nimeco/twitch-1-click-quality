let thisBrowser = null; 
if (!chrome?.app) {
    thisBrowser = chrome;
}
else {
    thisBrowser = browser;
}

if (thisBrowser) {
    let s = document.createElement('script');
    s.src = thisBrowser.runtime.getURL('resource.js');

    (document.head||document.documentElement).appendChild(s);

    document.addEventListener('option-request', (event) => {
        if (event.type === 'option-request') {
            let detail = event.detail;
            let requestedKey = detail['requested-key'];

            thisBrowser.storage.local.get(requestedKey, (result) => {
                detail.answer = result[requestedKey];
                let customEvent = new CustomEvent('option-answer', { detail: detail });
                document.dispatchEvent(customEvent);
            });
        }
    });

    s.addEventListener('load', () => {
        s.parentNode.removeChild(s);
    });
}
