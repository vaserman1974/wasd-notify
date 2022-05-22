/*--------------------------------------------------------------
>>> TABLE OF CONTENTS:
----------------------------------------------------------------
# Global variable
# Localization
# Search
# Channels
# Games
# Initialization
--------------------------------------------------------------*/

/*--------------------------------------------------------------
# GLOBAL VARIABLE
--------------------------------------------------------------*/

var extension = {
	elements: {
		container: document.querySelector('.container'),
		subscriptionsLink: document.querySelector('a[data-i18n="subscriptions"]'),
		gamesLink: document.querySelector('a[data-i18n="games"]'),
		searchField: document.querySelector('.search-field')
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
		element.textContent = chrome.i18n.getMessage(skeleton.text) || skeleton.text;
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
	extension.elements.searchField.addEventListener('input', function (event) {
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

	item.channelName = channelName;
	avatar.style.backgroundImage = 'url(' + imageUrl + ')';
	name.textContent = channelName;
	button.dataset.name = channelName;
	button.dataset.image = imageUrl;

	item.addEventListener('click', function () {
		open('https://wasd.tv/' + this.channelName, '_blank');
	});

	button.addEventListener('click', function (event) {
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

		event.preventDefault();
		event.stopPropagation();

		return false;
	}, true);

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
	extension.empty(extension.elements.container);

	extension.elements.gamesLink.dataset.active = false;
	extension.elements.subscriptionsLink.dataset.active = true;

	extension.elements.searchField.value = '';

	if (Object.keys(extension.channels.followed).length > 0) {
		for (name in extension.channels.followed) {
			var channel = extension.channels.followed[name],
				node = extension.channels.render(name, channel.image);
		}
	} else {
		extension.render({
			component: 'div',
			class: 'empty-content',
			text: 'youAreNotFollowingAnyChannelsYetTryUsingTheSearch'
		}, extension.elements.container);
	}
};


/*--------------------------------------------------------------
# GAMES
--------------------------------------------------------------*/

extension.games = {};


/*--------------------------------------------------------------
# RENDER
--------------------------------------------------------------*/

extension.games.render = function (data) {
	var game = extension.render({
		component: 'div',
		class: 'game'
	}, extension.elements.container);

	game.style.backgroundImage = 'url(' + data.game_image.medium + ')';

	game.dataset.id = data.game_id;
	game.dataset.name = data.game_name;

	game.title = data.game_name;

	game.addEventListener('click', function () {
		window.open('https://wasd.tv/games/' + this.dataset.id, '_blank');
	});
};


/*--------------------------------------------------------------
# GET ALL
--------------------------------------------------------------*/

extension.games.getAll = async function () {
	extension.empty(extension.elements.container);

	extension.elements.subscriptionsLink.dataset.active = false;
	extension.elements.gamesLink.dataset.active = true;

	extension.elements.searchField.value = '';

	try {
		var response = await (await fetch('https://wasd.tv/api/games?limit=32&offset=0', {
			credentials: 'omit'
		})).json();
		if (response.result.length > 0) {
			console.log(response);

			for (var i = 0, l = response.result.length; i < l; i++) {
				var game = response.result[i];

				extension.games.render(game);
			}
		} else {
			extension.render({
				component: 'div',
				class: 'empty-content',
				text: 'noResultsFound'
			}, extension.elements.container);
		}
	} catch (error) {
		extension.render({
			component: 'div',
			class: 'empty-content',
			text: 'noResultsFound'
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

	if (items.rateUs !== true) {
		var modal = extension.render({
				component: 'div',
				class: 'modal'
			}, document.body),
			scrim = extension.render({
				component: 'div',
				class: 'modal__scrim'
			}, modal),
			surface = extension.render({
				component: 'div',
				class: 'modal__surface'
			}, modal);

		scrim.addEventListener('click', function () {
			var component = this.parentNode;

			component.classList.add('modal--closing');

			setTimeout(function () {
				component.remove();
			}, 140);
		});

		extension.render({
			component: 'h1',
			text: 'pleaseRateTheExtension'
		}, surface);

		extension.render({
			component: 'button',
			text: 'later'
		}, surface).addEventListener('click', function () {
			extension.storage.set('rateUs', true);

			this.parentNode.parentNode.firstChild.click();
		});

		extension.render({
			component: 'button',
			text: 'rate'
		}, surface).addEventListener('click', function () {
			extension.storage.set('rateUs', true);

			window.open('https://chrome.google.com/webstore/detail/wasdtv-%D1%83%D0%B2%D0%B5%D0%B4%D0%BE%D0%BC%D0%BB%D0%B5%D0%BD%D0%B8%D1%8F/ipeemmihcaliedfhcomcclimhgaiiflp/reviews', '_blank');

			this.parentNode.parentNode.firstChild.click();
		});
	}

	extension.elements.subscriptionsLink.addEventListener('click', extension.channels.getAll);
	extension.elements.gamesLink.addEventListener('click', extension.games.getAll);

	extension.channels.getAll();
});