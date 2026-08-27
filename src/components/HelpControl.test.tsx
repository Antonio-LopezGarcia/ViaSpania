// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HelpControl, parseHelpDocument } from './HelpControl';

describe('HelpControl', () => {
  it('convierte encabezados y listas del manual', () => {
    expect(parseHelpDocument('# Manual\n\n## Flujo\n\n### Panel\n\n1. Primero\n2. Después')).toEqual([
      { type: 'h1', text: 'Manual' },
      { type: 'h2', text: 'Flujo' },
      { type: 'h3', text: 'Panel' },
      { type: 'ol', items: ['Primero', 'Después'] },
    ]);
  });

  it('abre el manual integrado', () => {
    render(<HelpControl />);
    fireEvent.click(screen.getByRole('button', { name: 'Ayuda' }));
    expect(screen.getByRole('dialog', { name: 'Manual de ayuda de ViaSpania' })).toBeTruthy();
    expect(screen.getByText('1. Vista general')).toBeTruthy();
    expect(screen.getByText('Panel Barreras y facilitadores')).toBeTruthy();
    expect(screen.getByText('Configuración actual')).toBeTruthy();
    expect(screen.getByText(/marca de agua VS · ViaSpania/)).toBeTruthy();
  });
});
