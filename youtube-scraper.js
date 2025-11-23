const axios = require("axios");
const yts = require("yt-search");
const { createDecipheriv } = require('crypto');

const audio = [92, 128, 256, 320];
const video = [144, 360, 480, 720, 1080];

function get_id(url) {
	const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|v\/|embed\/|user\/[^\/\n\s]+\/)?(?:watch\?v=|v%3D|embed%2F|video%2F)?|youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/|youtube\.com\/playlist\?list=)([a-zA-Z0-9_-]{11})/;
	const match = url.match(regex);
	return match ? match[1] : null;
}

function is_link(input) {
    const regex = /^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}(\/\S*)?$/i;
    return regex.test(input);
}

function make_id(length) {
	let result = '';
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for(let i=0; i<length; i++){
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return result;
}

function format_date(input) {
	const date = new Date(input);
	const options = {
		timeZone: "Asia/Jakarta",
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false
	};
	const formatter = new Intl.DateTimeFormat("id-ID", options);
	const formatted = formatter.format(date);
	return `${formatted.replace(".", ":")} WIB`;
}

const decode = (enc) => {
	try {
		const secret_key = 'C5D58EF67A7584E4A29F6C35BBC4EB12';
		const data = Buffer.from(enc, 'base64');
		const iv = data.slice(0, 16);
		const content = data.slice(16);
		const key = Buffer.from(secret_key, 'hex');
		const decipher = createDecipheriv('aes-128-cbc', key, iv);
		let decrypted = Buffer.concat([decipher.update(content), decipher.final()]);
		return JSON.parse(decrypted.toString());
	} catch (error) {
		throw new Error(error.message);
	}
};

async function savetube(link, quality, value) {
	try {
		const cdn = (await axios.get("https://media.savetube.me/api/random-cdn")).data.cdn;
		const infoget = (await axios.post('https://' + cdn + '/v2/info', { url: link }, {
			headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://yt.savetube.me/' }
		})).data;
		const info = decode(infoget.data);
		const response = (await axios.post('https://' + cdn + '/download', {
			downloadType: value,
			quality: `${quality}`,
			key: info.key
		}, {
			headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://yt.savetube.me/' }
		})).data;

		return {
			status: true,
			quality: `${quality}${value === "audio" ? "kbps" : "p"}`,
			availableQuality: value === "audio" ? audio : video,
			url: response.data.downloadUrl,
			filename: `${info.title} (${quality}${value === "audio" ? "kbps).mp3" : "p).mp4"}`
		};
	} catch (error) {
		console.error("Converting error:", error);
		return { status: false, message: "Converting error" };
	}
}

// MP3 download
async function ytmp3(link, formats = 128) {
	const id = get_id(link);
	const format = audio.includes(Number(formats)) ? Number(formats) : 128;
	if (!id) return { status: false, message: "Invalid link!" };
	try {
		let url = "https://youtube.com/watch?v=" + id;
		let data = await yts(url);
		let response = await savetube(url, format, "audio");
		return { status: true, creator: "@vreden/youtube_scraper", metadata: data.all[0], download: response };
	} catch (error) {
		console.log(error);
		return { status: false, message: "System error!" };
	}
}

// MP4 download
async function ytmp4(link, formats = 360) {
	const id = get_id(link);
	const format = video.includes(Number(formats)) ? Number(formats) : 360;
	if (!id) return { status: false, message: "Invalid link!" };
	try {
		let url = "https://youtube.com/watch?v=" + id;
		let data = await yts(url);
		let response = await savetube(url, format, "video");
		return { status: true, creator: "@vreden/youtube_scraper", metadata: data.all[0], download: response };
	} catch (error) {
		console.log(error);
		return { status: false, message: "System error!" };
	}
}

// External API MP3
async function apimp3(link, formats = 128) {
	const id = get_id(link);
	const format = audio.includes(Number(formats)) ? Number(formats) : 128;
	if (!id) return { status: false, message: "Invalid link!" };
	try {
		const url = "https://youtube.com/watch?v=" + id;
		const response = await axios.get(`https://api.vreden.my.id/api/v1/download/youtube/audio?url=${encodeURIComponent(url)}&quality=${format}`);
		return response.data.result;
	} catch (error) {
		console.log(error);
		return { status: false, message: "System error!" };
	}
}

// External API MP4
async function apimp4(link, formats = 360) {
	const id = get_id(link);
	const format = video.includes(Number(formats)) ? Number(formats) : 360;
	if (!id) return { status: false, message: "Invalid link!" };
	try {
		const url = "https://youtube.com/watch?v=" + id;
		const response = await axios.get(`https://api.vreden.my.id/api/v1/download/youtube/video?url=${encodeURIComponent(url)}&quality=${format}`);
		return response.data.result;
	} catch (error) {
		console.log(error);
		return { status: false, message: "System error!" };
	}
}

// Metadata
async function metadata(link) {
	const id = get_id(link);
	if (!id) return { status: false, message: "Invalid link!" };
	try {
		const response = await axios.get('https://ytapi.apps.mattw.io/v3/videos', {
			params: { key: 'foo1', quotaUser: make_id(40), part: 'snippet,statistics', id: id, _: Date.now() }
		});
		if (!response.data.items || response.data.items.length === 0) return { status: false, message: "No data found!" };
		const snippet = response.data.items[0].snippet;
		const statistics = response.data.items[0].statistics;
		return {
			id,
			title: snippet.title,
			description: snippet.description,
			channel_id: snippet.channelId,
			channel_title: snippet.channelTitle,
			thumbnails: Object.values(snippet.thumbnails),
			published_date: snippet.publishedAt,
			published_format: format_date(snippet.publishedAt),
			statistics
		};
	} catch (error) {
		console.log(error);
		return { status: false, message: "System error!" };
	}
}

// Channel info
async function channel(input) {
	try {
		const url = is_link(input) ? input : "https://www.youtube.com/" + input.replace(/@/g, "");
		const response = await axios.get('https://ytapi.apps.mattw.io/v1/resolve_url', { params: { url } });
		if (!response.data.channelId) return { status: false, message: "Channel not found!" };
		const result = await axios.get('https://ytapi.apps.mattw.io/v3/channels', { params: { key: 'foo1', id: response.data.channelId, _: Date.now() } });
		if (!result.data.items || result.data.items.length === 0) return { status: false, message: "No channel found!" };
		const snippet = result.data.items[0].snippet;
		const statistics = result.data.items[0].statistics;
		return {
			id: response.data.channelId,
			title: snippet.title,
			description: snippet.description,
			username: snippet.customUrl,
			thumbnails: Object.values(snippet.thumbnails),
			published_date: snippet.publishedAt,
			published_format: format_date(snippet.publishedAt),
			statistics
		};
	} catch (error) {
		console.log(error);
		return { status: false, message: "System error!" };
	}
}

// Search
async function search(teks) {
	try {
		let data = await yts(teks);
		return { status: true, creator: "@vreden/youtube_scraper", results: data.all };
	} catch (error) {
		return { status: false, message: error.message };
	}
}

module.exports = { search, ytmp3, ytmp4, apimp3, apimp4, metadata, channel };
