const io = require("socket.io-client");
const request = require("request");

/** Constants */
const API_ROOT_URL = "http://localhost:3030";
const LOGIN_URL = `${API_ROOT_URL}/login`;
const CONVERSATION_URL = `${API_ROOT_URL}/conversation`;
/*
 * Authenticate first, doing a post to some url
 * with the credentials for instance
 */
request.post(
	{
		url: LOGIN_URL,
		form: { mail: "theo.champion@proton.co", password: "redcardigan" }
	},
	(err, resp, body) => {
		if (err || resp.statusCode !== 200) {
			console.error(
				`\x1b[35mConnection failed, check your credentials. Aborting.\x1b[0m`
			);
			process.exit(1);
		}
		// Grab auth cookies form response headers
		const cookies = resp.headers["set-cookie"];
		const json_body = JSON.parse(body);
		console.log(
			`\x1b[32mLogged in as \x1b[4m${json_body.name} ${
				json_body.lastname
			}\x1b[0m`
		);
		console.log(`\x1b[35mConnecting to chat service...\x1b[0m`);
		const convoID = "ekognerknp00ng4lshn0bf40dnfyu4o2nfkdhfw4nfafn3ifnambf";

		const socket = io.connect("http://localhost:3030", {
			query: `conversation_id=${convoID}`,
			transportOptions: {
				polling: {
					extraHeaders: {
						Cookie: cookies
					}
				}
			}
		});
		socket.on("connect", function() {
			console.log(`\x1b[32mConnected to chat services\x1b[0m`);
		});

		socket.on("error", error => {
			console.error(`Impossible to connect to chat service : "${error}"`);
		});
	}
);
