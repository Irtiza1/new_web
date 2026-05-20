import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ToastProvider, useToast } from '@/contexts/ToastContext';

function TestConsumer() {
    const { showToast } = useToast();
    return (
        <div>
            <button onClick={() => showToast('Success message')}>Show Success</button>
            <button onClick={() => showToast('Error message', 'error')}>Show Error</button>
        </div>
    );
}

describe('ToastContext', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders children without toast initially', () => {
        render(
            <ToastProvider>
                <span>child content</span>
            </ToastProvider>
        );
        expect(screen.getByText('child content')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('shows success toast with message', () => {
        render(
            <ToastProvider>
                <TestConsumer />
            </ToastProvider>
        );

        act(() => {
            fireEvent.click(screen.getByText('Show Success'));
        });

        expect(screen.getByRole('alert')).toHaveTextContent('Success message');
        expect(screen.getByRole('alert')).toHaveClass('bg-green-600');
    });

    it('shows error toast with red styling', () => {
        render(
            <ToastProvider>
                <TestConsumer />
            </ToastProvider>
        );

        act(() => {
            fireEvent.click(screen.getByText('Show Error'));
        });

        expect(screen.getByRole('alert')).toHaveTextContent('Error message');
        expect(screen.getByRole('alert')).toHaveClass('bg-red-600');
    });

    it('auto-dismisses toast after 3000ms', () => {
        render(
            <ToastProvider>
                <TestConsumer />
            </ToastProvider>
        );

        act(() => {
            fireEvent.click(screen.getByText('Show Success'));
        });

        expect(screen.getByRole('alert')).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(3000);
        });

        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('replaces current toast when showing a new one', () => {
        function MultiToastConsumer() {
            const { showToast } = useToast();
            return (
                <button onClick={() => {
                    showToast('First');
                    showToast('Second', 'error');
                }}>Fire Both</button>
            );
        }

        render(
            <ToastProvider>
                <MultiToastConsumer />
            </ToastProvider>
        );

        act(() => {
            fireEvent.click(screen.getByText('Fire Both'));
        });

        expect(screen.getByRole('alert')).toHaveTextContent('Second');
        expect(screen.getAllByRole('alert')).toHaveLength(1);
    });
});
