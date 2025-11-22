import { Hono } from "hono";

type Bindings = {
	DB: D1Database;
};

type IdeaRow = {
	id: string;
	title: string;
	tags: string | null;
	note: string | null;
	created_at: string;
	updated_at: string;
	last_suggested_at: string | null;
	snoozed_until: string | null;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
	return c.json({
		message: "Hello, Suggestman!",
		timestamp: new Date().toISOString(),
	});
});

app.get("/ideas", async (c) => {
	const { results } = await c.env.DB.prepare(
		`
      SELECT
        id,
        title,
        tags,
        note,
        created_at,
        updated_at,
        last_suggested_at,
        snoozed_until
      FROM ideas
      ORDER BY created_at DESC;
    `,
	).all<IdeaRow>();

	const ideas = results.map((row) => ({
		id: row.id,
		title: row.title,
		tags: parseTags(row.tags),
		note: row.note,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
		lastSuggestedAt: row.last_suggested_at,
		snoozedUntil: row.snoozed_until,
	}));

	return c.json({ ideas });
});

function parseTags(raw: string | null): string[] {
	if (!raw) return [];

	try {
		const parsed = JSON.parse(raw);

		if (Array.isArray(parsed)) {
			return parsed.filter((item): item is string => typeof item === "string");
		}

		return [];
	} catch {
		return [];
	}
}

export default app;
