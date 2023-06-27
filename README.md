# NodeJs TLS Media Server

This is a basic example of a web server that I set up to share videos with family members across the ocean.

The server has the following features:

- Uses a certificate for HTTPS
- Redirects traffic from HTTP port 80 to HTTPS
- Can stream MP4 videos as byte ranges
- Can serve HTML pages

Note: there are a few 0-byte files in this example. They are intentionally left blank, such as certificate files used to server a trusted HTTPS page. You should replace these with real content.

## Setup

- `git clone git@github.com:f1lt3r/tls-media-server.git`
- `cd tls-media-server`
- `npm install`
- `npm install -g htdigest` (encrypted user/pass generation w/ nonce)
- `npm install -g pm2` (keep server alive)
- `cp -r ./secrets-example ./secrets`
- Populate your `./secrets` certificate files and htdigest file. 
- allow ports 80 and 443 in your firewall
- `htdigest ./secrets/htdigest Users <NEW-USERNAME>` (see Adding Users below)
- `DOMAIN=<YOUR-DOMAIN> pm2 start ./server` (start the server)

## Secrets

The `./secrets` directory contains things that you do not want to share publicly; like passwords, certificate keys and a source file to provide paths to secret files in your environment.

For example:

- Certification
	+ CA Bundle file
	+ Key file
	+ Cert file
- htdigest file (contains encrypted passwords)

The `SECRETS/SOURCE` file below should updated to reflect the real paths to your certificates and `htdigest` file (where your user/passwords are stored).

```shell
export CA_PATH="/<user>/SECRETS/<domain>.ca-bundle"
export KEY_PATH="/<user>/SECRETS/<domain>.key"
export CRT_PATH="/<user>/SECRETS/<domain>.crt"
export DIGEST_PATH="/<user>/SECRETS/htdigest"
```

## Adding Users

To add a user to the `htdigest` file:

```shell
cd SECRETS/SOURCE
htdigest Users <username>

# You will be prompted for a password and confirmation
```

## Generating Certificates

I am using NameCheap SSL, Ubuntu 18 and a Digital Ocean Droplet.

```shell
mkdir ~/.ssl

openssl req -new -newkey rsa:2048 -nodes -keyout <DOMAIN.TLD>.key -out <DOMAIN.TLD>.csr

# Organization and Unit can be "NA"

# YOU MUST leave Challenge Password and OptionalCompanyName empty!
```




