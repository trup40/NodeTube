// by trup40 (Eagle) 
// https://github.com/trup40/NodeTube
// 2026

const express = require('express');
const cors = require('cors');
const path = require('path');
const https = require('https');
const { exec, spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT ? (isNaN(process.env.PORT) ? process.env.PORT : (parseInt(process.env.PORT, 10) || 3000)) : 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

let searchCache = {};

app.get('/search', (req, res) => {
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const limit = 12; 

    if (!query) return res.status(400).json({ error: 'no search terms.' });

    if (searchCache[query]) {
        return sendPaginated(res, searchCache[query], page, limit);
    }

    const exePath = path.join(__dirname, 'yt-dlp.exe');
    const safeQuery = query.replace(/"/g, ''); 
    const command = `"${exePath}" "ytsearch36:${safeQuery}" --dump-json --flat-playlist --no-warnings --no-check-certificates`;

    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ error: 'can not search.' });

        try {
            const lines = stdout.trim().split('\n');
            const allVideos = [];

            for (let line of lines) {
                if (!line) continue;
                const v = JSON.parse(line);
                
                if (v.id && v.duration > 0 && v.id.length === 11) {
                    let thumbnail = '';
                    if (v.thumbnails && v.thumbnails.length > 0) thumbnail = v.thumbnails[v.thumbnails.length - 1].url;

                    let durationStr = "0:00";
                    const mins = Math.floor(v.duration / 60);
                    const secs = Math.floor(v.duration % 60);
                    durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

                    allVideos.push({
                        id: v.id, title: v.title, thumbnail: thumbnail,
                        duration: durationStr, author: v.uploader || v.channel || 'YouTube'
                    });
                }
            }
            searchCache[query] = allVideos;
            sendPaginated(res, allVideos, page, limit);
        } catch (err) {
            res.status(500).json({ error: 'can not read.' });
        }
    });
});

function sendPaginated(res, allVideos, page, limit) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const videos = allVideos.slice(startIndex, endIndex);
    const hasMore = endIndex < allVideos.length;
    res.json({ videos, hasMore });
}

app.get('/resolve', (req, res) => {
    let url = '';
    
    if (req.query.url) {
        try {
            url = Buffer.from(req.query.url, 'hex').toString('utf8');
        } catch(e) {}
    }

    if (!url) return res.status(400).json({ error: 'no url' });

    const exePath = path.join(__dirname, 'yt-dlp.exe');
    const command = `"${exePath}" "${url}" --dump-json --flat-playlist --no-warnings --no-check-certificates`;

    exec(command, { maxBuffer: 1024 * 1024 * 50 }, (error, stdout, stderr) => {
        if (error) return res.status(500).json({ error: 'cannot resolve' });

        try {
            const lines = stdout.trim().split('\n');
            const allVideos = [];
            let playlistTitle = '';

            for (let line of lines) {
                if (!line) continue;
                const v = JSON.parse(line);
                if (v.playlist_title && !playlistTitle) playlistTitle = v.playlist_title;
                
                if (v.id && v.duration > 0 && v.id.length === 11) {
                    let thumbnail = '';
                    if (v.thumbnails && v.thumbnails.length > 0) thumbnail = v.thumbnails[v.thumbnails.length - 1].url;

                    let durationStr = "0:00";
                    const mins = Math.floor(v.duration / 60);
                    const secs = Math.floor(v.duration % 60);
                    durationStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

                    allVideos.push({
                        id: v.id, title: v.title, thumbnail: thumbnail,
                        duration: durationStr, author: v.uploader || v.channel || 'YouTube'
                    });
                }
            }
            res.json({ title: playlistTitle || allVideos[0]?.title || 'Playlist', videos: allVideos });
        } catch (err) {
            res.status(500).json({ error: 'cannot parse' });
        }
    });
});

app.get('/stream', async (req, res) => {
    const videoId = req.query.id;
    if (!videoId) return res.status(400).send('no video id.');

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const exePath = path.join(__dirname, 'yt-dlp.exe');

    try {
        const command = `"${exePath}" -f bestaudio -g --no-warnings --no-check-certificates "${videoUrl}"`;
        exec(command, (error, stdout, stderr) => {
            if (error || !stdout) return res.status(500).send('can not connect.');

            const directAudioUrl = stdout.trim();
            const range = req.headers.range;
            const options = { headers: { 'User-Agent': 'Mozilla/5.0' } };
            if (range) options.headers['Range'] = range;

            https.get(directAudioUrl, options, (ytResponse) => {
                res.writeHead(ytResponse.statusCode, ytResponse.headers);
                ytResponse.pipe(res);
            }).on('error', () => { if (!res.headersSent) res.status(500).send('connection dropped.'); });
        });
    } catch (error) { if (!res.headersSent) res.status(500).send('server error.'); }
});

app.get('/download', (req, res) => {
    const videoId = req.query.id;
    let rawTitle = 'NodeTube_Audio';

    if (req.query.t) {
        try {
            rawTitle = Buffer.from(req.query.t, 'hex').toString('utf8');
        } catch(e) {}
    }

    const safeTitle = rawTitle.replace(/[^a-zA-Z0-9 ğüşöçİĞÜŞÖÇ-]/g, '_'); 

    if (!videoId) return res.status(400).send('no video id.');

    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.m4a"`);
    res.setHeader('Content-Type', 'audio/mp4');

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const exePath = path.join(__dirname, 'yt-dlp.exe');

    const ytDlpProcess = spawn(exePath, [
        '-f', 'm4a/bestaudio',
        '-o', '-', 
        '--no-warnings',
        '--no-check-certificates',
        videoUrl
    ]);

    ytDlpProcess.stdout.pipe(res);

    req.on('close', () => {
        ytDlpProcess.kill('SIGKILL');
    });
});

app.listen(PORT, () => {
    console.log(`NodeTube rocks :) ...`);
});