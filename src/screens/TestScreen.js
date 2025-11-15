import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { supabase } from '../api/supabaseClient';

export default function TestScreen() {
  const [profiles, setProfiles] = useState([]);

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) {
        console.error('Error fetching profiles:', error);
      } else {
        setProfiles(data);
        console.log('Profiles:', data);
      }
    };

    fetchProfiles();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      {profiles.length === 0 ? (
        <Text>Loading...</Text>
      ) : (
        profiles.map(profile => (
          <Text key={profile.id}>{profile.username || profile.email}</Text>
        ))
      )}
    </View>
  );
}
