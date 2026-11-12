import { boolean, date, pgTable, text } from "drizzle-orm/pg-core";

export const physicians = pgTable("physicians", {
  npi: text("npi").primaryKey(),
  entityTypeCode: text("entity_type_code").notNull(),
  lastName: text("last_name"),
  firstName: text("first_name"),
  middleName: text("middle_name"),
  credential: text("credential"),
  primaryTaxonomyCode: text("primary_taxonomy_code"),
  primaryTaxonomyName: text("primary_taxonomy_name"),

  mailingAddress1: text("mailing_address_1"),
  mailingAddress2: text("mailing_address_2"),
  mailingCity: text("mailing_city"),
  mailingState: text("mailing_state"),
  mailingZip: text("mailing_zip"),

  practiceAddress1: text("practice_address_1"),
  practiceAddress2: text("practice_address_2"),
  practiceCity: text("practice_city"),
  practiceState: text("practice_state"),
  practiceZip: text("practice_zip"),

  phone: text("phone"),
  enumerationDate: date("enumeration_date"),
  lastUpdateDate: date("last_update_date"),

  isActive: boolean("is_active").notNull(),
  deactivationReasonCode: text("deactivation_reason_code"),
  deactivationDate: date("deactivation_date"),
  reactivationDate: date("reactivation_date"),
});

export type PhysicianRow = typeof physicians.$inferInsert;
