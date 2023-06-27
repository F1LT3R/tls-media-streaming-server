# TLS Media Streaming Server

A simple SSL HTTP server with ByteRange MP4 video streaming support written in NodeJs.

Features:

- Uses an SSL certificate for HTTPS (PROD & DEV)
- Redirects traffic from HTTP port 80 to HTTPS 443.
- Can stream MP4 videos as byte ranges.
- Can serve HTML pages, and a few content types like .css, jpg, .etc.

Note: there are a few 0-byte files in this example. They are intentionally left blank, such as certificate files used to server a trusted HTTPS page. You should replace these with real content.

## Setup

- `git clone git@github.com:f1lt3r/tls-media-server.git`
- `cd tls-media-server`
- `npm install`
- `npm install -g htdigest` (encrypted user/pass generation w/ nonce)
- `npm install -g pm2` (keep server alive)
- `cp -r ./secrets-example ./secrets`
- Populate your `./secrets` certificate files and htdigest file. 
- DEV: Create your Dev Env  SSL Certificates (see below)
- PROD: Allow ports 80 and 443 in your firewall if you are in production
- `htdigest ./secrets/htdigest Users <NEW-USERNAME>` (see Adding Users below)
- PROD: `DOMAIN=<YOUR-DOMAIN> pm2 start ./server` (start the server)

## Create Dev Env SSL Certificate

```shell
# Create your cert pem 
openssl req -x509 -newkey rsa:2048 -keyout keytmp.pem -out cert.pem -days 365

# You will be asked to fill out the following
Enter PEM pass phrase: <PASSWORD>
Verifying - Enter PEM pass phrase: <PASSWORD>
-----
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:US
State or Province Name (full name) [Some-State]:New York
Locality Name (eg, city) []:New York
Organization Name (eg, company) [Internet Widgits Pty Ltd]:DEV.INC
Organizational Unit Name (eg, section) []: <BLANK>
Common Name (e.g. server FQDN or YOUR name) []:localhost
Email Address []:admin@dev.inc


# Create your key pem file
openssl rsa -in keytmp.pem -out key.pem
# You will see this password prompt:

#Enter pass phrase for keytmp.pem: <PASSWORD>

# Remove your temporary RSA key file
rm keytmp.pem


# Move your cert and key  to the .secrets folder
mv cert.pem .secrets/DEV.crt.pem
mv key.pem .secrets/DEV.key.pem
```

- Run the server.
- Launch the browser at: https://localhost:8443/
- Type `thisisunsafe` (Bypasses SSL cert in Chromium browsers)

## Secrets

The `./secrets` directory contains things that you do not want to share publicly; like passwords, certificate keys and a source file to provide paths to secret files in your environment.

For example:

- SSL Certification
	+ DEV Cert file
	+ DEV Key file
	+ CA Bundle file
	+ Key file
	+ Cert file
- htdigest file (contains encrypted passwords)

## Adding Users

To add a user to the `htdigest` file:

```shell
# It appears you MUST cd into the dir you are updating your htdigest file
cd ./secrets
# Digest file can be blank text file to start
# Eg: htdigest ./secrets/example.com.htdigest Users <username>
htdigest ./secrets/example.com.htdigest Users alice
# You will be prompted for a password and confirmation
```

## Generating SSL Certificates for Production

I am using NameCheap SSL, Ubuntu 18 and a Digital Ocean Droplet.

```shell
mkdir ~/.ssl

openssl req -new -newkey rsa:2048 -nodes -keyout <DOMAIN.TLD>.key -out <DOMAIN.TLD>.csr

# Organization and Unit can be "NA"

# YOU MUST leave Challenge Password and OptionalCompanyName empty!
```




