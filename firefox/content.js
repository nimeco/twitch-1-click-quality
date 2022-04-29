/* global cloneInto */
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

let cachedStorage = {};

const innerDimensions = node => {
    var computedStyle = getComputedStyle(node);

    let width = node.clientWidth;
    let height = node.clientHeight;

    height -= parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
    width -= parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
    return { height, width };
};

function setButtonsStyles() {
    try {
        let t = cachedStorage['option-button-margin'] / 100;
        let s = cachedStorage['option-button-scale'] / 100;
        let node = document.querySelector('[data-target="channel-header-right"]');
        let totalWidth = node.parentNode.getBoundingClientRect().width;
        let childrenNodes = [];
        [...node.children].forEach(n => {
            childrenNodes.push(innerDimensions(n).width);
        });
        childrenNodes[0] *= s;
        let childrenWidth = childrenNodes.reduce((a, b) => a + b, 0);
        let buttonWithTransform = document.querySelector('.quality-button-header ~ div div[style*="translateX"]');
        let transformWidth = ['', '0px'];
        if (buttonWithTransform) {
            transformWidth = buttonWithTransform.style.getPropertyValue('transform').match(/translateX\(([^)]+)\)/);
        }

        let transformValue = `translateX(calc(${transformWidth[1]} - 1rem - ${t} * (${totalWidth - childrenWidth}px + 1rem))) scale(${s})`;
        document.querySelector('.quality-button-header')?.style.setProperty('transform', transformValue);
    } catch (e) {
    }
}

if (thisBrowser) {
    injectScripts();

    document.addEventListener('option-request', event => {
        if (event.type === 'option-request') {
            let detail = event.detail;
            let requestedKey = detail['requested-key'];

            if (requestedKey === 'all') {
                thisBrowser.storage.local.get(null, result => {
                    let clonedDetail = result;
                    if (chrome?.app === undefined) {
                        clonedDetail = cloneInto(result, document.defaultView);
                    }
                    let customEvent = new CustomEvent('option-answer', { detail: clonedDetail });
                    document.dispatchEvent(customEvent);
                });
            } else {
                thisBrowser.storage.local.get(requestedKey, result => {
                    let answer = result[requestedKey];
                    let customEvent = new CustomEvent('option-answer', { detail: { [requestedKey]: answer } });
                    document.dispatchEvent(customEvent);
                });
            }
        }
    });

    thisBrowser.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
        // if (request.type === 'style') {
        //     let detail = request.detail;
        //
        //     if (detail.selector === '.quality-button-header') {
        //         let clonedDetail = { [detail['requested-key']]: detail.value };
        //         if (chrome?.app === undefined) {
        //             clonedDetail = cloneInto({ [detail["requested-key"]]: detail.value }, document.defaultView);
        //         }
        //         let customEvent = new CustomEvent('option-answer', { detail: clonedDetail });
        //         document.dispatchEvent(customEvent);
        //     }
        // }
        // return true;
        let result = await thisBrowser.storage.local.get(null);
        cachedStorage = { ...result };
        setButtonsStyles();
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
