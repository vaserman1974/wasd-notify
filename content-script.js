/*--------------------------------------------------------------
>>> TABLE OF CONTENTS:
----------------------------------------------------------------
# Global variables
# Create button
# Observe
# Page updated
# Initialization
--------------------------------------------------------------*/

/*--------------------------------------------------------------
# GLOBAL VARIABLES
--------------------------------------------------------------*/

var subscriptions = {},
    pathname = location.pathname,
    button,
    observer;


/*--------------------------------------------------------------
# CREATE BUTTON
--------------------------------------------------------------*/

function createButton() {
    button = document.createElement('button');

    button.className = 'wasd-notify--hidden';
    button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>';

    button.addEventListener('click', function() {
        if (document.querySelector('wasd-channel')) {
            var match = location.pathname.match(/\/[^\/]+/);

            if (match) {
                var channel_name = match[0].substr(1);

                subscriptions[channel_name] = !subscriptions[channel_name];

                updateButton();

                chrome.storage.local.set({
                    subscriptions
                });

                /*chrome.runtime.sendMessage({
                    action: 'notification',
                    message: 'Вы подписались на канал «' + channel_name + '»‎'
                });*/
            }
        }
    });

    document.body.appendChild(button);
}

function updateButton() {
    if (document.querySelector('wasd-channel')) {
        var match = location.pathname.match(/\/[^\/]+/);

        if (match) {
            var channel_name = match[0].substr(1);

            if (subscriptions[channel_name] === true) {
                if (button.className !== 'wasd-notify--subscribed') {
                    button.className = 'wasd-notify--subscribed';
                }
            } else {
                if (button.className !== 'wasd-notify') {
                    button.className = 'wasd-notify';
                }
            }
        }
    }
}


/*--------------------------------------------------------------
# OBSERVE
--------------------------------------------------------------*/

function observe() {
    if (observer) {
        observer.disconnect();
    }

    observer = new MutationObserver(function(mutationList) {
        for (var i = 0, l = mutationList.length; i < l; i++) {
            var mutation = mutationList[i];

            for (var j = 0, k = mutation.addedNodes.length; j < k; j++) {
                var node = mutation.addedNodes[j];

                if (node.nodeName.toLowerCase() === 'wasd-channel') {
                    var match = location.pathname.match(/\/[^\/]+/);

                    if (match) {
                        var channel_name = match[0].substr(1);

                        button.className = 'wasd-notify';

                        updateButton();
                    }
                }
            }
        }
    }, {
        childList: true,
        subtree: true
    });

    observer.observe(document, {
        childList: true,
        subtree: true
    });
}


/*--------------------------------------------------------------
# PAGE UPDATED
--------------------------------------------------------------*/

function pageUpdated() {
    if (!document.querySelector('wasd-channel')) {
        button.className = 'wasd-notify--hidden';
    }

    observe();
}


/*--------------------------------------------------------------
# INITIALIZATION
--------------------------------------------------------------*/

window.addEventListener('DOMContentLoaded', function() {
    setInterval(function() {
        if (pathname !== location.pathname) {
            pathname = location.pathname;

            pageUpdated();
        }
    }, 250);

    createButton();
});

observe();

chrome.storage.local.get(function(items) {
    if (items.hasOwnProperty('subscriptions')) {
        subscriptions = items.subscriptions;
    }
});

chrome.storage.onChanged.addListener(function(changes) {
    for (var key in changes) {
        if (key === 'subscriptions') {
            subscriptions = changes[key].newValue;
        }
    }
});