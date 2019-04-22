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

const MESSAGE_TYPES = {
	TEXT: 0,
	PICTURE: 1,
	MISC: 2
};

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
				socket.emit("message", {
					sender: user._id,
					content: line,
					type: MESSAGE_TYPES.TEXT
				});
			});
		});

		socket.on("new_message", msg => {
			if (msg.type == MESSAGE_TYPES.MISC)
				console.log(`\x1b[33m${msg.content}\x1b[0m`);
			else
				console.log(
					`\x1b[${msg.sender == user._id ? "32" : "35"}m<${msg.sender}> ${
						msg.content
					}\x1b[0m`
				);
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
