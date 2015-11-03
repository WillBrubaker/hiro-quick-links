/**
 * License: GPLv2 http://www.gnu.org/licenses/gpl-2.0.html
 * Copyright (C) 2015  Will Brubaker
	* This program is free software; you can redistribute it and/or
	* modify it under the terms of the GNU General Public License
	* as published by the Free Software Foundation; either version 2
	* of the License, or (at your option) any later version.
	*
	* This program is distributed in the hope that it will be useful,
	* but WITHOUT ANY WARRANTY; without even the implied warranty of
	* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	* GNU General Public License for more details.
	*
	* You should have received a copy of the GNU General Public License
	* along with this program; if not, write to the Free Software
	* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */
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
				Tipped.create("a", null,{position: "top", showDelay: 500, target: jQuery("#tooltip")})
				jQuery("a").on("click", function() {
					href = jQuery(this).attr("href")
					chrome.tabs.update(tabs[0].id, {url: href})
					window.close()
				})
			}
		})
	})
})