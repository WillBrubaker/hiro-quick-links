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