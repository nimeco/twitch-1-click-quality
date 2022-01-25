let thisBrowser = null; 
if (!chrome?.app) {
    thisBrowser = chrome;
}
else {
    thisBrowser = browser;
}

thisBrowser.runtime.onInstalled.addListener(() => {
    let defaultOptions = [
        {'option-quality-save': true},
        {'option-button-width': 69},
    ];

    for (let option of defaultOptions) {
        thisBrowser.storage.local.set(option);
    }
})
