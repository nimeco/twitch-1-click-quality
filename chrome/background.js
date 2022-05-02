let thisBrowser = null;
if (chrome?.app) {
    thisBrowser = chrome;
} else {
    thisBrowser = browser;
}

thisBrowser.runtime.onInstalled.addListener(() => {
    let defaultOptions = [
        { 'option-quality-save': true },

        // margin from 0-100
        { 'option-button-margin': "0" },

        // scale from 50 to 200 (%)
        { 'option-button-scale': "100" },

        { 'option-language-save': 'lang-en' },
    ];

    for (let option of defaultOptions) {
        thisBrowser.storage.local.set(option);
    }
});
