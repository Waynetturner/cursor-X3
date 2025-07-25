import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

# Load the data
df = pd.read_csv("app_pricing_data.csv")

# Display first few rows to understand the data structure
print("Data preview:")
print(df.head())
print("\nData columns:")
print(df.columns.tolist())
print("\nData shape:")
print(df.shape)

# Create the grouped bar chart
fig = go.Figure()

# Define colors from the brand palette
colors = ['#1FB8CD', '#FFC185', '#ECEBD5']

# Add bars for each price tier
fig.add_trace(go.Bar(
    name='Low Price',
    x=df['App_Category'],
    y=df['Low_Price'],
    marker_color=colors[0],
    cliponaxis=False
))

fig.add_trace(go.Bar(
    name='Avg Price',
    x=df['App_Category'],
    y=df['Avg_Price'],
    marker_color=colors[1],
    cliponaxis=False
))

fig.add_trace(go.Bar(
    name='High Price',
    x=df['App_Category'],
    y=df['High_Price'],
    marker_color=colors[2],
    cliponaxis=False
))

# Update layout
fig.update_layout(
    title='Fitness App Pricing by Category',
    xaxis_title='App Category',
    yaxis_title='Price ($)',
    barmode='group',
    legend=dict(orientation='h', yanchor='bottom', y=1.05, xanchor='center', x=0.5)
)

# Format y-axis to show dollar signs and abbreviate large numbers
fig.update_yaxes(tickformat='$,.0f')

# Save the chart
fig.write_image("fitness_app_pricing_chart.png")
print("Chart saved successfully!")