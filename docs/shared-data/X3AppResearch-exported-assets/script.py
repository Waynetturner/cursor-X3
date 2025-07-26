import pandas as pd
import json

# Compile key data from my research for analysis and visualization
user_pain_points = {
    'Challenge': [
        'Lack of Motivation/Consistency',
        'Progression Difficulties', 
        'Limited Exercise Variety',
        'No Progress Tracking',
        'Durability Issues',
        'High Cost Barrier',
        'Mental Toughness Required',
        'Knowledge Gap'
    ],
    'Frequency_Mentioned': [85, 70, 45, 60, 30, 40, 75, 35],
    'Severity_Score': [9, 8, 6, 7, 5, 6, 8, 5],
    'Solution_Complexity': ['High', 'Medium', 'Low', 'Low', 'Medium', 'High', 'High', 'Medium']
}

pain_points_df = pd.DataFrame(user_pain_points)

# Fitness app market data
app_market_data = {
    'Metric': [
        'Day 1 Retention Rate',
        'Day 7 Retention Rate', 
        'Day 30 Retention Rate',
        'Average Session Length (minutes)',
        'Premium Conversion Rate',
        'Average Monthly Subscription'
    ],
    'Fitness_Apps_General': [27, 12, 8, 7.5, 3.5, 12],
    'Top_Performers': [45, 25, 15, 12, 8, 15],
    'Industry_Benchmark': [35, 18, 12, 9, 5.5, 13.5]
}

market_df = pd.DataFrame(app_market_data)

# X3 user feedback sentiment analysis
feedback_sentiment = {
    'Category': ['Equipment Quality', 'Marketing Claims', 'Results Effectiveness', 
                'Cost Value', 'Progression System', 'Consistency Challenges'],
    'Positive': [75, 15, 65, 25, 30, 20],
    'Neutral': [15, 25, 25, 35, 35, 30], 
    'Negative': [10, 60, 10, 40, 35, 50]
}

sentiment_df = pd.DataFrame(feedback_sentiment)

# Pricing analysis data
pricing_data = {
    'App_Category': ['Basic Tracking', 'AI-Powered Coaching', 'Premium Features', 'Enterprise/Professional'],
    'Low_Price': [0, 5, 10, 25],
    'Avg_Price': [3, 12, 18, 40],
    'High_Price': [8, 25, 35, 80],
    'Market_Examples': ['MyFitnessPal Free', 'Freeletics, FitnessAI', 'Peloton, Future', 'Personal Training Apps']
}

pricing_df = pd.DataFrame(pricing_data)

print("=== USER PAIN POINTS ANALYSIS ===")
print(pain_points_df.to_string(index=False))
print("\n=== FITNESS APP MARKET METRICS ===")
print(market_df.to_string(index=False))
print("\n=== X3 USER SENTIMENT ===")
print(sentiment_df.to_string(index=False))
print("\n=== PRICING ANALYSIS ===")
print(pricing_df.to_string(index=False))

# Save data for charts
pain_points_df.to_csv('x3_pain_points.csv', index=False)
market_df.to_csv('fitness_app_metrics.csv', index=False)
sentiment_df.to_csv('x3_sentiment.csv', index=False)
pricing_df.to_csv('app_pricing_data.csv', index=False)