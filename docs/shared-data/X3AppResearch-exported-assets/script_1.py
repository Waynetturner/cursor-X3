# Create opportunity matrix data for final visualization
import pandas as pd

opportunity_data = {
    'Feature': [
        'Basic Progress Tracking',
        'AI Workout Adaptation', 
        'Motivation Coaching',
        'X3-Specific Optimization',
        'Community Features',
        'Nutrition Integration',
        'Form Analysis',
        'Plateau Detection'
    ],
    'User_Demand': [70, 85, 90, 80, 45, 50, 35, 75],
    'Implementation_Difficulty': [20, 80, 60, 40, 50, 30, 90, 70],
    'Revenue_Potential': [40, 85, 80, 75, 60, 55, 65, 70],
    'Competitive_Advantage': [25, 90, 85, 95, 40, 30, 80, 85]
}

opportunity_df = pd.DataFrame(opportunity_data)

# Calculate priority score (high demand + high revenue + high advantage - implementation difficulty)
opportunity_df['Priority_Score'] = (
    opportunity_df['User_Demand'] * 0.3 +
    opportunity_df['Revenue_Potential'] * 0.25 +
    opportunity_df['Competitive_Advantage'] * 0.25 -
    opportunity_df['Implementation_Difficulty'] * 0.2
)

# Sort by priority score
opportunity_df = opportunity_df.sort_values('Priority_Score', ascending=False)

print("=== PRODUCT FEATURE OPPORTUNITY MATRIX ===")
print(opportunity_df.to_string(index=False))
print(f"\nTop 3 Priority Features:")
for i, feature in enumerate(opportunity_df.head(3)['Feature'], 1):
    score = opportunity_df.head(3).iloc[i-1]['Priority_Score']
    print(f"{i}. {feature} (Score: {score:.1f})")

# Save for visualization
opportunity_df.to_csv('feature_opportunity_matrix.csv', index=False)

# Create user segment analysis
segment_data = {
    'User_Segment': [
        'New X3 Users',
        'Consistent Users',
        'Struggling Users', 
        'Former Users',
        'Fitness Professionals'
    ],
    'Market_Size': [25, 30, 35, 15, 5],
    'Pain_Level': [60, 40, 95, 85, 20],
    'Willingness_to_Pay': [70, 85, 90, 60, 80],
    'Conversion_Probability': [65, 80, 95, 40, 70]
}

segment_df = pd.DataFrame(segment_data)
print("\n=== TARGET USER SEGMENT ANALYSIS ===")
print(segment_df.to_string(index=False))

segment_df.to_csv('user_segments.csv', index=False)