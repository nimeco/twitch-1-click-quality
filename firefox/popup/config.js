let thisBrowser = null;
if (chrome) {
    thisBrowser = chrome;
} else {
    thisBrowser = browser;
}

function setControlValue(selector, property, value, event) {
    let node = document.querySelectorAll(selector);
    node.forEach(n => {
        n[property] = value;
        n.dispatchEvent(new Event(event, { bubbles: true }));
    });
}

const defaultLocale = "en";
let locale;
let translations = {};

function setLocale(newLocale) {
    if (newLocale === locale) return;
    locale = newLocale;
    translatePage();
}

async function fetchTranslations() {
    const response = await fetch(`translations.json`);
    return response.json();
}

async function translatePage() {
    if (Object.keys(translations).length === 0) {
        translations = await fetchTranslations();
    }
    document.querySelectorAll("[data-i18n-key]").forEach(translateElement);
}

function translateElement(element) {
    const key = element.dataset.i18nKey;
    const translation = translations[locale][key];
    if (key === "qualityTooltip") {
        element.dataset.description = translation;
    } else {
        element.innerText = translation;
    }
}

const options = {
    'option-quality-save': {
        type: 'input',
        event: 'click',
        property: 'checked',
    },
    'option-button-margin': {
        type: 'input',
        event: 'input',
        property: 'value',
        selector: '.quality-button-header',
        message: 'calculate-style',
        calc: x => `${x}`,
    },
    'option-button-scale': {
        type: 'input',
        event: 'input',
        property: 'value',
        selector: '.quality-button-header',
        message: 'calculate-style',
        calc: x => `${x}`,
    },
    'option-language-save': {
        type: 'select',
        event: 'change',
        property: 'value',
        callback: value => {
            setLocale(value);
            translatePage();
        },
    },
    'option-toggle-transition': {
        type: 'input',
        event: 'click',
        property: 'checked',
        message: 'toggle-transition',
    },
    'option-reset': {
        type: '',
        event: 'click',
        callback: () => {
            thisBrowser.storage.local.get(null, items => {
                setControlValue('#checkbox-save', 'checked', items['reset-quality-save'], 'click');
                setControlValue('#range-margin', 'value', items['reset-button-margin'], 'input');
                setControlValue('#range-scale', 'value', items['reset-button-scale'], 'input');
                setControlValue('#checkbox-transition', 'checked', items['reset-toggle-transition'], 'click');

                [
                    'text', 'background', 'text-hover',
                    'background-hover', 'text-selected', 'background-selected'
                ].forEach(color => sendColorToTab(`option-color-${color}`, `reset-color-${color}`));

                thisBrowser.storage.local.set({
                    'option-color-text': items['reset-color-text'],
                    'option-color-background': items['reset-color-background'],
                    'option-color-text-hover': items['reset-color-text-hover'],
                    'option-color-background-hover': items['reset-color-background-hover'],
                    'option-color-text-selected': items['reset-color-text-selected'],
                    'option-color-background-selected': items['reset-color-background-selected'],
                });
            });
        },
    },
};

let savedParams = {};
let currentId = { id: 'option-color-text' };

function messageTwitchTabs(message) {
    thisBrowser.tabs.query({}, tabs => {
        tabs.forEach(tab => {
            if (tab.url.match(/^(?:https?:\/\/)?(?:[^.]+\.)?twitch\.(tv|com)\/[^/]+\/?$/)) {
                thisBrowser.tabs.sendMessage(tab.id, message);
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


function clamp(n, min, max) {
    return Math.min(Math.max(n, min), max);
}
function getCursorPosition(element, event) {
    const rect = element.getBoundingClientRect();
    const clampedX = clamp(event.clientX, rect.left, rect.right - 1);
    const clampedY = clamp(event.clientY, rect.top, rect.bottom - 1);
    return [clampedX - rect.left, clampedY - rect.top];
}

function truncDigits(color, digits = 2) {
    return [
        Number(color[0]).toFixed(digits),
        Number(color[1]).toFixed(digits),
        Number(color[2]).toFixed(digits),
    ];
}

function hsv2rgb(h, s, v) {
    const f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
    return [f(5), f(3), f(1)];
}
function rgb2hsv(r, g, b) {
    const v = Math.max(r, g, b), c = v - Math.min(r, g, b);
    const h = c && (v === r ? (g - b) / c : v === g ? 2 + (b - r) / c : 4 + (r - g) / c);
    return [60 * (h < 0 ? h + 6 : h), v && c / v, v];
}

function rgb2hex(r, g, b) {
    return `#${(1 << 24 | (r * 255 << 16) | (g * 255 << 8) | b * 255).toString(16).slice(1).toUpperCase()}`;
}
function hex2rgb(hex) {
    if (hex[0] === '#') {
        hex = hex.substring(1);
    }
    const bigInt = parseInt(hex, 16);
    const r = (bigInt >> 16) & 255;
    const g = (bigInt >> 8) & 255;
    const b = bigInt & 255;
    return [r, g, b];
}

function normalizeRgb(r, g, b) {
    return [r, g, b].map(v => v / 255);
}
function validateHexRgb(hex) {
    return /^#?[0-9A-F]{3}([0-9A-F]{3})?$/i.test(hex);
}
function sendColorToTab(id, value) {
    messageTwitchTabs({
        type: "select-color",
        detail: {
            'requested-key': id,
            value: value,
        }
    });
}
function mouseMovePickerHandler(event, target, cursor, textNodes) {
    const [cursorX, cursorY] = getCursorPosition(target, event);
    const id = currentId.id;

    savedParams = {
        ...savedParams,
        savedX: cursorX,
        savedY: cursorY,
    };
    let { savedSliderX, savedX, savedY, savedW, savedH } = savedParams;

    const degrees = 360 * savedSliderX / savedW;
    const convertedY = savedH - savedY;

    setCursorCoords(cursor, cursorX, cursorY);
    const rgbDec = truncDigits(hsv2rgb(...[degrees, savedX / savedW, convertedY / savedH]));
    const rgbHex = rgb2hex(...rgbDec);
    textNodes.rgbText.value = rgbHex;
    textNodes.rgbText.dispatchEvent(new Event('input', { bubbles: true }));

    sendColorToTab(id, rgbHex);
}

function mouseMoveSliderHandler(event, target, cursor, textNodes) {
    const [cursorX,] = getCursorPosition(target, event);
    const id = currentId.id;

    savedParams.savedSliderX = cursorX;
    let { savedSliderX, savedX, savedY, savedW, savedH } = savedParams;

    const degrees = 360 * savedSliderX / savedW;
    const convertedY = savedH - savedY;

    setCursorCoords(cursor, cursorX, 0);
    const rgbDec = truncDigits(hsv2rgb(...[degrees, savedX / savedW, convertedY / savedH]));
    const rgbHex = rgb2hex(...rgbDec);
    textNodes.rgbText.value = rgbHex;
    textNodes.rgbText.dispatchEvent(new Event('input', { bubbles: true }));

    sendColorToTab(id, rgbHex);
    target.parentElement.querySelector('.color-picker').style.setProperty('--hue', `${Math.round(degrees)}`);
}
function mouseDown(eventDown, func, cursor, textNodes) {
    const originalTarget = eventDown.target;

    func(eventDown, originalTarget, cursor, textNodes);
    function mouseMove(event) {
        func(event, originalTarget, cursor, textNodes);
    }
    function mouseUp() {
        clearEvents();
    }
    function clearEvents() {
        window.removeEventListener('mousemove', mouseMove);
        window.removeEventListener('mouseup', mouseUp);
    }
    window.addEventListener('mousemove', mouseMove, { passive: true });
    window.addEventListener('mouseup', mouseUp, { passive: true });
}

function setCursorCoords(cursor, x, y) {
    cursor.style.left = `${Math.round(x)}px`;
    cursor.style.top = `${Math.round(y)}px`;
}

function initOpenDialogButton(id) {
    const inputToggle = document.getElementById(id);

    inputToggle.addEventListener('change', event => {
        const dialogPicker = document.getElementById("dialog-color-picker");
        const dialogTitle = document.getElementById("dialog-title");
        const confirmButton = dialogPicker.querySelector("button");

        if (event.target.checked) {
            dialogPicker.querySelector('label.close-button').setAttribute('for', id);
            // translateElement(confirmButton);
            dialogTitle.textContent = document.querySelector(`#${event.target.id}-label > span`).textContent;
            currentId.id = id;
        } else {
            confirmButton.classList.remove('confirm-button');
        }
    });
}

function initColorPicker() {
    const dialogPicker = document.getElementById("dialog-color-picker");
    const rgbText = dialogPicker.querySelector(".color-picker-input");
    const textNodes = { rgbText };
    const confirmButton = dialogPicker.querySelector("button");

    const colorPickerNode = dialogPicker.querySelector('.color-picker');
    const colorPickerCursor = dialogPicker.querySelector(".color-picker-cursor");
    colorPickerNode.addEventListener('mousedown', event => {
        mouseDown(event, mouseMovePickerHandler, colorPickerCursor, textNodes);
    }, { passive: true });

    const colorPickerSliderNode = dialogPicker.querySelector('.color-slider');
    const colorPickerSliderCursor = dialogPicker.querySelector('.color-picker-slider-cursor');
    colorPickerSliderNode.addEventListener('mousedown', event => {
        mouseDown(event, mouseMoveSliderHandler, colorPickerSliderCursor, textNodes);
    }, { passive: true });

    const rectPicker = window.getComputedStyle(colorPickerNode);
    const rectPickerSlider = window.getComputedStyle(colorPickerSliderNode);
    savedParams = {
        savedX: 0,
        savedY: 0,
        savedW: parseInt(rectPicker.width) - 1,
        savedH: parseInt(rectPicker.height) - 1,
        savedSliderX: 0,
        savedSliderW: parseInt(rectPickerSlider.width) - 1,
    };

    function pinpointCursor(r, g, b) {
        const rgbNormalized = normalizeRgb(r, g, b);
        const hsv = rgb2hsv(...rgbNormalized);

        let { savedSliderW, savedW, savedH } = savedParams;

        savedParams = {
            ...savedParams,
            savedSliderX: hsv[0] / 360 * savedSliderW,
            savedX: hsv[1] * savedW,
            savedY: savedH - hsv[2] * savedH,
        };

        let { savedSliderX } = savedParams;

        setCursorCoords(colorPickerCursor, hsv[1] * savedW, (1 - hsv[2]) * savedH);
        setCursorCoords(colorPickerSliderCursor, savedSliderX, 0);

        colorPickerNode.style.setProperty('--hue', `${Math.round(hsv[0])}`);
    }
    function preSelectColor(rgbHex, func) {
        if (validateHexRgb(rgbHex)) {
            if (rgbHex.length === 4) {
                rgbHex = rgbHex.replaceAll(/([0-9a-fA-F])/gi, "$1$1");
                rgbText.value = rgbHex;
            }
            const rgbDec = hex2rgb(rgbHex);
            pinpointCursor(...rgbDec);
            const id = currentId.id;
            sendColorToTab(id, rgbHex);
            if (func) {
                func();
            }
        }
    }

    rgbText.addEventListener('input', event => {
        let rgbHex = event.target.value;
        confirmButton.classList.remove('confirm-button');
        if (rgbHex.length === 0) {
            event.target.value = '#';
        } else if (rgbHex.length === 1 && rgbHex !== "#") {
            event.target.value = `#${rgbHex}`;
        }

        if ((rgbHex.length === 4 || rgbHex.length === 7) && /#[a-fA-F0-9]{3}([a-fA-F0-9]{3})?$/.test(rgbHex)) {
            confirmButton.removeAttribute('disabled');
        } else {
            confirmButton.setAttribute('disabled', '');
        }
    });
    rgbText.addEventListener('keydown', event => {
        let rgbHex = event.target.value;
        if (event.key === "Backspace" && rgbHex.length === 1) {
            event.preventDefault();
            event.stopPropagation();
        } else if (event.key === "Enter") {
            confirmButton.dispatchEvent(new Event("click", { bubbles: true }));
        }
    });
    rgbText.addEventListener('focusout', () => {
        preSelectColor(rgbText.value);
    });
    confirmButton.addEventListener('click', event => {
        preSelectColor(rgbText.value, () => {
            event.target.classList.add('confirm-button');
            const id = currentId.id;
            thisBrowser.storage.local.set({ [id]: rgbText.value });
        });
    });
}

// init control values and set listeners (except color pickers)
function initControls() {
    for (let [optionId, option] of Object.entries(options)) {
        let node = document.querySelector(`#${optionId} ${options[optionId].type}`);
        let debounceSet = debounce((...args) => thisBrowser.storage.local.set(...args));
        let debounceMsg = debounce((...args) => messageTwitchTabs(...args));
        if (option.event) {
            node.addEventListener(option.event, () => {
                if (option.property) {
                    debounceSet({ [optionId]: node[option.property] });
                }

                if (option.message) {
                    let value = node[option.property];
                    if (option.calc) {
                        value = option.calc(value);
                    }
                    let detail = Object.fromEntries(Object.entries(option).filter(([_, v]) => typeof v !== 'function'));
                    detail.value = value;
                    detail['requested-key'] = optionId;

                    let message = {
                        type: option.message,
                        detail: detail,
                    };

                    debounceMsg(message);
                }

                if (option.callback) {
                    option.callback(node[option.property]);
                }
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    thisBrowser.storage.local.get(null, result => {
        for (let [optionId, option] of Object.entries(result)) {
            if (!(optionId in options)) {
                continue;
            }
            let node = document.querySelector(`#${optionId} ${options[optionId].type}`);
            node[options[optionId].property] = option;

            if (options[optionId].callback) {
                options[optionId].callback(option, optionId);
            }
        }

        for (let elem of document.querySelectorAll('input[type="range"]')) {
            elem.style.setProperty('--value', elem.value);
            elem.style.setProperty('--min', elem.min === '' ? '0' : elem.min);
            elem.style.setProperty('--max', elem.max === '' ? '100' : elem.max);
            elem.addEventListener('input', () => elem.style.setProperty('--value', elem.value));
            elem.addEventListener('change', () => elem.style.setProperty('--value', elem.value));
        }
    });

    setLocale(defaultLocale);
    initColorPicker();
    [
        'option-color-text',
        'option-color-background',
        'option-color-text-hover',
        'option-color-background-hover',
        'option-color-text-selected',
        'option-color-background-selected',
    ].forEach(id => initOpenDialogButton(id));
    initControls();
});
