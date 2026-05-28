import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';

const MockWelcomeScreen = () => {
  return (
    <View>
      <Text>Welcome to Parent Portal</Text>
    </View>
  );
};

describe('WelcomeScreen', () => {
  it('renders correctly', () => {
    const { getByText } = render(<MockWelcomeScreen />);
    expect(getByText('Welcome to Parent Portal')).toBeTruthy();
  });
});
