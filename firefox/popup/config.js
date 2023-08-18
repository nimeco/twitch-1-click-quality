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

function drawGradient(canvas, color = '#f00') {
    canvas.setAttribute('width', window.getComputedStyle(canvas, null).getPropertyValue('width'));
    canvas.setAttribute('height', window.getComputedStyle(canvas, null).getPropertyValue('height'));
    let context = canvas.getContext('2d');

    let gradientH = context.createLinearGradient(0, 0, context.canvas.width, 0);
    gradientH.addColorStop(0, '#fff');
    gradientH.addColorStop(1, color);
    context.fillStyle = gradientH;
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);

    let gradientV = context.createLinearGradient(0, 0, 0, context.canvas.height);
    gradientV.addColorStop(0, 'rgba(0,0,0,0)');
    gradientV.addColorStop(1, '#000');
    context.fillStyle = gradientV;
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);

    return context;
}

function loadSliderCanvas(canvas) {
    canvas.setAttribute('width', '150px');
    canvas.setAttribute('height', '8px');
    // canvas.setAttribute('width', window.getComputedStyle(canvas, null).getPropertyValue('width'));
    // canvas.setAttribute('height', window.getComputedStyle(canvas, null).getPropertyValue('height'));
    let context = canvas.getContext('2d');

    let gradient = context.createLinearGradient(0, 0, context.canvas.width, 0);
    gradient.addColorStop(0, '#f00');
    gradient.addColorStop(0.17, '#ff0');
    gradient.addColorStop(0.33, '#0f0');
    gradient.addColorStop(0.50, '#0ff');
    gradient.addColorStop(0.67, '#00f');
    gradient.addColorStop(0.83, '#f0f');
    gradient.addColorStop(1, '#f00');

    context.fillStyle = gradient;
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);

    return context;
}

function clamp(n, min, max) {
    return Math.min(Math.max(n, min), max);
}
function getCursorPosition(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    const clampedX = clamp(event.clientX, rect.left, rect.right - 1);
    const clampedY = clamp(event.clientY, rect.top, rect.bottom - 1);
    return [clampedX - rect.left + canvas.offsetLeft, clampedY - rect.top + canvas.offsetTop];
}
function getColorAt(x, y, context) {
    const pixel = context.getImageData(parseInt(x), parseInt(y), 1, 1).data;
    return `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
}
function onMouseDown(downEvent) {
    let targetNode = downEvent.currentTarget;
    function onMouseMove(event) {
        const [x, y] = getCursorPosition(targetNode, event);
        const rgb = getColorAt(x, y, targetNode.ctx);
        targetNode.cursor.style.top = `${y}px`;
        targetNode.cursor.style.left = `${x}px`;
        targetNode.inputHex.value = rgb;
        targetNode.x = x;
        targetNode.y = y;
        document.body.style.background = rgb;
        let debounceSet = debounce((...args) => thisBrowser.storage.local.set(...args));
        const key = targetNode.parentElement.getAttribute('id');
        debounceSet({ [key]: rgb });
        messageTwitchTabs({
            type: 'select-color',
            'requested-key': key,
            detail: {
                color: rgb,
            },
        });
    }
    function onMouseUp() {
        cleanMouseEvents();
    }
    function cleanMouseEvents() {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    }
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });
}
function onMouseDownSlider(downEvent) {
    let targetNode = downEvent.currentTarget;
    function onMouseMoveSlider(event) {
        const [x] = getCursorPosition(targetNode, event);
        const y = targetNode.offsetTop + (targetNode.getBoundingClientRect().height / 2);
        const rgb = getColorAt(x, 0, targetNode.ctx);
        targetNode.cursor.style.top = `${y}px`;
        targetNode.cursor.style.left = `${x}px`;
        drawGradient(targetNode.respectiveCanvas, rgb);

        const mainRgb = getColorAt(targetNode.respectiveCanvas.x, targetNode.respectiveCanvas.y, targetNode.respectiveCanvas.ctx);
        document.body.style.background = mainRgb;
        targetNode.respectiveCanvas.inputHex.value = mainRgb;
    }
    function onMouseUpSlider() {
        cleanMouseEvents();
    }
    function cleanMouseEvents() {
        window.removeEventListener('mousemove', onMouseMoveSlider);
        window.removeEventListener('mouseup', onMouseUpSlider);
    }
    window.addEventListener('mousemove', onMouseMoveSlider, { passive: true });
    window.addEventListener('mouseup', onMouseUpSlider, { passive: true });
}

function newElement(nodeName, attributes) {
    const node = document.createElement(nodeName);
    if (attributes) {
        Object.assign(node, attributes);
    }
    return node;
}
function initCanvas(parentName) {
    const parentNode = document.getElementById(parentName);

    const inputHex = newElement('input', { type: "text" });

    const mainCursor = newElement('div', { classList: 'canvas-pointer' });
    const mainCanvas = newElement('canvas', {
        id: 'canvas-color-text-selected',
        cursor: mainCursor,
        inputHex: inputHex,
        x: 0,
        y: 0,
    });
    const mainContext = drawGradient(mainCanvas);
    mainCanvas.ctx = mainContext;

    const sliderCursor = newElement('div', { classList: 'canvas-pointer-slider' });
    const sliderCanvas = newElement('canvas', {
        classList: 'canvas-slider',
        cursor: sliderCursor,
        respectiveCanvas: mainCanvas,
    });
    const sliderContext = loadSliderCanvas(sliderCanvas);
    sliderCanvas.ctx = sliderContext;

    parentNode.appendChild(mainCanvas);
    parentNode.appendChild(mainCursor);
    mainCanvas.addEventListener('mousedown', onMouseDown, { passive: true });

    parentNode.appendChild(sliderCanvas);
    parentNode.appendChild(sliderCursor);
    sliderCanvas.addEventListener('mousedown', onMouseDownSlider, { passive: true });

    parentNode.appendChild(inputHex);
}
function initCanvases() {
    initCanvas('option-color-text-selected');
    // initCanvas('canvas-color-background-selected');
    // initCanvas('canvas-color-background');
    // initCanvas('canvas-color-text');
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

    initCanvases();
});
