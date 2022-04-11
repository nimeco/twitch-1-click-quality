(() => {
    let videoPlayer = null;
    let cssNode = null;
    let buttonsHeader = null;
    let buttons = [];
    let lastButton = null;

    function findPlayer() {
        function findReactNode(root, constraint) {
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
        }

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
                node => node.setPlayerActive && node.props && node.props.mediaPlayerInstance,
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
    }

    function createCssRules(rules) {
        let styleNode = newNode('style');
        styleNode.appendChild(document.createTextNode(rules));
        document.head.appendChild(styleNode);
        return cssNode;
    }

    function highlightSelectedButton(button) {
        if (lastButton) {
            lastButton.removeAttribute('data-selected');
        }
        button.dataset.selected = '1';
        lastButton = button;
    }

    function setItem(key, value, stringify = false) {
        window.localStorage.setItem(key, stringify ? JSON.stringify(value) : value);
    }
    function setQualityStorage(detail) {
        setItem('video-quality', { default: detail['quality-group'] }, true);
    }

    function newNode(nodeName, classes, options, dataset) {
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
    }

    function createButton(data) {
        let button = newNode('button', ['quality-button'], { textContent: data.quality.name });
        button.addEventListener('click', event => {
            videoPlayer[data.func](data.quality);
            highlightSelectedButton(event.target);

            let customEvent = new CustomEvent('option-request', {
                detail: {
                    'requested-key': 'option-quality-save',
                    'quality-group': data.quality.group,
                },
            });
            document.dispatchEvent(customEvent);
        });
        return button;
    }

    document.addEventListener('option-answer', event => {
        if (event.detail) {
            let detail = event.detail;

            if (detail['requested-key'] === 'option-quality-save' && detail.answer === true) {
                setQualityStorage(detail);
            }
            if (detail['requested-key'] === 'option-button-margin' && detail.answer) {
                document.querySelector('.quality-button-header').style.marginRight = `${144.5 - (149 / 140 * detail.answer)}%`;
            }
            if (detail['requested-key'] === 'option-button-scale' && detail.answer) {
                document.querySelector('.quality-button-header').style.transform = `scale(${detail.answer / 100})`;
            }
        }
    });

    function getStorageItem(key) {
        let customEvent = new CustomEvent('option-request', {
            detail: {
                'requested-key': key,
            },
        });
        document.dispatchEvent(customEvent);
    }

    function createButtons(properties) {
        buttons = [];
        for (let property of properties) {
            buttons.push(createButton(property));
        }
        return buttons;
    }

    function createButtonsHeader() {
        let channelHeader = document.querySelector('div[data-target="channel-header-right"]');

        buttonsHeader = newNode('div', ['quality-button-header']);

        channelHeader?.prepend(buttonsHeader);
        getStorageItem('option-button-margin');
        getStorageItem('option-button-scale');

        return buttonsHeader;
    }

    function updateQualityButtons() {
        if (!document.contains(buttonsHeader) && !document.querySelector('.quality-button-header')) {
            buttonsHeader = createButtonsHeader();
        }

        if (!document.contains(videoPlayer?.core?.mediaSinkManager?.video)) {
            videoPlayer = findPlayer();
        }

        if (videoPlayer && buttonsHeader) {
            let qualities = [...videoPlayer.getQualities()];
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
    }

    function initScript() {
        if (!cssNode) {
            let buttonCss = `
            .quality-button {
                display: inline-flex;
                position: relative;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                text-decoration: none;
                white-space: nowrap;
                font-weight: var(--font-weight-semibold);
                border-radius: var(--border-radius-medium);
                font-size: var(--button-text-default);
                height: var(--button-size-default);
                background-color: var(--color-background-button-primary-default);
                color: var(--color-text-overlay);
                margin-left: 1rem;
                padding: 0px var(--button-padding-x);
            }
            .quality-button:hover {
                background-color: var(--color-background-button-primary-hover);
                color: var(--color-text-button-primary);
            }
            .quality-button[data-selected='1'] {
                background-color: var(--color-twitch-purple-7);
            }
            .quality-button-header {
                display: flex;
                position: relative;
                margin-left: 3rem;
                height: 3rem;
                transform-origin: top right 0px;
                transition: all 700ms;
            }
            `;
            cssNode = createCssRules(buttonCss);
        }
    }

    const targetNode = document.getElementById('root');
    const config = { attributes: true, subtree: true, attributeFilter: ['src'], childList: true };
    const observer = new MutationObserver(list => {
        for (let mutation of list) {
            if (mutation.type === 'attributes' && mutation.target?.nodeName === 'VIDEO') {
                updateQualityButtons();
            } else if (mutation.addedNodes.length > 0) {
                if (mutation.addedNodes[0].innerHTML?.includes('follow-button"')) {
                    updateQualityButtons();
                }
            }
        }
    });
    observer.observe(targetNode, config);

    initScript();
})();
