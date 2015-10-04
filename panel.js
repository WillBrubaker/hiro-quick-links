restore_options()
var tabContent

/* hides or shows WordPress admin notices (for screenshots or whatever) */
$("#toggle-notices").on("click", function() {
	chrome.tabs.query({
		active: true,
		currentWindow: true
	}, function(tabs) {
		message = {
			"action": "toggleNotices",
			"value": true
		}
		chrome.tabs.sendMessage(tabs[0].id, {
			message: message
		}, function(response) {
			return true
		})
	})
	window.close()
})

/* updates the extension settings from the panel */
jQuery("#hide-yoast").on("change", function() {
	hideYoast =
		chrome.storage.sync.set({
			hideYoast: jQuery(this).prop("checked")
		})
		/* send a message to the content script to toggle as appropriate */
	chrome.tabs.query({
		active: true,
		currentWindow: true
	}, function(tabs) {
		message = {
			"action": "hideYoast",
			"value": document.getElementById('hide-yoast').checked
		}
		chrome.tabs.sendMessage(tabs[0].id, {
			message: message
		})
	})
	window.close()
})

/* gets the "hide yoast" setting from the options panel and checks/unchecks the box on the panel */
function restore_options() {
	chrome.storage.sync.get({
		hideYoast: true
	}, function(items) {
		document.getElementById('hide-yoast').checked = items.hideYoast;
		if (true == items.hideYoast) {
			chrome.tabs.query({
				active: true,
				currentWindow: true
			}, function(tabs) {
				message = {
					"action": "hideYoast",
					"value": true
				}
				chrome.tabs.sendMessage(tabs[0].id, {
					message: message
				})
			})
		}
	})
}

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if ("undefined" != typeof request && "undefined" != typeof request.action) {
			if ("update-content" == request.action) {
				tabContent = request.value
				$("#wc-links").empty().append(tabContent)
			}
		}
		return true
	})

jQuery(document).ready(function() {
	//ask the content script for the tab content
	message = {
		"message": {
			"action": "whats-the-content"
		}
	}
	chrome.tabs.query({
		active: true,
		currentWindow: true
	}, function(tabs) {
		chrome.tabs.sendMessage(tabs[0].id, message, function(response) {
			if ("undefined" != typeof response && "undefined" != typeof response.content) { //if there is content, put the links in the thing, man
				$("#wc-links").empty().append(response.content)
				jQuery("a").each(function() {
					jQuery(this).attr('title', jQuery(this).attr("href"))
				})
				Tipped.create("a", null,{position: "bottom", fadeIn: 1200})
				jQuery("a").on("click", function() {
					href = jQuery(this).attr("href")
					chrome.tabs.update(tabs[0].id, {url: href})
					window.close()
				})
			}
		})
	})
})