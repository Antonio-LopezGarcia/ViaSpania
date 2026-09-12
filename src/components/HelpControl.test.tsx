// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { HelpControl, parseHelpDocument } from './HelpControl';
import { setLanguage } from '../core/i18n';

afterEach(() => { cleanup(); setLanguage('es'); });

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
    expect(screen.getByRole('heading', { name: '1. Empiece aquí' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Su primera ruta, paso a paso' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '12. Resolver problemas frecuentes' })).toBeTruthy();
    expect(screen.getByText(/El JSON conserva datos y configuración/)).toBeTruthy();
    act(() => setLanguage('en'));
    expect(screen.getByRole('dialog', { name: 'ViaSpania help manual' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Your first route, step by step' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: '12. Solve common problems' })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: '1. Empiece aquí' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Close help' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
