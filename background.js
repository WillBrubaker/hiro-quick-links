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
var sitesContent = {}
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if ("undefined" != typeof request.action) {
			if ("have-content" == request.action) {
				//check if sitesContent request.value.site is defined if it is, send content
				//to the panel, if not send false
				site = request.value.site
				content = ( "undefined" != typeof sitesContent[site] ) ? sitesContent[site].content : false
				sendResponse({
					"content": content
				})
			}
			if ("set-content" == request.action) {
				sitesContent[request.value.site] = {"content": request.value.content}
			}
		}
	})