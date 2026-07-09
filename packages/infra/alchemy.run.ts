import alchemy from "alchemy";
import {
	D1Database,
	KVNamespace,
	Queue,
	Vite,
	Worker,
} from "alchemy/cloudflare";
import { config } from "dotenv";

config({ path: "./.env" });
config({ path: "../../apps/web/.env" });
config({ path: "../../apps/server/.env" });

const app = await alchemy("worker-smtp");

const db = await D1Database("database", {
	migrationsDir: "../../packages/db/src/migrations",
});

const mailDlq = await Queue("mail-dlq", {
	settings: {
		messageRetentionPeriod: 86400,
	},
});

const mailQueue = await Queue("mail-queue", {
	dlq: mailDlq,
});

const mailKv = await KVNamespace("mail-kv");

const serverDomain = alchemy.env.SERVER_DOMAIN || "";
const webDomain = alchemy.env.WEB_DOMAIN || "";

export const server = await Worker("server", {
	cwd: "../../apps/server",
	entrypoint: "src/index.ts",
	compatibility: "node",
	sourceMap: false,
	url: true,
	domains: serverDomain ? [{ domainName: serverDomain, adopt: true }] : undefined,
	bindings: {
		DB: db,
		MAIL_QUEUE: mailQueue,
		MAIL_KV: mailKv,
		CORS_ORIGIN: alchemy.env.CORS_ORIGIN || "",
		BETTER_AUTH_SECRET: alchemy.secret.env.BETTER_AUTH_SECRET || "",
		BETTER_AUTH_URL: alchemy.env.BETTER_AUTH_URL || "",
	},
	eventSources: [
		{
			queue: mailQueue,
			settings: {
				batchSize: 10,
				maxRetries: 3,
				maxWaitTimeMs: 3000,
				deadLetterQueue: mailDlq,
			},
		},
	],
	dev: {
		port: 3000,
	},
});

const serverUrl = serverDomain ? `https://${serverDomain}` : server.url;
if (!serverUrl) {
	throw new Error("Server URL is undefined");
}

export const web = await Vite("web", {
	cwd: "../../apps/web",
	assets: "dist",
	domains: webDomain ? [{ domainName: webDomain, adopt: true }] : undefined,
	bindings: {
		VITE_SERVER_URL: serverUrl,
	},
});

console.log(`Web    -> ${web.url}`);
console.log(`Server -> ${server.url}`);

await app.finalize();
