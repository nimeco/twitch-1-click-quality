let thisBrowser = null; 
if (chrome?.app) {
    thisBrowser = chrome;
}
else {
    thisBrowser = browser;
}

if (thisBrowser) {
    function injectScript(name) {
        return new Promise((resolve, reject) => {
            let s = document.createElement('script');
            s.src = thisBrowser.runtime.getURL(name);
            s.addEventListener('load', () => {
                this.parentNode.removeChild(this);
                resolve(true);
            });
            (document.head||document.documentElement).appendChild(s);
        });
    }

    async function injectScripts() {
        await injectScript('resource.js');
    }

    injectScripts();


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
            node.style[detail.style] = `${detail.value}`;
        }
        setTimeout(() => {
            sendResponse({response: "Response from content script"});
        }, 1000);
        return true;
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


