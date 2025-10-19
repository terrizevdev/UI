
const axios = require('axios');
const yts = require('yt-search');

module.exports = function(app) {
    const ytdown = {
        // New API endpoint
        api: {
            base: "https://api.nekolabs.my.id/downloader/youtube/play/v1"
        },
        headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'accept': 'application/json',
        },
        isUrl: str => {
            try { new URL(str); return true; } catch { return false; }
        },
        youtube: url => {
            if (!url) return null;
            const patterns = [
                /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
                /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
                /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
                /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
                /youtu\.be\/([a-zA-Z0-9_-]{11})/
            ];
            for (let p of patterns) {
                const match = url.match(p);
                if (match) return match[1];
            }
            return null;
        },
        download: async (link) => {
            const id = ytdown.youtube(link);
            if (!id) throw new Error("Failed to extract YouTube ID");
            
            try {
                // Use the new API endpoint
                const response = await axios.get(ytdown.api.base, {
                    params: {
                        q: `https://www.youtube.com/watch?v=${id}`
                    },
                    headers: ytdown.headers,
                    responseType: 'json'
                });

                const data = response.data;
                
                if (!data.success) {
                    throw new Error("API returned error status");
                }

                if (!data.result || !data.result.downloadUrl) {
                    throw new Error("No download URL found in response");
                }

                return {
                    title: data.result.metadata?.title || "Unknown",
                    id: id,
                    thumbnail: data.result.metadata?.cover || `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
                    download: data.result.downloadUrl,
                    duration: data.result.metadata?.duration,
                    channel: data.result.metadata?.channel,
                    url: data.result.metadata?.url
                };
            } catch (error) {
                throw new Error(`Download failed: ${error.message}`);
            }
        }
    };

    app.get('/dl/yt/play', async (req, res) => {
        const { query } = req.query;
        if (!query) return res.status(400).json({ status: false, error: "Parameter 'query' is required" });

        try {
            let videoData;
            let youtubeUrl;

            // Check if query is a YouTube URL
            if (ytdown.isUrl(query) && ytdown.youtube(query)) {
                youtubeUrl = query;
                const id = ytdown.youtube(query);
                // Get video info using yts for additional metadata
                const searchResult = await yts({ videoId: id });
                videoData = searchResult;
            } else {
                // Search for first video
                const searchResult = await yts(query);
                videoData = searchResult.videos[0];
                if (!videoData) return res.status(404).json({ status: false, error: "Video not found" });
                youtubeUrl = videoData.url;
            }

            // Download mp3 using new API
            const mp3 = await ytdown.download(youtubeUrl);

            res.json({
                status: true,
                creator: "@Terri",
                result: {
                    video: {
                        title: videoData.title,
                        url: videoData.url,
                        description: videoData.description,
                        duration: videoData.timestamp,
                        views: videoData.views,
                        thumbnail: videoData.thumbnail,
                        channel: videoData.author?.name
                    },
                    mp3: {
                        title: mp3.title,
                        id: mp3.id,
                        thumbnail: mp3.thumbnail,
                        download: mp3.download,
                        duration: mp3.duration,
                        channel: mp3.channel
                    }
                }
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });

    // Direct endpoint using the new API
    app.get('/dl/yt/play/v2', async (req, res) => {
        const { q } = req.query;
        if (!q) return res.status(400).json({ status: false, error: "Parameter 'q' is required" });

        try {
            let youtubeUrl = q;
            
            // If it's not a URL, search for it
            if (!ytdown.isUrl(q)) {
                const searchResult = await yts(q);
                const video = searchResult.videos[0];
                if (!video) return res.status(404).json({ status: false, error: "Video not found" });
                youtubeUrl = video.url;
            }

            // Use the new API directly
            const response = await axios.get(ytdown.api.base, {
                params: { q: youtubeUrl },
                headers: ytdown.headers,
                responseType: 'json'
            });

            if (!response.data.success) {
                return res.status(500).json({ status: false, error: "API returned error" });
            }

            res.json({
                status: true,
                creator: "@Terri",
                result: response.data.result
            });
        } catch (err) {
            res.status(500).json({ status: false, error: err.message });
        }
    });

    // Simple health check for the API
    app.get('/dl/yt/health', async (req, res) => {
        try {
            const response = await axios.get(ytdown.api.base, {
                params: { q: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
                headers: ytdown.headers,
                timeout: 10000
            });
            
            res.json({
                status: true,
                api_status: response.data.success ? "working" : "error",
                timestamp: new Date().toISOString()
            });
        } catch (err) {
            res.status(500).json({
                status: false,
                api_status: "down",
                error: err.message
            });
        }
    });
};
