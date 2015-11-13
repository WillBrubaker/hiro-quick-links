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
var siteContent
var site
var protocol
var underLinks = []
var noticesDisplayed = true
var wcPages = {
	"Cart": null,
	"Checkout": null,
	"My Account": null,
	"Shop": null
}

jQuery(document).ready(function() {

	/*window variables aren't accessible to extension content scripts, need to get the ajax url somehow*/
	var ajaxUrl = retrieveAjaxUrl()
	if ("undefined" != typeof ajaxUrl) { //ajaxurl is defined, this is probably a WordPress site
		/*try to get a base url for the site*/
		var link = document.createElement("a")
		link.href = ajaxUrl
		site = link.host + link.pathname.replace("/wp-admin/admin-ajax.php", "")
		protocol = link.protocol
		message = {
			"action": "have-content",
			"value": {
				"site": site
			}
		}
		chrome.runtime.sendMessage(message, function(response) { //ask the background script for content for this site
			if ("undefined" != response.content && false == response.content) { //bg script didn't have content - fetch new
				jQuery.when(jQuery.get(protocol + "//" + site + "/wp-admin/admin.php?page=wc-settings", function(data) {
					links = jQuery('h2.woo-nav-tab-wrapper a', data)
					wcLinks = '<ul>'
					jQuery(links).each(function(index) {
						anchorText = jQuery(this).html()
						href = jQuery(this).attr('href')
						if (index > 0) {
							wcLinks += '<li>'
						}
						wcLinks += '<a href="' + href + '" tabindex="-1">' + anchorText + '</a>'
						if (index > 0) {
							wcLinks += '</li>'
						}
					})
					wcLinks += '</ul>'
				}).fail(function(xhr) {
					console.log(xhr)
				}).done(function() {
					jQuery.when(jQuery.get(protocol + "//" + site + "/wp-admin/admin.php?page=wc-settings&tab=products&section=display", function(data) {
						shopPageId = jQuery("#woocommerce_shop_page_id option:selected", data).val()
						if ("undefined" != typeof shopPageId && shopPageId.length > 0) {
							wcPages.Shop = protocol + "//" + site + "/?p=" + shopPageId
						}
					}).done(function() {}))
					jQuery.when(jQuery.get(protocol + "//" + site + "/wp-admin/admin.php?page=wc-settings&tab=checkout", function(data) {
						cartPageId = jQuery("#woocommerce_cart_page_id option:selected", data).val()
						if ("undefined" != typeof cartPageId && cartPageId.length > 0) {
							wcPages.Cart = protocol + "//" + site + "/?p=" + cartPageId
						}
						checkoutPageId = jQuery("#woocommerce_checkout_page_id option:selected", data).val()
						if ("undefined" != typeof checkoutPageId && checkoutPageId.length > 0) {
							wcPages.Checkout = protocol + "//" + site + "/?p=" + checkoutPageId
						}
					}).done(function() {}))
					jQuery.when(jQuery.get(protocol + "//" + site + "/wp-admin/admin.php?page=wc-settings&tab=account", function(data) {
						myAccountPageId = jQuery("#woocommerce_myaccount_page_id option:selected", data).val()
						if ("undefined" != typeof myAccountPageId && myAccountPageId.length > 0) {
							wcPages["My Account"] = protocol + "//" + site + "/?p=" + myAccountPageId
						}
					}).done(function() {}))
					processResponse(wcLinks)
				}))
			} else {
				siteContent = response.content
				message = {
					"action": "update-content",
					"value": siteContent
				}
			}
			chrome.runtime.sendMessage(message, function(response) {
				return true;
			})
		})
	}

	/*get the hide yoast setting, hide if appropriate*/
	chrome.storage.sync.get({
		hideYoast: true
	}, function(items) {
		if (items.hideYoast) {
			jQuery(".column-wpseo-score, .column-wpseo-title, .column-wpseo-title, .column-wpseo-metadesc, .column-wpseo-focuskw").hide()
		}
	})

	function retrieveAjaxUrl() {
		var ret
		var scriptContent = "if ('undefined' != typeof ajaxurl) {\n";
		scriptContent += "jQuery('body').attr('tmp_ajaxurl', ajaxurl)}\n"
		scriptContent += "else if ( 'undefined' != typeof woocommerce_params && 'undefined' != typeof woocommerce_params.ajax_url) {\n"
		scriptContent += "jQuery('body').attr('tmp_ajaxurl', woocommerce_params.ajax_url)\n"
		scriptContent += "}";
		var script = document.createElement('script');
		script.id = 'tmpScript';
		script.appendChild(document.createTextNode(scriptContent));
		(document.body || document.head || document.documentElement).appendChild(script);
		ret = jQuery("body").attr("tmp_ajaxurl");
		jQuery("#tmpScript").remove();
		return ret;
	}

})

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if ('undefined' != typeof request.message) {
			if ("toggleNotices" == request.message.action) {
				show = (noticesDisplayed) ? false : true
				jQuery(".notice, .updated, .error, .update-nag").toggle(show)
				noticesDisplayed = show
			}
			if ("hideYoast" == request.message.action) {
				show = (request.message.value) ? false : true
				jQuery(".column-wpseo-score, .column-wpseo-title, .column-wpseo-title, .column-wpseo-metadesc, .column-wpseo-focuskw").toggle(show)
			}
			if ("whats-the-content" == request.message.action) {
				//is site content defined? if so, send that
				if ("undefined" != typeof siteContent) {
					sendResponse({
						"content": siteContent
					})
				} else { //ask the background script if it has content for this url
					message = {
						"action": "have-content",
						"value": site
					}
					chrome.runtime.sendMessage(message, function(response) {
						if (response.content) {
							content = response.content
						} else {

						}
					})
				}
				sendResponse({
					"content": siteContent
				})
			}
		}
	})

function processResponse(wcLinks) {
	var html
	var wcMenu = $("#toplevel_page_woocommerce ul.wp-submenu")
	if (wcMenu.length < 1) {
		$.when($.get(protocol + "//" + site + "/wp-admin/", function(data) {})).done(function(data) {
			wcMenu = $("#toplevel_page_woocommerce ul.wp-submenu", data)
		})
	}
	subLinks = $('li a', wcLinks)
	var linkSet
	var numLoops = subLinks.length
	$(subLinks).each(function(index) {
		var sub = $(this)
		var theLinks = {}
		var href = $(this).attr('href')
		$.when($.get(href, function(subData) {
			underLinks[index] = $('ul.subsubsub', subData)
		}).done(function() {
			if (underLinks.length >= numLoops) {
				html = $(wcLinks).html().split('<li>')
				for (key in underLinks) {
					htmlKey = parseInt(key) + 1
					if ("undefined" != typeof underLinks[key][0]) {
						/*
						TODO: there should be some way to identify what these links point to
						and get their English titles and output that as the title in the
						case of working on a non-English site
						 */
						html[htmlKey] += "<li>" + underLinks[key][0].outerHTML + "</li>"
					}
				}
				html[0] = '<li class="no-indent">' + html[0] + "</li>"
				html = '<ul>' + html.join('<li>') + '</ul>'
				html += "<ul>"
				$("a", wcMenu).each(function() {
					href = protocol + "//" + site + "/wp-admin/" + $(this).attr("href")
					text = $(this).text()
					html += '<li><a href="' + href + '" tabindex="-1">' + text + '</a></li>'
				})
				html += "</ul>"
				html += "<hr>Frontend:<br><ul>"
				for (index in wcPages) {
					if (null !== wcPages[index]) {
						html += "<li><a href=" + wcPages[index] + ">" + index + "</a></li>"
					} else {
						html += "<li>" + index + " is undefined</li>"
					}
				}
				html += "</ul>"
				siteContent = html
				message = {
					"action": "set-content",
					"value": {
						"site": site,
						"content": siteContent
					}
				}
				chrome.runtime.sendMessage(message, function(response) {
					return true;
				})
			}
		}))
	})
}