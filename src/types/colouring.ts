export type AnimationType = "wagTail" | "bounce" | "spin" | "pulse" | "float";

export interface AnimatableElement {
  id: string;
  /** X position of the sprite region (canvas coordinates) */
  x: number;
  /** Y position of the sprite region (canvas coordinates) */
  y: number;
  /** Width of the sprite region */
  w: number;
  /** Height of the sprite region */
  h: number;
  animation: AnimationType;
}

export interface AnimatableElementsConfig {
  version: 1;
  /** Canvas dimensions these coordinates were authored at */
  canvasWidth: number;
  canvasHeight: number;
  elements: AnimatableElement[];
}

export interface PointerPoint {
  x: number;
  y: number;
  pressure: number;
}

export interface BrushOptions {
  color: number; // PixiJS colour integer (0xRRGGBB)
  baseWidth: number;
  opacity: number;
}

export interface ChildProfile {
  id: string;
  parentId: string;
  name: string;
  avatarColour: string;
  createdAt: string;
}

export interface SavedPage {
  id: string;
  childId: string;
  pageId: string;
  colouredImageUrl: string | null;
  fillPercentage: number;
  completedAt: string | null;
  updatedAt: string;
}

export interface BookWithPages {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  priceDigitalCents: number;
  pricePhysicalCents: number;
  pageCount: number;
  pages?: PageConfig[];
}

export interface PageConfig {
  id: string;
  bookId: string;
  pageNumber: number;
  outlineUrl: string;
  animatableElementsUrl: string;
  completionThreshold: number;
}

// ─── Studio / authoring types ────────────────────────────────

export interface AuthoredBook {
  id: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  isPublic: boolean;
  status: "draft" | "published";
  authorId: string;
  slug: string | null;
  pageCount: number;
  createdAt: string;
  pages?: StudioPage[];
}

export interface StudioPage {
  id: string;
  bookId: string;
  pageNumber: number;
  outlineUrl: string;
  animatableElementsUrl: string;
  completionThreshold: number;
  pageTitle: string | null;
}
