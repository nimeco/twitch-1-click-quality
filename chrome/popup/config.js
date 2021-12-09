let thisBrowser = null; 
if (!chrome?.app) {
    thisBrowser = chrome;
}
else {
    thisBrowser = browser;
}

let keys = ["option-quality-save"];

if (thisBrowser) {
    for (let key of keys) {
        document.querySelector(`#${key} .switch-input`).addEventListener('click', (event) => {
            let aux = {[key]: event.target.checked};
            thisBrowser.storage.local.set(aux);
        });
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
            for (let [key, value] of Object.entries(result)) {
                console.log(key, value);
                document.querySelector(`#${key} .switch-input`).checked = value;
            }
            console.log(result);
        });
    });


    thisBrowser.storage.onChanged.addListener(function (changes, namespace) {
        for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
            console.log(
                `Storage key "${key}" in namespace "${namespace}" changed.`,
                `Old value was "${oldValue}", new value is "${newValue}".`
            );
        }
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
