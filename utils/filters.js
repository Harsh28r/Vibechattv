// Available interests
export const INTERESTS = [
  '🎮 Gaming',
  '🎵 Music',
  '🎬 Movies',
  '⚽ Sports',
  '✈️ Travel',
  '🍕 Food',
  '🎨 Art',
  '💻 Technology',
  '📚 Books',
  '🎭 Theater',
  '🏋️ Fitness',
  '🐕 Pets',
  '📸 Photography',
  '🎤 Singing',
  '💃 Dancing',
  '🎓 Education',
  '🌍 Languages',
  '🧘 Yoga',
  '🎯 Other'
];

// Available countries
export const COUNTRIES = [
  { code: 'ANY', name: '🌍 Any Country (Worldwide)' },
  { code: 'US', name: '🇺🇸 United States' },
  { code: 'IN', name: '🇮🇳 India' },
  { code: 'GB', name: '🇬🇧 United Kingdom' },
  { code: 'CA', name: '🇨🇦 Canada' },
  { code: 'AU', name: '🇦🇺 Australia' },
  { code: 'DE', name: '🇩🇪 Germany' },
  { code: 'FR', name: '🇫🇷 France' },
  { code: 'ES', name: '🇪🇸 Spain' },
  { code: 'IT', name: '🇮🇹 Italy' },
  { code: 'NL', name: '🇳🇱 Netherlands' },
  { code: 'BR', name: '🇧🇷 Brazil' },
  { code: 'MX', name: '🇲🇽 Mexico' },
  { code: 'AR', name: '🇦🇷 Argentina' },
  { code: 'PK', name: '🇵🇰 Pakistan' },
  { code: 'BD', name: '🇧🇩 Bangladesh' },
  { code: 'JP', name: '🇯🇵 Japan' },
  { code: 'KR', name: '🇰🇷 South Korea' },
  { code: 'CN', name: '🇨🇳 China' },
  { code: 'TH', name: '🇹🇭 Thailand' },
  { code: 'VN', name: '🇻🇳 Vietnam' },
  { code: 'PH', name: '🇵🇭 Philippines' },
  { code: 'ID', name: '🇮🇩 Indonesia' },
  { code: 'MY', name: '🇲🇾 Malaysia' },
  { code: 'SG', name: '🇸🇬 Singapore' },
  { code: 'RU', name: '🇷🇺 Russia' },
  { code: 'UA', name: '🇺🇦 Ukraine' },
  { code: 'PL', name: '🇵🇱 Poland' },
  { code: 'TR', name: '🇹🇷 Turkey' },
  { code: 'SA', name: '🇸🇦 Saudi Arabia' },
  { code: 'AE', name: '🇦🇪 UAE' },
  { code: 'EG', name: '🇪🇬 Egypt' },
  { code: 'ZA', name: '🇿🇦 South Africa' },
  { code: 'NG', name: '🇳🇬 Nigeria' },
  { code: 'KE', name: '🇰🇪 Kenya' }
];

// Gender options
export const GENDERS = [
  { value: 'any', label: '👥 Everyone' },
  { value: 'male', label: '👨 Male' },
  { value: 'female', label: '👩 Female' },
  { value: 'other', label: '🌈 Other' }
];

// Match users based on preferences
export function matchUsers(user1, user2) {
  // Gender filter
  if (user1.preferences.gender !== 'any' && user2.gender !== user1.preferences.gender) {
    return false;
  }
  if (user2.preferences.gender !== 'any' && user1.gender !== user2.preferences.gender) {
    return false;
  }

  // Country filter
  if (user1.preferences.country !== 'ANY' && user2.country !== user1.preferences.country) {
    return false;
  }
  if (user2.preferences.country !== 'ANY' && user1.country !== user2.preferences.country) {
    return false;
  }

  // Interest matching (at least 1 common interest for better matches)
  if (user1.interests.length > 0 && user2.interests.length > 0) {
    const commonInterests = user1.interests.filter(interest => 
      user2.interests.includes(interest)
    );
    
    // If both selected interests but have none in common, still allow (random)
    // But prioritize matches with common interests
    return {
      match: true,
      score: commonInterests.length // Higher score = better match
    };
  }

  return { match: true, score: 0 };
}

