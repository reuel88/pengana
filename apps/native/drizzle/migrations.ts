// @ts-expect-error - inline-import babel plugin handles .sql imports
import m0000 from "./0000_bouncy_catseye.sql";
// @ts-expect-error - inline-import babel plugin handles .sql imports
import m0001 from "./0001_add_upload_queue.sql";
// @ts-expect-error - inline-import babel plugin handles .sql imports
import m0002 from "./0002_add_org_todos.sql";
import journal from "./meta/_journal.json";

export default {
	journal,
	migrations: {
		m0000: m0000,
		m0001: m0001,
		m0002: m0002,
	},
};
