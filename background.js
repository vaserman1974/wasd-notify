/*--------------------------------------------------------------
>>> TABLE OF CONTENTS:
----------------------------------------------------------------
# 
--------------------------------------------------------------*/

var followed = {},
    notified = {},
    badge_counter = 0;

/*--------------------------------------------------------------
# 
--------------------------------------------------------------*/

chrome.runtime.onMessage.addListener(async function(message, sender, sendResponse) {
    if (message.action === 'notification') {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/128.png',
            title: 'WASD.TV',
            message: message.message
        }, function() {});
    } else if (message.action === 'reset-badge') {
        badge_counter = 0;

        updateBadge();
    }
});

function updateBadge() {
    chrome.browserAction.setBadgeText({
        text: badge_counter > 0 ? String(badge_counter) : ''
    });
}

async function liveCheck() {
    for (var key in followed) {
        if (followed[key].followed === true) {
            var response = await (await fetch('https://wasd.tv/api/v2/channels/nicknames/' + key, {
                    credentials: 'omit'
                })).json(),
                notif = notified[key] || {};

            if (
                response.result.channel_is_live === true &&
                (
                    response.result.channel_is_live !== notif.is_live ||
                    new Date().getTime() - notif.time >= 8.64e+7
                )
            ) {
                notified[key] = {
                    is_live: response.result.channel_is_live,
                    time: new Date().getTime()
                };

                badge_counter++;

                updateBadge();
            }
        }
    }
}

chrome.storage.local.get(function(items) {
    if (items.hasOwnProperty('followed')) {
        followed = items.followed;
    }

    liveCheck();

    setInterval(liveCheck, 60000);
});

chrome.storage.onChanged.addListener(function(changes) {
    for (var key in changes) {
        if (key === 'followed') {
            followed = changes[key].newValue;
        }
    }
});