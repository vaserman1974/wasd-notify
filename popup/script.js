/*--------------------------------------------------------------
>>> TABLE OF CONTENTS:
----------------------------------------------------------------
# Global variables
# Search
# Initialization
--------------------------------------------------------------*/

/*--------------------------------------------------------------
# GLOBAL VARIABLES
--------------------------------------------------------------*/

var followed = {};

function follow() {
    var name = this.dataset.name;

    this.classList.toggle('list-item__notify--followed');

    if (!followed[name]) {
        followed[name] = {
            followed: false
        };
    }

    followed[name].followed = !followed[name].followed;
    followed[name].image = this.dataset.image;

    chrome.storage.local.set({
        followed: followed
    });

    onlineChannels();
}

function offlineChannels(online = {}) {
    if (Object.keys(followed).length > 0) {
        document.querySelector('.channels-container').innerHTML += '<h1>Оффлайн</h1>';

        for (var key in followed) {
            var item = followed[key];

            if (item.followed === true && !online[key]) {
                document.querySelector('.channels-container').innerHTML += `
	            	<a class="list-item" href="https://wasd.tv/` + key + `" target="_blank">
	            		<div class="list-item__image" style="background-image:url(` + item.image + `);"></div>
	            		<div class="list-item__name">` + key + `</div>
	            		<button class="list-item__notify list-item__notify--followed" data-name="` + key + `" data-image="` + item.image + `">
	            			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
	            				<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
	            			</svg>
	            		</button>
	            	</a>
	            `;
            }
        }

        setTimeout(function() {
            var elements = document.querySelectorAll('.list-item__notify');

            for (var i = 0, l = elements.length; i < l; i++) {
                elements[i].removeEventListener('click', follow);
                elements[i].addEventListener('click', follow);
            }
        });
    } else {
        document.querySelector('.channels-container').innerHTML = 'Вы пока не отслеживаете ни одного канала, попробуйте воспользоваться поиском';
    }
}

async function onlineChannels() {
    var online = {};

    document.querySelector('.channels-container').innerHTML = '';

    if (Object.keys(followed).length > 0) {
        for (var key in followed) {
            var item = followed[key];

            if (item.followed === true) {
                var response = await (await fetch('https://wasd.tv/api/v2/channels/nicknames/' + key, {
                    credentials: 'omit'
                })).json();

                if (response.result.channel_is_live === true) {
                    online[key] = true;

                    document.querySelector('.channels-container').innerHTML += `
		            	<a class="list-item" href="https://wasd.tv/` + key + `" target="_blank">
		            		<div class="list-item__image" style="background-image:url(` + item.iamge + `);"></div>
		            		<div class="list-item__name">` + key + `</div>
		            		<button class="list-item__notify` + (item.followed === true ? ' list-item__notify--followed' : '') + `" data-name="` + key + `" data-image="` + item.image + `">
		            			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		            				<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
		            			</svg>
		            		</button>
		            	</a>
		            `;
                }
            }
        }

        setTimeout(function() {
            var elements = document.querySelectorAll('.list-item__notify');

            for (var i = 0, l = elements.length; i < l; i++) {
                elements[i].removeEventListener('click', follow);
                elements[i].addEventListener('click', follow);
            }
        });

        if (Object.keys(online).length > 0) {
            document.querySelector('.channels-container').innerHTML = '<h1>Онлайн</h1>' + document.querySelector('.channels-container').innerHTML;
        }
    }

    offlineChannels(online);
}


/*--------------------------------------------------------------
# SEARCH
--------------------------------------------------------------*/

async function searchChannels(query) {
    var response = await (await fetch('https://wasd.tv/api/search/channels?limit=13&offset=0&search_phrase=' + query, {
        credentials: 'omit'
    })).json();

    if (response.result.rows.length > 0) {
        for (var i = 0, l = response.result.rows.length; i < l; i++) {
            var item = response.result.rows[i];

            document.querySelector('.search-container').innerHTML += `
            	<div class="list-item">
            		<div class="list-item__image" style="background-image:url(` + item.channel_image.small + `);"></div>
            		<div class="list-item__name">` + item.channel_name + `</div>
            		<button class="list-item__notify` + ((followed[item.channel_name] || {}).followed === true ? ' list-item__notify--followed' : '') + `" data-name="` + item.channel_name + `" data-image="` + item.channel_image.small + `">
            			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            				<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
            			</svg>
            		</button>
            	</div>
            `;
        }

        setTimeout(function() {
            var elements = document.querySelectorAll('.list-item__notify');

            for (var i = 0, l = elements.length; i < l; i++) {
                elements[i].removeEventListener('click', follow);
                elements[i].addEventListener('click', follow);
            }
        });
    } else {
        document.querySelector('.search-container').innerHTML = 'Мы ничего не нашли по этому запросу, попробуй позже или измени искомое слово';
    }
}


document.querySelector('.search-field').addEventListener('input', function(event) {
    document.querySelector('.search-container').innerHTML = '';

    if (this.value.length > 0) {
        searchChannels(this.value);
    }
});


/*--------------------------------------------------------------
# INITIALIZATION
--------------------------------------------------------------*/

chrome.storage.local.get(function(items) {
    if (items.hasOwnProperty('followed')) {
        followed = items.followed;
    }

    onlineChannels();
});

chrome.runtime.sendMessage({
    action: 'reset-badge'
});