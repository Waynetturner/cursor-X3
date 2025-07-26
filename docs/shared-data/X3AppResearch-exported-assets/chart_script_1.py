import pandas as pd
import plotly.graph_objects as go

# Load the data
df = pd.read_csv("fitness_app_metrics.csv")

# Filter for retention rate data only
retention_data = df[df['Metric'].str.contains('Retention Rate')].copy()

# Extract day numbers for proper ordering
retention_data['Day'] = retention_data['Metric'].str.extract('(\d+)').astype(int)
retention_data = retention_data.sort_values('Day')

# Create x-axis labels
x_labels = ['Day ' + str(day) for day in retention_data['Day']]

# Create the line chart
fig = go.Figure()

# Add lines for each category using brand colors
colors = ['#1FB8CD', '#FFC185', '#ECEBD5']
categories = ['Fitness_Apps_General', 'Top_Performers', 'Industry_Benchmark']
legend_names = ['General Apps', 'Top Perform', 'Industry Bmk']

for i, category in enumerate(categories):
    fig.add_trace(go.Scatter(
        x=x_labels,
        y=retention_data[category],
        mode='lines+markers',
        name=legend_names[i],
        line=dict(color=colors[i], width=3),
        marker=dict(size=8),
        cliponaxis=False
    ))

# Update layout
fig.update_layout(
    title="Fitness App Retention Comparison",
    xaxis_title="Time Period",
    yaxis_title="Retention %",
    legend=dict(orientation='h', yanchor='bottom', y=1.05, xanchor='center', x=0.5)
)

# Update axes
fig.update_yaxes(ticksuffix='%')

# Save the chart
fig.write_image("fitness_retention_chart.png")

print("Chart saved successfully!")
print("Retention data:")
print(retention_data[['Metric', 'Fitness_Apps_General', 'Top_Performers', 'Industry_Benchmark']])