import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
// use the shared client
import { supabase } from '../api/supabaseClient';

export default function AddChildByCode({ parentId, navigation }) {
  const [code, setCode] = useState('');

  async function submitCode() {
    try {
      const { data: invite, error } = await supabase
        .from('child_invite_codes')
        .select('*')
        .eq('code', code)
        .eq('used', false)
        .gte('expires_at', new Date())
        .single();

      if (error || !invite) {
        return Alert.alert('Invalid or expired code');
      }

      const { error: linkError } = await supabase
        .from('children')
        .insert([{ parent_id: parentId, child_id: invite.child_id }]);

      if (linkError) return Alert.alert('Error linking child', linkError.message);

      await supabase
        .from('child_invite_codes')
        .update({ used: true })
        .eq('id', invite.id);

      Alert.alert('Child linked successfully!');
      navigation.goBack(); // back to ParentHome
    } catch (err) {
      console.error('submitCode error', err);
      Alert.alert('Error', 'Unexpected error linking child.');
    }
  }

  return (
    <View style={styles.container}>
      <Text>Enter your child’s invite code:</Text>
      <TextInput
        value={code}
        onChangeText={setCode}
        placeholder="XXXXXX"
        style={styles.input}
      />
      <Button title="Link Child" onPress={submitCode} />
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, padding:16, justifyContent:'center' },
  input:{ borderWidth:1, padding:8, marginVertical:12, borderRadius:8 }
});
