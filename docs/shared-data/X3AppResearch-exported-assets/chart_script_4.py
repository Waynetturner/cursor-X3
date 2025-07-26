import pandas as pd
import plotly.express as px
import plotly.graph_objects as go

# Load the data
df = pd.read_csv("feature_opportunity_matrix.csv")

# Truncate feature names to 15 characters for labels
df['Feature_Short'] = df['Feature'].str[:15]

# Create the scatter plot
fig = px.scatter(df, 
                x='User_Demand', 
                y='Revenue_Potential',
                size='Competitive_Advantage',
                color='Implementation_Difficulty',
                text='Feature_Short',
                title='Product Feature Opportunity Matrix',
                color_continuous_scale='Viridis',
                size_max=40)

# Update layout and styling
fig.update_traces(textposition='middle center', 
                 textfont_size=10,
                 cliponaxis=False)

fig.update_xaxes(title='User Demand')
fig.update_yaxes(title='Revenue Pot')

# Update color bar title
fig.update_coloraxes(colorbar_title="Implement Diff")

# Save the chart
fig.write_image("feature_opportunity_matrix.png")