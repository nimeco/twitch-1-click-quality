let thisBrowser = null;
if (chrome) {
    thisBrowser = chrome;
} else {
    thisBrowser = browser;
}

thisBrowser.runtime.onInstalled.addListener(details => {
    if (details.reason === thisBrowser.runtime.OnInstalledReason.INSTALL) {
        const defaultOptions = {
            'option-quality-save': true,
            'option-mute-on-lowest': true,
            'option-unmute-on-highest': true,
            'option-mute-volume': 100,
            'option-button-margin': "0",
            'option-button-scale': "100",
            'option-toggle-transition': true,
            'option-language-save': 'en',
            'option-color-text': '#FFFFFF',
            'option-color-background': '#9147FF',
            'option-color-text-hover': '#FFFFFF',
            'option-color-background-hover': '#772CE8',
            'option-color-text-selected': '#FFFFFF',
            'option-color-background-selected': '#5C16C5',
            'reset-quality-save': true,
            'reset-mute-on-lowest': true,
            'reset-unmute-on-highest': true,
            'reset-mute-volume': 100,
            'reset-button-margin': "0",
            'reset-button-scale': "100",
            'reset-toggle-transition': true,
            'reset-language-save': 'en',
            'reset-color-text': '#FFFFFF',
            'reset-color-background': '#9147FF',
            'reset-color-text-hover': '#FFFFFF',
            'reset-color-background-hover': '#772CE8',
            'reset-color-text-selected': '#FFFFFF',
            'reset-color-background-selected': '#5C16C5',
        };
        thisBrowser.storage.local.set(defaultOptions);
    }
});
