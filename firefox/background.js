let thisBrowser = null;
if (chrome?.app) {
    thisBrowser = chrome;
} else {
    thisBrowser = browser;
}

thisBrowser.runtime.onInstalled.addListener(() => {
    let defaultOptions = [
        { 'option-quality-save': true },

        // max button margin == 140
        { 'option-button-margin': "140" },

        // middle button scale == 100
        { 'option-button-scale': "100" },

        { 'option-language-save': 'lang-en' },
    ];

    for (let option of defaultOptions) {
        thisBrowser.storage.local.set(option);
    }
});
