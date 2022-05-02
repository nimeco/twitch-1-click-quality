/* global cloneInto */
let thisBrowser;
let cachedStorage = {};

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

function difference(keys, cache) {
    return [...new Set(keys)].filter(x => !new Set(Object.keys(cache)).has(x));
}

function getLocalStorage(keys) {
    return new Promise(resolve => {
        if (typeof keys === 'string') {
            if (keys in cachedStorage) {
                resolve({ [keys]: cachedStorage[keys] });
            } else {
                thisBrowser.storage.local.get(keys, result => {
                    cachedStorage = { ...cachedStorage, ...result };
                    resolve(result);
                });
            }
        } else {
            let diff = difference(keys, cachedStorage);
            thisBrowser.storage.local.get(diff, result => {
                cachedStorage = { ...cachedStorage, ...result };
                resolve(result);
            });
        }
    });
}

const innerDimensions = node => {
    var computedStyle = getComputedStyle(node);

    let width = node.clientWidth;
    let height = node.clientHeight;

    height -= parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
    width -= parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
    return { height, width };
};

async function setHeaderStyle() {
    try {
        let res = await getLocalStorage(['option-button-margin', 'option-button-scale']);
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
        console.log(e);
    }
}

injectScripts();

document.addEventListener('set-style', _event => {
    setHeaderStyle();
});

document.addEventListener('save-quality?', async event => {
    let detail = event.detail;
    let isSaveEnabled = await getLocalStorage('option-quality-save');
    if (isSaveEnabled['option-quality-save']) {
        window.localStorage.setItem('video-quality', JSON.stringify({ default: detail.group }));
    }
});

thisBrowser.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
    if (request.type === 'style') {
        cachedStorage = { ...cachedStorage, ...{ [request.detail['requested-key']]: request.detail.value } };
        setHeaderStyle();
    }
});

thisBrowser.storage.onChanged.addListener((changes, namespace) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        console.log(
            `Storage key "${key}" in namespace "${namespace}" changed.`,
            `Old value was "${oldValue}", new value is "${newValue}".`,
        );
    }
});
