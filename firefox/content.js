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


    thisBrowser.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === "style") {
            let detail = request.detail;

            let node = document.querySelector(detail.selector);
            node.style[detail.style] = `${detail.value}${detail.unit}`;
        }
        setTimeout(() => {
            sendResponse({response: "Response from content script"});
        }, 1000);
        return true;
    });

    s.addEventListener('load', () => {
        s.parentNode.removeChild(s);
    });

    thisBrowser.storage.onChanged.addListener((changes, namespace) => {
        for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
            console.log(
                `Storage key "${key}" in namespace "${namespace}" changed.`,
                `Old value was "${oldValue}", new value is "${newValue}".`
            );
        }
    });
}
