/**
 * Migration Applicator Component
 * Temporarily add this to your app to apply migrations
 * Usage: Add <ApplyRecipeSubcategoryMigration /> to a page, click the button
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export function ApplyRecipeSubcategoryMigration() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [results, setResults] = useState<any>(null);

  const applyMigration = async () => {
    setStatus('loading');
    setMessage('Applying migration...');
    
    try {
      // Step 1: Create "Prepared Foods" category
      const { data: existingCategory } = await supabase
        .from('label_categories')
        .select('id, name')
        .eq('name', 'Prepared Foods')
        .single();

      let categoryId: string;

      if (existingCategory) {
        categoryId = existingCategory.id;
        setMessage('✅ Category "Prepared Foods" already exists');
      } else {
        const { data: newCategory, error: catError } = await supabase
          .from('label_categories')
          .insert({
            name: 'Prepared Foods',
            icon: '🍽️',
          })
          .select()
          .single();

        if (catError) throw catError;
        categoryId = newCategory.id;
        setMessage('✅ Created category "Prepared Foods"');
      }

      // Step 2: Create "Recipes" subcategory
      const { data: existingSubcategory } = await supabase
        .from('label_subcategories')
        .select('id, name')
        .eq('category_id', categoryId)
        .eq('name', 'Recipes')
        .single();

      if (existingSubcategory) {
        setMessage('✅ Subcategory "Recipes" already exists');
      } else {
        const { data: newSubcategory, error: subError } = await supabase
          .from('label_subcategories')
          .insert({
            category_id: categoryId,
            name: 'Recipes',
            icon: '👨‍🍳',
            display_order: 1
          })
          .select()
          .single();

        if (subError) throw subError;
        setMessage('✅ Created subcategory "Recipes"');
      }

      // Step 3: Verify the setup
      const { data: verification, error: verifyError } = await supabase
        .from('label_categories')
        .select(`
          id,
          name,
          icon,
          label_subcategories (
            id,
            name,
            icon
          )
        `)
        .eq('name', 'Prepared Foods')
        .single();

      if (verifyError) throw verifyError;

      setResults(verification);
      setStatus('success');
      setMessage('🎉 Migration applied successfully!');

    } catch (error: any) {
      console.error('Migration error:', error);
      setStatus('error');
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Apply Recipe Subcategory Migration</CardTitle>
        <CardDescription>
          Creates "Prepared Foods" category and "Recipes" subcategory
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={applyMigration}
          disabled={status === 'loading'}
          className="w-full"
        >
          {status === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {status === 'loading' ? 'Applying Migration...' : 'Apply Migration'}
        </Button>

        {message && (
          <Alert variant={status === 'error' ? 'destructive' : 'default'}>
            {status === 'success' && <CheckCircle2 className="h-4 w-4" />}
            {status === 'error' && <XCircle className="h-4 w-4" />}
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {results && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Migration Results:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}

        {status === 'success' && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <strong>Next Steps:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Update TypeScript types: <code className="text-xs bg-background px-1 py-0.5 rounded">npm run update-types</code></li>
                <li>Remove this component from your app</li>
                <li>Start using the new subcategory in label forms</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
