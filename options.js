// Saves options to chrome.storage.sync.
function save_options() {
	var likesColor = document.getElementById('hide-yoast').checked;
	chrome.storage.sync.set({
		hideYoast: likesColor
	}, function() {
		// Update status to let user know options were saved.
		var status = document.getElementById('status');
		status.textContent = 'Options saved.';
		setTimeout(function() {
			status.textContent = '';
		}, 750);
	});
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
	// Use default value color = 'red' and likesColor = true.
	chrome.storage.sync.get({
		hideYoast: true
	}, function(items) {
		document.getElementById('hide-yoast').checked = items.hideYoast;
	});
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',
	save_options);