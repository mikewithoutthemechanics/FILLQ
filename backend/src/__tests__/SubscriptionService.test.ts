import { SubscriptionService } from '../services/SubscriptionService';

// Mock Prisma client for testing
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    fillIQSettings: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => {
    return {
      customers: {
        create: jest.fn(),
        retrieve: jest.fn(),
      },
      subscriptions: {
        create: jest.fn(),
        retrieve: jest.fn(),
        update: jest.fn(),
        del: jest.fn(),
      },
      checkout: {
        sessions: {
          create: jest.fn(),
        },
      },
      webhooks: {
        constructEvent: jest.fn(),
      },
    };
  });
});

describe('SubscriptionService', () => {
  let subscriptionService: SubscriptionService;
  let prismaMock: any;
  let stripeMock: any;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Initialize service
    subscriptionService = new SubscriptionService('test-studio-id');
    
    // Get mocked instances
    prismaMock = require('@prisma/client')();
    stripeMock = require('stripe')('test_key');
  });

  describe('getOrCreateCustomer', () => {
    it('should return existing customer if found', async () => {
      // Mock existing settings with stripe customer ID
      prismaMock.fillIQSettings.findUnique.mockResolvedValue({
        studioId: 'test-studio-id',
        stripeCustomerId: 'cus_123',
      } as any);
      
      // Mock stripe customer retrieval
      stripeMock.customers.retrieve.mockResolvedValue({
        id: 'cus_123',
      } as any);
      
      const customer = await subscriptionService.getOrCreateCustomer();
      
      expect(prismaMock.fillIQSettings.findUnique).toHaveBeenCalledWith({
        where: { studioId: 'test-studio-id' },
      });
      expect(stripeMock.customers.retrieve).toHaveBeenCalledWith('cus_123');
      expect(customer.id).toBe('cus_123');
    });

    it('should create new customer if none exists', async () => {
      // Mock no existing settings
      prismaMock.fillIQSettings.findUnique.mockResolvedValue(null);
      
      // Mock upsert to return settings with new customer ID
      prismaMock.fillIQSettings.upsert.mockResolvedValue({
        studioId: 'test-studio-id',
        stripeCustomerId: 'cus_new',
      } as any);
      
      // Mock stripe customer creation
      stripeMock.customers.create.mockResolvedValue({
        id: 'cus_new',
      } as any);
      
      const customer = await subscriptionService.getOrCreateCustomer();
      
      expect(prismaMock.fillIQSettings.findUnique).toHaveBeenCalledWith({
        where: { studioId: 'test-studio-id' },
      });
      expect(stripeMock.customers.create).toHaveBeenCalledWith({
        metadata: { studioId: 'test-studio-id' },
      });
      expect(prismaMock.fillIQSettings.upsert).toHaveBeenCalledWith({
        where: { studioId: 'test-studio-id' },
        update: { stripeCustomerId: 'cus_new' },
        create: {
          studioId: 'test-studio-id',
          stripeCustomerId: 'cus_new',
        },
      });
      expect(customer.id).toBe('cus_new');
    });
  });

  describe('createSubscription', () => {
    it('should create a subscription and update settings', async () => {
      // Mock getOrCreateCustomer
      jest.spyOn(subscriptionService as any, 'getOrCreateCustomer')
        .mockResolvedValue({ id: 'cus_123' } as any);
      
      // Mock stripe subscription creation
      stripeMock.subscriptions.create.mockResolvedValue({
        id: 'sub_123',
        status: 'active',
        items: { data: [{ id: 'si_123' }] },
        metadata: { studioId: 'test-studio-id' },
      } as any);
      
      // Mock settings update
      prismaMock.fillIQSettings.update.mockResolvedValue({} as any);
      
      const subscription = await subscriptionService.createSubscription(
        'price_test_monthly',
        14
      );
      
      expect(subscriptionService['getOrCreateCustomer']).toHaveBeenCalled();
      expect(stripeMock.subscriptions.create).toHaveBeenCalledWith({
        customer: 'cus_123',
        items: [{ price: 'price_test_monthly' }],
        trial_period_days: 14,
        metadata: { studioId: 'test-studio-id' },
      });
      expect(prismaMock.fillIQSettings.update).toHaveBeenCalledWith({
        where: { studioId: 'test-studio-id' },
        data: {
          stripeSubscriptionId: 'sub_123',
          subscriptionStatus: 'active',
        },
      });
      expect(subscription.id).toBe('sub_123');
    });
  });
});