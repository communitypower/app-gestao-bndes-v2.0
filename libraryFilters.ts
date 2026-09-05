export type LibraryFilters = {
  search?: string;
  theme?: string;
  sectionId?: number;
};

export function normalizeLibraryFilters(filters?: LibraryFilters) {
  const search = filters?.search?.trim() || undefined;
  const theme = filters?.theme?.trim() || undefined;
  const sectionId =
    filters?.sectionId && filters.sectionId > 0
      ? Math.trunc(filters.sectionId)
      : undefined;
  return { search, theme, sectionId };
}
