import pandas as pd
import plotly.graph_objects as go
import plotly.express as px

# Load the data
df = pd.read_csv('x3_pain_points.csv')

# Sort by Frequency_Mentioned in descending order
df = df.sort_values('Frequency_Mentioned', ascending=True)  # ascending=True for horizontal bars to show highest at top

# Truncate challenge names to 15 characters if needed
df['Challenge_Short'] = df['Challenge'].apply(lambda x: x[:15] if len(x) > 15 else x)

# Create the horizontal grouped bar chart
fig = go.Figure()

# Add Frequency_Mentioned bars
fig.add_trace(go.Bar(
    y=df['Challenge_Short'],
    x=df['Frequency_Mentioned'],
    name='Freq Mentioned',
    orientation='h',
    marker_color='#1FB8CD',
    cliponaxis=False
))

# Add Severity_Score bars
fig.add_trace(go.Bar(
    y=df['Challenge_Short'],
    x=df['Severity_Score'],
    name='Severity Score',
    orientation='h',
    marker_color='#FFC185',
    cliponaxis=False
))

# Update layout
fig.update_layout(
    title='X3 Resistance Band User Pain Points Analysis',
    xaxis_title='Score/Count',
    yaxis_title='Challenge',
    barmode='group',
    legend=dict(orientation='h', yanchor='bottom', y=1.05, xanchor='center', x=0.5)
)

# Save the chart
fig.write_image('x3_pain_points_chart.png')