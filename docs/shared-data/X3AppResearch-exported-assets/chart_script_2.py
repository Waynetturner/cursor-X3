import pandas as pd
import plotly.graph_objects as go

# Load the data
df = pd.read_csv("x3_sentiment.csv")

# Create the stacked horizontal bar chart
fig = go.Figure()

# Add Positive bars (using cyan as green substitute)
fig.add_trace(go.Bar(
    name='Positive',
    y=df['Category'],
    x=df['Positive'],
    orientation='h',
    marker_color='#5D878F',  # Cyan from brand colors
    cliponaxis=False
))

# Add Neutral bars (light orange)
fig.add_trace(go.Bar(
    name='Neutral',
    y=df['Category'],
    x=df['Neutral'],
    orientation='h',
    marker_color='#FFC185',  # Light orange from brand colors
    cliponaxis=False
))

# Add Negative bars (moderate red)
fig.add_trace(go.Bar(
    name='Negative', 
    y=df['Category'],
    x=df['Negative'],
    orientation='h',
    marker_color='#B4413C',  # Moderate red from brand colors
    cliponaxis=False
))

# Update layout for stacked bars
fig.update_layout(
    barmode='stack',
    title='X3 User Sentiment Analysis by Category',
    xaxis_title='Percentage',
    yaxis_title='Category',
    legend=dict(orientation='h', yanchor='bottom', y=1.05, xanchor='center', x=0.5)
)

# Update x-axis to show percentages
fig.update_xaxes(range=[0, 100], ticksuffix='%')
fig.update_yaxes()

# Save the chart
fig.write_image("sentiment_chart.png")