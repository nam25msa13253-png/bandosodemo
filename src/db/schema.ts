/**
 * ============================================================
 *  CSDL Bản đồ số – Tra cứu tiện ích cấp phường (PostgreSQL)
 *  Sửa các lỗi thiết kế của web gốc:
 *   - Mọi cơ sở có ID riêng + slug duy nhất (web gốc sinh slug từ tên -> trùng)
 *   - SĐT là mảng (web gốc dính 2 số vào 1 ô)
 *   - Dân số / số hộ là số nguyên
 *   - Trạng thái xác minh là trường thật, không gắn nhãn tùy tiện
 *   - Có nhật ký thay đổi và hàng chờ đóng góp của người dân
 * ============================================================
 */
import {
  pgTable, pgEnum, text, integer, serial, boolean, timestamp, doublePrecision, jsonb, index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date());

export const placeStatus = pgEnum("place_status", ["ACTIVE", "INACTIVE", "HIDDEN"]);
export const role = pgEnum("role", ["ADMIN", "VILLAGE"]);
export const submissionType = pgEnum("submission_type", [
  "NEW_PLACE", "WRONG_PHONE", "WRONG_HOURS", "WRONG_LOCATION", "CLOSED", "OTHER",
]);
export const submissionStatus = pgEnum("submission_status", ["PENDING", "ACCEPTED", "REJECTED"]);

/** Lĩnh vực dịch vụ */
export const sectors = pgTable("sectors", {
  id: text("id").primaryKey(), // mã snake_case
  name: text("name").notNull(),
  icon: text("icon").notNull().default("LayoutGrid"), // tên icon lucide-react
  color: text("color").notNull().default("#64748B"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** Tổ dân phố */
export const villages = pgTable("villages", {
  id: serial("id").primaryKey(),
  code: integer("code").notNull().unique(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  mergedFrom: text("merged_from"),
  areaHa: doublePrecision("area_ha"),
  population: integer("population"),
  households: integer("households"),
  secretaryName: text("secretary_name"), // Bí thư chi bộ
  secretaryPhone: text("secretary_phone"),
  leaderName: text("leader_name"), // Tổ trưởng
  leaderPhone: text("leader_phone"),
  frontHeadName: text("front_head_name"), // Trưởng ban CTMT
  frontHeadPhone: text("front_head_phone"),
  note: text("note"),
  locationUrl: text("location_url"),
  images: text("images").array().notNull().default([]),
  /** Ranh giới trên ảnh bản đồ hành chính: [[x%, y%], ...] */
  polygon: jsonb("polygon").$type<[number, number][] | null>(),
  searchText: text("search_text").notNull().default(""),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** Cơ sở dịch vụ / tiện ích */
export const places = pgTable(
  "places",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    sectorId: text("sector_id").notNull().references(() => sectors.id),
    villageId: integer("village_id").references(() => villages.id, { onDelete: "set null" }),
    phones: text("phones").array().notNull().default([]),
    openingHours: text("opening_hours"),
    address: text("address"),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    locationUrl: text("location_url"),
    description: text("description"),
    images: text("images").array().notNull().default([]),
    website: text("website"),
    verified: boolean("verified").notNull().default(false),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    status: placeStatus("status").notNull().default("ACTIVE"),
    featured: boolean("featured").notNull().default(false),
    /** Chuỗi không dấu phục vụ tìm kiếm – tự sinh khi lưu */
    searchText: text("search_text").notNull().default(""),
    viewCount: integer("view_count").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("places_sector_idx").on(t.sectorId), index("places_village_idx").on(t.villageId)],
);

/** Slug cũ -> cơ sở (giữ QR/link đã in không bị chết) */
export const slugRedirects = pgTable("slug_redirects", {
  fromSlug: text("from_slug").primaryKey(),
  placeId: text("place_id").notNull().references(() => places.id, { onDelete: "cascade" }),
});

/** Sự kiện sử dụng: view | call | direction | share (không lưu danh tính) */
export const placeEvents = pgTable(
  "place_events",
  {
    id: serial("id").primaryKey(),
    placeId: text("place_id").notNull().references(() => places.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("events_place_idx").on(t.placeId, t.type), index("events_time_idx").on(t.createdAt)],
);

/** Thông báo */
export const announcements = pgTable("announcements", {
  id: id(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  summary: text("summary"),
  content: text("content").notNull(),
  villageId: integer("village_id").references(() => villages.id, { onDelete: "set null" }), // null = toàn phường
  pinned: boolean("pinned").notNull().default(false),
  published: boolean("published").notNull().default(true),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  authorId: text("author_id"),
  searchText: text("search_text").notNull().default(""),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** Đề xuất cơ sở mới / báo sai thông tin */
export const submissions = pgTable(
  "submissions",
  {
    id: id(),
    type: submissionType("type").notNull(),
    placeId: text("place_id").references(() => places.id, { onDelete: "set null" }),
    name: text("name"),
    sectorId: text("sector_id"),
    phone: text("phone"),
    address: text("address"),
    content: text("content").notNull(),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    contactName: text("contact_name"),
    contactPhone: text("contact_phone"),
    status: submissionStatus("status").notNull().default("PENDING"),
    handledById: text("handled_by_id"),
    handledAt: timestamp("handled_at", { withTimezone: true }),
    handlerNote: text("handler_note"),
    ipHash: text("ip_hash"),
    createdAt: createdAt(),
  },
  (t) => [index("submissions_status_idx").on(t.status)],
);

/** Cơ quan, đơn vị */
export const agencies = pgTable("agencies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"),
  locationUrl: text("location_url"),
  phone: text("phone"),
  sortOrder: integer("sort_order").notNull().default(0),
});

/** Số khẩn cấp */
export const emergencyContacts = pgTable("emergency_contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  color: text("color"),
  sortOrder: integer("sort_order").notNull().default(0),
});

/** Cấu hình khóa – giá trị */
export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: updatedAt(),
});

export const users = pgTable("users", {
  id: id(),
  username: text("username").notNull().unique(),
  fullName: text("full_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: role("role").notNull().default("VILLAGE"),
  villageId: integer("village_id").references(() => villages.id, { onDelete: "set null" }),
  active: boolean("active").notNull().default(true),
  failedLogins: integer("failed_logins").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: createdAt(),
});

/** Nhật ký thay đổi */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
    username: text("username"),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    summary: text("summary"),
    before: jsonb("before"),
    after: jsonb("after"),
    createdAt: createdAt(),
  },
  (t) => [index("audit_time_idx").on(t.createdAt)],
);

// ---------- Quan hệ (dùng cho db.query) ----------
export const sectorsRelations = relations(sectors, ({ many }) => ({ places: many(places) }));
export const villagesRelations = relations(villages, ({ many }) => ({
  places: many(places),
  announcements: many(announcements),
}));
export const placesRelations = relations(places, ({ one, many }) => ({
  sector: one(sectors, { fields: [places.sectorId], references: [sectors.id] }),
  village: one(villages, { fields: [places.villageId], references: [villages.id] }),
  events: many(placeEvents),
}));
export const announcementsRelations = relations(announcements, ({ one }) => ({
  village: one(villages, { fields: [announcements.villageId], references: [villages.id] }),
}));
export const submissionsRelations = relations(submissions, ({ one }) => ({
  place: one(places, { fields: [submissions.placeId], references: [places.id] }),
}));
export const usersRelations = relations(users, ({ one }) => ({
  village: one(villages, { fields: [users.villageId], references: [villages.id] }),
}));

export type Sector = typeof sectors.$inferSelect;
export type Village = typeof villages.$inferSelect;
export type Place = typeof places.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
export type User = typeof users.$inferSelect;
