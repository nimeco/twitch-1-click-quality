let thisBrowser = null; 
if (chrome?.app) {
    thisBrowser = chrome;
}
else {
    thisBrowser = browser;
}

thisBrowser.runtime.onInstalled.addListener(() => {
    let defaultOptions = [
        {'option-quality-save': true},
        {'option-button-margin': "100"},
        {'option-button-scale': "100"},
    ];

    for (let option of defaultOptions) {
        thisBrowser.storage.local.set(option);
    }
})
