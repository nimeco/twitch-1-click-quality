let thisBrowser = null; 
if (!chrome?.app) {
    thisBrowser = chrome;
}
else {
    thisBrowser = browser;
}

function getItem(key) {
    thisBrowser.storage.local.get(key, (result) => {
        if (result) {
            return result
        }
    });
    return null;
}

const options = {
    "option-quality-save": {
        event: "click",
        property: "checked",
    },
    "option-button-width": {
        event: "input",
        property: "value",
        style: "marginRight",
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
        node.addEventListener(option.event, (event) => {
            thisBrowser.storage.local.set({[optionId]: node[option.property]});

            if (option.style != undefined) {
                let message = {
                    type: "style",
                    detail: {
                        'selector': '.quality-button-header',
                        'value': node[option.property],
                        'property': option.property,
                        'style': option.style,
                    }
                }

                // active: true, currentWindow: true
                thisBrowser.tabs.query({}, (tabs) => {
                    tabs.forEach((tab) => {
                        console.log("title", tab.title);
                        thisBrowser.tabs.sendMessage(tab.id, message, (response) => {
                            console.log("response", response);
                        });
                    });
                });
            }
        });
    }
}


// make firefox fire resize popup by dom manipulation as hover doesn't trigger it
document.querySelectorAll('.tooltip').forEach((elem) => {
    elem.addEventListener('mouseleave', () => {
        let a = document.createElement('a');
        document.body.appendChild(a);
        document.body.removeChild(a);
    });
});

document.addEventListener('DOMContentLoaded', () => {
    thisBrowser.storage.local.get(null, (result) => {
        for (let [optionId, option] of Object.entries(result)) {
            document.querySelector(`#${optionId} input`)[options[optionId].property] = result[optionId];
            console.log(optionId, option);
        }
        console.log(result);
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


thisBrowser.storage.onChanged.addListener((changes, namespace) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        console.log(
            `Storage key "${key}" in namespace "${namespace}" changed.`,
            `Old value was "${oldValue}", new value is "${newValue}".`
        );
    }
});
