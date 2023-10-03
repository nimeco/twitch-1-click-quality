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
    'option-color-text': {
        type: 'input',
        property: 'value',
        callback: (value, id) => {
            document.getElementById(id).querySelector('input.color-picker-input').dispatchEvent(new Event('focusout', { bubbles: true }));
        }
    },
    'option-color-background': {
        type: 'input',
        property: 'value',
        callback: (value, id) => {
            document.getElementById(id).querySelector('input.color-picker-input').dispatchEvent(new Event('focusout', { bubbles: true }));
        }
    },
    'option-color-text-hover': {
        type: 'input',
        property: 'value',
        callback: (value, id) => {
            document.getElementById(id).querySelector('input.color-picker-input').dispatchEvent(new Event('focusout', { bubbles: true }));
        }
    },
    'option-color-background-hover': {
        type: 'input',
        property: 'value',
        callback: (value, id) => {
            document.getElementById(id).querySelector('input.color-picker-input').dispatchEvent(new Event('focusout', { bubbles: true }));
        }
    },
    'option-color-text-selected': {
        type: 'input',
        property: 'value',
        callback: (value, id) => {
            document.getElementById(id).querySelector('input.color-picker-input').dispatchEvent(new Event('focusout', { bubbles: true }));
        }
    },
    'option-color-background-selected': {
        type: 'input',
        property: 'value',
        callback: (value, id) => {
            document.getElementById(id).querySelector('input.color-picker-input').dispatchEvent(new Event('focusout', { bubbles: true }));
        }
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
                setControlValue('#option-color-text .color-picker-input', 'value', items['reset-color-text'], 'focusout');
                setControlValue('#option-color-background .color-picker-input', 'value', items['reset-color-background'], 'focusout');
                setControlValue('#option-color-text-hover .color-picker-input', 'value', items['reset-color-text-hover'], 'focusout');
                setControlValue('#option-color-background-hover .color-picker-input', 'value', items['reset-color-background-hover'], 'focusout');
                setControlValue('#option-color-text-selected .color-picker-input', 'value', items['reset-color-text-selected'], 'focusout');
                setControlValue('#option-color-background-selected .color-picker-input', 'value', items['reset-color-background-selected'], 'focusout');

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

function messageTwitchTabs(message) {
    thisBrowser.tabs.query({}, tabs => {
        tabs.forEach(tab => {
            if (tab.url.match(/^(?:https?:\/\/)?(?:[^.]+\.)?twitch\.(tv|com)\/[^/]+\/?$/)) {
                thisBrowser.tabs.sendMessage(tab.id, message);
                // thisBrowser.tabs.sendMessage(tab.id, message, response => { console.log(response); });
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

function newElement(nodeName, attributes) {
    const node = document.createElement(nodeName);
    if (attributes) {
        Object.entries(attributes).forEach(e => {
            node.setAttribute(e[0], e[1]);
        });
    }
    return node;
}

function truncDigits(color, digits = 2) {
    return [
        Number(color[0]).toFixed(digits),
        Number(color[1]).toFixed(digits),
        Number(color[2]).toFixed(digits),
    ];
}

function hsv2hsl(h, s, v) {
    const l = v - v * s / 2;
    let sl = 0;
    if (l > 0 && l < 1) {
        sl = (v - l) / Math.min(l, 1 - l);
    }
    return [h, sl, l];
}

function hsv2rgb2(h, s, v) {
    const c = s * v;
    const h_line = h / 60;
    const x = c * (1 - Math.abs((h_line % 2) - 1));

    const rgb_table = [
        [c, x, 0],
        [x, c, 0],
        [0, c, x],
        [0, x, c],
        [x, 0, c],
        [c, 0, x],
        [c, x, 0],
    ];

    const m = v - c;
    const rgb = rgb_table[Math.floor(h_line)];

    return [rgb[0] + m, rgb[1] + m, rgb[2] + m];
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
function rgb2css(r, g, b) {
    return `rgb(${r * 255},${g * 255},${b * 255})`;
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
function mouseMovePickerHandler(event, id, target, cursor, textNodes) {
    const [cursorX, cursorY] = getCursorPosition(target, event);

    // savedX = cursorX;
    // savedY = cursorY;
    savedParams[id] = {
        ...savedParams[id],
        savedX: cursorX,
        savedY: cursorY,
    };
    let { savedSliderX, savedX, savedY, savedW, savedH } = savedParams[id];

    const degrees = 360 * savedSliderX / savedW;
    const convertedY = savedH - savedY;

    setCursorCoords(cursor, cursorX, cursorY);
    const rgbDec = truncDigits(hsv2rgb(...[degrees, savedX / savedW, convertedY / savedH]));
    const rgbHex = rgb2hex(...rgbDec);
    textNodes.rgbText.value = rgbHex;
    textNodes.rgbText.dispatchEvent(new Event('input', { bubbles: true }));

    sendColorToTab(id, rgbHex);

    // const hsl = truncDigits(hsv2hsl(...[degrees, savedX/savedW, convertedY/savedH]));
    // textNodes.coordText.value = `${Number(cursorX).toFixed(2)} ${Number(convertedY).toFixed(2)}`;
    // textNodes.hsvText.value = `${Number(degrees).toFixed(2)} ${Number(savedX/savedW).toFixed(2)} ${Number(convertedY/savedH).toFixed(2)}`;
    // textNodes.hslText.value = `${hsl[0]} ${hsl[1]} ${hsl[2]}`;
    // // document.body.style.backgroundColor = `hsl(${hsl[0]}deg, ${hsl[1] * 100}%, ${hsl[2] * 100}%)`;
    // document.body.style.backgroundColor = rgb2css(...rgbDec);
}

function mouseMoveSliderHandler(event, id, target, cursor, textNodes) {
    const [cursorX,] = getCursorPosition(target, event);

    savedParams[id].savedSliderX = cursorX;
    let { savedSliderX, savedX, savedY, savedW, savedH } = savedParams[id];

    const degrees = 360 * savedSliderX / savedW;
    const convertedY = savedH - savedY;

    setCursorCoords(cursor, cursorX, 0);
    const rgbDec = truncDigits(hsv2rgb(...[degrees, savedX / savedW, convertedY / savedH]));
    const rgbHex = rgb2hex(...rgbDec);
    textNodes.rgbText.value = rgbHex;
    textNodes.rgbText.dispatchEvent(new Event('input', { bubbles: true }));

    sendColorToTab(id, rgbHex);
    target.parentElement.querySelector('.color-picker').style.setProperty('--hue', `${Math.round(degrees)}`);

    // const hsl = truncDigits(hsv2hsl(...[degrees, savedX/savedW, convertedY/savedH]));
    // textNodes.coordText.value = `${Number(cursorX).toFixed(2)} ${Number(convertedY).toFixed(2)}`;
    // textNodes.hsvText.value = `${Number(degrees).toFixed(2)} ${Number(savedX/savedW).toFixed(2)} ${Number(convertedY/savedH).toFixed(2)}`;
    // textNodes.hslText.value = `${hsl[0]} ${hsl[1]} ${hsl[2]}`;
    // // document.body.style.backgroundColor = `hsl(${hsl[0]}deg, ${hsl[1] * 100}%, ${hsl[2] * 100}%)`;
    // document.body.style.backgroundColor = rgb2css(...rgbDec);
}
function mouseDown(eventDown, id, func, cursor, textNodes) {
    const originalTarget = eventDown.target;
    func(eventDown, id, originalTarget, cursor, textNodes);
    function mouseMove(event) {
        func(event, id, originalTarget, cursor, textNodes);
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

function initColorPicker(id) {
    const colorPicker = document.getElementById(id);

    // const coordText = newElement('input', { type: 'text', class: 'color-picker-input' });
    const rgbText = newElement('input', { type: 'text', class: 'color-picker-input', maxlength: 7, value: '#' });
    // const hsvText = newElement('input', { type: 'text', class: 'color-picker-input' });
    // const hslText = newElement('input', { type: 'text', class: 'color-picker-input' });
    // const textNodes = { coordText, rgbText, hsvText, hslText };
    const textNodes = { rgbText };

    const confirmButton = newElement('button', { class: 'button' });
    confirmButton.textContent = 'Confirm';

    const colorPickerNode = colorPicker.getElementsByClassName('color-picker')[0];
    const colorPickerCursor = newElement('div', { class: 'color-picker-cursor' });
    colorPickerNode.appendChild(colorPickerCursor);
    colorPickerNode.addEventListener('mousedown', event => {
        mouseDown(event, id, mouseMovePickerHandler, colorPickerCursor, textNodes);
    }, { passive: true });

    const colorPickerSliderNode = colorPicker.getElementsByClassName('color-slider')[0];
    const colorPickerSliderCursor = newElement('div', { class: 'color-picker-slider-cursor' });
    colorPickerSliderNode.appendChild(colorPickerSliderCursor);
    colorPickerSliderNode.addEventListener('mousedown', event => {
        mouseDown(event, id, mouseMoveSliderHandler, colorPickerSliderCursor, textNodes);
    }, { passive: true });

    // colorPicker.appendChild(coordText);
    colorPicker.appendChild(rgbText);
    colorPicker.appendChild(confirmButton);
    // colorPicker.appendChild(hsvText);
    // colorPicker.appendChild(hslText);

    // const loadColor = getStorage(id);
    // preSelectColor(loadColor);

    const rectPicker = colorPickerNode.getBoundingClientRect();
    const rectPickerSlider = colorPickerSliderNode.getBoundingClientRect();
    if (!(id in savedParams)) {
        savedParams[id] = {
            savedX: 0,
            savedY: 0,
            savedW: 0,
            savedH: 0,
            savedSliderX: 0,
            savedSliderW: 0,
        };
    }
    savedParams[id] = {
        ...savedParams[id],
        savedH: rectPicker.height - 1,
        savedW: rectPicker.width - 1,
        savedSliderW: rectPickerSlider.width - 1,
    };

    function pinpointCursor(r, g, b) {
        const rgbNormalized = normalizeRgb(r, g, b);
        const hsv = rgb2hsv(...rgbNormalized);

        let { savedSliderW, savedW, savedH } = savedParams[id];

        savedParams[id] = {
            ...savedParams[id],
            savedSliderX: hsv[0] / 360 * savedSliderW,
            savedX: hsv[1] * savedW,
            savedY: savedH - hsv[2] * savedH,
        };

        let { savedSliderX } = savedParams[id];

        setCursorCoords(colorPickerCursor, hsv[1] * savedW, (1 - hsv[2]) * savedH);
        setCursorCoords(colorPickerSliderCursor, savedSliderX, 0);

        colorPickerNode.style.setProperty('--hue', `${Math.round(hsv[0])}`);
        // document.body.style.backgroundColor = rgb2css(...rgbNormalized);
    }
    function preSelectColor(rgbHex, func) {
        if (validateHexRgb(rgbHex)) {
            if (rgbHex.length === 4) {
                rgbHex = rgbHex.replaceAll(/([0-9a-fA-F])/gi, "$1$1");
                rgbText.value = rgbHex;
            }
            const rgbDec = hex2rgb(rgbHex);
            pinpointCursor(...rgbDec);
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
    rgbText.addEventListener('focusout', event => {
        preSelectColor(rgbText.value);
        // let value = rgbText.value;
        // if (validateHexRgb(value)) {
        //     if (value.length === 4) {
        //         value = value.replaceAll(/([0-9a-fA-F])/gi, "$1$1");
        //         rgbText.value = value;
        //     }
        //     const rgb = hex2rgb(value);
        //     pinpointCursor(...rgb);
        // }
    });
    confirmButton.addEventListener('click', event => {
        preSelectColor(rgbText.value, () => {
            event.target.classList.add('confirm-button');
            thisBrowser.storage.local.set({ [id]: rgbText.value });
        });
        // preSelectColor(rgbText.value, () => {
        // });
        // let value = rgbText.value;
        // if (validateHexRgb(value)) {
        //     if (value.length === 4) {
        //         value = value.replaceAll(/([0-9a-fA-F])/gi, "$1$1");
        //         rgbText.value = value;
        //     }
        //     const rgb = hex2rgb(value);
        //     pinpointCursor(...rgb);
        //     event.target.classList.add('confirm-button');
        // }
    });
}

function initColorPickers() {
    [
        'option-color-text',
        'option-color-background',
        'option-color-text-hover',
        'option-color-background-hover',
        'option-color-text-selected',
        'option-color-background-selected',
    ].forEach(currentOption => initColorPicker(currentOption));
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
    initColorPickers();
    initControls();
});
