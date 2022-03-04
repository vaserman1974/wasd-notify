/*--------------------------------------------------------------
>>> TABLE OF CONTENTS:
----------------------------------------------------------------
# Global variable
# Localization
# Search
# Initialization
--------------------------------------------------------------*/

/*--------------------------------------------------------------
# GLOBAL VARIABLE
--------------------------------------------------------------*/

var extension = {
    elements: {
        container: document.querySelector('.container')
    }
};


/*--------------------------------------------------------------
# EMPTY
--------------------------------------------------------------*/

extension.empty = function (node) {
    for (var i = node.childNodes.length - 1; i > -1; i--) {
        node.childNodes[i].remove();
    }
};


/*--------------------------------------------------------------
# RENDER
--------------------------------------------------------------*/

extension.render = function (skeleton, container) {
    var element = document.createElement(skeleton.component);

    if (skeleton.class) {
        element.className = skeleton.class;
    }

    if (skeleton.text) {
        element.textContent = skeleton.text;
    }

    container.appendChild(element);

    return element;
};


/*--------------------------------------------------------------
# LOCALIZATION
--------------------------------------------------------------*/

extension.localization = function () {
    var nodes = document.querySelectorAll('[data-i18n]');

    for (var i = 0, l = nodes.length; i < l; i++) {
        var node = nodes[i],
            tagName = node.tagName,
            message = chrome.i18n.getMessage(node.dataset.i18n);

        if (tagName === 'A') {
            node.title = message;
            node.textContent = message;
        } else if (tagName === 'INPUT') {
            node.placeholder = message;
        }
    }
};


/*--------------------------------------------------------------
# STORAGE
--------------------------------------------------------------*/

extension.storage = {
    data: {}
};


/*--------------------------------------------------------------
# IMPORT
--------------------------------------------------------------*/

extension.storage.import = function (callback) {
    chrome.storage.local.get(function (items) {
        extension.storage.data = items;

        callback(items);
    });
};


/*--------------------------------------------------------------
# GET
--------------------------------------------------------------*/

extension.storage.get = function (name) {
    return extension.storage.data[name];
};


/*--------------------------------------------------------------
# SET
--------------------------------------------------------------*/

extension.storage.set = function (name, value) {
    extension.storage.data[name] = value;

    chrome.storage.local.set(extension.storage.data);
};


/*--------------------------------------------------------------
# SEARCH
--------------------------------------------------------------*/

extension.search = {};


/*--------------------------------------------------------------
# QUERY
--------------------------------------------------------------*/

extension.search.query = async function (query) {
    try {
        var response = await (await fetch('https://wasd.tv/api/search/channels?limit=13&offset=0&search_phrase=' + query, {
            credentials: 'omit'
        })).json();

        if (response.result.rows.length > 0) {
            console.log(response);

            for (var i = 0, l = response.result.rows.length; i < l; i++) {
                var channel = response.result.rows[i];

                extension.channels.render(channel.channel_name, channel.channel_image.small);
            }
        } else {
            extension.render({
                component: 'div',
                class: 'empty-content',
                text: chrome.i18n.getMessage('noResultsFound')
            }, extension.elements.container);
        }
    } catch (error) {
        extension.render({
            component: 'div',
            class: 'empty-content',
            text: chrome.i18n.getMessage('noResultsFound')
        }, extension.elements.container);
    }
};


/*--------------------------------------------------------------
# ON INPUT
--------------------------------------------------------------*/

extension.search.oninput = function () {
    document.querySelector('.search-field').addEventListener('input', function (event) {
        extension.empty(extension.elements.container);

        if (this.value.length > 0) {
            extension.search.query(this.value);
        } else {
            extension.channels.getAll();
        }
    });
};


/*--------------------------------------------------------------
# CHANNELS
--------------------------------------------------------------*/

extension.channels = {
    followed: {}
};


/*--------------------------------------------------------------
# RENDER
--------------------------------------------------------------*/

extension.channels.render = async function (channelName, imageUrl) {
    var item = document.createElement('div'),
        avatar = document.createElement('div'),
        info = document.createElement('div'),
        name = document.createElement('div'),
        gameName = document.createElement('div'),
        data = document.createElement('div'),
        followersCount = document.createElement('div'),
        viewersCount = document.createElement('div'),
        duration = document.createElement('div'),
        button = document.createElement('button');

    item.className = 'list-item';
    avatar.className = 'list-item__image';
    info.className = 'list-item__info';
    name.className = 'list-item__name';
    gameName.className = 'list-item__game-name';
    data.className = 'list-item__data';
    followersCount.className = 'list-item__followers-count';
    viewersCount.className = 'list-item__viewers-count';
    duration.className = 'list-item__duration';
    button.className = 'list-item__button';

    if (extension.channels.followed[channelName]) {
        button.className += ' list-item__button--active';
    }

    avatar.style.backgroundImage = 'url(' + imageUrl + ')';
    name.textContent = channelName;
    button.dataset.name = channelName;
    button.dataset.image = imageUrl;

    button.addEventListener('click', function () {
        var followed = extension.channels.followed,
            name = this.dataset.name;

        this.classList.toggle('list-item__button--active');

        if (!followed[name]) {
            followed[name] = {
                followed: false
            };
        }

        followed[name].followed = !followed[name].followed;
        followed[name].image = this.dataset.image;

        extension.storage.set('followed', followed);
    });

    item.appendChild(avatar);
    info.appendChild(name);
    info.appendChild(gameName);
    info.appendChild(data);
    data.appendChild(followersCount);
    data.appendChild(viewersCount);
    data.appendChild(duration);
    item.appendChild(info);
    item.appendChild(button);
    extension.elements.container.appendChild(item);

    try {
        var response = await (await fetch('https://wasd.tv/api/v2/channels/nicknames/' + channelName, {
            credentials: 'omit'
        })).json();

        if (response) {
            response = response.result;

            followersCount.textContent = response.followers_count

            if (response.channel_is_live === true) {
                item.classList.add('list-item--live');
            }

            console.log(response);
        }

        var response = await (await fetch('https://wasd.tv/api/v2/broadcasts/public?channel_name=' + channelName, {
            credentials: 'omit'
        })).json();

        if (response) {
            response = response.result;

            if (response.media_container) {
                var date = new Date(new Date().getTime() - new Date(response.media_container.published_at).getTime());

                viewersCount.textContent = response.media_container.media_container_streams[0].stream_current_viewers;
                gameName.textContent = response.media_container.game.game_name;
                duration.textContent = date.getHours() + chrome.i18n.getMessage('h') + ' ' + date.getMinutes() + chrome.i18n.getMessage('m');
            }

            console.log(response);
        }
    } catch (error) {
        console.error(error);
    }

    return item;
};


/*--------------------------------------------------------------
# GET ALL
--------------------------------------------------------------*/

extension.channels.getAll = async function () {
    for (name in this.followed) {
        var channel = this.followed[name],
            node = extension.channels.render(name, channel.image);
    }

    if (extension.elements.container.childNodes.length === 0) {
        extension.render({
            component: 'div',
            class: 'empty-content',
            text: chrome.i18n.getMessage('youAreNotFollowingAnyChannelsYetTryUsingTheSearch')
        }, extension.elements.container);
    }
};


/*--------------------------------------------------------------
# INITIALIZATION
--------------------------------------------------------------*/

extension.localization();

extension.search.oninput();

extension.storage.import(function (items) {
    if (items.hasOwnProperty('followed')) {
        extension.channels.followed = items.followed;
    }

    extension.channels.getAll();
});