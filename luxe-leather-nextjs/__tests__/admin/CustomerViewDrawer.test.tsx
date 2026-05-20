import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CustomerViewDrawer from '@/components/admin/CustomerViewDrawer';

const mockCustomer = {
    id: 'abc-123',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1 555-0123',
    address: '123 Main St',
    city: 'New York',
    country: 'USA',
    createdAt: '2025-06-15T10:00:00Z',
    updatedAt: '2025-06-15T10:00:00Z',
    ordersCount: 5,
    totalSpent: 749.95,
};

describe('CustomerViewDrawer', () => {
    it('renders customer name and email', () => {
        render(<CustomerViewDrawer customer={mockCustomer} onClose={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getAllByText('jane@example.com').length).toBeGreaterThanOrEqual(1);
    });

    it('renders phone number', () => {
        render(<CustomerViewDrawer customer={mockCustomer} onClose={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
        expect(screen.getByText('+1 555-0123')).toBeInTheDocument();
    });

    it('renders location', () => {
        render(<CustomerViewDrawer customer={mockCustomer} onClose={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
        expect(screen.getByText('New York, USA')).toBeInTheDocument();
    });

    it('renders order stats', () => {
        render(<CustomerViewDrawer customer={mockCustomer} onClose={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('$749.95')).toBeInTheDocument();
    });

    it('calls onClose when close button clicked', () => {
        const onClose = vi.fn();
        render(<CustomerViewDrawer customer={mockCustomer} onClose={onClose} onEdit={vi.fn()} onDelete={vi.fn()} />);
        fireEvent.click(screen.getByLabelText('Close drawer'));
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('calls onEdit when edit button clicked', () => {
        const onEdit = vi.fn();
        render(<CustomerViewDrawer customer={mockCustomer} onClose={vi.fn()} onEdit={onEdit} onDelete={vi.fn()} />);
        fireEvent.click(screen.getByText('Edit Customer'));
        expect(onEdit).toHaveBeenCalledOnce();
    });

    it('calls onDelete when delete button clicked', () => {
        const onDelete = vi.fn();
        render(<CustomerViewDrawer customer={mockCustomer} onClose={vi.fn()} onEdit={vi.fn()} onDelete={onDelete} />);
        fireEvent.click(screen.getByText('Delete Customer'));
        expect(onDelete).toHaveBeenCalledOnce();
    });

    it('shows dash for missing location', () => {
        const noLocation = { ...mockCustomer, city: null, country: null };
        render(<CustomerViewDrawer customer={noLocation} onClose={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} />);
        expect(screen.getByText('—')).toBeInTheDocument();
    });
});
