/**
 * Recipe Print Button
 * Button component to trigger recipe label printing
 * Flow: User selection → Print form dialog
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { RecipePrintDialog } from './RecipePrintDialog';
import { UserSelectionDialog } from '@/components/labels/UserSelectionDialog';

interface RecipePrintButtonProps {
  recipe: {
    id: string;
    name: string;
    shelf_life_days?: number;
    allergens?: Array<{ id: string; name: string }>;
  };
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function RecipePrintButton({ 
  recipe, 
  variant = 'default', 
  size = 'default',
  className 
}: RecipePrintButtonProps) {
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; display_name: string } | null>(null);

  const handleUserSelect = (user: { id: string; display_name: string }) => {
    setSelectedUser(user);
    setUserDialogOpen(false);
    // Open print dialog after user selection
    setPrintDialogOpen(true);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => setUserDialogOpen(true)}
      >
        <Printer className="mr-2 h-4 w-4" />
        Print Label
      </Button>

      <UserSelectionDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        onSelectUser={handleUserSelect}
        title="Who is preparing this recipe?"
        description="Select the team member preparing this item"
      />

      <RecipePrintDialog
        open={printDialogOpen}
        onOpenChange={setPrintDialogOpen}
        recipe={recipe}
        initialUser={selectedUser}
      />
    </>
  );
}
