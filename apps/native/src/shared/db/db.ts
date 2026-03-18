import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";

const expoDb = openDatabaseSync("app.db", { enableChangeListener: true });

export const appDb = drizzle(expoDb);
