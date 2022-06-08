let thisBrowser;
let cachedStorage = {};

if (chrome) {
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

let cssNode = null;
function newNode(nodeName, classes, options, dataset) {
    let node = document.createElement(nodeName);
    if (classes) {
        Object.assign(node, { classList: classes.join(' ') });
    }
    if (options) {
        Object.assign(node, options);
    }
    if (dataset) {
        Object.assign(node.dataset, dataset);
    }
    return node;
}
function createCssRules(rules) {
    let styleNode = newNode('style', null, { title: "1-click-quality" });
    styleNode.appendChild(document.createTextNode(rules));
    document.head.appendChild(styleNode);
    return cssNode;
}
async function initCSS() {
    let transition = true;
    transition = await getStorage('option-toggle-transition');
    let buttonCss = `
        .quality-button {
        display: inline-flex;
        position: relative;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        text-decoration: none;
        white-space: nowrap;
        font-weight: var(--font-weight-semibold);
        border-radius: var(--border-radius-medium);
        font-size: var(--button-text-default);
        height: var(--button-size-default);
        background-color: var(--color-background-button-primary-default);
        color: var(--color-text-overlay);
        padding: 0px var(--button-padding-x);
        }
        .quality-button:not(:first-child) {
        margin-left: 1rem;
        }
        .quality-button:hover {
        background-color: var(--color-background-button-primary-hover);
        color: var(--color-text-button-primary);
        }
        .quality-button[data-selected='1'] {
        background-color: var(--color-twitch-purple-7);
        }
        .quality-button-header {
        display: flex;
        position: relative;
        height: 3rem;
        transform-origin: top right 0px;
        transition: all ${transition ? '700' : '0'}ms ease 0s;
        padding-left: 1rem;
        z-index: 1;
        }
        .quality-button-header:not(:first-child) {
        margin-left: 1rem;
        }
        `;
    cssNode = createCssRules(buttonCss);
}
initCSS();

function getStorage(_keys) {
    return new Promise(resolve => {
        let keys = _keys;
        if (typeof _keys === "string") {
            keys = [keys];
        }
        let allKeysExist = true;
        let result = [];
        for (let i = 0; i < keys.length; i++) {
            if (keys[i] in cachedStorage) {
                result.push(cachedStorage[keys[i]]);
            } else {
                allKeysExist = false;
                break;
            }
        }

        if (allKeysExist) {
            if (result.length === 1) {
                resolve(result[0]);
            } else {
                resolve(result);
            }
        } else {
            thisBrowser.storage.local.get(keys, res => {
                cachedStorage = { ...cachedStorage, ...res };
                let values = Object.values(res);
                if (values.length === 1) {
                    resolve(values[0]);
                } else {
                    resolve(values);
                }
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
        let [t, s] = await getStorage(['option-button-margin', 'option-button-scale']);
        t /= 100;
        s /= 100;

        let node = document.querySelector('[data-target="channel-header-right"]');

        let totalWidth = node.parentNode?.getBoundingClientRect().width;

        let childrenNodes = [];
        [...node.children].forEach(n => {
            childrenNodes.push(innerDimensions(n).width);
        });
        childrenNodes[0] *= s;
        let childrenWidth = childrenNodes.reduce((a, b) => a + b, 0);

        let buttonWithTransform = document.querySelector('.quality-button-header ~ div div[style*="translateX"]');
        let transformWidth = ['', '0'];
        if (buttonWithTransform) {
            transformWidth = buttonWithTransform.style.getPropertyValue('transform').match(/translateX\(([^)]+)px\)/);
        }

        let transformValue = `translateX(calc((${transformWidth[1] - 45}px) - ${t} * (${totalWidth - childrenWidth}px + 3rem))) scale(${s})`;
        document.querySelector('.quality-button-header')?.style.setProperty('transform', transformValue);
    } catch (e) {
        console.log(e);
    }
}

function setTransitionRule(enabled) {
    document.querySelector('.quality-button-header')?.style.setProperty('transition', `all ${enabled ? '700' : '0'}ms ease 0s`);
}

injectScripts();

document.addEventListener('set-style', _event => {
    setHeaderStyle();
});

document.addEventListener('save-quality?', async event => {
    let detail = event.detail;
    let isSaveEnabled = await getStorage('option-quality-save');
    if (isSaveEnabled) {
        window.localStorage.setItem('video-quality', JSON.stringify({ default: detail.group }));
    }
});

thisBrowser.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.type === 'calculate-style') {
        cachedStorage = { ...cachedStorage, ...{ [request.detail['requested-key']]: request.detail.value } };
        setHeaderStyle();
    } else if (request.type === 'toggle-transition') {
        cachedStorage = { ...cachedStorage, ...{ [request.detail['requested-key']]: request.detail.value } };
        setTransitionRule(request.detail.value);
    }
    sendResponse({});
});
