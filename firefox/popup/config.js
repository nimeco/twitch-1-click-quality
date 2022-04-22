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
        style: 'margin-right',
        selector: '.quality-button-header',
        calc: x => `${x}`,
    },
    'option-button-scale': {
        event: 'input',
        property: 'value',
        style: 'transform',
        selector: '.quality-button-header',
        calc: x => `${x}`,
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
                detail['requested-key'] = optionId;

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

    document.querySelector('#option-reset').addEventListener('click', () => {
        let margin_node = document.querySelector('#range-margin');
        margin_node.value = 0;
        margin_node.dispatchEvent(new Event('input', { bubbles: true }));

        let scale_node = document.querySelector('#range-scale');
        scale_node.value = 100;
        scale_node.dispatchEvent(new Event('input', { bubbles: true }));
    });
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
            e.addEventListener('change', () => e.style.setProperty('--value', e.value));
        }
    });

    document.querySelector('.svg-close').addEventListener('click', () => {
        window.close();
    });
});
