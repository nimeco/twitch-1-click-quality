let thisBrowser = null;
if (chrome?.app) {
    thisBrowser = chrome;
} else {
    thisBrowser = browser;
}

const options = {
    "option-quality-save": {
        event: "click",
        property: "checked",
    },
    "option-button-margin": {
        event: "input",
        property: "value",
        style: "marginRight",
        selector: ".quality-button-header",
        calc: x => `${11.5 - (0.15 * x)}rem`,
    },
    "option-button-scale": {
        event: "input",
        property: "value",
        style: "transform",
        selector: ".quality-button-header",
        calc: x => `scale(${x / 100})`,
    },
    "option-language-save": {
        event: "click",
        property: "checked",
        callback: lang => {
            document.body.removeAttribute('class');
            document.body.classList.add(lang);
        },
    },
};

function handleResponse(message) {
    console.log(`Message from the background script: ${message.response}`);
}

function handleError(error) {
    console.log(`Error: ${error}`);
}

if (thisBrowser) {
    for (let [optionId, option] of Object.entries(options)) {
        let node = document.querySelector(`#${optionId} input`);
        let debounceSet = debounce((...args) => thisBrowser.storage.local.set(...args));
        let debounceMsg = debounce((...args) => messageTwitchTabs(...args));
        node.addEventListener(option.event, _event => {
            debounceSet({ [optionId]: node[option.property] });

            if (option.style !== undefined) {
                let value = option.calc(node[option.property]);
                let detail = Object.fromEntries(Object.entries(option).filter(([_, v]) => typeof v !== "function"));
                detail.value = value;

                let message = {
                    type: "style",
                    detail: detail,
                };

                debounceMsg(thisBrowser, message);
            }

            if (option.callback !== undefined) {
                option.callback(node.checked === false ? 'lang-en' : 'lang-pt');
            }
        });
    }
}

function messageTwitchTabs(browser, message) {
    console.log('just to have a string');
    browser.tabs.query({}, tabs => {
        tabs.forEach(tab => {
            if (tab.url.match(/https:\/\/[^.]+\.(?!.*-.*).+\.com\//)) {
                browser.tabs.sendMessage(tab.id, message, response => {
                    store(response);
                });
            }
        });
    });
}
function debounce(func, timeout = 100) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args);
        }, timeout);
    };
}

// make firefox fire resize popup by dom manipulation as hover doesn't trigger it
document.querySelectorAll('.tooltip').forEach(elem => {
    elem.addEventListener('mouseleave', () => {
        let a = document.createElement('a');
        document.body.appendChild(a);
        document.body.removeChild(a);
    });
});


function setRangeBackground(node) {
    let point = (node.value - node.min) / (node.max - node.min) * 100;
    node.style.background = `linear-gradient(to right, #a970ff 0%, #a970ff ${point}%, hsla(0,0%,100%,0.2) ${point}%, hsla(0,0%,100%,0.2) 100%)`;
}
let nodes = document.querySelectorAll("input[type='range']");
document.addEventListener('DOMContentLoaded', () => {
    thisBrowser.storage.local.get(null, result => {
        for (let [optionId, option] of Object.entries(result)) {
            document.querySelector(`#${optionId} input`)[options[optionId].property] = result[optionId];
            if (chrome?.app) {
                nodes.forEach(node => {
                    setRangeBackground(node);
                });
            }

            if (options[optionId].callback) {
                options[optionId].callback(result[optionId] === false ? 'lang-en' : 'lang-pt');
            }
            console.log(optionId, option);
        }
        console.log(result);
    });
});

if (chrome?.app) {
    nodes.forEach(node => {
        node.addEventListener('input', evt => { setRangeBackground(evt.target); });
    });
}

document.getElementById('donate').addEventListener('click', () => {
    window.open('https://www.paypal.com/donate/?business=NJ6EEA8PWCZW2&no_recurring=0&currency_code=BRL');
});

document.getElementById('twitter').addEventListener('click', () => {
    window.open('https://twitter.com/ttvxuxameneghel');
});

document.getElementById('github').addEventListener('click', () => {
    window.open('https://github.com/nimeco/twitch-1-click-quality');
});

thisBrowser.storage.onChanged.addListener((changes, namespace) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        console.log(
            `Storage key "${key}" in namespace "${namespace}" changed.`,
            `Old value was "${oldValue}", new value is "${newValue}".`,
        );
    }
});
