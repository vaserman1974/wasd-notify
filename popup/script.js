var subscriptions = {};

async function createUI() {
    for (var key in subscriptions) {
        if (subscriptions[key] === true) {
            var response = await (await fetch('https://wasd.tv/api/v2/channels/nicknames/' + key, {
                    credentials: 'omit'
                })).json(),
                item = document.createElement('div'),
                image = document.createElement('img'),
                title = document.createElement('span'),
                status = document.createElement('div');

            item.className = 'wasd-item';
            image.className = 'wasd-item__img';
            title.className = 'wasd-item__title';
            status.className = 'wasd-item__status--' + response.result.channel_is_live;

            if (response.result.channel_is_live === true) {
                status.innerText = 'LIVE';
            }

            item.dataset.key = key;
            item.addEventListener('click', function() {
                window.open('https://wasd.tv/' + this.dataset.key, '_blank');
            });

            image.src = response.result.channel_image.small;

            title.innerText = response.result.channel_name;

            item.appendChild(image);
            item.appendChild(title);
            item.appendChild(status);

            document.querySelector('main').appendChild(item);
        }
    }
}

chrome.storage.local.get(function(items) {
    if (items.hasOwnProperty('subscriptions')) {
        subscriptions = items.subscriptions;
    }

    createUI();
});

chrome.runtime.sendMessage({
    action: 'reset-badge'
});