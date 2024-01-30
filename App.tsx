import React, {useState} from 'react';
import {
  StyleSheet,
  View,
  Button,
  PermissionsAndroid,
  Platform,
  Alert,
} from 'react-native';
import AudioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AudioEncoderAndroidType,
  AudioSet,
  AudioSourceAndroidType,
} from 'react-native-audio-recorder-player';
import axios from 'axios';

const audioRecorderPlayer = new AudioRecorderPlayer();

const App: React.FC = () => {
  const [isRecording, setIsRecording] = useState<boolean>(false);

  const onStartRecord = async (): Promise<void> => {
    if (Platform.OS === 'android') {
      try {
        const grants = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        if (
          grants['android.permission.WRITE_EXTERNAL_STORAGE'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.READ_EXTERNAL_STORAGE'] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          grants['android.permission.RECORD_AUDIO'] ===
            PermissionsAndroid.RESULTS.GRANTED
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

    const audioSet: AudioSet = {
      AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
      AudioSourceAndroid: AudioSourceAndroidType.MIC,
      AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
      AVNumberOfChannelsKeyIOS: 2,
      AVFormatIDKeyIOS: AVEncodingOption.alac,
    };

    console.log('audioSet', audioSet);
    const uri = await audioRecorderPlayer.startRecorder(path, audioSet);
    audioRecorderPlayer.addRecordBackListener(e => {
      console.log('record-back', e);
      return;
    });
    console.log('uri: ', uri);
    setIsRecording(true);
  };

  const onStopRecord = async (): Promise<void> => {
    const result = await audioRecorderPlayer.stopRecorder();
    audioRecorderPlayer.removeRecordBackListener();
    setIsRecording(false);
    console.log(result);
    sendAudio(result);
  };

  const sendAudio = async (audioPath: string): Promise<void> => {
    const formData = new FormData();
    formData.append('audio', {
      uri: audioPath,
      type: 'audio/mp4',
      name: 'audio.mp4',
    });

    try {
      const response = await axios.post(
        'http://192.168.100.6:5001/transcribe',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
      console.log('Transcription:', response.data.transcription);
      Alert.alert('Transcription', response.data.transcription);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title={isRecording ? 'Stop Recording' : 'Start Recording'}
        onPress={isRecording ? onStopRecord : onStartRecord}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
});

export default App;
