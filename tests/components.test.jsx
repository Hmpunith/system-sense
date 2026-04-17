import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import React from 'react';
import ActionPlan from '../src/components/ActionPlan';

describe('ActionPlan Component', () => {
  const mockResult = {
    errorCode: '0x800F081F',
    errorName: 'Source files not found',
    severity: 'critical',
    diagnosis: 'Microsoft-Windows-NetFx3-OC-Package is missing.',
    commands: [
      { label: 'Check health', command: 'Dism /Online /Cleanup-Image /CheckHealth' }
    ],
    explanation: 'The system cannot find the source files for .NET Framework 3.5.'
  };

  it('renders error code and name correctly', () => {
    render(<ActionPlan result={mockResult} />);
    expect(screen.getByText(/0x800F081F/i)).toBeInTheDocument();
    expect(screen.getByText(/Source files not found/i)).toBeInTheDocument();
  });

  it('displays the correct severity badge', () => {
    render(<ActionPlan result={mockResult} />);
    expect(screen.getByText(/CRITICAL/i)).toBeInTheDocument();
  });

  it('renders diagnostic commands', () => {
    render(<ActionPlan result={mockResult} />);
    expect(screen.getByText(/Check health/i)).toBeInTheDocument();
    expect(screen.getByText(/Dism \/Online/i)).toBeInTheDocument();
  });
});
