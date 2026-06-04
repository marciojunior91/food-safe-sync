// Admin-only article editor. Used by the Knowledge Base page to create a new
// article or edit an existing one. Renders a markdown source editor on the left
// and a live preview on the right (collapses to single column on mobile).

import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  slugify,
  useArticleMutations,
  type ArticleInput,
  type KbArticle,
  type KbCategory,
} from '@/hooks/useKnowledgeBase';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  article?: KbArticle | null;
  categories: KbCategory[];
  onSaved: () => void;
}

const NONE_CATEGORY = '__none__';

export function ArticleEditorDialog({
  open, onOpenChange, article, categories, onSaved,
}: Props) {
  const { toast } = useToast();
  const { createArticle, updateArticle, deleteArticle } = useArticleMutations();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [categoryId, setCategoryId] = useState<string>(NONE_CATEGORY);
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isEditing = !!article;

  // Reset form whenever a new article (or "new article") is loaded.
  useEffect(() => {
    if (!open) return;
    setTitle(article?.title ?? '');
    setSlug(article?.slug ?? '');
    setSlugTouched(!!article);
    setCategoryId(article?.category_id ?? NONE_CATEGORY);
    setExcerpt(article?.excerpt ?? '');
    setContent(article?.content ?? '');
    setIsPublished(article?.is_published ?? false);
  }, [open, article]);

  // Auto-derive slug from title until the user touches the slug field.
  useEffect(() => {
    if (!slugTouched && !isEditing) setSlug(slugify(title));
  }, [title, slugTouched, isEditing]);

  const canSave = useMemo(
    () => title.trim().length > 0 && slug.trim().length > 0 && content.trim().length > 0,
    [title, slug, content],
  );

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const input: ArticleInput = {
        title: title.trim(),
        slug: slug.trim(),
        category_id: categoryId === NONE_CATEGORY ? null : categoryId,
        excerpt,
        content,
        is_published: isPublished,
      };
      if (isEditing && article) await updateArticle(article.id, input);
      else await createArticle(input);
      toast({
        title: isEditing ? 'Article updated' : 'Article created',
        description: title,
      });
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast({
        title: 'Save failed',
        description: e instanceof Error ? e.message : String(e),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!article) return;
    if (!confirm(`Delete "${article.title}"? This can't be undone.`)) return;
    setDeleting(true);
    try {
      await deleteArticle(article.id);
      toast({ title: 'Article deleted', description: article.title });
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast({
        title: 'Delete failed',
        description: e instanceof Error ? e.message : String(e),
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Article' : 'New Article'}</DialogTitle>
          <DialogDescription>
            Articles are visible to everyone in your organisation when published.
            Drafts are visible only to admins.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: form */}
          <div className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Allergen Cross-Contamination Prevention"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="slug">URL slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={e => { setSlug(e.target.value); setSlugTouched(true); }}
                placeholder="allergen-cross-contamination-prevention"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger id="category"><SelectValue placeholder="Uncategorised" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_CATEGORY}>Uncategorised</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.icon ? `${c.icon} ${c.name}` : c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="excerpt">Excerpt (short summary)</Label>
              <Textarea
                id="excerpt"
                value={excerpt}
                onChange={e => setExcerpt(e.target.value)}
                rows={2}
                placeholder="One sentence shown on the card."
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="content">Content (Markdown)</Label>
              <Textarea
                id="content"
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={14}
                className="font-mono text-sm"
                placeholder={'# Heading\n\nWrite the body of the article here using Markdown.'}
              />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <Switch id="publish" checked={isPublished} onCheckedChange={setIsPublished} />
              <Label htmlFor="publish" className="cursor-pointer">
                {isPublished ? 'Published — visible to everyone' : 'Draft — admins only'}
              </Label>
            </div>
          </div>

          {/* Right: live preview */}
          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="border rounded-lg p-4 bg-muted/20 prose dark:prose-invert max-w-none prose-sm overflow-auto max-h-[600px]">
              <h1 className="!mt-0">{title || 'Untitled'}</h1>
              {excerpt && <p className="text-muted-foreground !mt-0">{excerpt}</p>}
              {content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              ) : (
                <p className="text-muted-foreground">Markdown preview will appear here.</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-between">
          <div>
            {isEditing && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting || saving}
                className="gap-2"
              >
                {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!canSave || saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isEditing ? 'Save changes' : 'Create article'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
