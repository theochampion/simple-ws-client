const io = require("socket.io-client");
const fetch = require("node-fetch");
const minimist = require("minimist");
const readline = require("readline");

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
	prompt: "SWSC> "
});

/** Constants */
const API_ROOT_URL = "http://localhost:3030";
const LOGIN_URL = `${API_ROOT_URL}/login`;
const CONVERSATION_URL = `${API_ROOT_URL}/conversation`;

// /*
//  * Authenticate first, doing a post to some url
//  * with the credentials for instance
//  */
// request.post(
// 	{
// 		url: LOGIN_URL,
// 		form: { mail: email, password: password }
// 	},
// 	(err, resp, body) => {
// 		if (err || resp.statusCode !== 200) {
// 			console.error(
// 				`\x1b[35mConnection failed, check your credentials. Aborting.\x1b[0m`
// 			);
// 			process.exit(1);
// 		}
// 		// Grab auth cookies form response headers
// 		const cookies = resp.headers["set-cookie"];
// 		const json_body = JSON.parse(body);
// 		console.log(
// 			`\x1b[32mLogged in as \x1b[4m${json_body.name} ${
// 				json_body.lastname
// 			}. \x1b[0m\x1b[32mFetching conversations...\x1b[0m`
// 		);
// 		request.get(
// 			{
// 				url: CONVERSATION_URL,
// 				headers: {
// 					Cookie: cookies
// 				}
// 			},
// 			(err, resp, body) => {
// 				if (err || resp.statusCode !== 200) {
// 					console.error(
// 						`\x1b[35mError fetching conversations. Aborting.\x1b[0m`
// 					);
// 					process.exit(1);
// 				}
// 				const conversations = JSON.parse(body).conversations;
// 				console.error(`\x1b[35mSelect a conversation to join:\x1b[0m`);
// 				conversations.forEach((conversation, idx) =>
// 					console.log(`[${idx}] "${conversation._id}"`)
// 				);
// 			}
// 		);

// 		const convoID = "ekognerknp00ng4lshn0bf40dnfyu4o2nfkdhfw4nfafn3ifnambf";

// 	}
// );

ask = questionText => {
	return new Promise((resolve, reject) => {
		rl.question(questionText, input => resolve(input));
	});
};

const authenticate = async (email, password) => {
	try {
		const res = await fetch(LOGIN_URL, {
			method: "post",
			body: JSON.stringify({ mail: email, password: password }),
			headers: { "Content-Type": "application/json" }
		});
		if (!res.ok) return null;
		const cookies = res.headers.get("set-cookie");
		const user = await res.json();
		user.session = cookies;
		console.log(
			`\x1b[32mLogged in as \x1b[4m${user.name} ${user.lastname}\x1b\x1b[0m`
		);
		rl.setPrompt(`${user.name} ${user.lastname}`);
		return user;
	} catch (err) {
		console.error(err);
		return null;
	}
};

const selectConversation = async session_cookie => {
	try {
		const res = await fetch(CONVERSATION_URL, {
			method: "get",
			headers: { Cookie: session_cookie }
		});
		if (!res.ok) return null;
		const body = await res.json();
		if (body.conversations.length == 0) return null;
		console.log(`\x1b[35mSelect a conversation to join:\x1b[0m`);
		const conversation_ids = body.conversations.map((conversation, idx) => {
			console.log(`[${idx}] "${conversation._id}"`);
			return conversation._id;
		});

		const conversation_id = await ask(
			"Select a conversation leave blank to exit : "
		);
		return conversation_ids.includes(conversation_id) ? conversation_id : null;
	} catch (err) {
		console.error(err);
		return null;
	}
};

const connectToConversation = async (user, conversation_id) => {
	return new Promise((resolve, reject) => {
		const socket = io.connect(API_ROOT_URL, {
			query: `conversation_id=${conversation_id}`,
			transportOptions: {
				polling: {
					extraHeaders: {
						Cookie: user.session
					}
				}
			}
		});

		socket.on("connect", () => {
			console.log(
				`\x1b[32mConnected to conversation [${conversation_id}]\x1b[0m`
			);
			rl.on("line", line => {
				socket.emit("message", { sender: user._id, content: line, type: 0 });
				console.log(`Line from file: ${line}`);
			});
		});
		socket.on("new_message", msg => {
			console.log(`[${msg.sender}] ${msg.content}`);
		});

		socket.on("disconnect", () => {
			console.log("Disconnected");
			resolve();
		});

		socket.on("error", error => {
			console.error(`Impossible to connect to chat service : "${error}"`);
			reject();
		});
	});
};

const main = async () => {
	let email, password;
	try {
		const argv = minimist(process.argv.slice(2));
		email = argv.email;
		password = argv.pass;
	} catch (err) {
		return console.error(
			`\x1b[35mUsage: node index.js --email <email> --pass <password>\x1b[0m`
		);
	}
	const user = await authenticate(email, password);
	if (user == null)
		return console.error(
			`\x1b[33mConnection failed, check your credentials. Aborting.\x1b[0m`
		);

	const conversation_id = await selectConversation(user.session);
	if (conversation_id == null) return;
	await connectToConversation(user, conversation_id);
};

main();
