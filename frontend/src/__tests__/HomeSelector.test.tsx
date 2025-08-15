import React from 'react';
import { render, screen } from '@testing-library/react';
import HomeSelector from '../components/HomeSelector/HomeSelector';

jest.mock('../contexts/HomeContext', () => ({
  useHome: jest.fn(),
}));

const mockUseHome = require('../contexts/HomeContext').useHome as jest.Mock;

describe('HomeSelector', () => {
  it('shows placeholder when no homes available', () => {
    mockUseHome.mockReturnValue({
      selectedHome: null,
      homes: [],
      loading: false,
      setSelectedHome: jest.fn(),
    });
    render(<HomeSelector />);
    expect(screen.getByText(/No homes available/i)).toBeInTheDocument();
  });

  it('renders selected home chip', () => {
    mockUseHome.mockReturnValue({
      selectedHome: { id: '1', name: 'Home A' },
      homes: [{ id: '1', name: 'Home A' }],
      loading: false,
      setSelectedHome: jest.fn(),
    });
    render(<HomeSelector />);
    expect(screen.getAllByText('Home A').length).toBeGreaterThan(0);
  });
});
