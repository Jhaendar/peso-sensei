import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './button';

describe('Button component', () => {
  it('renders with default props', () => {
    render(<Button>Click Me</Button>);
    const buttonElement = screen.getByRole('button', { name: /Click Me/i });
    expect(buttonElement).toBeInTheDocument();
    // Default variant is 'default', default size is 'default'
    // Check for classes associated with these defaults (can be brittle, but useful)
    expect(buttonElement).toHaveClass('bg-primary');
    expect(buttonElement).toHaveClass('h-10'); // Default size height
  });

  it('renders with a specific variant and size', () => {
    render(<Button variant="destructive" size="sm">Delete</Button>);
    const buttonElement = screen.getByRole('button', { name: /Delete/i });
    expect(buttonElement).toBeInTheDocument();
    expect(buttonElement).toHaveClass('bg-destructive');
    expect(buttonElement).toHaveClass('h-9'); // Small size height
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Submit</Button>);
    const buttonElement = screen.getByRole('button', { name: /Submit/i });
    fireEvent.click(buttonElement);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    // When asChild is true, it should render the child (<a> tag here)
    // instead of a <button> element.
    const linkElement = screen.getByRole('link', { name: /Link Button/i });
    expect(linkElement).toBeInTheDocument();
    expect(linkElement.tagName).toBe('A');
    // Check that it still gets button-like styling
    expect(linkElement).toHaveClass('bg-primary');
  });

  it('applies className prop', () => {
    render(<Button className="custom-class">Custom</Button>);
    const buttonElement = screen.getByRole('button', { name: /Custom/i });
    expect(buttonElement).toHaveClass('custom-class');
  });

  it('is disabled when disabled prop is true', () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    const buttonElement = screen.getByRole('button', { name: /Disabled/i });
    expect(buttonElement).toBeDisabled();
    fireEvent.click(buttonElement);
    expect(handleClick).not.toHaveBeenCalled();
  });
});
