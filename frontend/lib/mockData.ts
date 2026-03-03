export const mockNews = {
    articles: [
        {
            id: 'mock-1',
            title: 'Air Pollution Levels Spike in Delhi NCR Region (Demo Data)',
            description: 'PM2.5 particulate matter reaches hazardous levels as AQI crosses 400 mark.',
            url: 'https://example.com/air-delhi',
            source: 'Environment Today',
            publishedAt: new Date(Date.now() - 3600000).toISOString(),
            category: 'air',
            confidence: 0.94,
            locality: 'Delhi',
            summary: 'Delhi NCR is experiencing severe air pollution with AQI above 400. Schools may be shut down if it continues.',
            actions: ['Wear N95 masks outdoors', 'Use air purifiers', 'Avoid morning walks'],
        },
        {
            id: 'mock-2',
            title: 'Yamuna River Pollution Reaches Critical Levels (Demo Data)',
            description: 'Industrial discharge and sewage continue to degrade water quality along the Yamuna.',
            url: 'https://example.com/water-yamuna',
            source: 'Water Watch',
            publishedAt: new Date(Date.now() - 7200000).toISOString(),
            category: 'water',
            confidence: 0.91,
            locality: 'Delhi',
            summary: 'Toxic foam was observed in the Yamuna river due to untreated sewage and industrial effluents.',
            actions: ['Report illegal discharge', 'Participate in river cleanup', 'Save water at home'],
        },
        {
            id: 'mock-3',
            title: 'Plastic Waste Crisis Worsens in Mumbai (Demo Data)',
            description: 'Single-use plastic continues to dominate municipal solid waste.',
            url: 'https://example.com/waste-mumbai',
            source: 'Waste Weekly',
            publishedAt: new Date(Date.now() - 10800000).toISOString(),
            category: 'waste',
            confidence: 0.88,
            locality: 'Mumbai',
            summary: 'Mumbai is struggling with plastic waste management despite bans in Maharashtra.',
            actions: ['Use cloth bags', 'Segregate dry and wet waste', 'Stop using plastic straws'],
        },
        {
            id: 'mock-4',
            title: 'Deforestation in Western Ghats Accelerates (Demo Data)',
            description: 'Satellite imagery reveals unprecedented forest loss driven by agricultural expansion.',
            url: 'https://example.com/forest-western-ghats',
            source: 'Forest Monitor',
            publishedAt: new Date(Date.now() - 14400000).toISOString(),
            category: 'land',
            confidence: 0.89,
            locality: 'Bangalore',
            summary: 'The Western Ghats have lost a significant amount of forest cover over the last decade.',
            actions: ['Donate to conservation', 'Plant native trees', 'Use recycled paper'],
        },
        {
            id: 'mock-5',
            title: 'Groundwater Contamination in Pune Industrial Zones (Demo Data)',
            description: 'Heavy metal traces found in borewells near factories raising alarm.',
            url: 'https://example.com/water-pune',
            source: 'Ground Report',
            publishedAt: new Date(Date.now() - 18000000).toISOString(),
            category: 'water',
            confidence: 0.87,
            locality: 'Pune',
            summary: 'Industrial pollution has severely contaminated the groundwater in Pune suburbs.',
            actions: ['Test home drinking water', 'Install RO filters', 'Demand strict regulations'],
        },
        {
            id: 'mock-6',
            title: 'Toxic Smog Blankets Chennai Post-Festival (Demo Data)',
            description: 'Fireworks push Air Quality Index into severe category.',
            url: 'https://example.com/air-chennai',
            source: 'City Air Report',
            publishedAt: new Date(Date.now() - 21600000).toISOString(),
            category: 'air',
            confidence: 0.92,
            locality: 'Chennai',
            summary: 'Chennai experienced a sharp drop in air quality due to festival celebrations.',
            actions: ['Use eco-friendly alternatives', 'Carpool to work', 'Stay indoors'],
        },
    ],
    total: 6,
};

export const mockPosts = {
    posts: [
        {
            id: 'post-1',
            userId: 'guest-123',
            userName: 'EcoWarrior',
            title: 'Illegal garbage dumping near my street (Demo Data)',
            description: 'People are constantly dumping construction debris here. It is causing a huge mess and dust.',
            category: 'waste',
            locality: 'Mumbai',
            likes: 12,
            comments: [
                { userId: 'guest-456', userName: 'LocalResident', text: 'I reported this to the BMC yesterday.', createdAt: new Date().toISOString() }
            ],
            aiVerification: 'valid',
            credibilityScore: 8.5,
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            updates: [],
        },
        {
            id: 'post-2',
            userId: 'guest-789',
            userName: 'GreenLife',
            title: 'Lake Bellandur frothing again (Demo Data)',
            description: 'The foam is flying onto the streets and it smells terrible. Factory chemicals are back.',
            category: 'water',
            locality: 'Bangalore',
            likes: 34,
            comments: [],
            aiVerification: 'valid',
            credibilityScore: 9.1,
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            updates: [],
        },
        {
            id: 'post-3',
            userId: 'guest-111',
            userName: 'TreeHugger',
            title: 'Felling of old Banyan tree (Demo Data)',
            description: 'They are cutting down a 100-year-old tree for a road widening project without permits.',
            category: 'land',
            locality: 'Pune',
            likes: 45,
            comments: [],
            aiVerification: 'needs_review',
            credibilityScore: 6.2,
            createdAt: new Date(Date.now() - 259200000).toISOString(),
            updates: [],
        },
    ],
    total: 3,
};

export const mockStats = {
    distribution: { air: 2, water: 2, waste: 1, land: 1, general: 0 },
    total: 6,
};

export const mockTrends = {
    trends: [
        { month: 'Oct 2025', air: 12, water: 8, land: 4, waste: 10, general: 6 },
        { month: 'Nov 2025', air: 15, water: 7, land: 5, waste: 11, general: 7 },
        { month: 'Dec 2025', air: 18, water: 6, land: 4, waste: 12, general: 8 },
        { month: 'Jan 2026', air: 14, water: 9, land: 5, waste: 9, general: 6 },
        { month: 'Feb 2026', air: 10, water: 11, land: 6, waste: 10, general: 5 },
        { month: 'Mar 2026', air: 8, water: 12, land: 7, waste: 11, general: 4 },
    ],
};

export const mockHeatmap = {
    points: [
        { locality: 'Delhi', lat: 28.6139, lng: 77.2090, count: 18, category: 'air' },
        { locality: 'Mumbai', lat: 19.0760, lng: 72.8777, count: 14, category: 'water' },
        { locality: 'Bangalore', lat: 12.9716, lng: 77.5946, count: 9, category: 'waste' },
        { locality: 'Chennai', lat: 13.0827, lng: 80.2707, count: 7, category: 'water' },
        { locality: 'Kolkata', lat: 22.5726, lng: 88.3639, count: 11, category: 'air' },
        { locality: 'Pune', lat: 18.5204, lng: 73.8567, count: 6, category: 'land' },
        { locality: 'Hyderabad', lat: 17.3850, lng: 78.4867, count: 8, category: 'waste' },
        { locality: 'Jaipur', lat: 26.9124, lng: 75.7873, count: 5, category: 'land' },
    ],
};

export const mockSummary = {
    totalNews: 48,
    totalCommunityPosts: 12,
    validatedPosts: 9,
    localitiesCovered: 8,
    categoriesActive: 5,
};

export function getFallbackData(path: string) {
    if (path.includes('/api/news/stats')) return mockStats;
    if (path.includes('/api/news/fetch')) return { message: 'Offline Demo Mode: Fetch simulated.', total_raw: 0 };
    if (path.includes('/api/news/classify')) return { category: 'general', confidence: 0.5 };
    if (path.includes('/api/news')) return mockNews;
    if (path.includes('/api/community/posts')) return mockPosts;
    if (path.includes('/api/analytics/trends')) return mockTrends;
    if (path.includes('/api/analytics/heatmap')) return mockHeatmap;
    if (path.includes('/api/analytics/summary')) return mockSummary;
    return {};
}
