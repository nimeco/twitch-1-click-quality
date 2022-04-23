let thisBrowser;

if (chrome?.app) {
    thisBrowser = chrome;
} else {
    thisBrowser = browser;
}

function injectScript(name) {
    return new Promise((resolve, _response) => {
        let s = document.createElement('script');
        s.src = thisBrowser.runtime.getURL(name);
        s.addEventListener('load', () => {
            s.parentNode.removeChild(s);
            resolve(true);
        });
        (document.head || document.documentElement).appendChild(s);
    });
}

async function injectScripts() {
    await injectScript('resource.js');
}

if (thisBrowser) {
    injectScripts();

    document.addEventListener('option-request', event => {
        if (event.type === 'option-request') {
            let detail = event.detail;
            let requestedKey = detail['requested-key'];

            thisBrowser.storage.local.get(requestedKey, result => {
                detail.answer = result[requestedKey];
                let customEvent = new CustomEvent('option-answer', { detail: detail });
                document.dispatchEvent(customEvent);
            });
        }
    });

    thisBrowser.runtime.onMessage.addListener((request, _sender, sendResponse) => {
        if (request.type === 'style') {
            let detail = request.detail;

            if (detail.selector === '.quality-button-header') {
                detail.answer = detail.value;
                let clonedDetail = detail;
                // firefox hack so data isn't private after the message is sent
                if (chrome?.app === undefined) {
                    clonedDetail = cloneInto(detail, document.defaultView);
                }
                let customEvent = new CustomEvent('option-answer', { detail: clonedDetail });
                document.dispatchEvent(customEvent);
            }
        }
        setTimeout(() => {
            sendResponse({ response: 'Response from content script' });
        }, 1000);
        return true;
    });

    thisBrowser.storage.onChanged.addListener((changes, namespace) => {
        for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
            console.log(
                `Storage key "${key}" in namespace "${namespace}" changed.`,
                `Old value was "${oldValue}", new value is "${newValue}".`,
            );
        }
    });
}
