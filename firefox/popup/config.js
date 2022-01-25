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

let options = {
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
    for (let [optionId, properties] of Object.entries(options)) {
        let node = document.querySelector(`#${optionId} input`);
        node.addEventListener(properties.event, (event) => {
            let optionValue = {[optionId]: event.target[properties.property]};

            node[properties.property] = optionValue[optionId];
            thisBrowser.storage.local.set(optionValue);

            if (properties.style != undefined) {
                let message = {
                    type: "style",
                    detail: {
                        'selector': '.quality-button-header',
                        'value': optionValue[optionId],
                        'property': properties.property,
                        'style': properties.style,
                    }
                }

                // thisBrowser.tabs.query({}, (tabs) => {
                //     tabs.forEach((tab) => {
                //         console.log(tab.title);
                //         thisBrowser.tabs.sendMessage(tab.id, message, (response) => {
                //             console.log("response", response);
                //         });
                //     });
                // });

                thisBrowser.tabs.query({active: true, currentWindow: true}, (tabs) => {
                    console.log("title", tabs[0].title);
                    thisBrowser.tabs.sendMessage(tabs[0].id, message, (response) => {
                        console.log("response", response);
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
        for (let [optionId, properties] of Object.entries(result)) {
            let optionValue = result[optionId];
            document.querySelector(`#${optionId} input`)[options[optionId].property] = optionValue;
            console.log(optionId, properties);
        }
        console.log(result);
    });
});

thisBrowser.storage.onChanged.addListener((changes, namespace) => {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
        console.log(
            `Storage key "${key}" in namespace "${namespace}" changed.`,
            `Old value was "${oldValue}", new value is "${newValue}".`
        );
    }
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
