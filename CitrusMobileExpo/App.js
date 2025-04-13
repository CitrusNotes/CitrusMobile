import { StatusBar } from 'expo-status-bar';
import AppNavigator from './app/navigation/AppNavigator';

/**
 * Main application component that serves as the root of the React Native application.
 * 
 * This component sets up the basic application structure including:
 * - Status bar configuration
 * - Navigation system initialization
 * 
 * @component
 * @returns {JSX.Element} The root application component with status bar and navigation
 */
export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <AppNavigator />
    </>
  );
}
