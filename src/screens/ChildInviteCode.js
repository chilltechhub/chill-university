import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
// use the shared client
import { supabase } from '../api/supabaseClient';
import 'react-native-get-random-values'
import { v4 as uuidv4 } from 'uuid';


// Note: Clipboard API changed in newer RN versions. If Clipboard from 'react-native' breaks,
// install and use '@react-native-clipboard/clipboard' and import: import Clipboard from '@react-native-clipboard/clipboard';

export default function ChildInviteCode({ childId }) {
  const [code, setCode] = useState(null);

  async function generateCode() {
    try {
      const newCode = uuidv4().split('-')[0]; // short code
      const expiresAt = new Date(Date.now() + 24*60*60*1000); // 24h

      const { error } = await supabase
        .from('child_invite_codes')
        .insert([{ child_id: childId, code: newCode, expires_at: expiresAt }]);

      if (error) return Alert.alert('Error generating code', error.message);
      setCode(newCode);
    } catch (err) {
      console.error('generateCode error', err);
      Alert.alert('Error', 'Could not generate code.');
    }
  }

  return (
    <View style={styles.container}>
      <Button title="Generate Invite Code" onPress={generateCode} />
      {code && (
        <View style={styles.codeBox}>
          <Text style={styles.code}>{code}</Text>
          <Button
            title="Copy Code"
            onPress={() => {
              // prefer '@react-native-clipboard/clipboard' in modern RN apps
              try {
                // fallback: use navigator.clipboard if available, else Alert user to copy manually
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(code);
                  Alert.alert('Copied!');
                } else {
                  Alert.alert('Copy the code manually:', code);
                }
              } catch (e) {
                Alert.alert('Copy failed', code);
              }
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, padding:16, justifyContent:'center', alignItems:'center' },
  codeBox: { marginTop:16, padding:16, borderWidth:1, borderRadius:8 },
  code: { fontSize:20, fontWeight:'700' }
});
