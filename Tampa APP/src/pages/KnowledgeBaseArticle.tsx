// Knowledge Base article reader. URL: /knowledge-base/article/:slug
//
// Renders the markdown body of a single article. Bumps the article's view
// counter once per session via the RPC defined in the migration. Admins get
// an edit affordance in the header.

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ArrowLeft, BookOpen, Edit, Eye, Clock, Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useArticleBySlug, useArticleCategories } from '@/hooks/useKnowledgeBase';
import { useUserRole } from '@/hooks/useUserRole';
import { ArticleEditorDialog } from '@/components/knowledge/ArticleEditorDialog';

export default function KnowledgeBaseArticle() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { article, loading, notFound } = useArticleBySlug(slug);
  const { categories } = useArticleCategories();
  const { isAdmin } = useUserRole();
  const [editorOpen, setEditorOpen] = useState(false);

  if (loading) {
    return (
      <div className="p-6 md:p-8 flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h1 className="text-2xl font-bold">Article not found</h1>
        <p className="text-muted-foreground mt-2">
          It may have been deleted or unpublished.
        </p>
        <Button
          variant="outline"
          className="mt-6 gap-2"
          onClick={() => navigate('/knowledge-base')}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Knowledge Base
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 -ml-2"
          onClick={() => navigate('/knowledge-base')}
        >
          <ArrowLeft className="h-4 w-4" /> All articles
        </Button>
        {isAdmin && (
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditorOpen(true)}>
            <Edit className="h-4 w-4" /> Edit
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
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
        <h1 className="text-3xl font-bold tracking-tight">{article.title}</h1>
        {article.excerpt && (
          <p className="text-lg text-muted-foreground">{article.excerpt}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Updated {format(new Date(article.updated_at), 'MMM d, yyyy')}
          </div>
          <div className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {article.views} {article.views === 1 ? 'view' : 'views'}
          </div>
        </div>
      </div>

      <article className="prose dark:prose-invert max-w-none prose-headings:scroll-mt-20">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content}</ReactMarkdown>
      </article>

      <ArticleEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        article={article}
        categories={categories}
        onSaved={() => {
          // Refresh by navigating to the (possibly new) slug — author may have changed it.
          setEditorOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
}
