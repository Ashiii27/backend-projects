/**
 * 03 · Generics & Advanced Types — the built-in utility types plus hand-rolled
 * mapped, conditional and template-literal types.
 *
 * Guide sections covered: §19 Utility Types, §20 Mapped Types, §21 Conditional
 * Types, §22 Template Literal Types, §23 keyof & typeof, §24 Indexed Access.
 */

// ─────────────────────────────────────────────────────────────────────────────
// The source type everything below is derived from
// ─────────────────────────────────────────────────────────────────────────────

export interface Article {
  id: string;
  title: string;
  body: string;
  tags: string[];
  authorId: string;
  publishedAt: Date | null;
  views: number;
}

// ── §23 keyof & typeof ───────────────────────────────────────────────────────
export type ArticleKey = keyof Article; // "id" | "title" | "body" | ...
export const ARTICLE_KEYS = ["id", "title", "body", "tags", "authorId", "publishedAt", "views"] as const;
export type ArticleKeyFromValue = (typeof ARTICLE_KEYS)[number]; // derived from the value

// ── §24 Indexed access ───────────────────────────────────────────────────────
export type ArticleViews = Article["views"]; // number
export type ArticleIdOrTitle = Article["id" | "title"]; // string
export type ArticleValues = Article[keyof Article]; // union of every value type

// ─────────────────────────────────────────────────────────────────────────────
// §19 Built-in utility types
// ─────────────────────────────────────────────────────────────────────────────

export type ArticleDraft = Partial<Article>; // every property optional
export type FrozenArticle = Readonly<Article>; // every property readonly
export type ArticleSummary = Pick<Article, "id" | "title" | "views">;
export type ArticleWithoutBody = Omit<Article, "body">;
export type ById = Record<string, Article>;
export type NonNullablePublishedAt = NonNullable<Article["publishedAt"]>; // Date
export type TitleOrNull = Article["publishedAt"] extends null ? never : string;

/** Only the keys whose value is a string. */
export type StringKeys<T> = {
  [K in keyof T]: T[K] extends string ? K : never;
}[keyof T];

export type ArticleStringKeys = StringKeys<Article>; // "id" | "title" | "body" | "authorId"

/**
 * Every field of `ArticleDraft` is optional (it is `Partial<Article>`), so each
 * one falls back to a sensible default — this is what `Partial` is for.
 * Function-introspection utilities (§19) derive types *from* this signature.
 */
export function createArticle(draft: ArticleDraft, authorId: string): Article {
  return {
    id: draft.id ?? crypto.randomUUID(),
    title: draft.title ?? "untitled",
    body: draft.body ?? "",
    tags: draft.tags ?? [],
    authorId,
    publishedAt: draft.publishedAt ?? null,
    views: draft.views ?? 0,
  };
}

export type CreateArticleParams = Parameters<typeof createArticle>;
export type CreateArticleReturn = ReturnType<typeof createArticle>;
export type CreateArticleArity = CreateArticleParams["length"]; // 2

// ─────────────────────────────────────────────────────────────────────────────
// §20 Mapped types (with key remapping via `as`)
// ─────────────────────────────────────────────────────────────────────────────

/** Every property optional, all the way down. */
export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

/** Every property readonly, all the way down. */
export type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

/** Strip `readonly` back off. */
export type Mutable<T> = {
  -readonly [K in keyof T]: T[K];
};

/** Key remapping: build a getter name for every property. */
export type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

/** Key remapping + filtering: keep only the string-valued keys. */
export type OnlyStrings<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};

/** Rename keys: drop a prefix from each one. */
export type StripPrefix<T, P extends string> = {
  [K in keyof T as K extends `${P}${infer Rest}` ? Rest : K]: T[K];
};

export type ArticleGetters = Getters<Pick<Article, "id" | "views">>;
export type ArticleStringsOnly = OnlyStrings<Article>;
export type Stripped = StripPrefix<{ db_host: string; db_port: number }, "db_">;

// ─────────────────────────────────────────────────────────────────────────────
// §21 Conditional types
// ─────────────────────────────────────────────────────────────────────────────

export type IsString<T> = T extends string ? true : false;
export type NonNullish<T> = T extends null | undefined ? never : T;

/**
 * Conditional types *distribute* over naked type parameters: `IsString<"a" | 1>`
 * becomes `IsString<"a"> | IsString<1>` = `true | false` = `boolean`.
 * Wrapping both sides in a tuple switches distribution off.
 */
export type IsStringDistributed<T> = T extends string ? true : false;
export type IsStringNotDistributed<T> = [T] extends [string] ? true : false;

type A = IsStringDistributed<"a" | 1>; // boolean
type B = IsStringNotDistributed<"a" | 1>; // false

export const distributed: A = true;
export const notDistributed: B = false;

// ─────────────────────────────────────────────────────────────────────────────
// §22 Template literal types
// ─────────────────────────────────────────────────────────────────────────────

type CssUnit = "px" | "rem" | "%";
export type CssLength = `${number}${CssUnit}`;

export const goodLength: CssLength = "12px";
export const goodRem: CssLength = "1.5rem";

/** Intrinsic string manipulation types: Uppercase / Lowercase / Capitalize / Uncapitalize. */
export type Shout<T extends string> = Uppercase<T>;

/** Build event handler names from a union of event names. */
type AppEvent = "click" | "focus" | "blur";
export type AppEventHandler = `on${Capitalize<AppEvent>}`; // "onClick" | "onFocus" | "onBlur"

/**
 * Extract `:param` segments from a route pattern. This is the same technique
 * used by project 06's router.
 */
export type ExtractRouteParams<Path extends string> =
  Path extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractRouteParams<`/${Rest}`>
    : Path extends `${string}:${infer Param}`
      ? Param
      : never;

export type UserRouteParams = ExtractRouteParams<"/users/:userId/posts/:postId">;
export type NoParams = ExtractRouteParams<"/health">; // never

/** Values for those params, derived from the extracted union. */
export type RouteParams<Path extends string> = Record<ExtractRouteParams<Path>, string>;

export const userRouteParams: RouteParams<"/users/:userId/posts/:postId"> = {
  userId: "u1",
  postId: "p1",
};

export type _Checks = [A, B, UserRouteParams, NoParams, ArticleKeyFromValue, TitleOrNull];
