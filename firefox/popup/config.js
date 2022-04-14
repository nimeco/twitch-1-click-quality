let thisBrowser = null;
if (chrome?.app) {
    thisBrowser = chrome;
} else {
    thisBrowser = browser;
}

const options = {
    'option-quality-save': {
        event: 'click',
        property: 'checked',
    },
    'option-button-margin': {
        event: 'input',
        property: 'value',
        style: 'marginRight',
        selector: '.quality-button-header',
        calc: x => `${144.5 - (149 / 140 * x)}%`,
        // calc: x => `${11.5 - (0.15 * x)}rem`,
    },
    'option-button-scale': {
        event: 'input',
        property: 'value',
        style: 'transform',
        selector: '.quality-button-header',
        calc: x => `scale(${x / 100})`,
    },
    'option-language-save': {
        event: 'change',
        property: 'value',
        callback: node => {
            document.body.removeAttribute('class');
            document.body.classList.add(node);
        },
    },
};

if (thisBrowser) {
    for (let [optionId, option] of Object.entries(options)) {
        let node = document.querySelector(`#${optionId} .input`);
        let debounceSet = debounce((...args) => thisBrowser.storage.local.set(...args));
        let debounceMsg = debounce((...args) => messageTwitchTabs(...args));
        node.addEventListener(option.event, () => {
            debounceSet({ [optionId]: node[option.property] });

            if (option.style !== undefined) {
                let value = option.calc(node[option.property]);
                let detail = Object.fromEntries(Object.entries(option).filter(([_, v]) => typeof v !== 'function'));
                detail.value = value;

                let message = {
                    type: 'style',
                    detail: detail,
                };

                debounceMsg(thisBrowser, message);
            }

            if (option.callback !== undefined) {
                option.callback(node[option.property]);
            }
        });
    }
}

function messageTwitchTabs(browser, message) {
    browser.tabs.query({}, tabs => {
        tabs.forEach(tab => {
            if (tab.url.match(/^(?:https?:\/\/)?(?:[^.]+\.)?twitch\.(tv|com)\/[^/]+\/?$/)) {
                browser.tabs.sendMessage(tab.id, message);
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
        let node = document.createElement('a');
        document.body.appendChild(node);
        document.body.removeChild(node);
    });
});

document.addEventListener('DOMContentLoaded', () => {
    thisBrowser.storage.local.get(null, result => {
        for (let [optionId, option] of Object.entries(result)) {
            let node = document.querySelector(`#${optionId} .input`);
            node[options[optionId].property] = result[optionId];

            if (options[optionId].callback) {
                options[optionId].callback(result[optionId]);
            }
        }

        for (let e of document.querySelectorAll('input[type="range"]')) {
            e.style.setProperty('--value', e.value);
            e.style.setProperty('--min', e.min === '' ? '0' : e.min);
            e.style.setProperty('--max', e.max === '' ? '100' : e.max);
            e.addEventListener('input', () => e.style.setProperty('--value', e.value));
        }
    });
});

document.getElementById('donate').addEventListener('click', () => {
    window.open('https://www.paypal.com/donate/?business=NJ6EEA8PWCZW2&no_recurring=0&currency_code=BRL');
});

document.getElementById('twitter').addEventListener('click', () => {
    window.open('https://twitter.com/ttvxuxameneghel');
});

document.getElementById('github').addEventListener('click', () => {
    window.open('https://github.com/nimeco/twitch-1-click-quality');
});
