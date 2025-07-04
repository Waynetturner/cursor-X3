
export interface BandColorStyle {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
}

export const getBandColorStyle = (bandColor: string): BandColorStyle => {
  const normalizedColor = bandColor.toLowerCase().trim();
  
  switch (normalizedColor) {
    case 'white':
      return {
        backgroundColor: 'bg-white',
        textColor: 'text-black',
        borderColor: 'border-black'
      };
    case 'light gray':
    case 'lightgray':
    case 'light grey':
    case 'lightgrey':
      return {
        backgroundColor: 'bg-gray-300',
        textColor: 'text-black',
        borderColor: 'border-gray-400'
      };
    case 'dark gray':
    case 'darkgray':
    case 'dark grey':
    case 'darkgrey':
      return {
        backgroundColor: 'bg-gray-600',
        textColor: 'text-white',
        borderColor: 'border-gray-500'
      };
    case 'black':
      return {
        backgroundColor: 'bg-black',
        textColor: 'text-white',
        borderColor: 'border-white'
      };
    case 'red':
      return {
        backgroundColor: 'bg-red-500',
        textColor: 'text-white',
        borderColor: 'border-red-400'
      };
    case 'orange':
      return {
        backgroundColor: 'bg-orange-500',
        textColor: 'text-white',
        borderColor: 'border-orange-400'
      };
    case 'yellow':
      return {
        backgroundColor: 'bg-yellow-400',
        textColor: 'text-black',
        borderColor: 'border-yellow-500'
      };
    case 'green':
      return {
        backgroundColor: 'bg-green-500',
        textColor: 'text-white',
        borderColor: 'border-green-400'
      };
    case 'blue':
      return {
        backgroundColor: 'bg-blue-500',
        textColor: 'text-white',
        borderColor: 'border-blue-400'
      };
    case 'purple':
      return {
        backgroundColor: 'bg-purple-500',
        textColor: 'text-white',
        borderColor: 'border-purple-400'
      };
    default:
      // Fallback for unknown colors
      return {
        backgroundColor: 'bg-gray-100',
        textColor: 'text-gray-700',
        borderColor: 'border-gray-300'
      };
  }
};
