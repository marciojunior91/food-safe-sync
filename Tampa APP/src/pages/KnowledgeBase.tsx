import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Search, Plus, Star, Clock, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  is_published: boolean;
  views: number;
}

export default function KnowledgeBase() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Placeholder categories (will be from database later)
  const categories = [
    "Food Safety",
    "Equipment Operation",
    "Recipes & Procedures",
    "Health & Hygiene",
    "Emergency Procedures",
    "Allergen Management",
    "Storage Guidelines",
    "Cleaning Protocols"
  ];

  useEffect(() => {
    fetchArticles();
  }, [user]);

  useEffect(() => {
    filterArticles();
  }, [searchQuery, selectedCategory, articles]);

  const fetchArticles = async () => {
    try {
      if (!user?.id) return;

      // TODO: Create knowledge_base_articles table in Supabase
      // For now, using placeholder data
      
      const placeholderArticles: Article[] = [
        {
          id: "1",
          title: "Food Temperature Safety Guidelines",
          content: "Complete guide to safe food storage temperatures...",
          category: "Food Safety",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          author_id: user.id,
          is_published: true,
          views: 42
        },
        {
          id: "2",
          title: "How to Use the Zebra Printer",
          content: "Step-by-step guide for printing labels...",
          category: "Equipment Operation",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          author_id: user.id,
          is_published: true,
          views: 28
        },
        {
          id: "3",
          title: "Allergen Cross-Contamination Prevention",
          content: "Best practices to prevent allergen cross-contamination...",
          category: "Allergen Management",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          author_id: user.id,
          is_published: true,
          views: 35
        },
        {
          id: "4",
          title: "Deep Cleaning Procedures",
          content: "Weekly and monthly deep cleaning checklists...",
          category: "Cleaning Protocols",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          author_id: user.id,
          is_published: true,
          views: 19
        }
      ];

      setArticles(placeholderArticles);
      
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast({
        title: "Error",
        description: "Failed to load knowledge base articles",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterArticles = () => {
    let filtered = [...articles];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    setFilteredArticles(filtered);
  };

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-blue-500" />
            Knowledge Base
          </h1>
          <p className="text-muted-foreground mt-1">
            Documentation, guides, and best practices
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Article
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{articles.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {articles.reduce((sum, a) => sum + a.views, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Most Popular</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.max(...articles.map(a => a.views), 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">views</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
            >
              All Categories
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                size="sm"
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Articles Grid */}
      {filteredArticles.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No articles found</p>
              <p className="text-sm mt-1">
                {searchQuery || selectedCategory !== "all" 
                  ? "Try adjusting your search or filters"
                  : "Create your first article to get started"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article) => (
            <Card key={article.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <Badge variant="secondary">{article.category}</Badge>
                  <Button variant="ghost" size="icon">
                    <Star className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="text-lg line-clamp-2 mt-2">
                  {article.title}
                </CardTitle>
                <CardDescription className="line-clamp-3">
                  {article.content}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(article.updated_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    {article.views} views
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Coming Soon Notice */}
      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="text-blue-600 dark:text-blue-400">
            🚧 Knowledge Base - Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Full knowledge base functionality including article creation, editing, 
            categories management, and search will be available soon. Currently showing 
            placeholder data for UI preview.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
