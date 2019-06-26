const request = require('sync-request');

const SSI = function (param) {
	const options = param;
	options.includesMatcher = /<!--\s?#\s?include\s+(?:virtual|file)="([^"]+)"(?:\s+stub="(\w+)")?\s+-->/;

	function getContent(location) {
		let url;
		const urlPattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)*([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/;
		const matches = location.match(urlPattern);
		if (matches) {
			url = location;
		} else {
			url = `${options.location}${location}`;
		}
		const res = request('GET', url);
		return [res.statusCode, res.statusCode < 400 ? res.getBody('utf8') : [200, `ERROR : ${location}`]];
	}

	function processInclude(part, blocks) {
		const matches = part.match(options.includesMatcher);
		if (!matches) {
			return part;
		}

		const location = matches[1];
		const stub = matches[2];

		const [status, body] = getContent(location);
		return status === 200 ? body : blocks[stub];
	}

	function compile(content) {
		let output = [];
		const blocks = {};
		const splitContent = content.split('\n');

		for (const line of splitContent) {
			const part = line.trim();
			output += processInclude(part, blocks);
		}

		return output;
	}

	return (content) => compile(content);
};

module.exports = SSI;
