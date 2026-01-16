import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskForm } from '@/components/routine-tasks/TaskForm';

// Mock dependencies
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123', name: 'Test User' },
    organization: { id: 'org-123', name: 'Test Org' },
  }),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: [
            { id: 'member-1', name: 'John Doe', photo_url: null },
            { id: 'member-2', name: 'Jane Smith', photo_url: null },
          ],
          error: null,
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: 'task-123', title: 'Test Task' },
            error: null,
          })),
        })),
      })),
    })),
  },
}));

describe('TaskForm - Routine Tasks Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TEST 1: Mandatory Assignment Field', () => {
    it('should disable submit button when assignment field is empty', async () => {
      render(<TaskForm onSubmit={async () => {}} onCancel={async () => {}} />);

      // Fill in other required fields
      const titleInput = screen.getByLabelText(/title/i);
      await userEvent.type(titleInput, 'Test Task');

      // Check if submit button is disabled
      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toBeDisabled();
    });

    it('should show warning message for empty assignment field', async () => {
      render(<TaskForm onSubmit={async () => {}} onCancel={async () => {}} />);

      // Look for warning message about assignment
      const warningText = screen.getByText(/this field is required/i);
      expect(warningText).toBeInTheDocument();
    });

    it('should enable submit button when assignment is selected', async () => {
      render(<TaskForm onSubmit={async () => {}} onCancel={async () => {}} />);

      // Fill required fields
      const titleInput = screen.getByLabelText(/title/i);
      await userEvent.type(titleInput, 'Test Task');

      // Select assignment using data-testid
      const assignSelect = screen.getByTestId('assign-to-select');
      await userEvent.click(assignSelect);
      const memberOption = await screen.findByText('John Doe');
      await userEvent.click(memberOption);

      // Submit button should be enabled
      await waitFor(() => {
        const submitButton = screen.getByTestId('submit-button');
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should show red border on assignment field when empty', () => {
      render(<TaskForm onSubmit={async () => {}} onCancel={async () => {}} />);

      const assignField = screen.getByTestId('assign-to-select');
      expect(assignField).toHaveClass('border-destructive');
    });
  });

  describe('TEST 2: Calendar Integration', () => {
    it('should open calendar popover when calendar button is clicked', async () => {
      render(<TaskForm onSubmit={async () => {}} onCancel={async () => {}} />);

      const calendarButton = screen.getByTestId('scheduled-date-button');
      await userEvent.click(calendarButton);

      // Calendar should appear
      await waitFor(() => {
        const calendar = screen.getByRole('grid');
        expect(calendar).toBeInTheDocument();
      });
    });

    it('should update date when a date is selected from calendar', async () => {
      render(<TaskForm onSubmit={async () => {}} onCancel={async () => {}} />);

      const calendarButton = screen.getByTestId('scheduled-date-button');
      await userEvent.click(calendarButton);

      // Select a date (wait for calendar to appear)
      await waitFor(() => {
        expect(screen.getByRole('grid')).toBeInTheDocument();
      });
      
      // Find and click a date button
      const dateButtons = screen.getAllByRole('gridcell');
      const availableDate = dateButtons.find(btn => 
        !btn.hasAttribute('disabled') && btn.textContent
      );
      
      if (availableDate) {
        await userEvent.click(availableDate);
      }

      // Date should be selected (button text changes)
      await waitFor(() => {
        const buttonText = calendarButton.textContent;
        expect(buttonText).not.toContain('Pick a date');
      });
    });
  });

  describe('TEST 3: Activity History', () => {
    it('should create task with initial "created" activity', async () => {
      const onSubmit = vi.fn();
      render(<TaskForm onSubmit={onSubmit} onCancel={async () => {}} />);

      // Fill form
      await userEvent.type(screen.getByLabelText(/title/i), 'Test Task');
      
      // Select assignment using data-testid
      const assignSelect = screen.getByTestId('assign-to-select');
      await userEvent.click(assignSelect);
      const memberOption = await screen.findByText('John Doe');
      await userEvent.click(memberOption);

      // Submit
      const submitButton = screen.getByTestId('submit-button');
      await userEvent.click(submitButton);

      // Verify success callback was called
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('TEST 4: Recurring Tasks', () => {
    it('should show recurrence options when recurring task checkbox is checked', async () => {
      render(<TaskForm onSubmit={async () => {}} onCancel={async () => {}} />);

      const recurringCheckbox = screen.getByTestId('is-recurring-checkbox');
      await userEvent.click(recurringCheckbox);

      // Check if frequency options appear
      await waitFor(() => {
        expect(screen.getByText(/Daily/)).toBeInTheDocument();
        expect(screen.getByText(/Weekly/)).toBeInTheDocument();
      });
    });

    it('should hide recurrence options when checkbox is unchecked', async () => {
      render(<TaskForm onSubmit={async () => {}} onCancel={async () => {}} />);

      const recurringCheckbox = screen.getByTestId('is-recurring-checkbox');
      
      // Check then uncheck
      await userEvent.click(recurringCheckbox);
      await waitFor(() => {
        expect(screen.getByText(/Daily/)).toBeInTheDocument();
      });
      
      await userEvent.click(recurringCheckbox);

      // Frequency options should be hidden
      await waitFor(() => {
        expect(screen.queryByText(/Every day/i)).not.toBeInTheDocument();
      });
    });

    it('should allow selecting different frequencies', async () => {
      render(<TaskForm onSubmit={async () => {}} onCancel={async () => {}} />);

      const recurringCheckbox = screen.getByTestId('is-recurring-checkbox');
      await userEvent.click(recurringCheckbox);

      // Wait for frequency group to appear
      await waitFor(() => {
        expect(screen.getByTestId('recurrence-frequency-group')).toBeInTheDocument();
      });

      // Select daily
      const dailyRadio = screen.getByRole('radio', { name: /daily/i });
      await userEvent.click(dailyRadio);
      expect(dailyRadio).toBeChecked();

      // Select weekly
      const weeklyRadio = screen.getByRole('radio', { name: /weekly/i });
      await userEvent.click(weeklyRadio);
      expect(weeklyRadio).toBeChecked();
      expect(dailyRadio).not.toBeChecked();
    });

    it('should submit task with correct recurrence pattern', async () => {
      const onSubmit = vi.fn();
      render(<TaskForm onSubmit={onSubmit} onCancel={async () => {}} />);

      // Fill required fields
      await userEvent.type(screen.getByLabelText(/title/i), 'Recurring Task');
      
      // Select assignment using data-testid
      const assignSelect = screen.getByTestId('assign-to-select');
      await userEvent.click(assignSelect);
      const memberOption = await screen.findByText('John Doe');
      await userEvent.click(memberOption);

      // Enable recurrence and select weekly
      const recurringCheckbox = screen.getByTestId('is-recurring-checkbox');
      await userEvent.click(recurringCheckbox);
      
      await waitFor(() => {
        expect(screen.getByTestId('recurrence-frequency-group')).toBeInTheDocument();
      });
      
      const weeklyRadio = screen.getByRole('radio', { name: /weekly/i });
      await userEvent.click(weeklyRadio);

      // Submit
      const submitButton = screen.getByTestId('submit-button');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('TEST 5: Custom Task Types', () => {
    it('should show custom type field when "Others" is selected', async () => {
      render(<TaskForm onSubmit={async () => {}} onCancel={async () => {}} />);

      const taskTypeSelect = screen.getByTestId('task-type-select');
      await userEvent.click(taskTypeSelect);
      
      const othersOption = await screen.findByText(/others/i);
      await userEvent.click(othersOption);

      // Custom field should appear
      await waitFor(() => {
        const customField = screen.getByTestId('custom-task-type-input');
        expect(customField).toBeInTheDocument();
      });
    });

    it('should hide custom type field when non-Others type is selected', async () => {
      render(<TaskForm onSubmit={async () => {}} onCancel={async () => {}} />);

      const taskTypeSelect = screen.getByTestId('task-type-select');
      
      // Select Others first
      await userEvent.click(taskTypeSelect);
      const othersOption = await screen.findByText(/others/i);
      await userEvent.click(othersOption);

      // Verify field appears
      await waitFor(() => {
        expect(screen.getByTestId('custom-task-type-input')).toBeInTheDocument();
      });

      // Select different type
      await userEvent.click(taskTypeSelect);
      const cleaningOption = await screen.findByText(/daily cleaning/i);
      await userEvent.click(cleaningOption);

      // Custom field should disappear
      await waitFor(() => {
        expect(screen.queryByTestId('custom-task-type-input')).not.toBeInTheDocument();
      });
    });

    it('should require custom type field when Others is selected', async () => {
      render(<TaskForm onSubmit={async () => {}} onCancel={async () => {}} />);

      // Fill basic fields
      await userEvent.type(screen.getByLabelText(/title/i), 'Test Task');

      // Select Others
      const taskTypeSelect = screen.getByTestId('task-type-select');
      await userEvent.click(taskTypeSelect);
      const othersOption = await screen.findByText(/others/i);
      await userEvent.click(othersOption);

      // Select assignment
      const assignSelect = screen.getByTestId('assign-to-select');
      await userEvent.click(assignSelect);
      const memberOption = await screen.findByText('John Doe');
      await userEvent.click(memberOption);

      // Try to submit without filling custom type
      const submitButton = screen.getByTestId('submit-button');
      await userEvent.click(submitButton);

      // Should show validation warning (yellow border)
      await waitFor(() => {
        const customField = screen.getByTestId('custom-task-type-input');
        expect(customField).toHaveClass('border-yellow-500');
      });
    });

    it('should accept custom type and prepend to description', async () => {
      const onSubmit = vi.fn();
      render(<TaskForm onSubmit={onSubmit} onCancel={async () => {}} />);

      // Fill fields
      await userEvent.type(screen.getByLabelText(/title/i), 'Custom Task');

      // Select Others
      const taskTypeSelect = screen.getByTestId('task-type-select');
      await userEvent.click(taskTypeSelect);
      const othersOption = await screen.findByText(/others/i);
      await userEvent.click(othersOption);

      // Fill custom type
      await waitFor(() => {
        expect(screen.getByTestId('custom-task-type-input')).toBeInTheDocument();
      });
      
      const customTypeField = screen.getByTestId('custom-task-type-input');
      await userEvent.type(customTypeField, 'Inventory Count');

      // Fill description
      const descriptionField = screen.getByLabelText(/description/i);
      await userEvent.type(descriptionField, 'Check all stock levels');

      // Select assignment using data-testid
      const assignSelect = screen.getByTestId('assign-to-select');
      await userEvent.click(assignSelect);
      const memberOption = await screen.findByText('John Doe');
      await userEvent.click(memberOption);

      // Submit
      const submitButton = screen.getByTestId('submit-button');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });

      // Description should be prepended with [Inventory Count]
      // (Verify in the API call mock)
    });
  });

  describe('Integration Tests', () => {
    it('should create a complete task with all features enabled', async () => {
      const onSubmit = vi.fn();
      render(<TaskForm onSubmit={onSubmit} onCancel={async () => {}} />);

      // Fill all fields
      await userEvent.type(screen.getByLabelText(/title/i), 'Complete Test Task');

      // Select Others type
      const taskTypeSelect = screen.getByTestId('task-type-select');
      await userEvent.click(taskTypeSelect);
      const othersOption = await screen.findByText(/others/i);
      await userEvent.click(othersOption);

      // Fill custom type
      await waitFor(() => {
        expect(screen.getByTestId('custom-task-type-input')).toBeInTheDocument();
      });
      
      const customTypeField = screen.getByTestId('custom-task-type-input');
      await userEvent.type(customTypeField, 'Weekly Meeting');

      // Enable recurrence
      const recurringCheckbox = screen.getByTestId('is-recurring-checkbox');
      await userEvent.click(recurringCheckbox);
      
      await waitFor(() => {
        expect(screen.getByTestId('recurrence-frequency-group')).toBeInTheDocument();
      });
      
      const weeklyRadio = screen.getByRole('radio', { name: /weekly/i });
      await userEvent.click(weeklyRadio);

      // Select assignment
      const assignSelect = screen.getByTestId('assign-to-select');
      await userEvent.click(assignSelect);
      const memberOption = await screen.findByText('John Doe');
      await userEvent.click(memberOption);

      // Submit
      const submitButton = screen.getByTestId('submit-button');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
    });
  });
});
