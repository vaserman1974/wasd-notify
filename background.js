/*--------------------------------------------------------------
>>> TABLE OF CONTENTS:
----------------------------------------------------------------
# 
--------------------------------------------------------------*/

var followed = {},
    notified = {};

/*--------------------------------------------------------------
# 
--------------------------------------------------------------*/

chrome.runtime.onMessage.addListener(async function (message, sender, sendResponse) {
    if (message.action === 'notification') {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/128.png',
            title: 'WASD.TV',
            message: message.message
        }, function () {});
    }
});

function updateBadge(count) {
    chrome.browserAction.setBadgeText({
        text: count === 0 ? '' : String(count)
    });
}

async function liveCheck() {
    var badge_counter = 0;

    for (var key in followed) {
        if (followed[key].followed === true) {
            var response = await (await fetch('https://wasd.tv/api/v2/channels/nicknames/' + key, {
                    credentials: 'omit'
                })).json(),
                notif = notified[key] || {};

            if (response.result.channel_is_live === true) {
                badge_counter++;

                if (response.result.channel_is_live !== notif.is_live || new Date().getTime() - notif.time >= 8.64e+7) {
                    notified[key] = {
                        is_live: response.result.channel_is_live,
                        time: new Date().getTime()
                    };
                }
            }
        }
    }

    updateBadge(badge_counter);
}

chrome.storage.local.get(function (items) {
    if (items.hasOwnProperty('followed')) {
        followed = items.followed;
    }

    liveCheck();

    setInterval(liveCheck, 60000);
});

chrome.storage.onChanged.addListener(function (changes) {
    for (var key in changes) {
        if (key === 'followed') {
            followed = changes[key].newValue;
        }
    }

    liveCheck();
});