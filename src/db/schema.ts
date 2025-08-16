import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";
import { type InferSelectModel } from "drizzle-orm";

import { createId } from "@paralleldrive/cuid2";

const commonColumns = {
  id: text()
    .primaryKey()
    .$defaultFn(() => createId())
    .notNull(),
  createdAt: integer({
    mode: "timestamp",
  })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer({
    mode: "timestamp",
  })
    .$onUpdateFn(() => new Date())
    .notNull(),
};

export const userTransactions = sqliteTable(
  "user_transactions",
  {
    ...commonColumns,
    telegramId: text({
      length: 255,
    }),
  },
  (table) => [index("user_telegram_id_idx").on(table.telegramId)]
);

export type UserTransactions = InferSelectModel<typeof userTransactions>;
