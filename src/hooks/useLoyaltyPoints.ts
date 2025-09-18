import { useState, useEffect } from 'react';
import { useAuthSafe } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface LoyaltyTransaction {
  id: string;
  type: 'EARN' | 'REDEEM' | 'EXPIRE' | 'BONUS';
  points: number;
  description: string;
  orderId?: string;
  createdAt: Date;
  expiresAt?: Date;
}

interface LoyaltyProgram {
  totalPoints: number;
  availablePoints: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  nextTierPoints: number;
  transactions: LoyaltyTransaction[];
  rules: {
    earningRate: number; // Points per EGP spent
    minRedemption: number;
    pointValue: number; // EGP value per point
    expiryMonths: number;
  };
}

interface LoyaltyTier {
  name: string;
  nameAr: string;
  minPoints: number;
  benefits: {
    earningMultiplier: number;
    freeShipping: boolean;
    exclusiveAccess: boolean;
    birthdayBonus: number;
  };
  color: string;
  icon: string;
}

const LOYALTY_TIERS: LoyaltyTier[] = [
  {
    name: 'Bronze',
    nameAr: 'برونزي',
    minPoints: 0,
    benefits: {
      earningMultiplier: 1,
      freeShipping: false,
      exclusiveAccess: false,
      birthdayBonus: 50
    },
    color: '#CD7F32',
    icon: '🥉'
  },
  {
    name: 'Silver',
    nameAr: 'فضي',
    minPoints: 500,
    benefits: {
      earningMultiplier: 1.2,
      freeShipping: true,
      exclusiveAccess: false,
      birthdayBonus: 100
    },
    color: '#C0C0C0',
    icon: '🥈'
  },
  {
    name: 'Gold',
    nameAr: 'ذهبي',
    minPoints: 1500,
    benefits: {
      earningMultiplier: 1.5,
      freeShipping: true,
      exclusiveAccess: true,
      birthdayBonus: 200
    },
    color: '#FFD700',
    icon: '🥇'
  },
  {
    name: 'Platinum',
    nameAr: 'بلاتيني',
    minPoints: 5000,
    benefits: {
      earningMultiplier: 2,
      freeShipping: true,
      exclusiveAccess: true,
      birthdayBonus: 500
    },
    color: '#E5E4E2',
    icon: '💎'
  }
];

export const useLoyaltyPoints = () => {
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyProgram | null>(null);
  const [loading, setLoading] = useState(false);
  const auth = useAuthSafe();
  const user = auth?.user;
  const { showToast } = useToast();

  // Load loyalty data
  useEffect(() => {
    if (user) {
      loadLoyaltyData();
    }
  }, [user]);

  const loadLoyaltyData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch('/api/v1/loyalty/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLoyaltyData(data.data);
      } else {
        // Initialize loyalty profile if doesn't exist
        await initializeLoyaltyProfile();
      }
    } catch (error) {
      console.error('Failed to load loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeLoyaltyProfile = async () => {
    try {
      const response = await fetch('/api/v1/loyalty/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLoyaltyData(data.data);
      }
    } catch (error) {
      console.error('Failed to initialize loyalty profile:', error);
    }
  };

  const calculatePointsForPurchase = (amount: number): number => {
    if (!loyaltyData) return 0;
    
    const tier = getCurrentTier();
    const basePoints = Math.floor(amount * loyaltyData.rules.earningRate);
    const multipliedPoints = Math.floor(basePoints * tier.benefits.earningMultiplier);
    
    return multipliedPoints;
  };

  const getCurrentTier = (): LoyaltyTier => {
    const totalPoints = loyaltyData?.totalPoints || 0;
    
    for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
      if (totalPoints >= LOYALTY_TIERS[i].minPoints) {
        return LOYALTY_TIERS[i];
      }
    }
    
    return LOYALTY_TIERS[0];
  };

  const getNextTier = (): LoyaltyTier | null => {
    const currentTier = getCurrentTier();
    const currentIndex = LOYALTY_TIERS.findIndex(tier => tier.name === currentTier.name);
    
    if (currentIndex < LOYALTY_TIERS.length - 1) {
      return LOYALTY_TIERS[currentIndex + 1];
    }
    
    return null;
  };

  const getPointsToNextTier = (): number => {
    const nextTier = getNextTier();
    if (!nextTier || !loyaltyData) return 0;
    
    return Math.max(0, nextTier.minPoints - loyaltyData.totalPoints);
  };

  const canRedeem = (points: number): boolean => {
    if (!loyaltyData) return false;
    
    return loyaltyData.availablePoints >= points && 
           points >= loyaltyData.rules.minRedemption;
  };

  const redeemPoints = async (points: number, orderId?: string): Promise<boolean> => {
    if (!canRedeem(points)) {
      showToast('Insufficient points for redemption', 'error');
      return false;
    }

    try {
      const response = await fetch('/api/v1/loyalty/redeem', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          points,
          orderId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setLoyaltyData(data.data);
        showToast(`Successfully redeemed ${points} points!`, 'success');
        return true;
      } else {
        const error = await response.json();
        showToast(error.message || 'Failed to redeem points', 'error');
        return false;
      }
    } catch (error) {
      console.error('Failed to redeem points:', error);
      showToast('Failed to redeem points', 'error');
      return false;
    }
  };

  const earnPoints = async (points: number, description: string, orderId?: string): Promise<void> => {
    try {
      const response = await fetch('/api/v1/loyalty/earn', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          points,
          description,
          orderId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setLoyaltyData(data.data);
        showToast(`Earned ${points} loyalty points!`, 'success');
      }
    } catch (error) {
      console.error('Failed to earn points:', error);
    }
  };

  const getPointValue = (points: number): number => {
    if (!loyaltyData) return 0;
    return points * loyaltyData.rules.pointValue;
  };

  const getRedemptionOptions = () => {
    if (!loyaltyData) return [];

    const options = [
      {
        id: 'discount_50',
        name: '50 EGP Discount',
        nameAr: 'خصم 50 جنيه',
        points: 100,
        value: 50,
        type: 'discount',
        available: canRedeem(100)
      },
      {
        id: 'discount_100',
        name: '100 EGP Discount',
        nameAr: 'خصم 100 جنيه',
        points: 200,
        value: 100,
        type: 'discount',
        available: canRedeem(200)
      },
      {
        id: 'free_shipping',
        name: 'Free Shipping',
        nameAr: 'شحن مجاني',
        points: 50,
        value: 45,
        type: 'shipping',
        available: canRedeem(50)
      },
      {
        id: 'discount_250',
        name: '250 EGP Discount',
        nameAr: 'خصم 250 جنيه',
        points: 500,
        value: 250,
        type: 'discount',
        available: canRedeem(500)
      }
    ];

    return options.filter(option => option.available);
  };

  const getBirthdayBonus = async (): Promise<void> => {
    try {
      const response = await fetch('/api/v1/loyalty/birthday-bonus', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLoyaltyData(data.data);
        const tier = getCurrentTier();
        showToast(`Happy Birthday! You earned ${tier.benefits.birthdayBonus} bonus points!`, 'success');
      }
    } catch (error) {
      console.error('Failed to claim birthday bonus:', error);
    }
  };

  const getReferralBonus = async (referredUserId: string): Promise<void> => {
    try {
      const response = await fetch('/api/v1/loyalty/referral-bonus', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          referredUserId
        })
      });

      if (response.ok) {
        const data = await response.json();
        setLoyaltyData(data.data);
        showToast('Referral bonus earned!', 'success');
      }
    } catch (error) {
      console.error('Failed to claim referral bonus:', error);
    }
  };

  const getProgressPercentage = (): number => {
    const nextTier = getNextTier();
    if (!nextTier || !loyaltyData) return 100;
    
    const currentTier = getCurrentTier();
    const currentProgress = loyaltyData.totalPoints - currentTier.minPoints;
    const tierRange = nextTier.minPoints - currentTier.minPoints;
    
    return Math.min(100, (currentProgress / tierRange) * 100);
  };

  return {
    loyaltyData,
    loading,
    currentTier: getCurrentTier(),
    nextTier: getNextTier(),
    pointsToNextTier: getPointsToNextTier(),
    progressPercentage: getProgressPercentage(),
    calculatePointsForPurchase,
    canRedeem,
    redeemPoints,
    earnPoints,
    getPointValue,
    getRedemptionOptions,
    getBirthdayBonus,
    getReferralBonus,
    tiers: LOYALTY_TIERS,
    refresh: loadLoyaltyData
  };
};
