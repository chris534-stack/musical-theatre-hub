// lib/__mocks__/supabaseClient.ts

// Default mock implementation
const mockSupabaseClient = {
  auth: {
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    }),
    signInWithOAuth: jest.fn().mockResolvedValue({ error: null }),
    signOut: jest.fn().mockResolvedValue({ error: null }),
    // Add any other auth methods you use
  },
  from: jest.fn(() => mockSupabaseClient.queryMethods), // Return chainable methods
  // Mock chainable query methods
  queryMethods: {
    select: jest.fn(() => mockSupabaseClient.queryMethods),
    insert: jest.fn(() => mockSupabaseClient.queryMethods),
    upsert: jest.fn(() => mockSupabaseClient.queryMethods),
    update: jest.fn(() => mockSupabaseClient.queryMethods),
    delete: jest.fn(() => mockSupabaseClient.queryMethods),
    eq: jest.fn(() => mockSupabaseClient.queryMethods),
    neq: jest.fn(() => mockSupabaseClient.queryMethods),
    gt: jest.fn(() => mockSupabaseClient.queryMethods),
    lt: jest.fn(() => mockSupabaseClient.queryMethods),
    gte: jest.fn(() => mockSupabaseClient.queryMethods),
    lte: jest.fn(() => mockSupabaseClient.queryMethods),
    like: jest.fn(() => mockSupabaseClient.queryMethods),
    in: jest.fn(() => mockSupabaseClient.queryMethods),
    is: jest.fn(() => mockSupabaseClient.queryMethods),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    // order: jest.fn(() => mockSupabaseClient.queryMethods), // Add if you use it
    // limit: jest.fn(() => mockSupabaseClient.queryMethods), // Add if you use it
    // etc.
  },
  // Helper to reset all mocks
  resetMocks: () => {
    mockSupabaseClient.auth.getSession.mockReset().mockResolvedValue({ data: { session: null }, error: null });
    mockSupabaseClient.auth.onAuthStateChange.mockReset().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
    mockSupabaseClient.auth.signInWithOAuth.mockReset().mockResolvedValue({ error: null });
    mockSupabaseClient.auth.signOut.mockReset().mockResolvedValue({ error: null });
    
    mockSupabaseClient.from.mockReset().mockImplementation(() => mockSupabaseClient.queryMethods);
    
    Object.values(mockSupabaseClient.queryMethods).forEach(mockFn => {
      if (jest.isMockFunction(mockFn)) {
        mockFn.mockReset().mockImplementation(() => mockSupabaseClient.queryMethods);
      }
    });
    // Ensure single, maybeSingle are reset to their default promise resolve
    mockSupabaseClient.queryMethods.single.mockResolvedValue({ data: null, error: null });
    mockSupabaseClient.queryMethods.maybeSingle.mockResolvedValue({ data: null, error: null });

  },
};

export const supabase = mockSupabaseClient;
