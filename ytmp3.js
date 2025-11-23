import { ytmp3 } from "../youtube-scraper";

export default async function handler(req, res) {
	const { url, quality } = req.query;
	if (!url) return res.status(400).json({ status: false, message: "URL required!" });
	const result = await ytmp3(url, Number(quality) || 128);
	res.status(200).json(result);
}
