let thisBrowser = null;
if (chrome) {
    thisBrowser = chrome;
} else {
    thisBrowser = browser;
}

const setControlValue = (selector, property, value, event) => {
    let node = document.querySelectorAll(selector);
    node.forEach(n => {
        n[property] = value;
        n.dispatchEvent(new Event(event, { bubbles: true }));
    });
};

const defaultLocale = "en";
let locale;
let translations = {};

const setLocale = newLocale => {
    if (newLocale === locale) return;
    locale = newLocale;
    translatePage();
};

const fetchTranslations = async() => {
    const response = await fetch(`translations.json`);
    return response.json();
};

const translatePage = async() => {
    if (Object.keys(translations).length === 0) {
        translations = await fetchTranslations();
    }
    document.querySelectorAll("[data-i18n-key]").forEach(translateElement);
};

const translateElement = element => {
    const key = element.dataset.i18nKey;
    const translation = translations[key][locale];
    if (element.classList.contains("tooltip")) {
        element.dataset.description = translation;
    } else {
        element.innerText = translation;
    }
};

const options = {
    'option-quality-save': {
        type: 'input',
        event: 'click',
        property: 'checked',
        message: 'update-cache',
    },
    'option-mute-on-lowest': {
        type: 'input',
        event: 'click',
        property: 'checked',
        message: 'update-cache',
    },
    'option-unmute-on-highest': {
        type: 'input',
        event: 'click',
        property: 'checked',
        message: 'update-cache',
    },
    'option-mute-volume': {
        type: 'input',
        event: 'input',
        property: 'value',
        message: 'update-cache',
    },
    'option-button-margin': {
        type: 'input',
        event: 'input',
        property: 'value',
        selector: '.quality-button-header',
        message: 'calculate-style',
    },
    'option-button-scale': {
        type: 'input',
        event: 'input',
        property: 'value',
        selector: '.quality-button-header',
        message: 'calculate-style',
    },
    'option-button-border': {
        type: 'input',
        event: 'input',
        property: 'value',
        selector: '.quality-button-header',
        message: 'calculate-style',
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
                setControlValue('#checkbox-mute-on-lowest', 'checked', items['reset-mute-on-lowest'], 'click');
                setControlValue('#checkbox-unmute-on-highest', 'checked', items['reset-unmute-on-highest'], 'click');
                setControlValue('#range-margin', 'value', items['reset-button-margin'], 'input');
                setControlValue('#range-scale', 'value', items['reset-button-scale'], 'input');
                setControlValue('#range-border', 'value', items['reset-button-border'], 'input');
                setControlValue('#checkbox-transition', 'checked', items['reset-toggle-transition'], 'click');

                const resetColors = {};
                [
                    'text',
                    'background',
                    'text-hover',
                    'background-hover',
                    'text-selected',
                    'background-selected'
                ].forEach(color => {
                    const optionColor = `option-color-${color}`;
                    const resetColor = `reset-color-${color}`;

                    sendColorToTab(optionColor, items[resetColor]);
                    setColorPreviewDot(optionColor, items[resetColor]);
                    resetColors[optionColor] = items[resetColor];
                });

                thisBrowser.storage.local.set(resetColors);
            });
        },
    },
};

let savedParams = {};
let currentId = { id: 'option-color-text' };

const messageTwitchTabs = message => {
    thisBrowser.tabs.query({}, tabs => {
        tabs.forEach(tab => {
            if (tab.url.match(/^(?:https?:\/\/)?(?:[^.]+\.)?twitch\.(tv|com)\/[^/]+\/?$/)) {
                thisBrowser.tabs.sendMessage(tab.id, message);
            }
        });
    });
};
const debounce = (func, timeout = 100) => {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            func.apply(this, args);
        }, timeout);
    };
};

// make firefox fire resize popup by dom manipulation as hover doesn't trigger it
document.querySelectorAll('.tooltip').forEach(elem => {
    elem.addEventListener('mouseleave', () => {
        let node = document.createElement('a');
        document.body.appendChild(node);
        document.body.removeChild(node);
    });
});


const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

const getCursorPosition = (element, event) => {
    const rect = element.getBoundingClientRect();
    const clampedX = clamp(event.clientX, rect.left, rect.right - 1);
    const clampedY = clamp(event.clientY, rect.top, rect.bottom - 1);
    return [clampedX - rect.left, clampedY - rect.top];
};

const truncDigits = (color, digits = 2) => [
    Number(color[0]).toFixed(digits),
    Number(color[1]).toFixed(digits),
    Number(color[2]).toFixed(digits),
];


const hsv2rgb = (h, s, v) => {
    const f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
    return [f(5), f(3), f(1)];
};
const rgb2hsv = (r, g, b) => {
    const v = Math.max(r, g, b), c = v - Math.min(r, g, b);
    const h = c && (v === r ? (g - b) / c : v === g ? 2 + (b - r) / c : 4 + (r - g) / c);
    return [60 * (h < 0 ? h + 6 : h), v && c / v, v];
};

const rgb2hex = (r, g, b) => `#${(1 << 24 | (r * 255 << 16) | (g * 255 << 8) | b * 255).toString(16).slice(1).toUpperCase()}`;

const hex2rgb = hex => {
    if (hex[0] === '#') {
        hex = hex.substring(1);
    }
    const bigInt = parseInt(hex, 16);
    const r = (bigInt >> 16) & 255;
    const g = (bigInt >> 8) & 255;
    const b = bigInt & 255;
    return [r, g, b];
};

const normalizeRgb = (r, g, b) => [r, g, b].map(v => v / 255);

const validateHexRgb = hex => /^#?[0-9A-F]{3}([0-9A-F]{3})?$/i.test(hex);

const sendColorToTab = (id, value) => {
    messageTwitchTabs({
        type: "select-color",
        detail: {
            'requested-key': id,
            value: value,
        }
    });
};
const setPickedColor = color => {
    const pickedColor = document.getElementById('picked-color');
    pickedColor.style.setProperty('background-color', color);
};
const mouseMovePickerHandler = (event, target, cursor, textNodes) => {
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
    setPickedColor(rgbHex);

    sendColorToTab(id, rgbHex);
};

const mouseMoveSliderHandler = (event, target, cursor, textNodes) => {
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
    setPickedColor(rgbHex);

    sendColorToTab(id, rgbHex);
    target.parentElement.querySelector('.color-picker').style.setProperty('--hue', `${Math.round(degrees)}`);
};
const mouseDown = (eventDown, func, cursor, textNodes) => {
    const originalTarget = eventDown.target;

    func(eventDown, originalTarget, cursor, textNodes);
    const mouseMove = event => {
        func(event, originalTarget, cursor, textNodes);
    };
    const mouseUp = () => {
        clearEvents();
    };
    const clearEvents = () => {
        window.removeEventListener('mousemove', mouseMove);
        window.removeEventListener('mouseup', mouseUp);
    };
    window.addEventListener('mousemove', mouseMove, { passive: true });
    window.addEventListener('mouseup', mouseUp, { passive: true });
};

const setCursorCoords = (cursor, x, y) => {
    cursor.style.left = `${Math.round(x)}px`;
    cursor.style.top = `${Math.round(y)}px`;
};

const initColorPicker = () => {
    const dialogPicker = document.getElementById("dialog-color-picker");
    const rgbText = dialogPicker.querySelector(".color-picker-input");
    const textNodes = { rgbText };

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
};

const getStorage = _keys => new Promise(resolve => {
    let keys = _keys;
    let oneArgument = false;
    if (typeof _keys === "string") {
        keys = [keys];
        oneArgument = true;
    }

    thisBrowser.storage.local.get(keys, items => {
        if (oneArgument) {
            resolve(Object.values(items)[0]);
        } else {
            resolve(items);
        }
    });
});

const setColorPreviewDot = async(id, color) => {
    const selector = `#${id}-tooltip > span.color-tooltip`;
    if (!color) {
        color = await getStorage(id);
    }
    const element = document.querySelector(selector);
    element.style.backgroundColor = color;
    element.dataset.description = color;
};

let eventsSet = false;
const initOpenDialogButton = id => {
    const inputToggle = document.getElementById(id);
    const dialogPicker = document.getElementById("dialog-color-picker");
    const confirmButton = dialogPicker.querySelector("button");
    const rgbText = dialogPicker.querySelector(".color-picker-input");
    const colorPickerNode = dialogPicker.querySelector('.color-picker');
    const colorPickerCursor = dialogPicker.querySelector(".color-picker-cursor");
    const colorPickerSliderCursor = dialogPicker.querySelector('.color-picker-slider-cursor');

    inputToggle.addEventListener('change', async event => {
        currentId.id = id;
        event.target.checked = !event.target.checked;
        const currentColor = await getStorage(id);
        preSelectColor(currentColor);
        event.target.checked = !event.target.checked;
        const dialogTitle = document.getElementById("dialog-title");

        if (event.target.checked) {
            dialogPicker.querySelector('label.close-button').setAttribute('for', id);
            dialogTitle.textContent = document.querySelector(`#${event.target.id}-label > span`).textContent;
        } else {
            confirmButton.classList.remove('confirm-button');
        }
    });

    const pinpointCursor = (r, g, b) => {
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
    };
    const preSelectColor = (rgbHex, func) => {
        if (validateHexRgb(rgbHex)) {
            if (rgbHex.length === 4) {
                rgbHex = rgbHex.replaceAll(/([0-9a-fA-F])/gi, "$1$1");
            }
            rgbText.value = rgbHex;
            setPickedColor(rgbHex);
            const rgbDec = hex2rgb(rgbHex);
            pinpointCursor(...rgbDec);
            sendColorToTab(currentId.id, rgbHex);
            if (func) {
                func();
            }
        }
    };

    if (!eventsSet) {
        rgbText.addEventListener('input', event => {
            let rgbHex = event.target.value.toUpperCase();
            confirmButton.classList.remove('confirm-button');
            if (rgbHex.length === 0) {
                event.target.value = '#';
            } else if (rgbHex[0] === "#") {
                event.target.value = `${rgbHex.substring(0, 7)}`;
            } else {
                event.target.value = `#${rgbHex.substring(0, 6)}`;
            }

            if ((rgbHex.length === 4 || rgbHex.length === 7) && validateHexRgb(rgbHex)) {
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
                thisBrowser.storage.local.set({ [currentId.id]: rgbText.value });
                setColorPreviewDot(currentId.id, rgbText.value);
            });
        });
        eventsSet = true;
    }
};

// init control values and set listeners (except color pickers)
const initControls = () => {
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
                    // let detail = Object.fromEntries(Object.entries(option).filter(([_, v]) => typeof v !== 'function'));
                    let detail = option;
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
};

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
    const colorIds = [
        'option-color-text',
        'option-color-background',
        'option-color-text-hover',
        'option-color-background-hover',
        'option-color-text-selected',
        'option-color-background-selected',
    ];
    colorIds.forEach(id => initOpenDialogButton(id));
    colorIds.forEach(id => setColorPreviewDot(id));
    initControls();
});
