(() => {
    let videoPlayer = null;
    let buttonsHeader = null;
    let buttons = [];
    let lastButton = null;

    const findPlayer = () => {
        const findReactNode = (root, constraint) => {
            if (root.stateNode && constraint(root.stateNode)) {
                return root.stateNode;
            }
            let node = root.child;
            while (node) {
                const result = findReactNode(node, constraint);
                if (result) {
                    return result;
                }
                node = node.sibling;
            }
            return null;
        };

        try {
            videoPlayer = null;

            let reactRootNode = null;
            let rootNode = document.querySelector('#root');

            if (
                rootNode &&
                rootNode._reactRootContainer &&
                rootNode._reactRootContainer._internalRoot &&
                rootNode._reactRootContainer._internalRoot.current
            ) {
                reactRootNode = rootNode._reactRootContainer._internalRoot.current;
            }

            videoPlayer = findReactNode(
                reactRootNode,
                node => node.setPlayerActive && node.props && node.props.mediaPlayerInstance
            );
            videoPlayer =
                videoPlayer && videoPlayer.props && videoPlayer.props.mediaPlayerInstance ?
                    videoPlayer.props.mediaPlayerInstance :
                    null;

            if (videoPlayer) {
                return videoPlayer;
            }
        } catch (err) {
            console.log(err);
        }
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

    let lowestQuality = "";
    let highestQuality = "";
    const createButton = data => {
        let button = newNode('button', ['quality-button'], { textContent: data.quality.name });

        button.addEventListener('click', event => {
            videoPlayer[data.func](data.quality);
            // if (data.quality.name === "160p") {
            //     videoPlayer.setMuted(true);
            // } else {
            //     videoPlayer.setMuted(false);
            // }
            highlightSelectedButton(event.target);
            sendEvent('event-save-quality', { group: data.quality.group });
            sendEvent('event-mute-video', { group: data.quality.group, lowest: lowestQuality, highest: highestQuality });
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

    const updateQualityButtons = () => {
        if (!document.contains(buttonsHeader) && !document.querySelector('.quality-button-header')) {
            buttonsHeader = createButtonsHeader();
        }
        sendEvent('set-style', {});

        if (!document.contains(videoPlayer?.core?.mediaSinkManager?.video)) {
            videoPlayer = findPlayer();
        }

        if (videoPlayer && buttonsHeader) {
            let qualities = [...videoPlayer.getQualities()];
            lowestQuality = qualities[qualities.length - 1].group;
            highestQuality = qualities[0].group;
            qualities.unshift(Object.assign({}, qualities[0]));
            qualities[0].name = 'Auto';
            qualities[0].group = 'auto';

            let functions = Array(qualities.length).fill('setQuality');
            functions.unshift('setAutoQualityMode');

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
        videoPlayer.setMuted(data.detail);
    });
})();
