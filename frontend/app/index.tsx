import { Redirect } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
  useEffect(() => {
    console.log('Index route hit!');
  }, []);

  return <Redirect href="/(auth)/login" />;
}