// Knowledge Base index page. Lists articles for the current org, filterable
// by category + search. Admins get full CRUD via the editor dialog; staff
// see a read-only view that links to the per-article reader page.

import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen, Search, Plus, Clock, Eye, Edit, Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { useUserRole } from '@/hooks/useUserRole';
import {
  useArticleCategories,
  useArticles,
  type KbArticle,
} from '@/hooks/useKnowledgeBase';
import { ArticleEditorDialog } from '@/components/knowledge/ArticleEditorDialog';

export default function KnowledgeBase() {
  const navigate = useNavigate();
  const { isAdmin } = useUserRole();
  const { categories } = useArticleCategories();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KbArticle | null>(null);

  const { articles, loading, refetch } = useArticles({
    categoryId: selectedCategory,
    search,
    includeDrafts: isAdmin,
  });

  // Stats are computed off whatever the user can see (admins see drafts too).
  const stats = useMemo(() => {
    const total = articles.length;
    const totalViews = articles.reduce((s, a) => s + a.views, 0);
    const mostPopular = articles.reduce((max, a) => (a.views > max ? a.views : max), 0);
    return { total, totalViews, mostPopular };
  }, [articles]);

  const handleNew = () => {
    setEditingArticle(null);
    setEditorOpen(true);
  };

  const handleEdit = (article: KbArticle, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingArticle(article);
    setEditorOpen(true);
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-blue-500" />
            Knowledge Base
          </h1>
          <p className="text-muted-foreground mt-1">
            Documentation, guides, and best practices for your team.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleNew} className="gap-2">
            <Plus className="h-4 w-4" /> New Article
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard label={isAdmin ? 'Articles + Drafts' : 'Published Articles'} value={stats.total} />
        <StatCard label="Categories" value={categories.length} />
        <StatCard label="Total Views" value={stats.totalViews} />
        <StatCard label="Most Popular" value={stats.mostPopular} hint="views" />
      </div>

      {/* Search + categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search &amp; Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search articles…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 -mb-1">
            <Button
              size="sm"
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedCategory('all')}
              className="flex-shrink-0"
            >
              All
            </Button>
            {categories.map(c => (
              <Button
                key={c.id}
                size="sm"
                variant={selectedCategory === c.id ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(c.id)}
                className="flex-shrink-0 gap-1"
              >
                {c.icon && <span>{c.icon}</span>}
                {c.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Articles grid */}
      {loading ? (
        <Card>
          <CardContent className="py-12 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : articles.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No articles found</p>
              <p className="text-sm mt-1">
                {search || selectedCategory !== 'all'
                  ? 'Try adjusting your search or filters.'
                  : isAdmin
                  ? 'Create your first article to get started.'
                  : 'Your admin hasn\'t published any articles yet.'}
              </p>
              {isAdmin && !search && selectedCategory === 'all' && (
                <Button onClick={handleNew} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" /> Create first article
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articles.map(article => (
            <Card
              key={article.id}
              className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col"
              onClick={() => navigate(`/knowledge-base/article/${article.slug}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap gap-1">
                    {article.category && (
                      <Badge variant="secondary" className="gap-1">
                        {article.category.icon && <span>{article.category.icon}</span>}
                        {article.category.name}
                      </Badge>
                    )}
                    {!article.is_published && (
                      <Badge variant="outline" className="text-amber-600 border-amber-200">
                        Draft
                      </Badge>
                    )}
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0"
                      onClick={e => handleEdit(article, e)}
                      aria-label="Edit article"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <CardTitle className="text-lg line-clamp-2 mt-2">{article.title}</CardTitle>
                {article.excerpt && (
                  <CardDescription className="line-clamp-3 mt-1">
                    {article.excerpt}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="mt-auto">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(article.updated_at), 'MMM d, yyyy')}
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {article.views}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isAdmin && (
        <ArticleEditorDialog
          open={editorOpen}
          onOpenChange={setEditorOpen}
          article={editingArticle}
          categories={categories}
          onSaved={refetch}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}
