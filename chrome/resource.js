(() => {
    let videoPlayer = null;
    let buttonsHeader = null;
    let buttons = [];
    let lastButton = null;

    const findPlayer = () => {
        let videoElement = document.querySelector('.video-player');
        let reactKey = Object.keys(videoElement).filter(key => key.startsWith('__reactFiber$') || key.startsWith('__reactInternalInstance$'))[0];
        let node = videoElement[reactKey];
        let iterations = 1;
        try {
            while (node.return && iterations < 100) {
                if (node.dependencies?.firstContext?.memoizedValue?.mediaPlayerInstance?.playerInstance?.core) {
                    return node.dependencies.firstContext.memoizedValue.mediaPlayerInstance.playerInstance.core;
                }
                node = node.return;
                iterations += 1;
            }
        } catch (e) { console.log(e); }
        return null;
    };

    const highlightSelectedButton = button => {
        if (lastButton) {
            lastButton.removeAttribute('data-selected');
        }
        button.dataset.selected = '1';
        lastButton = button;
    };

    const newNode = (nodeName, classes, options, dataset) => {
        let node = document.createElement(nodeName);
        if (classes) {
            Object.assign(node, { classList: classes.join(' ') });
        }
        if (options) {
            Object.assign(node, options);
        }
        if (dataset) {
            Object.assign(node.dataset, dataset);
        }
        return node;
    };

    let lowestQualityGroup = "";
    let highestQualityGroup = "";
    const createButton = data => {
        let button = newNode('button', ['quality-button'], { textContent: data.quality.name });

        button.addEventListener('click', event => {
            videoPlayer[data.func](data.quality);
            highlightSelectedButton(event.target);
            sendEvent('event-save-quality', { group: data.quality.group });
            if (!event.ctrlKey) {
                sendEvent('event-mute-video', { group: data.quality.group, lowest: lowestQualityGroup, highest: highestQualityGroup });
            }
        });

        return button;
    };

    const sendEvent = (name, detail) => {
        let customEvent = new CustomEvent(name, { detail: detail });
        document.dispatchEvent(customEvent);
    };

    const createButtons = properties => {
        buttons = [];
        for (let property of properties) {
            buttons.push(createButton(property));
        }
        return buttons;
    };

    const createButtonsHeader = () => {
        let channelHeader = document.querySelector('div[data-target="channel-header-right"]');
        buttonsHeader = newNode('div', ['quality-button-header']);
        channelHeader?.prepend(buttonsHeader);

        return buttonsHeader;
    };

    const findNearestQuality = (targetNumber, qualities) => {
        let targetQuality = {};
        let lowestDifference = Infinity;
        for (const quality of qualities) {
            let qualityNumber = quality.group.split("p")[0];
            const difference = Math.abs(targetNumber - qualityNumber);
            if (difference < lowestDifference) {
                lowestDifference = difference;
                targetQuality = quality;
            }
        }
        return { quality: targetQuality, difference: lowestDifference };
    };

    const updateQualityButtons = () => {
        if (!document.contains(buttonsHeader) && !document.querySelector('.quality-button-header')) {
            buttonsHeader = createButtonsHeader();
        }
        sendEvent('set-style', {});

        if (!videoPlayer) {
            videoPlayer = findPlayer();
        }
        if (videoPlayer && buttonsHeader) {
            let qualities = [...videoPlayer.getQualities()];
            if (!qualities?.length) {
                return false;
            }
            lowestQualityGroup = qualities[qualities.length - 1].group;
            highestQualityGroup = qualities[0].group;
            qualities.unshift(Object.assign({}, qualities[0]));
            qualities[0].name = 'Auto';
            qualities[0].group = 'auto';

            let functions = Array(qualities.length).fill('setQuality');
            functions.unshift('setAutoQualityMode');

            const savedQualityObject = localStorage.getItem('video-quality');
            const savedQualityGroup = JSON.parse(savedQualityObject).default;
            const savedQualityNumber = savedQualityGroup.split("p")[0];
            if (!isNaN(savedQualityNumber)) {
                const nearestQuality = findNearestQuality(savedQualityNumber, qualities);
                if (nearestQuality.difference) {
                    videoPlayer.setQuality(nearestQuality.quality);
                }
            }

            let data = [];
            for (let i = 0; i < qualities.length; ++i) {
                data.push({
                    quality: qualities[i],
                    func: functions[i],
                });
            }

            buttons = createButtons(data);
            buttonsHeader.replaceChildren(...buttons.reverse());

            let qualityName = videoPlayer.isAutoQualityMode() ? 'Auto' : videoPlayer.getQuality().name;
            for (let button of buttons) {
                if (button.textContent === qualityName) {
                    highlightSelectedButton(button);
                    break;
                }
            }
        }
        return true;
    };

    const targetNode = document.getElementById('root');
    const config = { attributes: true, subtree: true, attributeFilter: ['src'], childList: true };
    const observer = new MutationObserver(list => {
        for (let mutation of list) {
            let nodes = mutation.addedNodes;
            if (mutation.type === 'attributes' && mutation.target?.nodeName === 'VIDEO') {
                updateQualityButtons();
            } else if (nodes.length > 0) {
                if (nodes[0].innerHTML?.includes('data-target="channel-header-right"') ||
                    nodes[0].innerHTML?.includes('follow-button"') ||
                    nodes[0].innerHTML?.includes('subscribe-button"') ||
                    nodes[0].innerHTML?.includes('subscribed-button"')) {
                    updateQualityButtons();
                }
            }
        }
    });
    observer.observe(targetNode, config);

    document.addEventListener('event-response-mute-video', data => {
        videoPlayer.setMuted(data.detail === 0);
        videoPlayer.setVolume(data.detail);
    });
})();
