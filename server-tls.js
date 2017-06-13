const https = require('https')
const http = require('http')
const fs = require('fs')
const auth = require('http-auth')
const path = require('path')
const useragent = require('useragent')

const CA_PATH = process.env.CA_PATH
const KEY_PATH = process.env.KEY_PATH
const CRT_PATH = process.env.CRT_PATH
const DIGEST_PATH = process.env.DIGEST_PATH

const authenticator = auth.digest({
    realm: 'Users',
    authType: 'digest',
    file: DIGEST_PATH
})

const ca = []
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
        certificate = []
    }
}

const key = fs.readFileSync(KEY_PATH).toString()
const cert = fs.readFileSync(CRT_PATH).toString()

const httpsOptions = {
    ca,
    key,
    cert
}

const headers = {
    mp4: 'video/mp4',
    html: 'text/html'
}

const maxChunk = 1024 * 1024

const requestHandler = (req, res) => {
    console.log()

    let url = req.url

    if (url[0] === '/') {
        url = url.substr(1)
    }

    console.log(`request: ${url}`)

    if (url === 'favicon.ico') {
        return
    }

    if (url === '/') {
        res.writeHead(200, {
            'Content-Type': 'text/html'
        })

        res.end('<h1>Welcome</h1>')

        return
    }

    const file = path.parse(url)
    const filePath = path.join(__dirname, 'private', url)
    const stat = fs.statSync(filePath)

    if (file.ext === '.mp4') {
        const range = req.headers.range

        if (!range) {
            console.log('NO RANGE!')
            return res.sendStatus(416)
        }

        const total = stat.size
        const positions = range.replace(/bytes=/, '').split('-')

		const start = parseInt(positions[0], 10)
        let end = positions[1] ? parseInt(positions[1], 10) : total - 1
        let chunksize = (end - start) + 1

        const agent = useragent.lookup(req.headers['user-agent'])

        if (agent.family !== 'Safari' && agent.family !== 'Mobile Safari') {
            if (chunksize > maxChunk) {
                end = start + maxChunk - 1
                chunksize = (end - start) + 1
            }
        }

        const contentRange = `bytes ${start}-${end}/${total}`

        res.writeHead(206, {
            'Content-Range': contentRange,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4'
        })

        const streamOpts = {autoClose: true, start, end}

        const stream = fs.createReadStream(filePath, streamOpts)
            .on('open', () => stream.pipe(res))
            .on('error', err => {
                res.end(err)
                console.log(err)
            })
            .on('close', function () {
                console.log('reponse closed')
            })
            .on('end', () => {
                console.log('response stream ended')
            })

        return
    } else {
        res.writeHead(200, {
            'Content-Type': headers[file.ext],
            'Content-Length': stat.size
        })

        const readStream = fs.createReadStream(filePath)

        readStream.pipe(res)

        return
	}
}

const httpsServer = https.createServer(authenticator, httpsOptions, requestHandler)

httpsServer.listen(443)

// Redirect HTTP (80) to HTTPS
http.createServer((req, res) => {
    res.writeHead(301, {
            Location: `https://${req.headers.host}${req.url}`
    })

    res.end()
}).listen(80)