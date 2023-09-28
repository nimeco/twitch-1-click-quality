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
    const colors = await getStorage([
        'option-color-text', 'option-color-background',
        'option-color-text-hover', 'option-color-background-hover',
        'option-color-text-selected', 'option-color-background-selected'
    ]);
    let buttonCss = `
        :root {
            --option-color-text: ${colors['option-color-text']};
            --option-color-background: ${colors['option-color-background']};
            --option-color-text-hover: ${colors['option-color-text-hover']};
            --option-color-background-hover: ${colors['option-color-background-hover']};
            --option-color-text-selected: ${colors['option-color-text-selected']};
            --option-color-background-selected: ${colors['option-color-background-selected']};
        }
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
            background-color: var(--option-color-background);
            color: var(--option-color-text);
            padding: 0px var(--button-padding-x);
        }
        .quality-button:not(:first-child) {
            margin-left: 1rem;
        }
        .quality-button:hover,
        .quality-button[data-selected='1']:hover {
            color: var(--option-color-text-hover);
            background-color: var(--option-color-background-hover);
        }
        .quality-button[data-selected='1'] {
            color: var(--option-color-text-selected);
            background-color: var(--option-color-background-selected);
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
        let oneArgument = false;
        if (typeof _keys === "string") {
            keys = [keys];
            oneArgument = true;
        }

        let allKeysExist = true;
        let result = {};
        for (let i = 0; i < keys.length; i++) {
            if (keys[i] in cachedStorage) {
                result[keys[i]] = cachedStorage[keys[i]];
            } else {
                allKeysExist = false;
                break;
            }
        }

        if (allKeysExist) {
            if (oneArgument) {
                resolve(Object.values(result)[0]);
            } else {
                resolve(result);
            }
        } else {
            thisBrowser.storage.local.get(keys, items => {
                cachedStorage = { ...cachedStorage, ...items };

                if (oneArgument) {
                    resolve(Object.values(items)[0]);
                } else {
                    resolve(items);
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
        let opts = await getStorage(['option-button-margin', 'option-button-scale']);
        let t = opts['option-button-margin'] / -100;
        let s = opts['option-button-scale'] / 100;

        let node = document.querySelector('[data-target="channel-header-right"]');

        let totalWidth = node.parentNode?.getBoundingClientRect().width;

        let childrenNodes = [];
        [...node.children].forEach(n => {
            childrenNodes.push(innerDimensions(n).width);
        });
        childrenNodes[0] *= s;
        let childrenWidth = childrenNodes.reduce((a, b) => a + b, 0);

        let transformValue = `translateX(calc(${t} * (${totalWidth - childrenWidth}px + 3rem) - 1rem)) scale(${s})`;
        document.querySelector('.quality-button-header')?.style.setProperty('transform', transformValue);
    } catch (e) {
        console.log(e);
    }
}

function setTransitionRule(enabled) {
    document.querySelector('.quality-button-header')?.style.setProperty('transition', `all ${enabled ? '700' : '0'}ms ease 0s`);
}

function setButtonColor(request) {
    const key = request.detail['requested-key'];
    document.documentElement.style.setProperty(`--${key}`, request.detail.value);
    // document.querySelector('.quality-button-header button')?.style.setProperty(properties[request['requested-key']], request.detail.color);
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

thisBrowser.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
    if (request.type === 'calculate-style') {
        cachedStorage = { ...cachedStorage, ...{ [request.detail['requested-key']]: request.detail.value } };
        setHeaderStyle();
    } else if (request.type === 'toggle-transition') {
        cachedStorage = { ...cachedStorage, ...{ [request.detail['requested-key']]: request.detail.value } };
        setTransitionRule(request.detail.value);
    } else if (request.type === 'select-color') {
        cachedStorage = { ...cachedStorage, ...{ [request.detail['requested-key']]: request.detail.value } };
        setButtonColor(request);
        console.log(request);
    }
    // sendResponse({});
});

// alert(window.localStorage.getItem('video-quality'));
/*
 {'default': 'chunked'}
 {'default': '480p30'}
 */
