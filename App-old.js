import React, { useState } from 'react';
import { StyleSheet, View, Button, PermissionsAndroid, Platform } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import axios from 'axios';

const audioRecorderPlayer = new AudioRecorderPlayer();

const App = () => {
  const [isRecording, setIsRecording] = useState(false);

  const onStartRecord = async () => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        if (
          grants['android.permission.WRITE_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.READ_EXTERNAL_STORAGE'] === PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('Permissions granted');
        } else {
          console.log('All required permissions not granted');
          return;
        }
      } catch (err) {
        console.warn(err);
        return;
      }
    }

    const path = Platform.select({
      ios: 'hello.m4a',
      android: 'sdcard/hello.mp4',
    });

    const result = await audioRecorderPlayer.startRecorder(path);
    audioRecorderPlayer.addRecordBackListener((e) => {
      return;
    });
    console.log(result);
    setIsRecording(true);
  };

  const onStopRecord = async () => {
    const result = await audioRecorderPlayer.stopRecorder();
    audioRecorderPlayer.removeRecordBackListener();
    setIsRecording(false);
    console.log(result);
    sendAudio(result);
  };

  const sendAudio = async (audioPath) => {
    const formData = new FormData();
    formData.append('audio', {
      uri: audioPath,
      type: 'audio/mp4',
      name: 'audio.mp4',
    });

    try {
      const response = await axios.post('http://<your-server-ip>:5000/transcribe', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Transcription:', response.data.transcription);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Button title={isRecording ? 'Stop Recording' : 'Start Recording'} onPress={isRecording ?
