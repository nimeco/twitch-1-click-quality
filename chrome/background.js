let thisBrowser = null; 
if (!chrome?.app) {
    thisBrowser = chrome;
}
else {
    thisBrowser = browser;
}

thisBrowser.runtime.onInstalled.addListener((details) => {
    let defaultOptions = [
        {'option-quality-save': true}
    ];

    for (let entry of defaultOptions) {
        thisBrowser.storage.local.set(entry);
    }
})
