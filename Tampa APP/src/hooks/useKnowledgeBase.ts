// Knowledge Base data hooks.
//
// One hook per concern so the page + editor can mix them without prop-drilling:
//   - useArticleCategories  → list categories (admin can mutate)
//   - useArticles           → list articles (filtered by category + search)
//   - useArticleBySlug      → fetch a single article (used by the reader page)
//   - useArticleMutations   → create / update / delete (admin gated by RLS)

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganizationId } from './useUserContext';

export interface KbCategory {
  id: string;
  name: string;
  icon: string | null;
  sort_order: number;
}

export interface KbArticle {
  id: string;
  organization_id: string;
  category_id: string | null;
  author_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  is_published: boolean;
  views: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  category?: KbCategory | null;
}

// ── Categories ────────────────────────────────────────────────────────────
export function useArticleCategories(): {
  categories: KbCategory[];
  loading: boolean;
  refetch: () => Promise<void>;
} {
  const { organizationId } = useOrganizationId();
  const [categories, setCategories] = useState<KbCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    const { data } = await supabase
      .from('knowledge_base_categories')
      .select('id, name, icon, sort_order')
      .eq('organization_id', organizationId)
      .order('sort_order', { ascending: true });
    setCategories((data as KbCategory[]) || []);
    setLoading(false);
  }, [organizationId]);

  useEffect(() => { void refetch(); }, [refetch]);

  return { categories, loading, refetch };
}

// ── Articles list ─────────────────────────────────────────────────────────
export function useArticles(opts: {
  categoryId?: string;
  search?: string;
  includeDrafts?: boolean;
}): {
  articles: KbArticle[];
  loading: boolean;
  refetch: () => Promise<void>;
} {
  const { organizationId } = useOrganizationId();
  const [articles, setArticles] = useState<KbArticle[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);

    let query = supabase
      .from('knowledge_base_articles')
      .select(`
        id, organization_id, category_id, author_id, title, slug, excerpt,
        content, is_published, views, created_at, updated_at, published_at,
        category:knowledge_base_categories(id, name, icon, sort_order)
      `)
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false });

    if (!opts.includeDrafts) {
      query = query.eq('is_published', true);
    }
    if (opts.categoryId && opts.categoryId !== 'all') {
      query = query.eq('category_id', opts.categoryId);
    }

    const { data } = await query;

    let rows = (data as unknown as KbArticle[]) || [];
    // Search filter (client-side: small dataset, no FTS yet).
    if (opts.search?.trim()) {
      const q = opts.search.trim().toLowerCase();
      rows = rows.filter(
        a =>
          a.title.toLowerCase().includes(q) ||
          (a.excerpt && a.excerpt.toLowerCase().includes(q)) ||
          a.content.toLowerCase().includes(q),
      );
    }
    setArticles(rows);
    setLoading(false);
  }, [organizationId, opts.categoryId, opts.search, opts.includeDrafts]);

  useEffect(() => { void refetch(); }, [refetch]);

  return { articles, loading, refetch };
}

// ── Single article by slug ────────────────────────────────────────────────
export function useArticleBySlug(slug: string | undefined): {
  article: KbArticle | null;
  loading: boolean;
  notFound: boolean;
} {
  const { organizationId } = useOrganizationId();
  const [article, setArticle] = useState<KbArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!organizationId || !slug) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setNotFound(false);
      const { data, error } = await supabase
        .from('knowledge_base_articles')
        .select(`
          id, organization_id, category_id, author_id, title, slug, excerpt,
          content, is_published, views, created_at, updated_at, published_at,
          category:knowledge_base_categories(id, name, icon, sort_order)
        `)
        .eq('organization_id', organizationId)
        .eq('slug', slug)
        .maybeSingle();
      if (cancelled) return;
      if (error || !data) {
        setNotFound(true);
        setArticle(null);
      } else {
        setArticle(data as unknown as KbArticle);
        // Bump view count, once per session per article.
        const seenKey = `kb_view_${data.id}`;
        if (!sessionStorage.getItem(seenKey)) {
          sessionStorage.setItem(seenKey, '1');
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase.rpc as any)('increment_kb_article_view', { article_id: data.id }).then(() => {});
        }
      }
      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [organizationId, slug]);

  return { article, loading, notFound };
}

// ── Mutations ─────────────────────────────────────────────────────────────
export interface ArticleInput {
  title: string;
  slug: string;
  category_id: string | null;
  excerpt: string;
  content: string;
  is_published: boolean;
}

export function useArticleMutations() {
  const { organizationId } = useOrganizationId();

  const createArticle = useCallback(async (input: ArticleInput): Promise<KbArticle | null> => {
    if (!organizationId) return null;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('knowledge_base_articles')
      .insert({
        organization_id: organizationId,
        author_id: user.id,
        title: input.title,
        slug: input.slug,
        category_id: input.category_id,
        excerpt: input.excerpt || null,
        content: input.content,
        is_published: input.is_published,
        published_at: input.is_published ? new Date().toISOString() : null,
      })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as KbArticle;
  }, [organizationId]);

  const updateArticle = useCallback(async (
    id: string,
    input: Partial<ArticleInput>,
  ): Promise<KbArticle | null> => {
    const { data, error } = await supabase
      .from('knowledge_base_articles')
      .update({
        ...input,
        excerpt: input.excerpt === undefined ? undefined : (input.excerpt || null),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as KbArticle;
  }, []);

  const deleteArticle = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('knowledge_base_articles')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }, []);

  const createCategory = useCallback(async (
    name: string, icon?: string, sort_order?: number,
  ): Promise<KbCategory | null> => {
    if (!organizationId) return null;
    const { data, error } = await supabase
      .from('knowledge_base_categories')
      .insert({
        organization_id: organizationId,
        name,
        icon: icon || null,
        sort_order: sort_order ?? 100,
      })
      .select()
      .single();
    if (error) throw error;
    return data as KbCategory;
  }, [organizationId]);

  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('knowledge_base_categories')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }, []);

  return { createArticle, updateArticle, deleteArticle, createCategory, deleteCategory };
}

// ── Slug helper ───────────────────────────────────────────────────────────
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
