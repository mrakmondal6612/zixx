import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Thumbnail from './Thumbnail';

describe('Thumbnail', () => {
  it('renders image and responds to click', async () => {
    const onActivate = vi.fn();
    render(<Thumbnail image="/img.jpg" index={1} isActive={false} onActivate={onActivate} />);

    const btn = screen.getByRole('button', { name: /view image 2/i });
    expect(btn).toBeInTheDocument();

    await userEvent.click(btn);
    expect(onActivate).toHaveBeenCalledWith(1);
  });

  it('has aria-pressed when active and responds to keyboard', async () => {
    const onActivate = vi.fn();
    render(<Thumbnail image="/img.jpg" index={0} isActive={true} onActivate={onActivate} />);

    const btn = screen.getByRole('button', { name: /view image 1/i });
    expect(btn).toHaveAttribute('aria-pressed', 'true');

    // keyboard activation
    btn.focus();
    await userEvent.keyboard('{Enter}');
    expect(onActivate).toHaveBeenCalledWith(0);
  });
});
