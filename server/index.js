const https = require('https');
const http = require('http');
const fs = require('fs');
const auth = require('http-auth');
const path = require('path');
const useragent = require('useragent');

const DOMAIN = process.env.DOMAIN;
console.log(`Loading SSL configuration for DOMAIN: ${DOMAIN}`);
const ENVIRONMENT = process.env.NODE_ENV === 'production' && 'production' || 'development';
console.log(`(Environment: ${ENVIRONMENT})`);

let CRT_PATH = `.secrets/${DOMAIN}.crt`;
const CA_PATH = `.secrets/${DOMAIN}.ca-bundle`;
const DIGEST_PATH = `.secrets/${DOMAIN}.htdigest`;
let KEY_PATH = `.secrets/${DOMAIN}.key`;

let TLS_PORT = 443;
let HTP_PORT = 80;

if (ENVIRONMENT === 'development') {
    TLS_PORT = 8443;
    HTP_PORT = 8080;
    CRT_PATH = `.secrets/DEV.crt.pem`;
    KEY_PATH = `.secrets/DEV.key.pem`;
}

const authenticator = auth.digest({
    realm: 'Users',
    authType: 'digest',
    file: DIGEST_PATH
})
console.log(`htdigest Configuration: LOADED`);

let ca = null;
if (ENVIRONMENT === 'production') {
    ca = [];
    let certificate = []
    const chain = fs.readFileSync(CA_PATH, 'utf8').toString().split('\n')
    for (let i = 0, len = chain.length; i < len; i++) {
        const line = chain[i]

        if (!(line.length !== 0)) {
            continue
        }

        certificate.push(line)

        if (line.match(/-END CERTIFICATE-/)) {
            ca.push(certificate.join('\n'))
            certificate = [];
        }
    }
    console.log(`Certificate Authority Bundle: LOADED`);
}

const key = fs.readFileSync(KEY_PATH).toString();
console.log(`SSL Certificate Key: LOADED`);
const cert = fs.readFileSync(CRT_PATH).toString();
console.log(`SSL Certificate: LOADED`);

const httpsOptions = {
    ca,
    key,
    cert
};

const headers = {
    mp4: 'video/mp4',
    html: 'text/html',
    css: 'text/css',
    jpg: 'image/jpeg',
    mp3: 'audio/mpeg',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    ico: 'image/vnd.microsoft.icon'
};

const streaming = ['mp4', 'mp3']; 

const maxChunk = 512 * 512;

const requestHandler = (req, res) => {
    let url = req.url

    if (url === '/') {
    	url = 'index.html';
    }

    if (url[0] === '/') {
        url = url.substr(1);
    }

    if (url === 'favicon.ico') {
        return;
    }

    const file = path.parse(url);
    console.log(`REQUEST: ${url}`);

    const filePath = path.resolve(__dirname, '..', 'site', url);
    const stat = fs.statSync(filePath);
    const ext = file.ext.slice(1);
    const contentType = headers[ext];

    if (streaming.includes(ext)) {
        const range = req.headers.range;

        if (!range) {
            console.log(`! NO RANGE FOR: ${url}`);
            return res.sendStatus(416);
        }

        const total = stat.size
        const positions = range.replace(/bytes=/, '').split('-');

        const start = parseInt(positions[0], 10);
        let end = positions[1] ? parseInt(positions[1], 10) : total - 1;
        let chunksize = (end - start) + 1;

        const agent = useragent.lookup(req.headers['user-agent']);

        if (agent.family !== 'Safari' && agent.family !== 'Mobile Safari') {
            if (chunksize > maxChunk) {
                end = start + maxChunk - 1;
                chunksize = (end - start) + 1;
            }
        }

        const contentRange = `bytes ${start}-${end}/${total}`;

        res.writeHead(206, {
            'Content-Range': contentRange,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': contentType
        });

        const streamOpts = {
            autoClose: true,
            start,
            end
        };

        const stream = fs.createReadStream(filePath, streamOpts)
            .on('open', () => {
                console.log(`STREAM OPENED: ${url}`);
                stream.pipe(res);
            })
            .on('error', err => {
                res.end(err);
                console.log(err);
            })
            .on('close', function() {
                console.log(`STREAM CLOSED: ${url}`);
            })
            .on('end', () => {
                console.log(`STREAM ENDED: ${url}`);
            });

        return
    } else {
        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': stat.size
        })

        const readStream = fs.createReadStream(filePath);

        readStream.pipe(res);

        return;
    }
}

const httpsServer = https.createServer(authenticator, httpsOptions, requestHandler);
httpsServer.listen(TLS_PORT);
console.log(`Running HTTPS server on ${TLS_PORT}`);

// Redirect HTTP to HTTPS (80 --> 443 | 8080 --> 8443)
http.createServer((req, res) => {
    res.writeHead(301, {
        Location: `https://${req.headers.host}${req.url}`,
    });

    res.end();
}).listen(HTP_PORT);
console.log(`Running HTTP server on ${HTP_PORT}`);

console.log(`https://localhost:${TLS_PORT}`);