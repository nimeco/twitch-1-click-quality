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
            document.body.removeAttribute('class');
            document.body.classList.add(value);
        },
    },
    'option-toggle-transition': {
        type: 'input',
        event: 'click',
        property: 'checked',
        message: 'toggle-transition',
    },
    // 'option-color-background': {}
    'option-reset': {
        type: '',
        event: 'click',
        callback: () => {
            setControlValue('#checkbox-save', 'checked', true, 'click');
            setControlValue('#range-margin', 'value', 0, 'input');
            setControlValue('#range-scale', 'value', 100, 'input');
            setControlValue('#checkbox-transition', 'checked', true, 'click');
        },
    },
};

if (thisBrowser) {
    for (let [optionId, option] of Object.entries(options)) {
        let node = document.querySelector(`#${optionId} ${options[optionId].type}`);
        let debounceSet = debounce((...args) => thisBrowser.storage.local.set(...args));
        let debounceMsg = debounce((...args) => messageTwitchTabs(...args));
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
        Object.assign(node, attributes);
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
    const l = v - v*s/2;
    let sl = 0;
    if (l > 0 && l < 1) {
        sl = (v - l) / Math.min(l, 1-l);
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
    const f = (n, k = (n + h/60)%6) => v - v*s*Math.max(Math.min(k, 4 - k, 1), 0);
    return [f(5), f(3), f(1)];
}
function rgb2hsv(r, g, b) {
    const v = Math.max(r, g, b), c = v-Math.min(r, g, b);
    const h = c && (v===r ? (g-b)/c : v===g ? 2+(b-r)/c : 4+(r-g)/c);
    return [60*(h<0?h+6:h), v&&c/v, v];
}

function rgb2hex(r, g, b) {
    return (1 << 24 | (r * 255 << 16) | (g * 255 << 8) | b * 255).toString(16).slice(1).toUpperCase();
}
function hex2rgb(hex) {
    const bigInt = parseInt(hex, 16);
    const r = (bigInt >> 16) & 255;
    const g = (bigInt >> 8) & 255;
    const b = bigInt & 255;
    return [r, g, b];
}

function normalizeRgb(r, g, b) {
    return [r, g, b].map(v => v / 255);
}

function mouseMovePickerHandler(event, target, cursor, textNodes) {
    const [cursorX, cursorY] = getCursorPosition(target, event);
    const rect = target.getBoundingClientRect();
    const width = rect.width - 1;
    const height = rect.height - 1;
    const valueY = height - cursorY;

    setCursorCoords(cursor, cursorX, cursorY);
    const hsl = truncDigits(hsv2hsl(...[0, cursorX / width, valueY / height]));
    const rgb = truncDigits(hsv2rgb(...[0, cursorX / width, valueY / height]));

    textNodes.coordText.value = `${Number(cursorX).toFixed(2)} ${Number(valueY).toFixed(2)}`;
    textNodes.rgbText.value = `${rgb2hex(...rgb)}`;
    textNodes.hsvText.value = `0.00 ${Number(cursorX / width).toFixed(2)} ${Number(valueY / height).toFixed(2)}`;
    textNodes.hslText.value = `${hsl[0]} ${hsl[1]} ${hsl[2]}`;
    document.body.style.backgroundColor = `hsl(${hsl[0]}deg, ${hsl[1] * 100}%, ${hsl[2] * 100}%)`;
}

function mouseMoveSliderHandler(event, target, cursor, textNodes) {
    const [cursorX,] = getCursorPosition(target, event);
    const rect = target.getBoundingClientRect();
    const width = rect.width - 1;
    const height = rect.height - 1;
    const valueY = 0;

    const degrees = 360 * cursorX / width;
    setCursorCoords(cursor, cursorX, valueY);
    const hsl = truncDigits(hsv2hsl(...[degrees, cursorX / width, valueY / height]));
    const rgb = truncDigits(hsv2rgb(...[degrees, cursorX / width, valueY / height]));
    target.parentElement.parentElement.querySelector('.hue').style.setProperty('--h', `${Math.round(degrees)}`);

    textNodes.coordText.value = `${Number(cursorX).toFixed(2)} ${Number(valueY).toFixed(2)}`;
    textNodes.rgbText.value = `${rgb2hex(...rgb)}`;
    textNodes.hsvText.value = `${Number(degrees).toFixed(2)} ${Number(cursorX / width).toFixed(2)} ${Number(valueY / height).toFixed(2)}`;
    textNodes.hslText.value = `${hsl[0]} ${hsl[1]} ${hsl[2]}`;
    document.body.style.backgroundColor = `hsl(${hsl[0]}deg, ${hsl[1] * 100}%, ${hsl[2] * 100}%)`;
}
function mouseDown(eventDown, fn, cursor, textNodes) {
    const originalTarget = eventDown.target;
    fn(eventDown, originalTarget, cursor, textNodes);
    function mouseMove(event) {
        fn(event, originalTarget, cursor, textNodes);
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

    const coordText = newElement('input', { type: 'text', classList: 'color-picker-input' });
    const rgbText = newElement('input', { type: 'text', classList: 'color-picker-input' });
    const hsvText = newElement('input', { type: 'text', classList: 'color-picker-input' });
    const hslText = newElement('input', { type: 'text', classList: 'color-picker-input' });
    const textNodes = { coordText, rgbText, hsvText, hslText };

    const colorPickerNode = colorPicker.getElementsByClassName('hue')[0];
    const colorPickerCursor = newElement('div', { classList: 'color-picker-cursor' });
    colorPickerNode.appendChild(colorPickerCursor);
    colorPickerNode.addEventListener('mousedown', event => {
        mouseDown(event, mouseMovePickerHandler, colorPickerCursor, textNodes);
    }, { passive: true });

    const colorPickerSliderNode = colorPicker.getElementsByClassName('color-slider')[0];
    const colorPickerSliderCursor = newElement('div', { classList: 'color-picker-slider-cursor' });
    colorPickerSliderNode.appendChild(colorPickerSliderCursor);
    colorPickerSliderNode.addEventListener('mousedown', event => {
        mouseDown(event, mouseMoveSliderHandler, colorPickerSliderCursor, textNodes);
    }, { passive: true });

    colorPicker.appendChild(coordText);
    colorPicker.appendChild(rgbText);
    colorPicker.appendChild(hsvText);
    colorPicker.appendChild(hslText);

    function pinpointCursor(rgb) {
        const hsv = rgb2hsv(...normalizeRgb(...rgb));
        const hsl = hsv2hsl(...hsv);

        const pickerRect = colorPickerNode.getBoundingClientRect();
        const sliderRect = colorPickerSliderNode.getBoundingClientRect();
        setCursorCoords(colorPickerCursor, hsv[1]*(pickerRect.width-1), (1-hsv[2])*(pickerRect.height-1));
        setCursorCoords(colorPickerSliderCursor, hsv[0]/360*(sliderRect.width-1), 0);

        document.body.style.backgroundColor = `hsl(${hsl[0]}deg ${hsl[1]*100}% ${hsl[2]*100}%)`;
    }
    rgbText.addEventListener('focusout', event => {
        const value = event.target.value;
        const rgb = hex2rgb(value);
        pinpointCursor(rgb);
    });
}

function initColorPickers() {
    initColorPicker('option-color-background-selected');
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
                options[optionId].callback(option);
            }
        }

        for (let e of document.querySelectorAll('input[type="range"]')) {
            e.style.setProperty('--value', e.value);
            e.style.setProperty('--min', e.min === '' ? '0' : e.min);
            e.style.setProperty('--max', e.max === '' ? '100' : e.max);
            e.addEventListener('input', () => e.style.setProperty('--value', e.value));
            e.addEventListener('change', () => e.style.setProperty('--value', e.value));
        }
    });

    initColorPickers();
});
